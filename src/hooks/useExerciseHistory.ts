import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { auth } from '@/services/firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { DifficultyCategory } from '@/types/difficulty';
import {
  normalizeDistanceMeters,
  normalizeDurationSeconds,
  formatDurationSeconds,
} from '@/utils/activityFieldContract';

/** Ignore sessions lighter than this fraction of PR when choosing Last reference */
export const LAST_REFERENCE_MIN_PR_RATIO = 0.7;

export interface ExerciseHistoryEntry {
  id: string;
  exerciseName: string;
  sets: ExerciseSet[];
  /** True log time used for ordering (most recent session) */
  timestamp: Date;
  /** Calendar day shown in UI (sessionDateKey when present) */
  displayDate?: Date;
  summary: string; // e.g., "80kg × 5"
  activityType: ActivityType;
  totalVolume?: number; // For resistance training
  totalDuration?: number; // In seconds
  totalDistance?: number; // In meters
}

/** Structured highlight for progressive overload while logging resistance */
export interface ResistanceSetHighlight {
  weight: number;
  reps: number;
  rpe?: number;
  difficulty?: DifficultyCategory | string;
  timestamp: Date;
  setCount?: number;
}

export interface ExerciseHistoryData {
  history: ExerciseHistoryEntry[];
  lastPerformed?: ExerciseHistoryEntry;
  lastWorkingSets: ExerciseSet[];
  lastHighlight?: ResistanceSetHighlight;
  bestWeightSet?: ResistanceSetHighlight;
  trend: 'up' | 'down' | 'same' | 'none';
  trendDetails?: string;
  isLoading: boolean;
  error: string | null;
  copyLastValues: () => ExerciseSet[];
}

const normalizeName = (value: string | undefined | null): string =>
  String(value || '').trim().toLowerCase();

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
};

const formatWeightKg = (weight: number): string => {
  return Number.isInteger(weight) ? `${weight}` : `${weight}`;
};

/** Coerce Firestore/legacy values to a finite number (strings like "100" included). */
export const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

/**
 * Normalize set fields so weight/reps/rpe comparisons work on legacy string values.
 */
export const normalizeHistorySets = (sets: unknown): ExerciseSet[] => {
  if (!Array.isArray(sets)) return [];

  return sets.map((raw) => {
    const set = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const weight = toFiniteNumber(set.weight) ?? 0;
    const reps = toFiniteNumber(set.reps) ?? 0;
    const rpe = toFiniteNumber(set.rpe);
    const normalized: ExerciseSet = {
      ...(set as unknown as ExerciseSet),
      weight,
      reps,
    };
    if (rpe !== undefined) {
      normalized.rpe = rpe;
    }
    return normalized;
  });
};

const parseRawTimestampValue = (value: unknown): Date | null => {
  if (value == null) return null;

  if (typeof value === 'object') {
    const record = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof record.toDate === 'function') {
      const fromFirestore = record.toDate();
      if (!Number.isNaN(fromFirestore.getTime())) {
        return fromFirestore;
      }
    }
    const seconds = toFiniteNumber(record.seconds ?? record._seconds);
    if (seconds !== undefined) {
      return new Date(seconds * 1000);
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const parseSessionDateKey = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

/**
 * Ordering time: real log timestamp first so "most recent" is not skewed by sessionDateKey.
 */
export const parseSortTimestamp = (data: Record<string, unknown>): Date => {
  const candidates = [data.timestamp, data.loggedAt, data.performedAt, data.createdAt, data.date];
  for (const value of candidates) {
    const parsed = parseRawTimestampValue(value);
    if (parsed) return parsed;
  }

  const fromSession = parseSessionDateKey(data.sessionDateKey);
  if (fromSession) return fromSession;

  return new Date(0);
};

/**
 * Display date: prefer sessionDateKey (training day), else sort timestamp.
 */
export const parseDisplayDate = (data: Record<string, unknown>): Date => {
  const fromSession = parseSessionDateKey(data.sessionDateKey);
  if (fromSession) return fromSession;
  return parseSortTimestamp(data);
};

/** @deprecated Use parseSortTimestamp / parseDisplayDate */
export const parseHistoryTimestamp = (data: Record<string, unknown>): Date => parseDisplayDate(data);

/**
 * Main working resistance sets used as progressive-overload reference.
 * Excludes warmups and drop sets so Last reflects the best primary set.
 */
export const getWorkingResistanceSets = (sets: ExerciseSet[]): ExerciseSet[] => {
  if (!sets || sets.length === 0) return [];

  return sets.filter((set) => {
    const weight = toFiniteNumber(set.weight) ?? 0;
    const reps = toFiniteNumber(set.reps) ?? 0;
    if (weight <= 0 || reps <= 0) return false;
    if (set.difficulty === DifficultyCategory.WARMUP) return false;
    if (set.difficulty === DifficultyCategory.DROP) return false;
    return true;
  });
};

/**
 * Best set in a session for progressive overload: heaviest primary set,
 * tie-break by more reps. Falls back to any positive weight/reps set if
 * only warmups/drops were logged.
 */
export const findHeaviestWorkingSet = (sets: ExerciseSet[]): ExerciseSet | null => {
  const working = getWorkingResistanceSets(sets);
  const candidates =
    working.length > 0
      ? working
      : (sets || []).filter((set) => {
          const weight = toFiniteNumber(set.weight) ?? 0;
          const reps = toFiniteNumber(set.reps) ?? 0;
          return weight > 0 && reps > 0;
        });

  if (candidates.length === 0) return null;

  return candidates.reduce((heaviest, current) => {
    const currentWeight = toFiniteNumber(current.weight) ?? 0;
    const heaviestWeight = toFiniteNumber(heaviest.weight) ?? 0;
    if (currentWeight > heaviestWeight) return current;
    if (currentWeight < heaviestWeight) return heaviest;
    const currentReps = toFiniteNumber(current.reps) ?? 0;
    const heaviestReps = toFiniteNumber(heaviest.reps) ?? 0;
    return currentReps > heaviestReps ? current : heaviest;
  });
};

const toHighlight = (
  set: ExerciseSet,
  timestamp: Date,
  setCount?: number
): ResistanceSetHighlight => {
  const highlight: ResistanceSetHighlight = {
    weight: toFiniteNumber(set.weight) ?? 0,
    reps: toFiniteNumber(set.reps) ?? 0,
    timestamp,
  };

  const rpe = toFiniteNumber(set.rpe);
  if (rpe !== undefined && rpe > 0) {
    highlight.rpe = rpe;
  }
  if (set.difficulty) {
    highlight.difficulty = set.difficulty;
  }
  if (setCount !== undefined) {
    highlight.setCount = setCount;
  }

  return highlight;
};

const entryDisplayDate = (entry: ExerciseHistoryEntry): Date =>
  entry.displayDate || entry.timestamp;

/**
 * Most recent resistance session that has a real weighted best set.
 * Skips bodyweight/0kg logs so Last stays useful for progressive overload.
 */
export const findLastWeightedResistanceEntry = (
  entries: ExerciseHistoryEntry[]
): ExerciseHistoryEntry | undefined => {
  return entries.find((entry) => Boolean(findHeaviestWorkingSet(entry.sets)));
};

/**
 * Choose Last reference: newest weighted session whose top set is not far below PR
 * (deload / junk sessions are skipped). Falls back to newest weighted session.
 */
export const selectLastReferenceEntry = (
  entries: ExerciseHistoryEntry[],
  prWeight?: number,
  minPrRatio: number = LAST_REFERENCE_MIN_PR_RATIO
): ExerciseHistoryEntry | undefined => {
  const weighted = entries.filter((entry) => Boolean(findHeaviestWorkingSet(entry.sets)));
  if (weighted.length === 0) return undefined;

  const threshold =
    typeof prWeight === 'number' && prWeight > 0 ? prWeight * minPrRatio : 0;

  if (threshold > 0) {
    const representative = weighted.find((entry) => {
      const heaviest = findHeaviestWorkingSet(entry.sets);
      const weight = toFiniteNumber(heaviest?.weight) ?? 0;
      return weight >= threshold;
    });
    if (representative) return representative;
  }

  return weighted[0];
};

/**
 * Last-session progressive-overload cue: best single set from the chosen reference session.
 */
export const computeLastHighlight = (
  history: ExerciseHistoryEntry[],
  prWeight?: number
): ResistanceSetHighlight | undefined => {
  const last = selectLastReferenceEntry(history, prWeight);
  if (!last) return undefined;

  const working = getWorkingResistanceSets(last.sets);
  const heaviest = findHeaviestWorkingSet(last.sets);
  if (!heaviest) return undefined;

  return toHighlight(heaviest, entryDisplayDate(last), working.length);
};

/**
 * All-time PR: highest weight ever, and among those the highest reps at that weight.
 */
export const computeBestWeightSet = (
  entries: ExerciseHistoryEntry[]
): ResistanceSetHighlight | undefined => {
  let best: ResistanceSetHighlight | undefined;

  for (const entry of entries) {
    const heaviest = findHeaviestWorkingSet(entry.sets);
    if (!heaviest) continue;

    const candidate = toHighlight(heaviest, entryDisplayDate(entry));
    if (
      !best ||
      candidate.weight > best.weight ||
      (candidate.weight === best.weight && candidate.reps > best.reps)
    ) {
      best = candidate;
    }
  }

  return best;
};

const formatDifficultyLabel = (difficulty: DifficultyCategory | string): string => {
  const raw = String(difficulty);
  if (raw === raw.toUpperCase()) {
    return raw.charAt(0) + raw.slice(1).toLowerCase();
  }
  return raw;
};

export const formatResistanceHighlight = (highlight: ResistanceSetHighlight): string => {
  const base = `${formatWeightKg(highlight.weight)}kg × ${highlight.reps}`;
  if (typeof highlight.rpe === 'number' && highlight.rpe > 0) {
    return `${base} @ RPE ${highlight.rpe}`;
  }
  if (highlight.difficulty && highlight.difficulty !== DifficultyCategory.WARMUP && highlight.difficulty !== DifficultyCategory.DROP) {
    return `${base} @ ${formatDifficultyLabel(highlight.difficulty)}`;
  }
  return base;
};

const inferActivityType = (sets: ExerciseSet[], storedType?: string): ActivityType => {
  if (storedType) {
    return normalizeActivityType(storedType);
  }

  if (sets.some((set) => (toFiniteNumber(set.weight) ?? 0) > 0 && (toFiniteNumber(set.reps) ?? 0) > 0)) {
    return ActivityType.RESISTANCE;
  }

  if (sets.some((set) => (set.holdTime || 0) > 0)) {
    return ActivityType.STRETCHING;
  }

  if (sets.some((set) => (set.height || 0) > 0 || (set.restTime || 0) > 0)) {
    return ActivityType.SPEED_AGILITY;
  }

  if (sets.some((set) => (set.duration || 0) > 0 || (set.distance || 0) > 0)) {
    return ActivityType.ENDURANCE;
  }

  if (sets.some((set) => (toFiniteNumber(set.reps) ?? 0) > 0)) {
    return ActivityType.SPEED_AGILITY;
  }

  return ActivityType.OTHER;
};

/**
 * Calculate a summary string for an exercise log
 */
export const calculateSummary = (sets: ExerciseSet[], activityType: ActivityType): string => {
  if (!sets || sets.length === 0) return 'No sets';

  if (activityType === ActivityType.RESISTANCE) {
    const heaviest = findHeaviestWorkingSet(sets);
    if (heaviest) {
      return `${formatWeightKg(heaviest.weight)}kg × ${heaviest.reps}`;
    }

    const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
    if (totalReps > 0) {
      return `${sets.length} sets, ${totalReps} reps`;
    }
  }

  const normalizedDuration = sets.reduce(
    (sum, set) => sum + normalizeDurationSeconds(set.duration, activityType),
    0
  );
  const normalizedDistance = sets.reduce(
    (sum, set) => sum + normalizeDistanceMeters(set.distance, activityType),
    0
  );

  if (normalizedDuration > 0 || normalizedDistance > 0) {
    if (normalizedDuration > 0 && normalizedDistance > 0) {
      return `${formatDurationSeconds(normalizedDuration)}, ${formatDistance(normalizedDistance)}`;
    }
    if (normalizedDuration > 0) {
      return formatDurationSeconds(normalizedDuration);
    }
    return formatDistance(normalizedDistance);
  }

  const hasHoldTime = sets.some((set) => (set.holdTime ?? 0) > 0);
  if (hasHoldTime) {
    const avgHold = Math.round(sets.reduce((sum, set) => sum + (set.holdTime || 0), 0) / sets.length);
    return `${sets.length} sets, ${avgHold}s hold`;
  }

  const hasReps = sets.some((set) => set.reps > 0);
  if (hasReps) {
    const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
    return `${sets.length} sets, ${totalReps} reps`;
  }

  return `${sets.length} sets`;
};

/**
 * Calculate total volume for resistance exercises
 */
export const calculateVolume = (sets: ExerciseSet[], activityType: ActivityType): number | undefined => {
  if (activityType !== ActivityType.RESISTANCE) {
    return undefined;
  }

  const volume = sets.reduce((total, set) => {
    if (set.weight > 0 && set.reps > 0) {
      return total + (set.weight * set.reps);
    }
    return total;
  }, 0);

  return volume > 0 ? volume : undefined;
};

const calculateDurationSeconds = (sets: ExerciseSet[], activityType: ActivityType): number | undefined => {
  const totalDuration = sets.reduce(
    (sum, set) => sum + normalizeDurationSeconds(set.duration, activityType),
    0
  );

  return totalDuration > 0 ? totalDuration : undefined;
};

const calculateDistanceMeters = (sets: ExerciseSet[], activityType: ActivityType): number | undefined => {
  const totalDistance = sets.reduce(
    (sum, set) => sum + normalizeDistanceMeters(set.distance, activityType),
    0
  );

  return totalDistance > 0 ? totalDistance : undefined;
};

/**
 * Determine trend comparing current to previous performance
 */
export const determineTrend = (history: ExerciseHistoryEntry[]): { trend: 'up' | 'down' | 'same' | 'none'; details?: string } => {
  if (history.length < 2) {
    return { trend: 'none' };
  }

  const latest = history[0];
  const previous = history[1];

  if (latest.totalVolume !== undefined && previous.totalVolume !== undefined) {
    const volumeDiff = latest.totalVolume - previous.totalVolume;
    const percentChange = previous.totalVolume > 0
      ? ((volumeDiff / previous.totalVolume) * 100).toFixed(0)
      : 0;

    if (volumeDiff > 0) {
      return { trend: 'up', details: `+${percentChange}% volume` };
    } else if (volumeDiff < 0) {
      return { trend: 'down', details: `${percentChange}% volume` };
    }
    return { trend: 'same', details: 'Same volume' };
  }

  if (latest.totalDistance !== undefined && previous.totalDistance !== undefined) {
    const distanceDiff = latest.totalDistance - previous.totalDistance;

    if (distanceDiff > 0) {
      return { trend: 'up', details: `+${formatDistance(distanceDiff)} distance` };
    } else if (distanceDiff < 0) {
      return { trend: 'down', details: `-${formatDistance(Math.abs(distanceDiff))} distance` };
    }
    return { trend: 'same', details: 'Same distance' };
  }

  if (latest.totalDuration !== undefined && previous.totalDuration !== undefined) {
    const durationDiff = latest.totalDuration - previous.totalDuration;

    if (durationDiff > 0) {
      return { trend: 'up', details: `+${formatDurationSeconds(durationDiff)}` };
    } else if (durationDiff < 0) {
      return { trend: 'down', details: `-${formatDurationSeconds(Math.abs(durationDiff))}` };
    }
    return { trend: 'same', details: 'Same duration' };
  }

  return { trend: 'none' };
};

/**
 * Custom hook to fetch exercise history with caching
 * @param exerciseName - The name of the exercise to fetch history for
 * @returns ExerciseHistoryData with history, trend, and utility functions
 */
export const useExerciseHistory = (exerciseName: string): ExerciseHistoryData => {
  const [allMatchedEntries, setAllMatchedEntries] = useState<ExerciseHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchHistory = useCallback(async () => {
    const effectiveUserId = auth.currentUser?.uid || user?.id;
    if (!effectiveUserId || !exerciseName) {
      setAllMatchedEntries([]);
      setIsLoading(false);
      return;
    }

    const normalizedTargetName = normalizeName(exerciseName);
    const trimmedName = exerciseName.trim();

    try {
      setIsLoading(true);
      setError(null);

      const exercisesRef = collection(db, 'users', effectiveUserId, 'exercises');
      const activitiesRef = collection(db, 'users', effectiveUserId, 'activities');

      // Name-scoped queries find this exercise across history (not just global last-N).
      // Recent scans catch case/spacing variants that equality miss.
      const [
        namedExerciseSnapshot,
        namedActivitySnapshot,
        recentExerciseSnapshot,
        recentActivitySnapshot,
      ] = await Promise.all([
        getDocs(query(exercisesRef, where('exerciseName', '==', trimmedName), limit(200))),
        getDocs(query(activitiesRef, where('activityName', '==', trimmedName), limit(200))),
        getDocs(query(exercisesRef, orderBy('timestamp', 'desc'), limit(300))),
        getDocs(query(activitiesRef, orderBy('timestamp', 'desc'), limit(300))),
      ]);

      const mapExerciseDoc = (docSnap: { id: string; data: () => Record<string, unknown> }): ExerciseHistoryEntry => {
        const data = docSnap.data();
        const entryName = data.exerciseName as string | undefined;
        const sets = normalizeHistorySets(data.sets);
        const activityType = inferActivityType(sets, data.activityType as string | undefined);
        const timestamp = parseSortTimestamp(data);
        const displayDate = parseDisplayDate(data);

        return {
          id: `exercise:${docSnap.id}`,
          exerciseName: entryName || '',
          sets,
          timestamp,
          displayDate,
          summary: calculateSummary(sets, activityType),
          activityType,
          totalVolume: calculateVolume(sets, activityType),
          totalDuration: calculateDurationSeconds(sets, activityType),
          totalDistance: calculateDistanceMeters(sets, activityType),
        };
      };

      const mapActivityDoc = (docSnap: { id: string; data: () => Record<string, unknown> }): ExerciseHistoryEntry => {
        const data = docSnap.data();
        const entryName = data.activityName as string | undefined;
        const sets = normalizeHistorySets(data.sets);
        const activityType = inferActivityType(sets, data.activityType as string | undefined);
        const timestamp = parseSortTimestamp(data);
        const displayDate = parseDisplayDate(data);

        return {
          id: `activity:${docSnap.id}`,
          exerciseName: entryName || '',
          sets,
          timestamp,
          displayDate,
          summary: calculateSummary(sets, activityType),
          activityType,
          totalVolume: calculateVolume(sets, activityType),
          totalDuration: calculateDurationSeconds(sets, activityType),
          totalDistance: calculateDistanceMeters(sets, activityType),
        };
      };

      const byId = new Map<string, ExerciseHistoryEntry>();

      for (const docSnap of namedExerciseSnapshot.docs) {
        const entry = mapExerciseDoc(docSnap);
        byId.set(entry.id, entry);
      }
      for (const docSnap of namedActivitySnapshot.docs) {
        const entry = mapActivityDoc(docSnap);
        byId.set(entry.id, entry);
      }
      for (const docSnap of recentExerciseSnapshot.docs) {
        const entry = mapExerciseDoc(docSnap);
        if (normalizeName(entry.exerciseName) === normalizedTargetName) {
          byId.set(entry.id, entry);
        }
      }
      for (const docSnap of recentActivitySnapshot.docs) {
        const entry = mapActivityDoc(docSnap);
        if (normalizeName(entry.exerciseName) === normalizedTargetName) {
          byId.set(entry.id, entry);
        }
      }

      const entries: ExerciseHistoryEntry[] = Array.from(byId.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setAllMatchedEntries(entries);
    } catch (err) {
      console.error('Error fetching exercise history:', err);
      setError('Failed to load exercise history');
      setAllMatchedEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, exerciseName]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const history = useMemo(() => allMatchedEntries.slice(0, 3), [allMatchedEntries]);
  const { trend, details: trendDetails } = determineTrend(history);

  const bestWeightSet = useMemo(
    () => computeBestWeightSet(allMatchedEntries),
    [allMatchedEntries]
  );

  // Last reference skips sessions far below PR (deload/junk), then newest weighted
  const lastWeightedEntry = useMemo(
    () => selectLastReferenceEntry(allMatchedEntries, bestWeightSet?.weight),
    [allMatchedEntries, bestWeightSet?.weight]
  );
  const lastHighlight = useMemo(
    () => computeLastHighlight(allMatchedEntries, bestWeightSet?.weight),
    [allMatchedEntries, bestWeightSet?.weight]
  );
  const lastWorkingSets = useMemo(() => {
    if (!lastWeightedEntry) return [];
    return getWorkingResistanceSets(lastWeightedEntry.sets);
  }, [lastWeightedEntry]);

  // Copy sets from the last weighted session used for progressive overload
  const copyLastValues = useCallback((): ExerciseSet[] => {
    const source = lastWeightedEntry ?? history[0];
    if (source && source.sets.length > 0) {
      return source.sets.map(set => ({ ...set }));
    }
    return [];
  }, [lastWeightedEntry, history]);

  return {
    history,
    lastPerformed: lastWeightedEntry ?? history[0],
    lastWorkingSets,
    lastHighlight,
    bestWeightSet,
    trend,
    trendDetails,
    isLoading,
    error,
    copyLastValues,
  };
};

/**
 * Clear the exercise history cache (useful after saving new exercises)
 */
export const clearExerciseHistoryCache = (userId?: string, exerciseName?: string) => {
  void userId;
  void exerciseName;
  return;
};

export default useExerciseHistory;
