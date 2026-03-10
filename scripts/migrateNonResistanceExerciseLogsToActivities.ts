import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';

type ScriptOptions = {
  apply: boolean;
  deleteSource: boolean;
};

type Counters = {
  scanned: number;
  candidates: number;
  moved: number;
  skippedResistance: number;
  skippedExistingActivity: number;
  skippedMissingName: number;
  deletedSource: number;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: 'session-logger-3619e.firebaseapp.com',
  projectId: 'session-logger-3619e',
  storageBucket: 'session-logger-3619e.firebasestorage.app',
  messagingSenderId: '936476651752',
  appId: '1:936476651752:web:7048bd9fcc902dc816595d',
};

const normalizeActivityType = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'resistance':
    case 'strength':
    case 'plyometric':
    case 'plyometrics':
    case 'bodyweight':
      return 'resistance';
    case 'sport':
    case 'team_sports':
      return 'sport';
    case 'stretching':
    case 'flexibility':
      return 'stretching';
    case 'endurance':
    case 'cardio':
      return 'endurance';
    case 'speedagility':
    case 'speed_agility':
    case 'speedagilityactivity':
      return 'speedAgility';
    default:
      return 'other';
  }
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

async function run() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Missing FIREBASE_API_KEY. Set it in the environment before running this script.');
  }

  const options = getOptions();
  const app = initializeApp(firebaseConfig, `non-resistance-migration-${Date.now()}`);
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
    candidates: 0,
    moved: 0,
    skippedResistance: 0,
    skippedExistingActivity: 0,
    skippedMissingName: 0,
    deletedSource: 0,
  };

  const exercisesRef = collection(db, 'users', userId, 'exercises');
  const activitiesRef = collection(db, 'users', userId, 'activities');

  const [exerciseSnapshot, activitySnapshot] = await Promise.all([
    getDocs(exercisesRef),
    getDocs(activitiesRef),
  ]);

  const existingActivityIds = new Set(activitySnapshot.docs.map((item) => item.id));

  for (const exerciseDoc of exerciseSnapshot.docs) {
    counters.scanned += 1;
    const data = exerciseDoc.data() as Record<string, unknown>;

    const activityType = normalizeActivityType(data.activityType);
    if (activityType === 'resistance') {
      counters.skippedResistance += 1;
      continue;
    }

    counters.candidates += 1;

    if (existingActivityIds.has(exerciseDoc.id)) {
      counters.skippedExistingActivity += 1;
      continue;
    }

    const exerciseName = typeof data.exerciseName === 'string' ? data.exerciseName.trim() : '';
    const activityName = typeof data.activityName === 'string' ? data.activityName.trim() : '';
    const resolvedName = activityName || exerciseName;

    if (!resolvedName) {
      counters.skippedMissingName += 1;
      continue;
    }

    const activityData = {
      ...data,
      userId,
      activityType,
      activityName: resolvedName,
    };

    if (options.apply) {
      await setDoc(doc(db, 'users', userId, 'activities', exerciseDoc.id), activityData, { merge: true });
      counters.moved += 1;

      if (options.deleteSource) {
        await deleteDoc(doc(db, 'users', userId, 'exercises', exerciseDoc.id));
        counters.deletedSource += 1;
      }
    }

    existingActivityIds.add(exerciseDoc.id);
  }

  console.log('✅ Migration finished');
  console.log(`Scanned exercises: ${counters.scanned}`);
  console.log(`Non-resistance candidates: ${counters.candidates}`);
  console.log(`Moves ${options.apply ? 'executed' : 'planned'}: ${options.apply ? counters.moved : counters.candidates - counters.skippedExistingActivity - counters.skippedMissingName}`);
  console.log(`Skipped resistance: ${counters.skippedResistance}`);
  console.log(`Skipped existing activity: ${counters.skippedExistingActivity}`);
  console.log(`Skipped missing name: ${counters.skippedMissingName}`);
  console.log(`Deletes ${options.apply ? 'executed' : 'planned'}: ${options.deleteSource ? counters.deletedSource : 0}`);
}

run().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
});
