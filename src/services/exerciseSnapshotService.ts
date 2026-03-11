import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { Exercise } from '@/types/exercise';
import { ProgramExercise } from '@/types/program';

export type ExerciseSnapshot = Pick<
  Exercise,
  'id' | 'name' | 'activityType' | 'category' | 'type' | 'defaultUnit' | 'metrics' | 'primaryMuscles' | 'secondaryMuscles' | 'equipment'
>;

const toExerciseSnapshot = (id: string, data: any): ExerciseSnapshot => ({
  id,
  name: String(data?.name || ''),
  activityType: data?.activityType,
  category: data?.category,
  type: data?.type,
  defaultUnit: data?.defaultUnit,
  metrics: data?.metrics,
  primaryMuscles: Array.isArray(data?.primaryMuscles) ? data.primaryMuscles : [],
  secondaryMuscles: Array.isArray(data?.secondaryMuscles) ? data.secondaryMuscles : [],
  equipment: Array.isArray(data?.equipment) ? data.equipment : []
});

const getExerciseDocById = async (exerciseId: string) => {
  const fromExercises = await getDoc(doc(db, 'exercises', exerciseId));
  if (fromExercises.exists()) {
    return fromExercises;
  }

  const fromGlobalExercises = await getDoc(doc(db, 'globalExercises', exerciseId));
  if (fromGlobalExercises.exists()) {
    return fromGlobalExercises;
  }

  return null;
};

export const resolveExerciseSnapshot = async (
  exercise: ProgramExercise
): Promise<ExerciseSnapshot | undefined> => {
  if (exercise.exerciseSnapshot?.name) {
    return exercise.exerciseSnapshot;
  }

  const exerciseId = exercise.id;
  if (!exerciseId || exerciseId.startsWith('default-') || exerciseId.startsWith('imported-') || exerciseId.startsWith('temp-')) {
    return undefined;
  }

  if (exercise.exerciseRef) {
    try {
      const refDoc = await getDoc(doc(db, exercise.exerciseRef));
      if (refDoc.exists()) {
        return toExerciseSnapshot(refDoc.id, refDoc.data());
      }
    } catch (error) {
      console.warn('[exerciseSnapshotService] Could not resolve exerciseRef snapshot:', exercise.exerciseRef, error);
    }
  }

  try {
    const exerciseDoc = await getExerciseDocById(exerciseId);
    if (exerciseDoc?.exists()) {
      return toExerciseSnapshot(exerciseDoc.id, exerciseDoc.data());
    }
  } catch (error) {
    console.warn('[exerciseSnapshotService] Could not resolve exercise snapshot by id:', exerciseId, error);
  }

  if (exercise.name) {
    return {
      id: exerciseId,
      name: exercise.name,
      activityType: exercise.activityType,
      category: 'other',
      type: 'other',
      defaultUnit: 'time',
      metrics: {
        trackTime: true,
        trackRPE: true,
      },
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: []
    };
  }

  return undefined;
};

export const withExerciseSnapshots = async (
  exercises: ProgramExercise[]
): Promise<ProgramExercise[]> => {
  const resolved = await Promise.all(
    exercises.map(async (exercise) => {
      const exerciseSnapshot = await resolveExerciseSnapshot(exercise);
      if (!exerciseSnapshot) {
        return exercise;
      }

      return {
        ...exercise,
        exerciseSnapshot,
      };
    })
  );

  return resolved;
};
