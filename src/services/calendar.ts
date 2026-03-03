import { ExerciseLog } from '@/types/exercise';
import { getExerciseLogsByDate, saveExerciseLog } from '@/utils/localStorageUtils';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { startOfWeek, endOfWeek } from 'date-fns';
import { getAuth } from 'firebase/auth';

const getCurrentUserId = (): string | null => {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
};

export const getWorkoutsByDate = async (date: Date): Promise<ExerciseLog[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const logs = await getAllExercisesByDate(date, userId);

    return logs
      .filter(
        (log): log is (typeof logs)[number] & { id: string; exerciseName: string } =>
          !!log.id && !!log.exerciseName
      )
      .map((log) => ({
        id: log.id,
        exerciseName: log.exerciseName,
        sets: log.sets || [],
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp),
        deviceId: log.deviceId,
        userId: log.userId,
        activityType: log.activityType,
        isWarmup: log.isWarmup,
        sharedSessionAssignmentId: log.sharedSessionAssignmentId,
        sharedSessionId: log.sharedSessionId,
        sharedSessionExerciseId: log.sharedSessionExerciseId,
        sharedSessionDateKey: log.sharedSessionDateKey,
        sharedSessionExerciseCompleted: log.sharedSessionExerciseCompleted,
        supersetId: log.supersetId,
        supersetLabel: log.supersetLabel,
        supersetName: log.supersetName,
        prescription: log.prescription,
        instructionMode: log.instructionMode,
        instructions: log.instructions,
        prescriptionAssistant: log.prescriptionAssistant
      }));
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutDays = async (month: Date): Promise<Date[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const exercises = await getAllExercisesByDate(new Date(currentDate), userId);
    if (exercises.length > 0) {
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

export const getWorkoutDaysForWeek = async (weekStartDate: Date): Promise<Date[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  
  const days: Date[] = [];
  const currentDate = new Date(weekStart);
  
  while (currentDate <= weekEnd) {
    const exercises = await getAllExercisesByDate(new Date(currentDate), userId);
    if (exercises.length > 0) {
      days.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};
