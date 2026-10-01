import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import {
  RehabPainLog,
  RehabProgress,
  SymmetryTestResult,
} from '@/types/rehabProgress';
import { toLocalDateString } from '@/utils/dateUtils';
import {
  SHOULDER_REHAB_PROGRAM_KEY,
  createInitialRehabProgress,
  isPainScore,
} from '@/utils/shoulderRehab';

const ensureAuth = (): string => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
};

const progressRef = (userId: string, programId: string) =>
  doc(db, 'users', userId, 'rehabProgress', programId);

const asPainLog = (value: unknown): RehabPainLog | null => {
  if (!value || typeof value !== 'object') return null;
  const log = value as Partial<RehabPainLog>;
  if (
    typeof log.id !== 'string' ||
    typeof log.sessionKey !== 'string' ||
    typeof log.sessionName !== 'string' ||
    typeof log.date !== 'string' ||
    typeof log.painBefore !== 'number' ||
    typeof log.painDuring !== 'number' ||
    typeof log.createdAt !== 'string'
  ) {
    return null;
  }
  return {
    id: log.id,
    sessionKey: log.sessionKey,
    sessionName: log.sessionName,
    week: typeof log.week === 'number' ? log.week : undefined,
    date: log.date,
    painBefore: log.painBefore,
    painDuring: log.painDuring,
    ...(typeof log.painNextMorning === 'number' ? { painNextMorning: log.painNextMorning } : {}),
    createdAt: log.createdAt,
  };
};

const asSymmetryTest = (value: unknown): SymmetryTestResult | null => {
  if (!value || typeof value !== 'object') return null;
  const test = value as Partial<SymmetryTestResult>;
  if (
    typeof test.id !== 'string' ||
    typeof test.date !== 'string' ||
    typeof test.weightKg !== 'number' ||
    typeof test.healthyReps !== 'number' ||
    typeof test.injuredReps !== 'number' ||
    typeof test.symmetryPercent !== 'number'
  ) {
    return null;
  }
  return {
    id: test.id,
    date: test.date,
    weightKg: test.weightKg,
    healthyReps: test.healthyReps,
    injuredReps: test.injuredReps,
    symmetryPercent: test.symmetryPercent,
  };
};

const asProgress = (programId: string, userId: string, data: Record<string, unknown>): RehabProgress => {
  const checks = data.checkpointChecks && typeof data.checkpointChecks === 'object'
    ? Object.fromEntries(
        Object.entries(data.checkpointChecks as Record<string, unknown>).filter(([, value]) => typeof value === 'boolean')
      ) as Record<string, boolean>
    : {};

  return {
    userId,
    programId,
    programKey: typeof data.programKey === 'string' ? data.programKey : SHOULDER_REHAB_PROGRAM_KEY,
    confirmedWeeks: Array.isArray(data.confirmedWeeks)
      ? data.confirmedWeeks.filter((week): week is number => typeof week === 'number')
      : [],
    checkpointChecks: checks,
    painLogs: Array.isArray(data.painLogs)
      ? data.painLogs.map(asPainLog).filter((log): log is RehabPainLog => log !== null)
      : [],
    symmetryTests: Array.isArray(data.symmetryTests)
      ? data.symmetryTests.map(asSymmetryTest).filter((test): test is SymmetryTestResult => test !== null)
      : [],
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
};

export const getRehabProgress = async (programId: string): Promise<RehabProgress> => {
  const userId = ensureAuth();
  const ref = progressRef(userId, programId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const initial = createInitialRehabProgress(userId, programId, toLocalDateString(new Date()));
    await setDoc(ref, initial);
    return initial;
  }
  return asProgress(programId, userId, snap.data() as Record<string, unknown>);
};

export const saveRehabProgress = async (progress: RehabProgress): Promise<void> => {
  const userId = ensureAuth();
  if (progress.userId !== userId) {
    throw new Error('You can only save your own rehab progress');
  }
  const next: RehabProgress = {
    ...progress,
    userId,
    painLogs: progress.painLogs.filter(
      (log) => isPainScore(log.painBefore) && isPainScore(log.painDuring) &&
        (log.painNextMorning === undefined || isPainScore(log.painNextMorning))
    ),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(progressRef(userId, progress.programId), next);
};
