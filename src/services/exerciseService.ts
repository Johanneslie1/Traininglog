import { ExerciseLog } from '@/types/exercise';

export const saveExerciseLog = async (exerciseLog: ExerciseLog): Promise<void> => {
  // TODO: Implement saving exercise log to backend/storage
  console.log('Saving exercise log:', exerciseLog);
};

export const deleteExerciseLog = async (exerciseLog: ExerciseLog): Promise<void> => {
  // TODO: Implement deleting exercise log from backend/storage
  console.log('Deleting exercise log:', exerciseLog);
};

export const getExerciseLogs = async (): Promise<ExerciseLog[]> => {
  // TODO: Implement fetching exercise logs from backend/storage
  return [];
};
