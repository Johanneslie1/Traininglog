import { ExerciseSet } from '@/types/sets';

export interface OneRepMaxPrediction {
  oneRepMax: number;
  bestSet: ExerciseSet;
}

export interface ExerciseKeyInput {
  exerciseName: string;
  sharedSessionExerciseId?: string;
}

export const normalizeExerciseName = (exerciseName: string): string =>
  exerciseName.trim().toLowerCase();

export const getExercisePerformanceKey = ({
  exerciseName,
  sharedSessionExerciseId,
}: ExerciseKeyInput): string => {
  if (sharedSessionExerciseId && sharedSessionExerciseId.trim().length > 0) {
    return `id:${sharedSessionExerciseId.trim()}`;
  }

  return `name:${normalizeExerciseName(exerciseName)}`;
};

export const estimateOneRepMaxEpley = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  if (reps > 12) return Math.round(weight * 10) / 10;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export const findBestOneRepMaxSet = (sets: ExerciseSet[]): OneRepMaxPrediction | null => {
  if (!Array.isArray(sets) || sets.length === 0) {
    return null;
  }

  let best: OneRepMaxPrediction | null = null;

  sets.forEach((set) => {
    const weight = typeof set.weight === 'number' ? set.weight : 0;
    const reps = typeof set.reps === 'number' ? set.reps : 0;
    const estimated = estimateOneRepMaxEpley(weight, reps);

    if (estimated <= 0) {
      return;
    }

    if (!best || estimated > best.oneRepMax) {
      best = {
        oneRepMax: estimated,
        bestSet: set,
      };
    }
  });

  return best;
};