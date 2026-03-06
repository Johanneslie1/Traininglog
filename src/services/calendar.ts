import { ExerciseLog } from '@/types/exercise';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { addActivityLog } from '@/services/firebase/activityLogs';
import { ActivityType } from '@/types/activityTypes';
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
    const userId = getCurrentUserId();
    if (!userId) {
      return false;
    }

    const workouts = await getAllExercisesByDate(sourceDate, userId);
    if (workouts.length === 0) return false;

    // Save each workout to canonical Firestore path for its activity type
    for (const workout of workouts) {
      if (!workout.exerciseName) {
        continue;
      }

      if (workout.activityType && workout.activityType !== ActivityType.RESISTANCE) {
        await addActivityLog(
          {
            activityName: workout.exerciseName,
            userId,
            sets: workout.sets || [],
            activityType: workout.activityType,
            supersetId: workout.supersetId,
            supersetLabel: workout.supersetLabel,
            supersetName: workout.supersetName,
          },
          targetDate
        );
      } else {
        await addExerciseLog(
          {
            exerciseName: workout.exerciseName,
            userId,
            sets: workout.sets || [],
            activityType: workout.activityType,
            supersetId: workout.supersetId,
            supersetLabel: workout.supersetLabel,
            supersetName: workout.supersetName,
            isWarmup: workout.isWarmup,
            sharedSessionAssignmentId: workout.sharedSessionAssignmentId,
            sharedSessionId: workout.sharedSessionId,
            sharedSessionExerciseId: workout.sharedSessionExerciseId,
            sharedSessionDateKey: workout.sharedSessionDateKey,
            sharedSessionExerciseCompleted: workout.sharedSessionExerciseCompleted,
            prescription: workout.prescription,
            instructionMode: workout.instructionMode,
            instructions: workout.instructions,
            prescriptionAssistant: workout.prescriptionAssistant,
          },
          targetDate
        );
      }
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
