import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ScriptOptions = {
  apply: boolean;
  userId?: string;
};

type CollectionName = 'exerciseLogs' | 'exercises' | 'activities';

type Counters = {
  usersScanned: number;
  docsScanned: number;
  docsUpdated: number;
  setsScanned: number;
  setsConverted: number;
  setsRemovedOnly: number;
  setsSkippedExistingRpe: number;
  setsUnexpectedRirValue: number;
  writesQueued: number;
  batchesCommitted: number;
};

const MAX_BATCH_OPS = 400;

const RIR_TO_RPE: Record<number, number> = {
  0: 10,
  1: 9,
  2: 7,
  3: 6,
  4: 5,
  5: 4,
};

const TARGET_COLLECTIONS: CollectionName[] = ['exerciseLogs', 'exercises', 'activities'];

function getScriptOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const userArg = args.find((arg) => arg.startsWith('--user='));
  const userId = userArg ? userArg.replace('--user=', '').trim() : undefined;
  return { apply, userId: userId || undefined };
}

function getProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }

  const firebaseRcPath = resolve(cwd(), '.firebaserc');
  if (existsSync(firebaseRcPath)) {
    try {
      const raw = readFileSync(firebaseRcPath, 'utf-8');
      const parsed = JSON.parse(raw) as { projects?: { default?: string } };
      if (parsed.projects?.default) {
        return parsed.projects.default;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function getFirebaseCliAccessToken(): string | undefined {
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

  return undefined;
}

function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = getProjectId();
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(parsed), projectId });
  }

  if (serviceAccountPath) {
    const resolvedPath = resolve(serviceAccountPath);
    const fileContent = readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    return initializeApp({ credential: cert(parsed), projectId });
  }

  const cliAccessToken = getFirebaseCliAccessToken();
  if (cliAccessToken) {
    return initializeApp({
      projectId,
      credential: {
        getAccessToken: async () => ({
          access_token: cliAccessToken,
          expires_in: 3600,
        }),
      } as any,
    });
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

const hasNumericRpe = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clampRpe = (value: number): number => Math.max(1, Math.min(10, value));

const mapRirToRpe = (rir: number): { rpe: number; unexpected: boolean } => {
  const rounded = Math.round(rir);
  if (Object.prototype.hasOwnProperty.call(RIR_TO_RPE, rounded)) {
    return { rpe: RIR_TO_RPE[rounded], unexpected: rounded !== rir };
  }

  const clampedKey = Math.max(0, Math.min(5, rounded));
  return { rpe: clampRpe(RIR_TO_RPE[clampedKey]), unexpected: true };
};

function migrateSets(
  sets: unknown,
  counters: Counters
): { changed: boolean; migratedSets: Array<Record<string, unknown>> } {
  if (!Array.isArray(sets)) {
    return { changed: false, migratedSets: [] };
  }

  let changed = false;
  const migratedSets = sets.map((rawSet) => {
    if (!rawSet || typeof rawSet !== 'object') {
      return rawSet as Record<string, unknown>;
    }

    counters.setsScanned += 1;
    const set = rawSet as Record<string, unknown>;

    if (!Object.prototype.hasOwnProperty.call(set, 'rir')) {
      return set;
    }

    const nextSet: Record<string, unknown> = { ...set };
    const rirValue = set.rir;
    const hasRpe = hasNumericRpe(set.rpe);

    if (!hasRpe && typeof rirValue === 'number' && Number.isFinite(rirValue)) {
      const mapped = mapRirToRpe(rirValue);
      nextSet.rpe = mapped.rpe;
      counters.setsConverted += 1;
      if (mapped.unexpected) {
        counters.setsUnexpectedRirValue += 1;
      }
    } else if (hasRpe) {
      counters.setsSkippedExistingRpe += 1;
      counters.setsRemovedOnly += 1;
    } else {
      counters.setsUnexpectedRirValue += 1;
      counters.setsRemovedOnly += 1;
    }

    delete nextSet.rir;
    changed = true;
    return nextSet;
  });

  return { changed, migratedSets };
}

async function run() {
  const options = getScriptOptions();
  initAdmin();
  const db = getFirestore();

  const counters: Counters = {
    usersScanned: 0,
    docsScanned: 0,
    docsUpdated: 0,
    setsScanned: 0,
    setsConverted: 0,
    setsRemovedOnly: 0,
    setsSkippedExistingRpe: 0,
    setsUnexpectedRirValue: 0,
    writesQueued: 0,
    batchesCommitted: 0,
  };

  let batch = db.batch();
  let batchOps = 0;

  const flushBatch = async () => {
    if (batchOps === 0) return;
    if (options.apply) {
      await batch.commit();
      counters.batchesCommitted += 1;
    }
    batch = db.batch();
    batchOps = 0;
  };

  const queueUpdate = async (
    ref: FirebaseFirestore.DocumentReference,
    data: Record<string, unknown>
  ) => {
    batch.update(ref, data);
    batchOps += 1;
    counters.writesQueued += 1;
    if (batchOps >= MAX_BATCH_OPS) {
      await flushBatch();
    }
  };

  const usersRef = db.collection('users');
  const usersSnap = options.userId
    ? await usersRef.where('__name__', '==', options.userId).get()
    : await usersRef.get();

  console.log(
    `[scan] Found ${usersSnap.size} user(s)${options.userId ? ` (filtered user=${options.userId})` : ''}.`
  );
  console.log(`[mode] ${options.apply ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  console.log(`[collections] ${TARGET_COLLECTIONS.join(', ')}`);

  for (const userDoc of usersSnap.docs) {
    counters.usersScanned += 1;

    for (const collectionName of TARGET_COLLECTIONS) {
      const logsSnap = await userDoc.ref.collection(collectionName).get();

      for (const logDoc of logsSnap.docs) {
        counters.docsScanned += 1;
        const data = logDoc.data() as Record<string, unknown>;
        const { changed, migratedSets } = migrateSets(data.sets, counters);

        if (!changed) {
          continue;
        }

        counters.docsUpdated += 1;
        await queueUpdate(logDoc.ref, {
          sets: migratedSets,
          updatedAt: new Date(),
        });
      }
    }
  }

  await flushBatch();

  console.log('\n[done] RIR -> RPE migration summary');
  console.log(`usersScanned: ${counters.usersScanned}`);
  console.log(`docsScanned: ${counters.docsScanned}`);
  console.log(`docsUpdated: ${counters.docsUpdated}`);
  console.log(`setsScanned: ${counters.setsScanned}`);
  console.log(`setsConverted (no rpe -> mapped): ${counters.setsConverted}`);
  console.log(`setsRemovedOnly (rpe existed or bad rir): ${counters.setsRemovedOnly}`);
  console.log(`setsSkippedExistingRpe: ${counters.setsSkippedExistingRpe}`);
  console.log(`setsUnexpectedRirValue: ${counters.setsUnexpectedRirValue}`);
  console.log(`writesQueued: ${counters.writesQueued}`);
  console.log(`batchesCommitted: ${counters.batchesCommitted}`);

  if (!options.apply) {
    console.log('\n[info] Dry run complete. Re-run with --apply to write changes.');
  }
}

run().catch((error) => {
  console.error('[error] Migration failed:', error);
  process.exitCode = 1;
});
