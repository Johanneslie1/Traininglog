import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDiaryImportPlan, DiaryImportEntry, DiaryImportSession } from '../src/services/diaryImport';

const PROJECT_ID = 'session-logger-3619e';
const BATCH_LIMIT = 400;
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

const getOptions = (): { apply: boolean; csvPath: string } => {
  const args = process.argv.slice(2);
  const csvPath = args.find((arg) => !arg.startsWith('--')) || 'C:/Users/johan/Downloads/diary_Me.csv';
  return {
    apply: args.includes('--apply'),
    csvPath,
  };
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
    if (refreshToken) {
      return { refreshToken, email: parsed.user?.email };
    }
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
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => toFirestoreValue(entry)) } };
  }
  if (value && typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      if (entry !== undefined) {
        fields[key] = toFirestoreValue(entry);
      }
    });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

const withoutEmpty = (value: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (entry !== undefined) {
      cleaned[key] = entry;
    }
  });
  return cleaned;
};

const entryDocument = (userId: string, session: DiaryImportSession, entry: DiaryImportEntry) =>
  withoutEmpty({
    ...(entry.collection === 'exercises'
      ? { exerciseName: entry.name }
      : { activityName: entry.name }),
    sets: entry.sets.map((set) => withoutEmpty(set as unknown as Record<string, unknown>)),
    timestamp: entry.timestamp,
    createdAt: entry.timestamp,
    userId,
    deviceId: 'diary-import',
    activityType: entry.activityType,
    sessionId: session.id,
    sessionType: 'main',
    sessionDateKey: session.dateKey,
    sessionWeekKey: session.sessionWeekKey,
    sessionNumberInDay: session.sessionNumberInDay,
    sessionNumberInWeek: session.sessionNumberInWeek,
    supersetId: entry.supersetId,
    supersetLabel: entry.supersetLabel,
    importSource: 'diary-csv',
  });

const sessionDocument = (userId: string, session: DiaryImportSession) =>
  withoutEmpty({
    userId,
    sessionId: session.id,
    sessionType: 'main',
    sessionDateKey: session.dateKey,
    sessionWeekKey: session.sessionWeekKey,
    sessionNumberInDay: session.sessionNumberInDay,
    sessionNumberInWeek: session.sessionNumberInWeek,
    name: session.name,
    status: 'completed',
    startedAt: session.startedAt,
    endedAt: session.startedAt,
    createdAt: session.startedAt,
    updatedAt: session.startedAt,
    importSource: 'diary-csv',
    ...(session.durationMinutes ? { durationMinutes: session.durationMinutes } : {}),
  });

const commitWrites = async (
  accessToken: string,
  writes: Array<{ name: string; data: Record<string, unknown> }>
): Promise<void> => {
  let written = 0;
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
      }
    );
    const json = await response.json() as { error?: { message?: string }; status?: Array<{ code?: number; message?: string }> };
    if (!response.ok) {
      throw new Error(json.error?.message || `Firestore write failed (${response.status}).`);
    }
    const failed = (json.status || []).find((status) => status.code && status.code !== 0);
    if (failed) {
      throw new Error(failed.message || 'Firestore rejected a diary document.');
    }
    written += chunk.length;
    console.log(`Saved ${written} / ${writes.length}`);
  }
};

async function run(): Promise<void> {
  const options = getOptions();
  const csvText = readFileSync(options.csvPath, 'utf8');
  const plan = buildDiaryImportPlan(csvText);

  console.log(`Diary: ${options.csvPath}`);
  console.log(
    `${plan.stats.sessions} sessions · ${plan.stats.exercises} strength exercises · ${plan.stats.activities} activities · ${plan.stats.sets} sets · ${plan.stats.measurements} weigh-ins`
  );
  console.log(`${plan.stats.firstDate} → ${plan.stats.lastDate}`);
  console.log(`${plan.warnings.length} warnings`);
  plan.warnings.slice(0, 15).forEach((warning) => console.log(`  ${warning}`));

  if (!options.apply) {
    console.log('Dry run only. Re-run with --apply to save these sessions.');
    return;
  }

  if (plan.sessions.length === 0) {
    throw new Error('Nothing to import.');
  }

  const login = readFirebaseCliLogin();
  if (!login.email) {
    throw new Error('Firebase CLI login has no email. Run "firebase login" and try again.');
  }
  const accessToken = await refreshAccessToken(login.refreshToken);
  const userId = await lookupUserId(accessToken, login.email);
  console.log(`Importing into ${login.email}`);

  const documentRoot = `projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`;
  const writes: Array<{ name: string; data: Record<string, unknown> }> = [];
  plan.sessions.forEach((session) => {
    writes.push({
      name: `${documentRoot}/sessions/${session.id}`,
      data: sessionDocument(userId, session),
    });
    session.entries.forEach((entry) => {
      writes.push({
        name: `${documentRoot}/${entry.collection}/${entry.id}`,
        data: entryDocument(userId, session, entry),
      });
    });
  });

  await commitWrites(accessToken, writes);
  console.log(`Imported ${plan.stats.sessions} sessions for ${login.email}.`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
