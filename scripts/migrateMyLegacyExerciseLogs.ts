import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';

type LegacySource = 'usersExerciseLogs' | 'usersStrengthExercises' | 'topLevelExerciseLogs';

type ScriptOptions = {
  apply: boolean;
  deleteSource: boolean;
};

type Counters = {
  scanned: number;
  toWrite: number;
  skippedExisting: number;
  skippedNoUserId: number;
  deleted: number;
};

const firebaseConfig = {
  apiKey: 'AIzaSyDgA76WHz1JzwEc1YeazhKTUxqxHzhcP2c',
  authDomain: 'session-logger-3619e.firebaseapp.com',
  projectId: 'session-logger-3619e',
  storageBucket: 'session-logger-3619e.firebasestorage.app',
  messagingSenderId: '936476651752',
  appId: '1:936476651752:web:7048bd9fcc902dc816595d',
};

function getOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    deleteSource: args.includes('--delete-source'),
  };
}

function getFirebaseToolsTokens(): { accessToken: string; idToken: string } {
  const candidatePaths = [
    resolve(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json'),
    resolve(process.env.APPDATA || '', 'configstore', 'firebase-tools.json'),
    resolve(process.env.LOCALAPPDATA || '', 'configstore', 'firebase-tools.json'),
  ];

  for (const candidate of candidatePaths) {
    if (!existsSync(candidate)) continue;
    const raw = readFileSync(candidate, 'utf-8');
    const parsed = JSON.parse(raw) as {
      tokens?: { access_token?: string; id_token?: string };
    };

    const accessToken = parsed.tokens?.access_token;
    const idToken = parsed.tokens?.id_token;

    if (accessToken && idToken) {
      return { accessToken, idToken };
    }
  }

  throw new Error('Could not find firebase-tools Google tokens. Run "firebase login" first.');
}

function normalizeDoc(userId: string, source: LegacySource, sourcePath: string, data: Record<string, unknown>) {
  return {
    ...data,
    userId,
    activityType: data.activityType ?? 'resistance',
    _migratedFrom: source,
    _migratedFromPath: sourcePath,
    _migratedAt: serverTimestamp(),
  };
}

async function run() {
  const options = getOptions();
  const app = initializeApp(firebaseConfig, `legacy-migration-${Date.now()}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const { accessToken, idToken } = getFirebaseToolsTokens();
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const signInResult = await signInWithCredential(auth, credential);
  const userId = signInResult.user.uid;

  console.log(`🔐 Signed in as ${signInResult.user.email || userId}`);
  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'} | Delete source: ${options.deleteSource ? 'YES' : 'NO'}`);

  const counters: Counters = {
    scanned: 0,
    toWrite: 0,
    skippedExisting: 0,
    skippedNoUserId: 0,
    deleted: 0,
  };

  const canonicalRef = collection(db, 'users', userId, 'exercises');
  const canonicalSnap = await getDocs(canonicalRef);
  const existingIds = new Set(canonicalSnap.docs.map((item) => item.id));

  const migrateSubcollection = async (subcollectionName: 'exerciseLogs' | 'strengthExercises', source: LegacySource) => {
    const sourceRef = collection(db, 'users', userId, subcollectionName);
    const sourceSnap = await getDocs(sourceRef);

    for (const sourceDoc of sourceSnap.docs) {
      counters.scanned += 1;

      if (existingIds.has(sourceDoc.id)) {
        counters.skippedExisting += 1;
        continue;
      }

      const normalized = normalizeDoc(
        userId,
        source,
        `users/${userId}/${subcollectionName}/${sourceDoc.id}`,
        sourceDoc.data() as Record<string, unknown>
      );

      counters.toWrite += 1;
      if (options.apply) {
        await setDoc(doc(db, 'users', userId, 'exercises', sourceDoc.id), normalized, { merge: true });
        if (options.deleteSource) {
          await deleteDoc(sourceDoc.ref);
          counters.deleted += 1;
        }
      }

      existingIds.add(sourceDoc.id);
    }
  };

  await migrateSubcollection('exerciseLogs', 'usersExerciseLogs');
  await migrateSubcollection('strengthExercises', 'usersStrengthExercises');

  const topLegacyQuery = query(collection(db, 'exerciseLogs'), where('userId', '==', userId));
  const topLegacySnap = await getDocs(topLegacyQuery);

  for (const sourceDoc of topLegacySnap.docs) {
    counters.scanned += 1;
    const sourceData = sourceDoc.data() as Record<string, unknown>;
    const sourceUserId = typeof sourceData.userId === 'string' ? sourceData.userId : '';

    if (!sourceUserId) {
      counters.skippedNoUserId += 1;
      continue;
    }

    if (existingIds.has(sourceDoc.id)) {
      counters.skippedExisting += 1;
      continue;
    }

    const normalized = normalizeDoc(userId, 'topLevelExerciseLogs', `exerciseLogs/${sourceDoc.id}`, sourceData);

    counters.toWrite += 1;
    if (options.apply) {
      await setDoc(doc(db, 'users', userId, 'exercises', sourceDoc.id), normalized, { merge: true });
      if (options.deleteSource) {
        await deleteDoc(sourceDoc.ref);
        counters.deleted += 1;
      }
    }

    existingIds.add(sourceDoc.id);
  }

  console.log('✅ Migration finished');
  console.log(`Scanned: ${counters.scanned}`);
  console.log(`Writes ${options.apply ? 'executed' : 'planned'}: ${counters.toWrite}`);
  console.log(`Skipped existing: ${counters.skippedExisting}`);
  console.log(`Skipped no userId: ${counters.skippedNoUserId}`);
  console.log(`Deletes ${options.apply ? 'executed' : 'planned'}: ${options.deleteSource ? counters.deleted : 0}`);
}

run().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
});
