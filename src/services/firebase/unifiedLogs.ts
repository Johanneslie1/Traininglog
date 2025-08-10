import { UnifiedLog, getCollectionTypeFromExerciseType, mapExerciseTypeToActivityType } from '@/types/activityLog';
import { ExerciseSet } from '@/types/sets';
import { ExerciseType } from '@/config/exerciseTypes';
import { TemplatedLogData, UniversalExerciseSet } from '@/types/trainingTemplates';
import { TemplatedLoggingService } from '../templatedLoggingService';

// Import services
import { addExerciseLog as addStrengthExercise, getExerciseLogs as getStrengthExercises, deleteExerciseLog as deleteStrengthExercise } from './strengthExerciseLogs';
import { addActivityLog, getActivityLogs, deleteActivityLog } from './activityLogs';

// Unified input type (legacy)
type UnifiedLogInput = {
  exerciseName?: string;
  activityName?: string;
  userId: string;
  sets: ExerciseSet[];
  exerciseType?: ExerciseType;
  categories?: string[];
  notes?: string;
};

// Enhanced input type with template support
type EnhancedLogInput = UnifiedLogInput & {
  templateId?: string;
  templateData?: UniversalExerciseSet[];
};

// Main routing function for saving logs (now supports templates)
export const saveLog = async (
  logData: UnifiedLogInput,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  try {
    console.log('🎯 saveLog called with:', { 
      logData: {
        ...logData,
        sets: `${logData.sets?.length || 0} sets`
      }, 
      selectedDate: selectedDate.toISOString(), 
      existingId 
    });
    
    if (!logData.userId) {
      throw new Error('userId is required to save log');
    }

    // Check if this is a templated log
    const enhancedLogData = logData as EnhancedLogInput;
    if (enhancedLogData.templateId && enhancedLogData.templateData) {
      // Route to templated logging service
      const templatedData: TemplatedLogData = {
        templateId: enhancedLogData.templateId,
        exerciseName: enhancedLogData.exerciseName,
        activityName: enhancedLogData.activityName,
        userId: enhancedLogData.userId,
        sets: enhancedLogData.templateData,
        exerciseType: enhancedLogData.exerciseType || 'strength',
        categories: enhancedLogData.categories,
        notes: enhancedLogData.notes
      };
      
      console.log('🎯 Routing to templated logging service');
      return await TemplatedLoggingService.saveTemplatedLog(templatedData, selectedDate, existingId);
    }

    // Legacy logging approach
    const exerciseType: ExerciseType = logData.exerciseType || 'strength';
    let firestoreExerciseType: ExerciseType = exerciseType;
    if (exerciseType === 'plyometrics') firestoreExerciseType = 'plyometric' as ExerciseType;

    const collectionType = getCollectionTypeFromExerciseType(exerciseType.toString());
    console.log('🎯 Legacy routing decision:', {
      exerciseType,
      firestoreExerciseType,
      collectionType,
      exerciseName: logData.exerciseName,
      activityName: logData.activityName
    });

    if (collectionType === 'strength') {
      // Route to strength exercises collection
      const strengthData = {
        exerciseName: logData.exerciseName || logData.activityName || 'Unknown Exercise',
        userId: logData.userId,
        sets: logData.sets,
        exerciseType: firestoreExerciseType,
        categories: logData.categories
      };
      console.log('💪 Calling addStrengthExercise with:', strengthData);
      return await addStrengthExercise(strengthData, selectedDate, existingId);
    } else {
      // Route to activities collection
      const activityType = mapExerciseTypeToActivityType(exerciseType.toString());
      const activityData = {
        activityName: logData.activityName || logData.exerciseName || 'Unknown Activity',
        userId: logData.userId,
        sets: logData.sets,
        activityType,
        categories: logData.categories,
        notes: logData.notes
      };
      console.log('🏃 Calling addActivityLog with:', activityData);
      return await addActivityLog(activityData, selectedDate, existingId);
    }
  } catch (error) {
    console.error('❌ Error in saveLog:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      logData: {
        exerciseName: logData.exerciseName,
        activityName: logData.activityName,
        exerciseType: logData.exerciseType,
        userId: logData.userId,
        setsCount: logData.sets?.length || 0
      }
    });
    throw error;
  }
};

// Main function for getting all logs (unified)
export const getAllLogs = async (userId: string, startDate: Date, endDate: Date): Promise<UnifiedLog[]> => {
  try {
    console.log('📖 getAllLogs called with:', { userId, startDate, endDate });
    console.log('📖 getAllLogs function path check - this is the unified logs service');
    
    if (!userId) {
      throw new Error('userId is required to fetch logs');
    }

    // Fetch from both collections in parallel
    console.log('📖 Fetching from both strength and activity collections...');
    const [strengthExercises, activities] = await Promise.all([
      getStrengthExercises(userId, startDate, endDate).catch(error => {
        console.warn('⚠️ Error fetching strength exercises:', error);
        return [];
      }),
      getActivityLogs(userId, startDate, endDate).catch(error => {
        console.warn('⚠️ Error fetching activities:', error);
        return [];
      })
    ]);

    console.log('📖 Retrieved data from both collections:', {
      strengthExercises: strengthExercises.length,
      activities: activities.length,
      strengthDetails: strengthExercises.map(ex => ({ id: ex.id, name: ex.exerciseName, type: 'strength' })),
      activityDetails: activities.map(act => ({ id: act.id, name: act.activityName, type: act.activityType }))
    });

    // Combine and sort by timestamp
    const allLogs = [
      ...strengthExercises.map(ex => ({
        ...ex,
        exerciseType: 'strength' as const,
        userId: ex.userId || userId // Ensure userId is always defined
      })),
      ...activities
    ] as UnifiedLog[];

    allLogs.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return bTime - aTime; // Descending order (newest first)
    });

    console.log('📖 Final unified logs being returned:', {
      total: allLogs.length,
      logs: allLogs.map(log => ({
        id: log.id,
        name: 'activityName' in log ? log.activityName : log.exerciseName,
        type: 'activityType' in log ? log.activityType : log.exerciseType,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString(),
        isActivity: 'activityType' in log
      }))
    });

    console.log('📖 Combined and sorted logs:', allLogs.length);
    return allLogs;
  } catch (error) {
    console.error('❌ Error in getAllLogs:', error);
    throw new Error('Failed to fetch logs');
  }
};

// Delete function that routes to correct collection
export const deleteLog = async (logId: string, userId: string, logType?: 'strength' | 'activity'): Promise<void> => {
  try {
    console.log('🗑️ deleteLog called with:', { logId, userId, logType });
    
    if (!userId) {
      throw new Error('userId is required to delete log');
    }

    if (!logId) {
      throw new Error('logId is required to delete log');
    }

    let deleted = false;
    const errors = [];

    // If logType is specified, try that collection first
    if (logType === 'strength') {
      try {
        await deleteStrengthExercise(logId, userId);
        deleted = true;
        console.log('✅ Log deleted from strength exercises');
      } catch (error) {
        console.warn('⚠️ Could not delete from strength exercises:', error);
        errors.push(`Strength: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (logType === 'activity') {
      try {
        await deleteActivityLog(logId, userId);
        deleted = true;
        console.log('✅ Log deleted from activities');
      } catch (error) {
        console.warn('⚠️ Could not delete from activities:', error);
        errors.push(`Activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // If not deleted yet, try both collections
    if (!deleted) {
      try {
        await deleteStrengthExercise(logId, userId);
        deleted = true;
        console.log('✅ Log deleted from strength exercises (fallback)');
      } catch (error) {
        console.warn('⚠️ Could not delete from strength exercises (fallback):', error);
        errors.push(`Strength fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!deleted) {
      try {
        await deleteActivityLog(logId, userId);
        deleted = true;
        console.log('✅ Log deleted from activities (fallback)');
      } catch (error) {
        console.warn('⚠️ Could not delete from activities (fallback):', error);
        errors.push(`Activity fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!deleted) {
      const errorMessage = 'Log not found in any collection or failed to delete';
      console.error(`❌ ${errorMessage}. Errors:`, errors);
      throw new Error(`${errorMessage}: ${errors.join(', ')}`);
    }

    console.log('✅ Log deletion completed successfully');
  } catch (error) {
    console.error('❌ Error in deleteLog:', error);
    throw error instanceof Error ? error : new Error('Failed to delete log');
  }
};

// Legacy compatibility exports
export const addExerciseLog = saveLog;
export const getExerciseLogs = getAllLogs;
export const deleteExerciseLog = deleteLog;

// New template-based functions
export const saveTemplatedLog = async (
  templatedData: TemplatedLogData,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  return await TemplatedLoggingService.saveTemplatedLog(templatedData, selectedDate, existingId);
};

export const getTemplatedLogs = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  exerciseType?: ExerciseType
) => {
  return await TemplatedLoggingService.getTemplatedLogs(userId, startDate, endDate, exerciseType);
};

export const getAvailableTemplates = (exerciseType?: ExerciseType) => {
  return TemplatedLoggingService.getAvailableTemplates(exerciseType);
};

export const createNewSetFromTemplate = (
  templateId: string,
  previousSet?: UniversalExerciseSet
) => {
  return TemplatedLoggingService.createNewSetFromTemplate(templateId, previousSet);
};
