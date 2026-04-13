import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

type ScriptOptions = {
  apply: boolean;
  ownerUid: string;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
};

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

function getOptions(): ScriptOptions {
  const args = process.argv.slice(2);
  const ownerUidArg = args.find((arg) => arg.startsWith('--ownerUid='));
  const ownerUid = (ownerUidArg?.split('=')[1] || process.env.GLOBAL_EXERCISE_OWNER_UID || '').trim();

  if (!ownerUid) {
    throw new Error('Missing owner UID. Provide --ownerUid=<uid> or GLOBAL_EXERCISE_OWNER_UID env var.');
  }

  return {
    apply: args.includes('--apply'),
    ownerUid,
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
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Missing Firebase config env vars. Set FIREBASE_* env vars before running this script.');
  }

  const options = getOptions();
  const app = initializeApp(firebaseConfig, `global-exercise-migration-${Date.now()}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const { accessToken, idToken } = getFirebaseToolsTokens();
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const signInResult = await signInWithCredential(auth, credential);

  console.log(`🔐 Signed in as ${signInResult.user.email || signInResult.user.uid}`);
  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Owner UID: ${options.ownerUid}`);

  const ownerCustomExercisesQuery = query(
    collection(db, 'exercises'),
    where('userId', '==', options.ownerUid),
    limit(500)
  );
  const ownerCustomExercisesSnap = await getDocs(ownerCustomExercisesQuery);

  let scanned = 0;
  let toWrite = 0;
  let skippedDuplicates = 0;

  for (const sourceDoc of ownerCustomExercisesSnap.docs) {
    scanned += 1;
    const sourceData = sourceDoc.data() as Record<string, any>;
    const normalizedName = normalizeName(String(sourceData.name || ''));
    const activityType = String(sourceData.activityType || 'other');

    if (!normalizedName) {
      skippedDuplicates += 1;
      continue;
    }

    const duplicateQuery = query(
      collection(db, 'globalExercises'),
      where('activityType', '==', activityType),
      where('nameLower', '==', normalizedName),
      limit(1)
    );
    const duplicateSnap = await getDocs(duplicateQuery);

    if (!duplicateSnap.empty) {
      skippedDuplicates += 1;
      continue;
    }

    toWrite += 1;

    if (options.apply) {
      await setDoc(
        doc(db, 'globalExercises', sourceDoc.id),
        {
          ...sourceData,
          nameLower: sourceData.nameLower || normalizedName,
          userId: options.ownerUid,
          migratedAt: serverTimestamp(),
          migratedFrom: `exercises/${sourceDoc.id}`,
        },
        { merge: true }
      );
    }
  }

  console.log('✅ Global exercise migration finished');
  console.log(`Scanned: ${scanned}`);
  console.log(`Writes ${options.apply ? 'executed' : 'planned'}: ${toWrite}`);
  console.log(`Skipped duplicates/invalid: ${skippedDuplicates}`);
}

run().catch((error) => {
  console.error('❌ Global exercise migration failed:', error);
  process.exitCode = 1;
});
