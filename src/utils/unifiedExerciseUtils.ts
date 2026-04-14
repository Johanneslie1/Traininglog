import { ExerciseData } from '@/services/exerciseDataService';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType, type ActivityLog as StoredActivityLog } from '@/types/activityLog';
import { getExerciseLogs } from '@/services/firebase/exerciseLogs';
import { deleteExerciseLog } from '@/services/firebase/exerciseLogs';
import {
  getActivityLogs as getFirebaseActivityLogs,
  deleteActivityLog as deleteFirebaseActivityLog
} from '@/services/firebase/activityLogs';
import { getExerciseLogs as getLocalExerciseLogs } from '@/utils/localStorageUtils';
import { deleteLocalExerciseLog } from '@/utils/localStorageUtils';
import { auth } from '@/services/firebase/config';
import { normalizeSessionType } from '@/types/sessionType';

// Extended ExerciseData to support activity types
export interface UnifiedExerciseData extends ExerciseData {
  activityType?: ActivityType;
  activityData?: StoredActivityLog;
}

/**
 * Get all exercises (resistance + activities) for a specific date
 */
export async function getAllExercisesByDate(
  date: Date,
  userId: string
): Promise<UnifiedExerciseData[]> {
  try {
    const effectiveUserId = auth.currentUser?.uid || userId;

    // Get resistance training exercises (existing) - convert to proper format
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [resistanceResult, activityResult] = await Promise.allSettled([
      getExerciseLogs(effectiveUserId, startOfDay, endOfDay),
      getFirebaseActivityLogs(effectiveUserId, startOfDay, endOfDay),
    ]);

    const resistanceExerciseLogs = resistanceResult.status === 'fulfilled' ? resistanceResult.value : [];
    const activityLogs = activityResult.status === 'fulfilled' ? activityResult.value : [];

    if (resistanceResult.status === 'rejected') {
      console.warn('⚠️ Resistance logs fetch failed in getAllExercisesByDate:', resistanceResult.reason);
    }

    if (activityResult.status === 'rejected') {
      console.warn('⚠️ Activity logs fetch failed in getAllExercisesByDate:', activityResult.reason);
    }

    const resistanceExercises: UnifiedExerciseData[] = resistanceExerciseLogs.map(log => ({
      id: log.id,
      exerciseName: log.exerciseName,
      timestamp: log.timestamp || date,
      userId: log.userId || effectiveUserId,
      sets: log.sets || [],
      deviceId: log.deviceId,
      activityType: log.activityType ? normalizeActivityType(log.activityType) : ActivityType.RESISTANCE,
      isWarmup: log.isWarmup,
      sharedSessionAssignmentId: log.sharedSessionAssignmentId,
      sharedSessionId: log.sharedSessionId,
      sharedSessionExerciseId: log.sharedSessionExerciseId,
      sharedSessionDateKey: log.sharedSessionDateKey,
      sharedSessionExerciseCompleted: log.sharedSessionExerciseCompleted,
      sessionId: log.sessionId,
      sessionType: log.sessionType,
      sessionDateKey: log.sessionDateKey,
      sessionWeekKey: log.sessionWeekKey,
      sessionNumberInDay: log.sessionNumberInDay,
      sessionNumberInWeek: log.sessionNumberInWeek,
      supersetId: log.supersetId,
      supersetLabel: log.supersetLabel,
      supersetName: log.supersetName,
      prescription: log.prescription,
      instructionMode: log.instructionMode,
      instructions: log.instructions,
      prescriptionAssistant: log.prescriptionAssistant
    }));

    const activityExercises: UnifiedExerciseData[] = activityLogs.map((log) => ({
      id: log.id,
      exerciseName: log.activityName,
      timestamp: log.timestamp || date,
      userId: log.userId || effectiveUserId,
      sets: log.sets || [],
      deviceId: log.deviceId,
      activityType: normalizeActivityType(log.activityType),
      sessionId: log.sessionId,
      sessionType: log.sessionType,
      sessionDateKey: log.sessionDateKey,
      sessionWeekKey: log.sessionWeekKey,
      sessionNumberInDay: log.sessionNumberInDay,
      sessionNumberInWeek: log.sessionNumberInWeek,
      isWarmup: normalizeSessionType(log.sessionType) === 'warmup',
      activityData: log
    }));

    // Combine and sort by timestamp
    const allExercises = [...resistanceExercises, ...activityExercises];
    
    return allExercises.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeA - timeB;
    });

  } catch (error) {
    console.error('Error getting all exercises by date:', error);
    // Fallback to just resistance exercises from Firebase
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const effectiveUserId = auth.currentUser?.uid || userId;
      const resistanceExerciseLogs = await getExerciseLogs(effectiveUserId, startOfDay, endOfDay);
      return resistanceExerciseLogs.map(log => ({
        id: log.id,
        exerciseName: log.exerciseName,
        timestamp: log.timestamp || date,
        userId: log.userId || effectiveUserId,
        sets: log.sets || [],
        deviceId: log.deviceId,
        activityType: log.activityType ? normalizeActivityType(log.activityType) : ActivityType.RESISTANCE,
        isWarmup: log.isWarmup,
        sharedSessionAssignmentId: log.sharedSessionAssignmentId,
        sharedSessionId: log.sharedSessionId,
        sharedSessionExerciseId: log.sharedSessionExerciseId,
        sharedSessionDateKey: log.sharedSessionDateKey,
        sharedSessionExerciseCompleted: log.sharedSessionExerciseCompleted,
        sessionId: log.sessionId,
        sessionType: log.sessionType,
        sessionDateKey: log.sessionDateKey,
        sessionWeekKey: log.sessionWeekKey,
        sessionNumberInDay: log.sessionNumberInDay,
        sessionNumberInWeek: log.sessionNumberInWeek,
        supersetId: log.supersetId,
        supersetLabel: log.supersetLabel,
        supersetName: log.supersetName,
        prescription: log.prescription,
        instructionMode: log.instructionMode,
        instructions: log.instructions,
        prescriptionAssistant: log.prescriptionAssistant
      }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Delete exercise (handles both resistance and activity types)
 * Ensures deletion from both Firestore and localStorage for complete removal
 */
export async function deleteExercise(exercise: UnifiedExerciseData, userId: string): Promise<boolean> {
  try {
    console.log('🗑️ Starting dual deletion for exercise:', {
      id: exercise.id,
      exerciseName: exercise.exerciseName,
      activityType: exercise.activityType
    });

    let firestoreDeleted = false;
    let localStorageDeleted = false;
    let errors: string[] = [];

    const isActivity = exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE;

    // Always try to delete from Firestore first (if we have an ID)
    if (exercise.id) {
      const deletePrimary = async () => {
        if (isActivity) {
          await deleteFirebaseActivityLog(exercise.id!, userId);
          console.log('✅ Deleted activity log from Firestore activities collection:', exercise.id);
          return;
        }

        await deleteExerciseLog(exercise.id!, userId);
        console.log('✅ Deleted from Firestore exercises collection:', exercise.id);
      };

      const deleteFallback = async () => {
        if (isActivity) {
          await deleteExerciseLog(exercise.id!, userId);
          console.log('✅ Fallback delete succeeded in Firestore exercises collection:', exercise.id);
          return;
        }

        await deleteFirebaseActivityLog(exercise.id!, userId);
        console.log('✅ Fallback delete succeeded in Firestore activities collection:', exercise.id);
      };

      try {
        await deletePrimary();
        firestoreDeleted = true;
      } catch (primaryError) {
        const primaryMsg = primaryError instanceof Error ? primaryError.message : 'Unknown primary Firestore error';
        errors.push(`Firestore primary: ${primaryMsg}`);
        console.warn('⚠️ Primary Firestore deletion failed:', primaryMsg);

        try {
          await deleteFallback();
          firestoreDeleted = true;
        } catch (fallbackError) {
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback Firestore error';
          errors.push(`Firestore fallback: ${fallbackMsg}`);
          console.warn('⚠️ Fallback Firestore deletion failed:', fallbackMsg);
        }
      }
    }

    // Always try to delete from localStorage
    try {
      // Delete from exercise logs localStorage (canonical key: exercise_logs)
      if (exercise.id) {
        deleteLocalExerciseLog(exercise.id);
      } else {
        const exerciseLogs = getLocalExerciseLogs();
        const filteredExerciseLogs = exerciseLogs.filter((log: any) =>
          !(log.exerciseName === exercise.exerciseName && new Date(log.timestamp).getTime() === new Date(exercise.timestamp).getTime())
        );
        localStorage.setItem('exercise_logs', JSON.stringify(filteredExerciseLogs));
      }

      localStorageDeleted = true;
      console.log('✅ Deleted from localStorage:', exercise.id);
    } catch (localStorageError) {
      const errorMsg = localStorageError instanceof Error ? localStorageError.message : 'Unknown localStorage error';
      errors.push(`localStorage: ${errorMsg}`);
      console.warn('⚠️ localStorage deletion failed:', errorMsg);
    }    // Determine success based on what we were able to delete
    const success = firestoreDeleted || localStorageDeleted;

    if (success) {
      console.log('✅ Exercise deletion completed:', {
        firestoreDeleted,
        localStorageDeleted,
        exerciseId: exercise.id
      });

      if (errors.length > 0) {
        console.warn('⚠️ Some deletions failed but exercise was removed from at least one location:', errors);
      }
    } else {
      console.error('❌ Exercise deletion failed completely:', errors);
    }

    return success;

  } catch (error) {
    console.error('❌ Error in deleteExercise:', error);
    return false;
  }
}

/**
 * Delete an activity log
 */
export async function deleteActivityLog(logId: string, userId: string): Promise<void> {
  try {
    await deleteFirebaseActivityLog(logId, userId);
    console.log('✅ Activity log deleted successfully:', logId);
  } catch (error) {
    console.error('❌ Error deleting activity log:', error);
    throw error;
  }
}

/**
 * Check if exercise is an activity (non-resistance) type
 */
export function isActivityExercise(exercise: UnifiedExerciseData): boolean {
  return exercise.activityType ? exercise.activityType !== ActivityType.RESISTANCE : false;
}

/**
 * Get activity type display info
 */
export function getActivityTypeDisplay(activityType?: ActivityType) {
  const normalizedType = normalizeActivityType(activityType);
  const displayMap = {
    [ActivityType.RESISTANCE]: { emoji: '🏋️‍♂️', name: 'Resistance' },
    [ActivityType.SPORT]: { emoji: '⚽', name: 'Sports' },
    [ActivityType.STRETCHING]: { emoji: '🧘‍♀️', name: 'Stretching' },
    [ActivityType.ENDURANCE]: { emoji: '🏃‍♂️', name: 'Endurance' },
    [ActivityType.OTHER]: { emoji: '🎯', name: 'Other' },
    [ActivityType.SPEED_AGILITY]: { emoji: '⚡', name: 'Speed & Agility' }
  };

  return displayMap[normalizedType];
}
