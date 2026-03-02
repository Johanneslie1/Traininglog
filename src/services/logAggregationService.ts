import { getExerciseLogs as getFirebaseExerciseLogs } from '@/services/firebase/exerciseLogs';
import { getActivityLogs as getFirebaseActivityLogs } from '@/services/firebase/activityLogs';
import { getExerciseLogs as getStrengthExerciseLogs } from '@/services/firebase/strengthExerciseLogs';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';

type ExportSource = 'exercise' | 'activity' | 'strength' | 'local';

type AnySet = Record<string, unknown>;

type SourceLog = {
  id: string;
  exerciseName: string;
  sets: AnySet[];
  timestamp: Date;
  userId: string;
  activityType?: string;
  exerciseType?: string;
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
  collectionType: ExportSource;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toAnySets = (value: unknown): AnySet[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isObjectRecord);
};

const LOCAL_EXERCISE_LOGS_KEY = 'exercise_logs';

const parseTimestamp = (value: unknown): Date => {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>) && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = value ? new Date(value as string | number | Date) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const readTimestampFromRecord = (entry: Record<string, unknown>): Date => {
  const candidates = [
    entry.timestamp,
    entry.loggedTimestamp,
    entry.loggedAt,
    entry.performedAt,
    entry.date,
    entry.createdAt,
    entry.updatedAt,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return parseTimestamp(candidate);
    }
  }

  return new Date();
};

const safeGetLocalStorage = (key: string): string | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
};

const readLocalExerciseLogs = (userId: string, startDate: Date, endDate: Date): SourceLog[] => {
  const raw = safeGetLocalStorage(LOCAL_EXERCISE_LOGS_KEY);
  if (!raw) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse local exercise logs for export. Ignoring local source.', error);
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.warn('Local exercise logs are not an array. Ignoring local source.');
    return [];
  }

  return parsed
    .map((entry, index) => {
      const log = (entry || {}) as Record<string, unknown>;
      const timestamp = readTimestampFromRecord(log);
      const resolvedUserId = String(log.userId || userId);

      return {
        id: String(log.id || `local-${index}-${timestamp.getTime()}`),
        exerciseName: String(log.exerciseName || log.activityName || 'Unknown exercise'),
        sets: toAnySets(log.sets),
        timestamp,
        userId: resolvedUserId,
        activityType: typeof log.activityType === 'string' ? log.activityType : undefined,
        exerciseType: typeof log.exerciseType === 'string' ? log.exerciseType : undefined,
        supersetId: typeof log.supersetId === 'string' ? log.supersetId : undefined,
        supersetLabel: typeof log.supersetLabel === 'string' ? log.supersetLabel : undefined,
        supersetName: typeof log.supersetName === 'string' ? log.supersetName : undefined,
        collectionType: 'local' as const,
      };
    })
    .filter((log) => {
      if (log.userId !== userId && log.userId !== 'anonymous') {
        return false;
      }

      return log.timestamp >= startDate && log.timestamp <= endDate;
    });
};

const createDedupeKey = (log: SourceLog): string => {
  const normalizedName = log.exerciseName.trim().toLowerCase();
  const normalizedType = resolveActivityTypeFromExerciseLike(
    {
      activityType: log.activityType,
      exerciseType: log.exerciseType,
      sets: log.sets,
    },
    {
      fallback: ActivityType.OTHER,
      preferHintOverOther: true,
    }
  );
  const setSignature = JSON.stringify(log.sets || []);

  return `${normalizedName}|${normalizedType}|${log.timestamp.getTime()}|${setSignature}`;
};

const sourcePriority = (source: ExportSource): number => {
  switch (source) {
    case 'local':
      return 0;
    case 'activity':
      return 1;
    case 'exercise':
      return 2;
    case 'strength':
      return 3;
    default:
      return 0;
  }
};

const shouldReplaceLog = (current: SourceLog, candidate: SourceLog): boolean => {
  const currentTime = current.timestamp.getTime();
  const candidateTime = candidate.timestamp.getTime();

  if (candidateTime > currentTime) {
    return true;
  }

  if (candidateTime < currentTime) {
    return false;
  }

  return sourcePriority(candidate.collectionType) > sourcePriority(current.collectionType);
};

const dedupeLogs = (logs: SourceLog[]): SourceLog[] => {
  const byKey = new Map<string, SourceLog>();

  logs.forEach((log) => {
    const explicitIdKey = log.id ? `id:${log.id}` : '';
    const compositeKey = `shape:${createDedupeKey(log)}`;
    const existingById = explicitIdKey ? byKey.get(explicitIdKey) : undefined;
    const existingByComposite = byKey.get(compositeKey);
    const existing = existingById || existingByComposite;

    if (!existing) {
      if (explicitIdKey) {
        byKey.set(explicitIdKey, log);
      }
      byKey.set(compositeKey, log);
      return;
    }

    const winner = shouldReplaceLog(existing, log) ? log : existing;

    if (explicitIdKey) {
      byKey.set(explicitIdKey, winner);
    }
    byKey.set(compositeKey, winner);
  });

  const unique = new Map<string, SourceLog>();
  byKey.forEach((value) => {
    unique.set(`${value.id}|${createDedupeKey(value)}`, value);
  });

  return Array.from(unique.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getAggregatedExportLogs = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<SourceLog[]> => {
  const sourceReads = await Promise.allSettled([
    getFirebaseExerciseLogs(userId, startDate, endDate),
    getFirebaseActivityLogs(userId, startDate, endDate),
    getStrengthExerciseLogs(userId, startDate, endDate),
    Promise.resolve(readLocalExerciseLogs(userId, startDate, endDate)),
  ]);

  const sourceNames: ExportSource[] = ['exercise', 'activity', 'strength', 'local'];
  const failedSources = sourceReads
    .map((result, index) => ({ result, source: sourceNames[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failedSources.length > 0) {
    const details = failedSources
      .map(({ result, source }) => `${source}: ${result.status === 'rejected' ? (result.reason?.message || String(result.reason)) : 'unknown error'}`)
      .join('; ');

    throw new Error(`Failed to load export sources: ${details}`);
  }

  const exerciseLogs = sourceReads[0].status === 'fulfilled' ? sourceReads[0].value : [];
  const activityLogs = sourceReads[1].status === 'fulfilled' ? sourceReads[1].value : [];
  const strengthLogs = sourceReads[2].status === 'fulfilled' ? sourceReads[2].value : [];
  const localLogs = sourceReads[3].status === 'fulfilled' ? sourceReads[3].value : [];

  const normalizedSources: SourceLog[] = [
    ...exerciseLogs.map((log) => ({
      id: log.id,
      exerciseName: log.exerciseName || '',
      sets: toAnySets(log.sets),
      timestamp: parseTimestamp(log.timestamp),
      userId: String(log.userId || userId),
      activityType: log.activityType,
      exerciseType: log.exerciseType,
      supersetId: log.supersetId,
      supersetLabel: log.supersetLabel,
      supersetName: log.supersetName,
      collectionType: 'exercise' as const,
    })),
    ...activityLogs.map((log) => ({
      id: log.id,
      exerciseName: log.activityName || '',
      sets: toAnySets(log.sets),
      timestamp: parseTimestamp(log.timestamp),
      userId: String(log.userId || userId),
      activityType: log.activityType,
      supersetId: log.supersetId,
      supersetLabel: log.supersetLabel,
      supersetName: log.supersetName,
      collectionType: 'activity' as const,
    })),
    ...strengthLogs.map((log) => ({
      id: log.id,
      exerciseName: log.exerciseName || '',
      sets: toAnySets(log.sets),
      timestamp: parseTimestamp(log.timestamp),
      userId: String(log.userId || userId),
      activityType: log.activityType || ActivityType.RESISTANCE,
      exerciseType: log.exerciseType,
      supersetId: log.supersetId,
      supersetLabel: log.supersetLabel,
      supersetName: log.supersetName,
      collectionType: 'strength' as const,
    })),
    ...localLogs,
  ];

  const normalized: SourceLog[] = normalizedSources.map((log) => ({
    ...log,
    activityType: normalizeActivityType(
      resolveActivityTypeFromExerciseLike(
        {
          activityType: log.activityType,
          exerciseType: log.exerciseType,
          sets: log.sets,
        },
        {
          fallback: ActivityType.OTHER,
          preferHintOverOther: true,
        }
      )
    ),
  }));

  return dedupeLogs(normalized);
};

export type AggregatedExportLog = SourceLog;