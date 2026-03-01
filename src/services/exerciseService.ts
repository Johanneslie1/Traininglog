import { ExerciseLog } from '@/types/exercise';

const removeUndefinedFields = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }

  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned as T;
  }

  return obj;
};

export const prepareExerciseLogForPersistence = (exerciseLog: ExerciseLog): ExerciseLog => {
  const normalizedSets = (exerciseLog.sets || []).map((set) => removeUndefinedFields({
    ...set,
    weight: typeof set.weight === 'number' ? set.weight : 0,
    reps: typeof set.reps === 'number' ? set.reps : 0
  }));

  return removeUndefinedFields({
    ...exerciseLog,
    sets: normalizedSets
  });
};

export const saveExerciseLog = async (exerciseLog: ExerciseLog): Promise<void> => {
  // TODO: Implement saving exercise log to backend/storage
  const payload = prepareExerciseLogForPersistence(exerciseLog);
  console.log('Saving exercise log:', payload);
};

export const deleteExerciseLog = async (exerciseLog: ExerciseLog): Promise<void> => {
  // TODO: Implement deleting exercise log from backend/storage
  console.log('Deleting exercise log:', exerciseLog);
};

export const getExerciseLogs = async (): Promise<ExerciseLog[]> => {
  // TODO: Implement fetching exercise logs from backend/storage
  return [];
};
