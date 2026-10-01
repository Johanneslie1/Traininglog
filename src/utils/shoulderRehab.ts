import { ProgramSession, ProgramSessionKind } from '@/types/program';
import {
  RehabPainLog,
  RehabPainLogInput,
  RehabProgress,
  SymmetryTestInput,
  SymmetryTestResult,
} from '@/types/rehabProgress';

export const SHOULDER_REHAB_PROGRAM_KEY = 'shoulder-rehab-3-week';
export const PAIN_DURING_LIMIT = 3;
export const SYMMETRY_TARGET_PERCENT = 90;

export const symmetryPercent = (injuredReps: number, healthyReps: number): number => {
  if (!Number.isFinite(healthyReps) || healthyReps <= 0) return 0;
  if (!Number.isFinite(injuredReps) || injuredReps < 0) return 0;
  return Math.round((injuredReps / healthyReps) * 100);
};

export const checkpointKey = (week: number, index: number): string => `${week}:${index}`;

export const isRehabWeekUnlocked = (
  confirmedWeeks: number[] | undefined,
  week: number | undefined
): boolean => {
  if (week == null || week <= 1) return true;
  return (confirmedWeeks ?? []).includes(week - 1);
};

export const canConfirmCheckpoint = (
  checks: Record<string, boolean> | undefined,
  week: number,
  itemCount: number
): boolean => {
  if (itemCount <= 0) return false;
  for (let index = 0; index < itemCount; index += 1) {
    if (!checks?.[checkpointKey(week, index)]) return false;
  }
  return true;
};

export const rehabSessionKey = (
  session: Pick<ProgramSession, 'sessionKind' | 'week'>
): string | null => {
  if (session.sessionKind === 'daily-activation') return 'daily';
  if (session.sessionKind === 'strength' && typeof session.week === 'number') {
    return `week-${session.week}`;
  }
  return null;
};

export const getPainWarnings = (
  log: Pick<RehabPainLog, 'painDuring' | 'painBefore' | 'painNextMorning'>
): string[] => {
  const warnings: string[] = [];
  if (log.painDuring > PAIN_DURING_LIMIT) {
    warnings.push('Pain during exercise is above 3/10.');
  }
  if (typeof log.painNextMorning === 'number' && log.painNextMorning > log.painBefore) {
    warnings.push('Next-morning pain is worse than before the session.');
  }
  return warnings;
};

export const isPainScore = (value: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= 10;

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
};

export const createSeedSymmetryTest = (date: string): SymmetryTestResult => ({
  id: 'seed-side-lying-er',
  date,
  weightKg: 3,
  healthyReps: 16,
  injuredReps: 10,
  symmetryPercent: symmetryPercent(10, 16),
});

export const createInitialRehabProgress = (
  userId: string,
  programId: string,
  date: string
): RehabProgress => ({
  userId,
  programId,
  programKey: SHOULDER_REHAB_PROGRAM_KEY,
  confirmedWeeks: [],
  checkpointChecks: {},
  painLogs: [],
  symmetryTests: [createSeedSymmetryTest(date)],
  updatedAt: new Date().toISOString(),
});

export const withCheckpointToggle = (
  progress: RehabProgress,
  week: number,
  index: number
): RehabProgress => {
  const key = checkpointKey(week, index);
  return {
    ...progress,
    checkpointChecks: {
      ...progress.checkpointChecks,
      [key]: !progress.checkpointChecks[key],
    },
    updatedAt: new Date().toISOString(),
  };
};

export const withConfirmedWeek = (progress: RehabProgress, week: number): RehabProgress => {
  if (progress.confirmedWeeks.includes(week)) return progress;
  return {
    ...progress,
    confirmedWeeks: [...progress.confirmedWeeks, week].sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  };
};

export const withPainLog = (progress: RehabProgress, input: RehabPainLogInput): RehabProgress => {
  const log: RehabPainLog = {
    id: createId('pain'),
    sessionKey: input.sessionKey,
    sessionName: input.sessionName,
    date: input.date,
    painBefore: input.painBefore,
    painDuring: input.painDuring,
    createdAt: new Date().toISOString(),
    ...(typeof input.week === 'number' ? { week: input.week } : {}),
    ...(typeof input.painNextMorning === 'number' ? { painNextMorning: input.painNextMorning } : {}),
  };
  return {
    ...progress,
    painLogs: [...progress.painLogs, log],
    updatedAt: new Date().toISOString(),
  };
};

export const withNextMorningPain = (
  progress: RehabProgress,
  logId: string,
  painNextMorning: number
): RehabProgress => ({
  ...progress,
  painLogs: progress.painLogs.map((log) =>
    log.id === logId ? { ...log, painNextMorning } : log
  ),
  updatedAt: new Date().toISOString(),
});

export const withSymmetryTest = (
  progress: RehabProgress,
  input: SymmetryTestInput
): RehabProgress => {
  const result: SymmetryTestResult = {
    id: createId('symmetry'),
    date: input.date,
    weightKg: input.weightKg,
    healthyReps: input.healthyReps,
    injuredReps: input.injuredReps,
    symmetryPercent: symmetryPercent(input.injuredReps, input.healthyReps),
  };
  return {
    ...progress,
    symmetryTests: [...progress.symmetryTests, result].sort((a, b) => a.date.localeCompare(b.date)),
    updatedAt: new Date().toISOString(),
  };
};

const finiteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const mapStoredSessionRehabFields = (
  sessionData: Record<string, unknown>
): Partial<Pick<ProgramSession, 'week' | 'sessionsPerWeek' | 'sessionKind' | 'checkpoint'>> => {
  const week = finiteNumber(sessionData.week);
  const sessionsPerWeek = finiteNumber(sessionData.sessionsPerWeek);
  const sessionKind: ProgramSessionKind | undefined =
    sessionData.sessionKind === 'daily-activation' || sessionData.sessionKind === 'strength'
      ? sessionData.sessionKind
      : undefined;
  const checkpoint = Array.isArray(sessionData.checkpoint)
    ? sessionData.checkpoint.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined;

  return {
    ...(week !== undefined ? { week } : {}),
    ...(sessionsPerWeek !== undefined ? { sessionsPerWeek } : {}),
    ...(sessionKind ? { sessionKind } : {}),
    ...(checkpoint && checkpoint.length > 0 ? { checkpoint } : {}),
  };
};
