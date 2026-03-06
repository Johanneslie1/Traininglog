import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

type LegacySource = 'usersExerciseLogs' | 'usersStrengthExercises' | 'topLevelExerciseLogs';

type MigrationCounters = {
  scanned: number;
  queuedWrites: number;
  skippedExisting: number;
  skippedNoUserId: number;
  queuedDeletes: number;
  committedBatches: number;
  failures: number;
};

type ScriptOptions = {
  apply: boolean;
  deleteSource: boolean;
  userId?: string;
};

const MAX_BATCH_OPS = 400;

function getScriptOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const deleteSource = args.includes('--delete-source');
  const userArg = args.find((arg) => arg.startsWith('--user='));
  const userId = userArg ? userArg.replace('--user=', '').trim() : undefined;
  return { apply, deleteSource, userId: userId || undefined };
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

function withoutUndefined<T extends Record<string, unknown>>(obj: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

function normalizeExerciseDoc(
  userId: string,
  source: LegacySource,
  sourcePath: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  return withoutUndefined({
    ...data,
    userId,
    activityType: data.activityType ?? 'resistance',
    _migratedFrom: source,
    _migratedFromPath: sourcePath,
    _migratedAt: FieldValue.serverTimestamp(),
  });
}

async function runMigration() {
  const options = getScriptOptions();
  initAdmin();
  const db = getFirestore();

  const counters: MigrationCounters = {
    scanned: 0,
    queuedWrites: 0,
    skippedExisting: 0,
    skippedNoUserId: 0,
    queuedDeletes: 0,
    committedBatches: 0,
    failures: 0,
  };

  const existingExerciseIdsByUser = new Map<string, Set<string>>();

  let batch = db.batch();
  let batchOps = 0;

  const flushBatch = async () => {
    if (batchOps === 0) return;
    if (options.apply) {
      await batch.commit();
      counters.committedBatches += 1;
    }
    batch = db.batch();
    batchOps = 0;
  };

  const queueSet = async (ref: FirebaseFirestore.DocumentReference, data: Record<string, unknown>) => {
    batch.set(ref, data, { merge: true });
    batchOps += 1;
    counters.queuedWrites += 1;
    if (batchOps >= MAX_BATCH_OPS) {
      await flushBatch();
    }
  };

  const queueDelete = async (ref: FirebaseFirestore.DocumentReference) => {
    batch.delete(ref);
    batchOps += 1;
    counters.queuedDeletes += 1;
    if (batchOps >= MAX_BATCH_OPS) {
      await flushBatch();
    }
  };

  const usersRef = db.collection('users');
  const usersSnap = options.userId
    ? await usersRef.where('__name__', '==', options.userId).get()
    : await usersRef.get();

  console.log(`🔍 Found ${usersSnap.size} user document(s) to process${options.userId ? ` (filtered user=${options.userId})` : ''}.`);

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;

    const canonicalSnap = await userDoc.ref.collection('exercises').get();
    const canonicalIds = new Set<string>(canonicalSnap.docs.map((doc) => doc.id));
    existingExerciseIdsByUser.set(userId, canonicalIds);

    const sourceCollections: Array<{ name: string; source: LegacySource }> = [
      { name: 'exerciseLogs', source: 'usersExerciseLogs' },
      { name: 'strengthExercises', source: 'usersStrengthExercises' },
    ];

    for (const sourceCollection of sourceCollections) {
      const sourceSnap = await userDoc.ref.collection(sourceCollection.name).get();

      for (const legacyDoc of sourceSnap.docs) {
        counters.scanned += 1;
        const legacyData = legacyDoc.data() as Record<string, unknown>;
        const targetRef = userDoc.ref.collection('exercises').doc(legacyDoc.id);

        if (canonicalIds.has(legacyDoc.id)) {
          counters.skippedExisting += 1;
          continue;
        }

        const normalized = normalizeExerciseDoc(
          userId,
          sourceCollection.source,
          `users/${userId}/${sourceCollection.name}/${legacyDoc.id}`,
          legacyData
        );

        await queueSet(targetRef, normalized);
        canonicalIds.add(legacyDoc.id);

        if (options.deleteSource) {
          await queueDelete(legacyDoc.ref);
        }
      }
    }
  }

  const topLevelLegacySnap = await db.collection('exerciseLogs').get();
  console.log(`🔍 Found ${topLevelLegacySnap.size} top-level exerciseLogs document(s).`);

  for (const legacyDoc of topLevelLegacySnap.docs) {
    counters.scanned += 1;
    const legacyData = legacyDoc.data() as Record<string, unknown>;
    const userId = typeof legacyData.userId === 'string' ? legacyData.userId : '';

    if (!userId) {
      counters.skippedNoUserId += 1;
      continue;
    }

    if (options.userId && options.userId !== userId) {
      continue;
    }

    const userRef = db.collection('users').doc(userId);
    const canonicalIds = existingExerciseIdsByUser.get(userId) ?? new Set<string>();
    existingExerciseIdsByUser.set(userId, canonicalIds);

    const targetRef = userRef.collection('exercises').doc(legacyDoc.id);
    if (canonicalIds.has(legacyDoc.id)) {
      counters.skippedExisting += 1;
      continue;
    }

    const normalized = normalizeExerciseDoc(
      userId,
      'topLevelExerciseLogs',
      `exerciseLogs/${legacyDoc.id}`,
      legacyData
    );

    await queueSet(targetRef, normalized);
    canonicalIds.add(legacyDoc.id);

    if (options.deleteSource) {
      await queueDelete(legacyDoc.ref);
    }
  }

  await flushBatch();

  console.log('\n✅ Migration summary');
  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Delete source docs: ${options.deleteSource ? 'YES' : 'NO'}`);
  console.log(`Scanned docs: ${counters.scanned}`);
  console.log(`Queued writes: ${counters.queuedWrites}`);
  console.log(`Queued deletes: ${counters.queuedDeletes}`);
  console.log(`Skipped (already exists): ${counters.skippedExisting}`);
  console.log(`Skipped (missing userId): ${counters.skippedNoUserId}`);
  console.log(`Committed batches: ${counters.committedBatches}`);
  console.log(`Failures: ${counters.failures}`);
}

runMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
});
