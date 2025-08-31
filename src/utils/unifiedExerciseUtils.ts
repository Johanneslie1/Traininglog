import { ExerciseData } from '@/services/exerciseDataService';
import { ActivityLog, ActivityType } from '@/types/activityTypes';
import { activityLoggingService } from '@/services/activityService';
import { getExerciseLogs } from '@/services/firebase/exerciseLogs';
import { deleteExerciseLog } from '@/services/firebase/exerciseLogs';
import { deleteLocalExerciseLog } from '@/utils/localStorageUtils';
import { ExerciseSet } from '@/types/sets';

// Extended ExerciseData to support activity types
export interface UnifiedExerciseData extends ExerciseData {
  activityType?: ActivityType;
  activityData?: ActivityLog;
}

/**
 * Convert ActivityLog to ExerciseData format for unified display
 */
function convertActivityLogToExerciseData(activityLog: ActivityLog): UnifiedExerciseData {
  console.log('🔄 Converting activity log:', {
    activityType: activityLog.activityType,
    activityName: activityLog.activityName,
    rawLog: activityLog
  });

  const baseData: UnifiedExerciseData = {
    id: activityLog.id,
    exerciseName: activityLog.activityName,
    timestamp: activityLog.timestamp,
    userId: activityLog.userId,
    sets: [],
    // Add activity type indicator for UI
    activityType: activityLog.activityType,
    activityData: activityLog // Store original activity data
  };

  // Convert activity sessions to sets format for display
  if (activityLog.activityType === ActivityType.RESISTANCE) {
    // Already in the right format, this shouldn't happen but handle it
    baseData.sets = (activityLog as any).sessions || [];
  } else if (activityLog.activityType === ActivityType.SPORT) {
    const sportLog = activityLog as any;
    baseData.sets = sportLog.sessions?.map((session: any, index: number) => ({
      setNumber: index + 1,
      duration: session.duration,
      distance: session.distance,
      calories: session.calories,
      intensity: session.intensity,
      score: session.score,
      notes: session.notes,
      // Add other sport-specific fields
      ...(session.opponent && { opponent: session.opponent }),
      ...(session.performance && { performance: session.performance }),
      ...(session.skills && { skills: session.skills })
    } as ExerciseSet)) || [];
  } else if (activityLog.activityType === ActivityType.STRETCHING) {
    const stretchLog = activityLog as any;
    // Handle both 'stretches' and 'sessions' field names for backward compatibility
    const dataArray = stretchLog.stretches || stretchLog.sessions || [];
    baseData.sets = dataArray.map((session: any, index: number) => ({
      setNumber: index + 1,
      duration: session.duration,
      intensity: session.intensity,
      notes: session.notes,
      ...(session.holdTime && { holdTime: session.holdTime }),
      ...(session.flexibility && { flexibility: session.flexibility }),
      ...(session.stretchType && { stretchType: session.stretchType }),
      ...(session.bodyPart && { bodyPart: session.bodyPart })
    } as ExerciseSet)) || [];
  } else if (activityLog.activityType === ActivityType.ENDURANCE) {
    const enduranceLog = activityLog as any;
    baseData.sets = enduranceLog.sessions?.map((session: any, index: number) => ({
      setNumber: index + 1,
      duration: session.duration,
      ...(session.distance && { distance: session.distance }),
      ...(session.pace && { pace: session.pace }),
      ...(session.averageHeartRate && { averageHeartRate: session.averageHeartRate }),
      ...(session.averageHR && { averageHeartRate: session.averageHR }), // Handle both field names
      ...(session.maxHeartRate && { maxHeartRate: session.maxHeartRate }),
      ...(session.maxHR && { maxHeartRate: session.maxHR }), // Handle both field names
      ...(session.calories && { calories: session.calories }),
      ...(session.elevation && { elevation: session.elevation }),
      ...(session.rpe && { rpe: session.rpe }),
      ...(session.hrZone1 && { hrZone1: session.hrZone1 }),
      ...(session.hrZone2 && { hrZone2: session.hrZone2 }),
      ...(session.hrZone3 && { hrZone3: session.hrZone3 }),
      notes: session.notes
    } as ExerciseSet)) || [];
  } else if (activityLog.activityType === ActivityType.OTHER) {
    const otherLog = activityLog as any;
    // Other activities use 'customData' field
    const dataArray = otherLog.customData || otherLog.sessions || [];
    baseData.sets = dataArray.map((session: any, index: number) => ({
      setNumber: index + 1,
      duration: session.duration,
      ...(session.calories && { calories: session.calories }),
      ...(session.heartRate && { heartRate: session.heartRate }),
      ...(session.intensity && { intensity: session.intensity }),
      notes: session.notes,
      // Include any custom values
      ...(session.customValues && session.customValues),
      // Include any additional fields
      ...Object.keys(session).reduce((acc, key) => {
        if (!['sessionNumber', 'duration', 'calories', 'heartRate', 'intensity', 'notes', 'customValues'].includes(key)) {
          acc[key] = session[key];
        }
        return acc;
      }, {} as any)
    } as ExerciseSet)) || [];
  } else if (activityLog.activityType === ActivityType.SPEED_AGILITY) {
    const speedAgilityLog = activityLog as any;
    baseData.sets = speedAgilityLog.sessions?.map((session: any, index: number) => ({
      setNumber: index + 1,
      reps: session.reps,
      ...(session.time && { time: session.time }),
      ...(session.distance && { distance: session.distance }),
      ...(session.height && { height: session.height }),
      ...(session.restTime && { restTime: session.restTime }),
      rpe: session.rpe,
      notes: session.notes
    } as ExerciseSet)) || [];
  }

  console.log('✅ Converted data result:', {
    id: baseData.id,
    exerciseName: baseData.exerciseName,
    activityType: baseData.activityType,
    sets: baseData.sets,
    firstSet: baseData.sets[0]
  });

  return baseData;
}

/**
 * Get all exercises (resistance + activities) for a specific date
 */
export async function getAllExercisesByDate(
  date: Date,
  userId: string
): Promise<UnifiedExerciseData[]> {
  try {
    // Get resistance training exercises (existing) - convert to proper format
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const resistanceExerciseLogs = await getExerciseLogs(userId, startOfDay, endOfDay);
    const resistanceExercises: UnifiedExerciseData[] = resistanceExerciseLogs.map(log => ({
      id: log.id,
      exerciseName: log.exerciseName,
      timestamp: log.timestamp || date,
      userId: log.userId || userId,
      sets: log.sets || [],
      deviceId: log.deviceId,
      activityType: (log.activityType as ActivityType) || ActivityType.RESISTANCE
    }));

    const activityLogs = await activityLoggingService.getActivityLogs(
      userId,
      startOfDay,
      endOfDay
    );

    // Convert activity logs to ExerciseData format
    const activityExercises = activityLogs.map(convertActivityLogToExerciseData);

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

      const resistanceExerciseLogs = await getExerciseLogs(userId, startOfDay, endOfDay);
      return resistanceExerciseLogs.map(log => ({
        id: log.id,
        exerciseName: log.exerciseName,
        timestamp: log.timestamp || date,
        userId: log.userId || userId,
        sets: log.sets || [],
        deviceId: log.deviceId,
        activityType: (log.activityType as ActivityType) || ActivityType.RESISTANCE
      }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Delete exercise (handles both resistance and activity types)
 */
export async function deleteExercise(exercise: UnifiedExerciseData, userId: string): Promise<boolean> {
  try {
    if (exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE) {
      // Delete activity log from localStorage
      const logs: ActivityLog[] = JSON.parse(localStorage.getItem('activity-logs') || '[]');
      const filteredLogs = logs.filter(log => 
        !(log.id === exercise.id && log.userId === userId)
      );
      localStorage.setItem('activity-logs', JSON.stringify(filteredLogs));
      console.log('Activity log deleted:', exercise.id);
      return true;
    } else {
      // Delete resistance exercise using existing Firebase function
      if (exercise.id) {
        await deleteExerciseLog(exercise.id, userId);
        return true;
      } else {
        // If no ID, try to delete from local storage by exercise ID
        deleteLocalExerciseLog(exercise.exerciseName);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return false;
  }
}

/**
 * Delete an activity log
 */
export async function deleteActivityLog(logId: string, userId: string): Promise<void> {
  try {
    await activityLoggingService.deleteActivityLog(logId, userId);
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
  const displayMap = {
    [ActivityType.RESISTANCE]: { emoji: '🏋️‍♂️', name: 'Resistance' },
    [ActivityType.SPORT]: { emoji: '⚽', name: 'Sports' },
    [ActivityType.STRETCHING]: { emoji: '🧘‍♀️', name: 'Stretching' },
    [ActivityType.ENDURANCE]: { emoji: '🏃‍♂️', name: 'Endurance' },
    [ActivityType.OTHER]: { emoji: '🎯', name: 'Other' },
    [ActivityType.SPEED_AGILITY]: { emoji: '⚡', name: 'Speed & Agility' }
  };

  return displayMap[activityType || ActivityType.RESISTANCE] || displayMap[ActivityType.RESISTANCE];
}
