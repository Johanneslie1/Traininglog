import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildGarminSyncPlan, garminSyncRange } from '../src/services/garminSync';
import type { GarminActivityRecord, GarminConnectionStatus, GarminDayRecord } from '../src/types/garmin';

const PROJECT_ID = 'session-logger-3619e';
const GARMIN_BASE_URL = 'https://personal.connectapi.garmin.com';
const BATCH_LIMIT = 400;
const ACTIVITY_PAGE_SIZE = 100;
const MAX_ACTIVITIES = 400;
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

type GarminDocument = GarminActivityRecord | GarminDayRecord | GarminConnectionStatus;

const readPersonalApiKey = (): string => {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    throw new Error('Missing .env.local. Add GARMIN_PERSONAL_API_KEY there, then run this again.');
  }

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('GARMIN_PERSONAL_API_KEY='));
  if (!line) {
    throw new Error('GARMIN_PERSONAL_API_KEY is missing from .env.local.');
  }

  let value = line.slice('GARMIN_PERSONAL_API_KEY='.length).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!value) {
    throw new Error('GARMIN_PERSONAL_API_KEY in .env.local is empty.');
  }
  return value;
};

const readToken = (body: string): string => {
  const trimmed = body.trim();
  if (trimmed.startsWith('{')) {
    const json = JSON.parse(trimmed) as { access_token?: string; token?: string };
    const token = json.access_token || json.token;
    if (token) return token;
  }
  if (trimmed.split('.').length >= 3) return trimmed;
  throw new Error('Garmin did not return an access token. Check the personal API key.');
};

const obtainToken = async (apiKey: string): Promise<string> => {
  const response = await fetch(`${GARMIN_BASE_URL}/personalapitoken-service/personal-api/personal-api-key/token`, {
    method: 'POST',
    headers: { Authorization: `ApiKey ${apiKey}` },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Garmin rejected the API key (${response.status}). Create a new key and update .env.local.`);
  }
  return readToken(body);
};

const garminGet = async (token: string, path: string): Promise<unknown> => {
  const response = await fetch(`${GARMIN_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Garmin request failed (${response.status}) for ${path.split('?')[0]}`);
  }
  const body = await response.text();
  if (!body) return null;
  return JSON.parse(body) as unknown;
};

const fetchActivities = async (token: string, rangeStart: string, rangeEnd: string): Promise<unknown[]> => {
  const activities: unknown[] = [];
  let start = 0;
  while (activities.length < MAX_ACTIVITIES) {
    const params = new URLSearchParams({
      start: String(start),
      limit: String(ACTIVITY_PAGE_SIZE),
      startDate: rangeStart,
      endDate: rangeEnd,
    });
    const page = await garminGet(token, `/activitylist-service/activities/search/activities?${params.toString()}`);
    if (!Array.isArray(page) || page.length === 0) break;
    activities.push(...page);
    if (page.length < ACTIVITY_PAGE_SIZE) break;
    start += page.length;
  }
  return activities;
};

const fetchOptional = async (token: string, path: string, label: string): Promise<unknown> => {
  try {
    return await garminGet(token, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Garmin error';
    console.warn(`Skipped ${label}: ${message}`);
    return null;
  }
};

const readFirebaseCliLogin = (): { refreshToken: string; email?: string } => {
  const candidatePaths = [
    resolve(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json'),
    resolve(process.env.APPDATA || '', 'configstore', 'firebase-tools.json'),
    resolve(process.env.LOCALAPPDATA || '', 'configstore', 'firebase-tools.json'),
  ];

  for (const candidate of candidatePaths) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as {
      tokens?: { refresh_token?: string };
      user?: { email?: string };
    };
    const refreshToken = parsed.tokens?.refresh_token;
    if (refreshToken) return { refreshToken, email: parsed.user?.email };
  }

  throw new Error('Could not find a Firebase CLI login. Run "firebase login" first.');
};

const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = await response.json() as { access_token?: string };
  if (!response.ok || !json.access_token) {
    throw new Error('Firebase CLI login expired. Run "firebase login" and try again.');
  }
  return json.access_token;
};

const lookupUserId = async (accessToken: string, email: string): Promise<string> => {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      returnUserInfo: true,
      limit: 5,
      expression: [{ email }],
    }),
  });
  const json = await response.json() as {
    error?: { message?: string };
    userInfo?: Array<{ localId?: string; email?: string }>;
  };
  if (!response.ok) {
    throw new Error(json.error?.message || 'Could not look up the signed-in account.');
  }
  const match = (json.userInfo || []).find((user) => user.email === email && user.localId);
  if (!match?.localId) {
    throw new Error(`No Training Log account found for ${email}.`);
  }
  return match.localId;
};

const toFirestoreValue = (value: unknown): FirestoreValue => {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map((entry) => toFirestoreValue(entry)) } };
  if (value && typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      if (entry !== undefined) fields[key] = toFirestoreValue(entry);
    });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

const commitWrites = async (
  accessToken: string,
  writes: Array<{ name: string; data: GarminDocument }>,
): Promise<void> => {
  for (let index = 0; index < writes.length; index += BATCH_LIMIT) {
    const chunk = writes.slice(index, index + BATCH_LIMIT);
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: chunk.map((write) => ({
            update: {
              name: write.name,
              fields: (toFirestoreValue(write.data) as { mapValue: { fields: Record<string, FirestoreValue> } }).mapValue.fields,
            },
          })),
        }),
      },
    );
    const json = await response.json() as { error?: { message?: string }; status?: Array<{ code?: number; message?: string }> };
    if (!response.ok) {
      throw new Error(json.error?.message || `Firestore write failed (${response.status}).`);
    }
    const failed = (json.status || []).find((status) => status.code && status.code !== 0);
    if (failed) {
      throw new Error(failed.message || 'Firestore rejected a Garmin document.');
    }
  }
};

async function run(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const apiKey = readPersonalApiKey();
  const range = garminSyncRange(new Date());
  const token = await obtainToken(apiKey);
  const [activities, sleep, hrv, bodyBattery, dailySummaries] = await Promise.all([
    fetchActivities(token, range.start, range.end),
    fetchOptional(
      token,
      `/sleep-service/sleep/dailySleepSummariesByDate?startDate=${range.start}&endDate=${range.end}`,
      'sleep',
    ),
    fetchOptional(token, `/hrv-service/hrv/daily/${range.start}/${range.end}`, 'HRV'),
    fetchOptional(
      token,
      `/wellness-service/wellness/bodyBattery/reports/daily?startDate=${range.start}&endDate=${range.end}`,
      'Body Battery',
    ),
    fetchOptional(
      token,
      `/usersummary-service/v2/dailysummaries?startDate=${range.start}&endDate=${range.end}`,
      'daily summaries',
    ),
  ]);

  const login = readFirebaseCliLogin();
  if (!login.email) {
    throw new Error('Firebase CLI login has no email. Run "firebase login" and try again.');
  }
  const accessToken = await refreshAccessToken(login.refreshToken);
  const userId = await lookupUserId(accessToken, login.email);
  const plan = buildGarminSyncPlan({
    activities,
    sleep,
    hrv,
    bodyBattery,
    dailySummaries,
    userId,
    rangeStart: range.start,
    rangeEnd: range.end,
    syncedAt: new Date().toISOString(),
  });

  console.log(`Garmin ${plan.status.rangeStart} → ${plan.status.rangeEnd}`);
  console.log(`${plan.status.activityCount} activities · ${plan.status.dayCount} days`);
  console.log(`Account ${login.email}`);

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to save these stats.');
    return;
  }

  const documentRoot = `projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`;
  const writes: Array<{ name: string; data: GarminDocument }> = [
    { name: `${documentRoot}/garminConnection/status`, data: plan.status },
    ...plan.activities.map((activity) => ({
      name: `${documentRoot}/garminActivities/${activity.garminActivityId}`,
      data: activity,
    })),
    ...plan.days.map((day) => ({
      name: `${documentRoot}/garminDays/${day.date}`,
      data: day,
    })),
  ];
  await commitWrites(accessToken, writes);
  console.log(`Saved ${writes.length} Garmin documents.`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Garmin sync failed.';
  console.error(message);
  process.exitCode = 1;
});
