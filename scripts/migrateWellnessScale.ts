import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

type ScriptOptions = {
  apply: boolean;
  userId?: string;
};

type FirestoreValue = {
  integerValue?: string;
  doubleValue?: number;
  stringValue?: string;
  timestampValue?: string;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type ListDocumentsResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

type Counters = {
  usersScanned: number;
  logsScanned: number;
  logsAlreadyVersioned: number;
  logsChanged: number;
  fieldValuesConverted: number;
  unexpectedValues: number;
  writesApplied: number;
};

const WELLNESS_SCALE_VERSION = 2;
const DATABASE_ID = '(default)';
const MIGRATED_FIELDS = ['sleepQuality', 'fatigue', 'muscleSoreness', 'stress', 'mood'] as const;
const CONVERT_10_TO_7: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 4,
  6: 5,
  7: 6,
  8: 6,
  9: 7,
  10: 7,
};

function getScriptOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const userArg = args.find((arg) => arg.startsWith('--user='));
  const userId = userArg ? userArg.replace('--user=', '').trim() : undefined;
  return { apply, userId: userId || undefined };
}

function getProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }

  const firebaseRcPath = resolve(cwd(), '.firebaserc');
  const raw = readFileSync(firebaseRcPath, 'utf-8');
  const parsed = JSON.parse(raw) as { projects?: { default?: string } };
  const projectId = parsed.projects?.default;

  if (!projectId) {
    throw new Error('Could not resolve Firebase project id');
  }

  return projectId;
}

function getFirebaseCliAccessToken(): string {
  const configPaths = [
    resolve(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json'),
    resolve(process.env.APPDATA || '', 'configstore', 'firebase-tools.json'),
    resolve(process.env.LOCALAPPDATA || '', 'configstore', 'firebase-tools.json'),
  ].filter(Boolean);

  for (const configPath of configPaths) {
    if (!existsSync(configPath)) {
      continue;
    }

    try {
      const raw = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as { tokens?: { access_token?: string } };
      if (parsed.tokens?.access_token) {
        return parsed.tokens.access_token;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Could not find Firebase CLI access token. Run firebase login or provide a service-account based migration path.');
}

function documentId(documentName: string): string {
  return documentName.split('/').pop() || '';
}

function firestoreBaseUrl(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${DATABASE_ID}`;
}

async function firestoreFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore REST request failed ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

async function listCollection(
  projectId: string,
  token: string,
  collectionPath: string
): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${firestoreBaseUrl(projectId)}/documents/${collectionPath}`);
    url.searchParams.set('pageSize', '300');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await firestoreFetch<ListDocumentsResponse>(url.toString(), token);
    documents.push(...(response.documents || []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return documents;
}

function readNumber(fields: Record<string, FirestoreValue> | undefined, key: string): number | undefined {
  const value = fields?.[key];
  if (!value) return undefined;

  if (value.integerValue !== undefined) {
    return Number(value.integerValue);
  }

  if (value.doubleValue !== undefined) {
    return value.doubleValue;
  }

  return undefined;
}

function convertHooper10To7(value: unknown): { converted?: number; changed: boolean; unexpected: boolean } {
  if (value === undefined || value === null) {
    return { changed: false, unexpected: false };
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { changed: false, unexpected: true };
  }

  const rounded = Math.round(value);
  const converted = CONVERT_10_TO_7[rounded];

  if (!converted) {
    return { changed: false, unexpected: true };
  }

  return {
    converted,
    changed: converted !== value,
    unexpected: rounded !== value,
  };
}

async function patchDocument(
  documentName: string,
  token: string,
  fields: Record<string, FirestoreValue>
): Promise<void> {
  const url = new URL(`https://firestore.googleapis.com/v1/${documentName}`);
  Object.keys(fields).forEach((field) => {
    url.searchParams.append('updateMask.fieldPaths', field);
  });

  await firestoreFetch<FirestoreDocument>(url.toString(), token, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

async function run() {
  const options = getScriptOptions();
  const projectId = getProjectId();
  const token = getFirebaseCliAccessToken();
  const counters: Counters = {
    usersScanned: 0,
    logsScanned: 0,
    logsAlreadyVersioned: 0,
    logsChanged: 0,
    fieldValuesConverted: 0,
    unexpectedValues: 0,
    writesApplied: 0,
  };

  const users = options.userId
    ? [{ name: `${firestoreBaseUrl(projectId)}/documents/users/${options.userId}` }]
    : await listCollection(projectId, token, 'users');

  for (const userDoc of users) {
    counters.usersScanned += 1;
    const userId = documentId(userDoc.name);
    const wellnessLogs = await listCollection(projectId, token, `users/${userId}/wellnessLogs`);

    for (const logDoc of wellnessLogs) {
      counters.logsScanned += 1;
      const version = readNumber(logDoc.fields, 'wellnessScaleVersion');
      if (version === WELLNESS_SCALE_VERSION) {
        counters.logsAlreadyVersioned += 1;
        continue;
      }

      const updateFields: Record<string, FirestoreValue> = {
        wellnessScaleVersion: { integerValue: String(WELLNESS_SCALE_VERSION) },
        wellnessScaleMigratedAt: { timestampValue: new Date().toISOString() },
      };
      let changed = false;

      MIGRATED_FIELDS.forEach((field) => {
        const currentValue = readNumber(logDoc.fields, field);
        const result = convertHooper10To7(currentValue);
        if (result.unexpected) {
          counters.unexpectedValues += 1;
        }

        if (result.converted !== undefined) {
          updateFields[field] = { integerValue: String(result.converted) };
          if (result.changed) {
            counters.fieldValuesConverted += 1;
            changed = true;
          }
        }
      });

      if (!changed) {
        continue;
      }

      counters.logsChanged += 1;
      if (options.apply) {
        await patchDocument(logDoc.name, token, updateFields);
        counters.writesApplied += 1;
      }
    }
  }

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    projectId,
    migratedFields: MIGRATED_FIELDS,
    readinessMigrated: false,
    wellnessScaleVersion: WELLNESS_SCALE_VERSION,
    counters,
  }, null, 2));

  if (!options.apply) {
    console.log('Dry run only. Re-run with --apply to write changes.');
  }
}

run().catch((error) => {
  console.error('[migrateWellnessScale] Failed:', error);
  process.exitCode = 1;
});
