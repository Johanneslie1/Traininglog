import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, WriteBatch } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

interface TeamDoc {
  coachId?: string;
  isActive?: boolean;
}

interface TeamMemberDoc {
  status?: 'active' | 'inactive';
}

interface CoachAthleteAccessDoc {
  coachId: string;
  athleteId: string;
  teamId: string;
  sharedTeamIds?: string[];
}

interface RebuildStats {
  activeTeamsScanned: number;
  membersScanned: number;
  expectedAccessDocs: number;
  existingAccessDocs: number;
  toCreate: number;
  toUpdate: number;
  toDelete: number;
  writesApplied: number;
}

type AccessTarget = {
  id: string;
  coachId: string;
  athleteId: string;
  teamId: string;
  sharedTeamIds: string[];
};

const args = new Set(process.argv.slice(2));
const applyMode = args.has('--apply');
const dryRun = !applyMode || args.has('--dry-run');
const shouldPrune = !args.has('--no-prune');

const getArgValue = (name: string): string | undefined => {
  const prefixed = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) {
    return prefixed.slice(name.length + 1);
  }

  const index = process.argv.findIndex((arg) => arg === name);
  if (index >= 0) {
    const nextValue = process.argv[index + 1];
    if (nextValue && !nextValue.startsWith('--')) {
      return nextValue;
    }
  }

  return undefined;
};

const serviceAccountPath =
  getArgValue('--service-account') ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.npm_config_service_account;

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

const projectId = resolveProjectId();

const printUsage = () => {
  console.log('Usage:');
  console.log('  tsx scripts/rebuildCoachAthleteAccess.ts --dry-run');
  console.log('  tsx scripts/rebuildCoachAthleteAccess.ts --apply [--no-prune]');
  console.log('Optional auth:');
  console.log('  --service-account=/absolute/path/to/serviceAccount.json');
  console.log('Or set GOOGLE_APPLICATION_CREDENTIALS env var');
};

const initializeAdmin = () => {
  if (getApps().length > 0) {
    return;
  }

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountRaw);
    initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {})
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {})
  });
};

const buildAccessId = (coachId: string, athleteId: string): string => `${coachId}_${athleteId}`;

const arraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
};

const normalizeTeamIds = (teamIds: string[] | undefined): string[] => {
  if (!Array.isArray(teamIds)) {
    return [];
  }

  return Array.from(new Set(teamIds.filter(Boolean))).sort();
};

const flushBatch = async (batch: WriteBatch, pendingWrites: number): Promise<void> => {
  if (pendingWrites === 0) {
    return;
  }

  await batch.commit();
};

const rebuildCoachAthleteAccess = async (): Promise<void> => {
  initializeAdmin();
  const db = getFirestore();

  const stats: RebuildStats = {
    activeTeamsScanned: 0,
    membersScanned: 0,
    expectedAccessDocs: 0,
    existingAccessDocs: 0,
    toCreate: 0,
    toUpdate: 0,
    toDelete: 0,
    writesApplied: 0,
  };

  const expectedMap = new Map<string, AccessTarget>();

  const activeTeamsSnapshot = await db
    .collection('teams')
    .where('isActive', '==', true)
    .get();

  for (const teamDoc of activeTeamsSnapshot.docs) {
    const teamData = teamDoc.data() as TeamDoc;
    const coachId = teamData.coachId;

    if (!coachId) {
      continue;
    }

    stats.activeTeamsScanned += 1;

    const membersSnapshot = await db.collection('teams').doc(teamDoc.id).collection('members').get();

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data() as TeamMemberDoc;
      if (memberData.status && memberData.status !== 'active') {
        continue;
      }

      const athleteId = memberDoc.id;
      if (!athleteId || athleteId === coachId) {
        continue;
      }

      stats.membersScanned += 1;

      const accessId = buildAccessId(coachId, athleteId);
      const existing = expectedMap.get(accessId);

      if (existing) {
        existing.sharedTeamIds = normalizeTeamIds([...existing.sharedTeamIds, teamDoc.id]);
        existing.teamId = existing.sharedTeamIds[0];
        continue;
      }

      expectedMap.set(accessId, {
        id: accessId,
        coachId,
        athleteId,
        teamId: teamDoc.id,
        sharedTeamIds: [teamDoc.id],
      });
    }
  }

  stats.expectedAccessDocs = expectedMap.size;

  const existingSnapshot = await db.collection('coachAthleteAccess').get();
  stats.existingAccessDocs = existingSnapshot.size;

  const existingMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  existingSnapshot.docs.forEach((doc) => {
    existingMap.set(doc.id, doc);
  });

  const createTargets: AccessTarget[] = [];
  const updateTargets: AccessTarget[] = [];
  const deleteTargets: string[] = [];

  expectedMap.forEach((expected, id) => {
    const existingDoc = existingMap.get(id);

    if (!existingDoc) {
      createTargets.push(expected);
      return;
    }

    const existingData = existingDoc.data() as CoachAthleteAccessDoc;
    const existingSharedTeamIds = normalizeTeamIds(existingData.sharedTeamIds);

    const mustUpdate =
      existingData.coachId !== expected.coachId ||
      existingData.athleteId !== expected.athleteId ||
      existingData.teamId !== expected.teamId ||
      !arraysEqual(existingSharedTeamIds, expected.sharedTeamIds);

    if (mustUpdate) {
      updateTargets.push(expected);
    }
  });

  if (shouldPrune) {
    existingMap.forEach((_doc, id) => {
      if (!expectedMap.has(id)) {
        deleteTargets.push(id);
      }
    });
  }

  stats.toCreate = createTargets.length;
  stats.toUpdate = updateTargets.length;
  stats.toDelete = deleteTargets.length;

  console.log('');
  console.log('Coach-athlete access rebuild plan');
  console.log('--------------------------------');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'APPLY (writes enabled)'}`);
  console.log(`Prune stale docs: ${shouldPrune ? 'yes' : 'no'}`);
  console.log(`Active teams scanned: ${stats.activeTeamsScanned}`);
  console.log(`Active members scanned: ${stats.membersScanned}`);
  console.log(`Expected access docs: ${stats.expectedAccessDocs}`);
  console.log(`Existing access docs: ${stats.existingAccessDocs}`);
  console.log(`To create: ${stats.toCreate}`);
  console.log(`To update: ${stats.toUpdate}`);
  console.log(`To delete: ${stats.toDelete}`);

  if (dryRun) {
    const previewCreates = createTargets.slice(0, 5).map((target) => target.id);
    const previewUpdates = updateTargets.slice(0, 5).map((target) => target.id);
    const previewDeletes = deleteTargets.slice(0, 5);

    if (previewCreates.length > 0) {
      console.log(`Create preview: ${previewCreates.join(', ')}`);
    }
    if (previewUpdates.length > 0) {
      console.log(`Update preview: ${previewUpdates.join(', ')}`);
    }
    if (previewDeletes.length > 0) {
      console.log(`Delete preview: ${previewDeletes.join(', ')}`);
    }

    console.log('');
    console.log('Dry run complete. Re-run with --apply to write changes.');
    return;
  }

  let batch = db.batch();
  let pendingWrites = 0;

  const queueWrite = async (commitAction: () => void): Promise<void> => {
    commitAction();
    pendingWrites += 1;

    if (pendingWrites >= 400) {
      await flushBatch(batch, pendingWrites);
      stats.writesApplied += pendingWrites;
      batch = db.batch();
      pendingWrites = 0;
    }
  };

  for (const target of createTargets) {
    const accessRef = db.collection('coachAthleteAccess').doc(target.id);
    await queueWrite(() => {
      batch.set(accessRef, {
        coachId: target.coachId,
        athleteId: target.athleteId,
        teamId: target.teamId,
        sharedTeamIds: target.sharedTeamIds,
        updatedAt: new Date().toISOString(),
        rebuiltAt: FieldValue.serverTimestamp(),
      });
    });
  }

  for (const target of updateTargets) {
    const accessRef = db.collection('coachAthleteAccess').doc(target.id);
    await queueWrite(() => {
      batch.set(
        accessRef,
        {
          coachId: target.coachId,
          athleteId: target.athleteId,
          teamId: target.teamId,
          sharedTeamIds: target.sharedTeamIds,
          updatedAt: new Date().toISOString(),
          rebuiltAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  }

  for (const accessId of deleteTargets) {
    const accessRef = db.collection('coachAthleteAccess').doc(accessId);
    await queueWrite(() => {
      batch.delete(accessRef);
    });
  }

  await flushBatch(batch, pendingWrites);
  stats.writesApplied += pendingWrites;

  console.log('');
  console.log('Rebuild complete');
  console.log('----------------');
  console.log(`Writes applied: ${stats.writesApplied}`);
  console.log(`Created: ${stats.toCreate}`);
  console.log(`Updated: ${stats.toUpdate}`);
  console.log(`Deleted: ${stats.toDelete}`);
};

const main = async () => {
  const hasHelp = args.has('--help') || args.has('-h');
  if (hasHelp) {
    printUsage();
    return;
  }

  try {
    await rebuildCoachAthleteAccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Unable to detect a Project Id') || message.includes('Could not load the default credentials')) {
      console.error('Authentication setup needed for admin script execution.');
      console.error('Provide one of these before rerunning:');
      console.error('1) --service-account=/absolute/path/to/serviceAccount.json');
      console.error('2) Set GOOGLE_APPLICATION_CREDENTIALS to a service account file path');
      console.error('Optional: set GCLOUD_PROJECT if project auto-detection fails.');
      printUsage();
    }

    console.error('Failed to rebuild coach-athlete access docs:', error);
    process.exit(1);
  }
};

main();
