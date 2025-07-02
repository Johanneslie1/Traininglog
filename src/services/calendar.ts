import { ExerciseLog } from '@/types/exercise';
import { getExerciseLogsByDate, saveExerciseLog } from '@/utils/localStorageUtils';

export const getWorkoutsByDate = async (date: Date): Promise<ExerciseLog[]> => {
  try {
    const logs = await getExerciseLogsByDate(date);
    // Filter out logs without IDs and ensure all required properties are present
    return logs.filter((log): log is ExerciseLog => {
      return !!log.id && !!log.exerciseName && !!log.sets && !!log.timestamp;
    });
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutDays = async (month: Date): Promise<Date[]> => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const workouts = await getExerciseLogsByDate(currentDate);
    if (workouts.length > 0) {
      days.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

export const copyWorkoutFromDate = async (sourceDate: Date, targetDate: Date): Promise<boolean> => {
  try {
    const workouts = await getExerciseLogsByDate(sourceDate);
    if (workouts.length === 0) return false;

    const targetWorkouts = workouts.map(workout => ({
      ...workout,
      id: crypto.randomUUID(),
      timestamp: targetDate
    }));

    // Save each workout to the target date
    for (const workout of targetWorkouts) {
      await saveExerciseLog(workout);
    }

    return true;
  } catch (error) {
    console.error('Error copying workout:', error);
    return false;
  }
};
