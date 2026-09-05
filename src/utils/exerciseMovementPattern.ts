import { inferMovementPatterns, type MovementPattern } from '@/data/movementPatterns';
import type { Exercise } from '@/types/exercise';

export type ExerciseMovementPatternSource = Pick<
  Exercise,
  | 'name'
  | 'activityType'
  | 'category'
  | 'type'
  | 'laterality'
  | 'primaryMovementPattern'
  | 'secondaryMovementPattern'
  | 'primaryMuscles'
  | 'secondaryMuscles'
> & { id?: string };

export const resolveExerciseMovementPattern = (
  exercise: ExerciseMovementPatternSource
): MovementPattern | '' =>
  inferMovementPatterns({
    name: exercise.name,
    catalogId: exercise.id,
    activityType: exercise.activityType,
    category: exercise.category,
    type: exercise.type,
    laterality: exercise.laterality,
    primaryMovementPattern: exercise.primaryMovementPattern,
    secondaryMovementPattern: exercise.secondaryMovementPattern,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
  }).primary;

export const exerciseMatchesMovementPattern = (
  exercise: ExerciseMovementPatternSource,
  pattern: MovementPattern | ''
): boolean => {
  if (!pattern) {
    return true;
  }

  const resolved = inferMovementPatterns({
    name: exercise.name,
    catalogId: exercise.id,
    activityType: exercise.activityType,
    category: exercise.category,
    type: exercise.type,
    laterality: exercise.laterality,
    primaryMovementPattern: exercise.primaryMovementPattern,
    secondaryMovementPattern: exercise.secondaryMovementPattern,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
  });

  return resolved.primary === pattern || resolved.secondary === pattern;
};
