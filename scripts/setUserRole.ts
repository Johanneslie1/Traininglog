import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

type UserRole = 'athlete' | 'coach';

const args = process.argv.slice(2);

const getArgValue = (name: string): string | undefined => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) {
    return prefixed.slice(name.length + 1);
  }

  const index = args.findIndex((arg) => arg === name);
  if (index >= 0) {
    const nextValue = args[index + 1];
    if (nextValue && !nextValue.startsWith('--')) {
      return nextValue;
    }
  }

  return undefined;
};

const hasFlag = (name: string): boolean => args.includes(name);

const printUsage = (): void => {
  console.log('Usage:');
  console.log('  npm run user-role:set -- --email coach@example.com --role coach');
  console.log('  npm run user-role:set -- --uid firebaseUid --role athlete');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run                         Print the change without writing');
  console.log('  --service-account=/path/key.json   Use a Firebase service account key');
  console.log('');
  console.log('You can also set GOOGLE_APPLICATION_CREDENTIALS for service account auth.');
};

const resolveProjectId = (): string | undefined => {
  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }

  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return process.env.GOOGLE_CLOUD_PROJECT;
  }

  try {
    const firebasercPath = path.resolve('.firebaserc');
    if (!fs.existsSync(firebasercPath)) {
      return undefined;
    }

    const firebasercRaw = fs.readFileSync(firebasercPath, 'utf8');
    const firebaserc = JSON.parse(firebasercRaw) as {
      projects?: {
        default?: string;
      };
    };

    return firebaserc.projects?.default;
  } catch {
    return undefined;
  }
};

const initializeAdmin = (): void => {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountPath =
    getArgValue('--service-account') ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.npm_config_service_account;

  const projectId = resolveProjectId();

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountRaw);
    initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {}),
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
};

const parseRole = (value: string | undefined): UserRole => {
  if (value === 'athlete' || value === 'coach') {
    return value;
  }

  throw new Error('Missing or invalid --role. Expected "athlete" or "coach".');
};

const main = async (): Promise<void> => {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const email = getArgValue('--email');
  const uidArg = getArgValue('--uid');
  const role = parseRole(getArgValue('--role'));
  const dryRun = hasFlag('--dry-run');

  if (!email && !uidArg) {
    throw new Error('Provide either --email or --uid.');
  }

  if (email && uidArg) {
    throw new Error('Provide only one of --email or --uid.');
  }

  initializeAdmin();

  const auth = getAuth();
  const firestore = getFirestore();
  const authUser = email ? await auth.getUserByEmail(email) : await auth.getUser(uidArg as string);
  const userRef = firestore.collection('users').doc(authUser.uid);
  const userSnapshot = await userRef.get();
  const currentData = userSnapshot.exists ? userSnapshot.data() : undefined;
  const currentRole = currentData?.role ?? '(missing)';
  const displayEmail = currentData?.email || authUser.email || email || '(no email)';

  console.log('User role change');
  console.log(`  uid: ${authUser.uid}`);
  console.log(`  email: ${displayEmail}`);
  console.log(`  current role: ${currentRole}`);
  console.log(`  new role: ${role}`);
  console.log(`  mode: ${dryRun ? 'dry-run' : 'apply'}`);

  if (dryRun) {
    return;
  }

  await userRef.set(
    {
      id: authUser.uid,
      email: displayEmail,
      role,
      updatedAt: Timestamp.now(),
      ...(!userSnapshot.exists ? { createdAt: Timestamp.now() } : {}),
    },
    { merge: true }
  );

  const updatedSnapshot = await userRef.get();
  console.log(`Updated role: ${updatedSnapshot.data()?.role ?? '(missing)'}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  printUsage();
  process.exitCode = 1;
});
