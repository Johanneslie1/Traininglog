import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';

export interface ExerciseHistoryEntry {
  id: string;
  exerciseName: string;
  sets: ExerciseSet[];
  timestamp: Date;
  summary: string; // e.g., "3×10 @ 60kg"
  totalVolume?: number; // For resistance training
  totalDuration?: number; // For endurance
  totalDistance?: number; // For endurance
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

// Simple in-memory cache to avoid repeated Firestore reads
const historyCache = new Map<string, { data: ExerciseHistoryEntry[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Calculate a summary string for an exercise log
 */
const calculateSummary = (sets: ExerciseSet[]): string => {
  if (!sets || sets.length === 0) return 'No sets';

  // Check if it's a resistance exercise (has weight and reps)
  const hasWeightAndReps = sets.some(s => s.weight > 0 && s.reps > 0);
  
  if (hasWeightAndReps) {
    // Group by weight to show like "3×10 @ 60kg"
    const weightGroups = new Map<number, number[]>();
    sets.forEach(s => {
      if (s.weight > 0) {
        const existing = weightGroups.get(s.weight) || [];
        existing.push(s.reps);
        weightGroups.set(s.weight, existing);
      }
    });

    if (weightGroups.size > 0) {
      // Find the most common weight
      let maxWeight = 0;
      let maxReps: number[] = [];
      weightGroups.forEach((reps, weight) => {
        if (weight > maxWeight) {
          maxWeight = weight;
          maxReps = reps;
        }
      });

      const avgReps = Math.round(maxReps.reduce((a, b) => a + b, 0) / maxReps.length);
      return `${sets.length}×${avgReps} @ ${maxWeight}kg`;
    }
  }

  // Check for duration-based exercises (endurance, sport)
  const hasDuration = sets.some(s => (s.duration ?? 0) > 0);
  if (hasDuration) {
    const totalDuration = sets.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalDistance = sets.reduce((sum, s) => sum + (s.distance || 0), 0);
    
    if (totalDistance > 0) {
      return `${totalDuration}min, ${totalDistance.toFixed(1)}km`;
    }
    return `${totalDuration}min`;
  }

  // Check for hold time (flexibility)
  const hasHoldTime = sets.some(s => (s.holdTime ?? 0) > 0);
  if (hasHoldTime) {
    const avgHold = Math.round(sets.reduce((sum, s) => sum + (s.holdTime || 0), 0) / sets.length);
    return `${sets.length} sets, ${avgHold}s hold`;
  }

  // Check for reps only (bodyweight, speed/agility)
  const hasReps = sets.some(s => s.reps > 0);
  if (hasReps) {
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
    return `${sets.length} sets, ${totalReps} reps`;
  }

  return `${sets.length} sets`;
};

/**
 * Calculate total volume for resistance exercises
 */
const calculateVolume = (sets: ExerciseSet[]): number => {
  return sets.reduce((total, set) => {
    if (set.weight > 0 && set.reps > 0) {
      return total + (set.weight * set.reps);
    }
    return total;
  }, 0);
};

/**
 * Determine trend comparing current to previous performance
 */
const determineTrend = (history: ExerciseHistoryEntry[]): { trend: 'up' | 'down' | 'same' | 'none'; details?: string } => {
  if (history.length < 2) {
    return { trend: 'none' };
  }

  const latest = history[0];
  const previous = history[1];

  // Compare volumes for resistance exercises
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

  // Compare duration for endurance exercises
  if (latest.totalDuration !== undefined && previous.totalDuration !== undefined) {
    const durationDiff = latest.totalDuration - previous.totalDuration;
    
    if (durationDiff > 0) {
      return { trend: 'up', details: `+${durationDiff}min` };
    } else if (durationDiff < 0) {
      return { trend: 'down', details: `${durationDiff}min` };
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
  const fetchedRef = useRef<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user?.id || !exerciseName) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    // Normalize exercise name for cache key
    const normalizedName = exerciseName.toLowerCase().trim();
    const cacheKey = `${user.id}:${normalizedName}`;

    // Check cache first
    const cached = historyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setHistory(cached.data);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (fetchedRef.current === cacheKey) {
      return;
    }
    fetchedRef.current = cacheKey;

    try {
      setIsLoading(true);
      setError(null);

      // Query last 3 occurrences from Firestore
      const exercisesRef = collection(db, 'users', user.id, 'exercises');
      const q = query(
        exercisesRef,
        where('exerciseName', '==', exerciseName),
        orderBy('timestamp', 'desc'),
        limit(3)
      );

      const snapshot = await getDocs(q);
      
      const entries: ExerciseHistoryEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const sets = data.sets || [];
        const timestamp = data.timestamp?.toDate?.() || new Date();
        
        return {
          id: doc.id,
          exerciseName: data.exerciseName,
          sets,
          timestamp,
          summary: calculateSummary(sets),
          totalVolume: calculateVolume(sets),
          totalDuration: sets.reduce((sum: number, s: ExerciseSet) => sum + (s.duration || 0), 0) || undefined,
          totalDistance: sets.reduce((sum: number, s: ExerciseSet) => sum + (s.distance || 0), 0) || undefined,
        };
      });

      // Update cache
      historyCache.set(cacheKey, { data: entries, timestamp: Date.now() });
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
  if (userId && exerciseName) {
    const normalizedName = exerciseName.toLowerCase().trim();
    historyCache.delete(`${userId}:${normalizedName}`);
  } else {
    historyCache.clear();
  }
};

export default useExerciseHistory;
