import { SupersetGroup } from '@/types/session';

export interface ExerciseDisplayGroup<T extends { id?: string }> {
  superset: SupersetGroup | null;
  exercises: T[];
  originalIndices: number[];
}

/**
 * Place each superset where its first member sits in the list.
 * Members inside a superset stay in that superset's exerciseIds order.
 */
export const groupExercisesInListOrder = <T extends { id?: string }>(
  exercises: T[],
  supersets: SupersetGroup[]
): ExerciseDisplayGroup<T>[] => {
  const groups: ExerciseDisplayGroup<T>[] = [];
  const processedExerciseIds = new Set<string>();
  const supersetByExerciseId = new Map<string, SupersetGroup>();

  supersets.forEach((superset) => {
    superset.exerciseIds.forEach((exerciseId) => {
      if (!supersetByExerciseId.has(exerciseId)) {
        supersetByExerciseId.set(exerciseId, superset);
      }
    });
  });

  exercises.forEach((exercise, index) => {
    if (exercise.id && processedExerciseIds.has(exercise.id)) {
      return;
    }

    const superset = exercise.id ? supersetByExerciseId.get(exercise.id) : undefined;
    if (!superset) {
      groups.push({
        superset: null,
        exercises: [exercise],
        originalIndices: [index],
      });
      return;
    }

    const supersetExercises: T[] = [];
    const supersetIndices: number[] = [];

    superset.exerciseIds.forEach((exerciseId) => {
      const memberIndex = exercises.findIndex((item) => item.id === exerciseId);
      if (memberIndex === -1) {
        return;
      }
      supersetExercises.push(exercises[memberIndex]);
      supersetIndices.push(memberIndex);
      processedExerciseIds.add(exerciseId);
    });

    if (supersetExercises.length > 0) {
      groups.push({
        superset,
        exercises: supersetExercises,
        originalIndices: supersetIndices,
      });
    }
  });

  return groups;
};
