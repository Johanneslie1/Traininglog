import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import {
  normalizeDistanceMeters,
  normalizeDurationSeconds,
  formatDurationSeconds,
} from '@/utils/activityFieldContract';

export interface ExerciseHistoryEntry {
  id: string;
  exerciseName: string;
  sets: ExerciseSet[];
  timestamp: Date;
  summary: string; // e.g., "3×10 @ 60kg"
  activityType: ActivityType;
  totalVolume?: number; // For resistance training
  totalDuration?: number; // In seconds
  totalDistance?: number; // In meters
}

export interface ExerciseHistoryData {
  history: ExerciseHistoryEntry[];
  lastPerformed?: ExerciseHistoryEntry;
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

const inferActivityType = (sets: ExerciseSet[], storedType?: string): ActivityType => {
  if (storedType) {
    return normalizeActivityType(storedType);
  }

  if (sets.some((set) => set.weight > 0 && set.reps > 0)) {
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

  if (sets.some((set) => (set.reps || 0) > 0)) {
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
    const resistanceSets = sets.filter((set) => set.weight > 0 && set.reps > 0);
    if (resistanceSets.length > 0) {
      const topSet = resistanceSets.reduce((best, current) => {
        const currentVolume = current.weight * current.reps;
        const bestVolume = best.weight * best.reps;
        return currentVolume > bestVolume ? current : best;
      }, resistanceSets[0]);

      return `${resistanceSets.length}×${topSet.reps} @ ${topSet.weight}kg`;
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
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchHistory = useCallback(async () => {
    if (!user?.id || !exerciseName) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    const normalizedTargetName = normalizeName(exerciseName);

    try {
      setIsLoading(true);
      setError(null);

      const exercisesRef = collection(db, 'users', user.id, 'exercises');
      const activitiesRef = collection(db, 'users', user.id, 'activities');

      const [exerciseSnapshot, activitySnapshot] = await Promise.all([
        getDocs(query(exercisesRef, orderBy('timestamp', 'desc'), limit(100))),
        getDocs(query(activitiesRef, orderBy('timestamp', 'desc'), limit(100))),
      ]);

      const exerciseEntries: ExerciseHistoryEntry[] = exerciseSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const entryName = data.exerciseName;
          const sets = Array.isArray(data.sets) ? data.sets as ExerciseSet[] : [];
          const activityType = inferActivityType(sets, data.activityType);
          const timestamp = data.timestamp?.toDate?.() || new Date();

          return {
            id: `exercise:${doc.id}`,
            exerciseName: entryName,
            sets,
            timestamp,
            summary: calculateSummary(sets, activityType),
            activityType,
            totalVolume: calculateVolume(sets, activityType),
            totalDuration: calculateDurationSeconds(sets, activityType),
            totalDistance: calculateDistanceMeters(sets, activityType),
          };
        })
        .filter((entry) => normalizeName(entry.exerciseName) === normalizedTargetName);

      const activityEntries: ExerciseHistoryEntry[] = activitySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const entryName = data.activityName;
          const sets = Array.isArray(data.sets) ? data.sets as ExerciseSet[] : [];
          const activityType = inferActivityType(sets, data.activityType);
          const timestamp = data.timestamp?.toDate?.() || new Date();

          return {
            id: `activity:${doc.id}`,
            exerciseName: entryName,
            sets,
            timestamp,
            summary: calculateSummary(sets, activityType),
            activityType,
            totalVolume: calculateVolume(sets, activityType),
            totalDuration: calculateDurationSeconds(sets, activityType),
            totalDistance: calculateDistanceMeters(sets, activityType),
          };
        })
        .filter((entry) => normalizeName(entry.exerciseName) === normalizedTargetName);

      const entries: ExerciseHistoryEntry[] = [...exerciseEntries, ...activityEntries]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 3);

      setHistory(entries);
    } catch (err) {
      console.error('Error fetching exercise history:', err);
      setError('Failed to load exercise history');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, exerciseName]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Calculate trend
  const { trend, details: trendDetails } = determineTrend(history);

  // Get the sets from the last performed exercise
  const copyLastValues = useCallback((): ExerciseSet[] => {
    if (history.length > 0 && history[0].sets.length > 0) {
      // Return a deep copy of the last sets
      return history[0].sets.map(set => ({ ...set }));
    }
    return [];
  }, [history]);

  return {
    history,
    lastPerformed: history[0],
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
