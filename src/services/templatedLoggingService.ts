import { TemplatedLogData, UniversalExerciseSet } from '@/types/trainingTemplates';
import { ExerciseType } from '@/config/exerciseTypes';
import { TemplateService } from './templateService';
import { getCollectionTypeFromExerciseType, mapExerciseTypeToActivityType } from '@/types/activityLog';

// Import existing services
import { addExerciseLog as addStrengthExercise, getExerciseLogs as getStrengthExercises } from './firebase/strengthExerciseLogs';
import { addActivityLog, getActivityLogs } from './firebase/activityLogs';

/**
 * Enhanced unified logging service with template support
 */
export class TemplatedLoggingService {
  
  /**
   * Save a templated log entry
   */
  static async saveTemplatedLog(
    logData: TemplatedLogData,
    selectedDate: Date,
    existingId?: string
  ): Promise<string> {
    try {
      console.log('🎯 saveTemplatedLog called with:', { 
        templateId: logData.templateId,
        exerciseType: logData.exerciseType,
        setsCount: logData.sets?.length || 0,
        selectedDate: selectedDate.toISOString(), 
        existingId 
      });

      if (!logData.userId) {
        throw new Error('userId is required to save log');
      }

      if (!logData.templateId) {
        throw new Error('templateId is required to save templated log');
      }

      // Validate log data against template
      const validation = TemplateService.validateLogData(logData.templateId, logData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get template for additional context
      const template = TemplateService.getTemplateById(logData.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Use original routing logic from unifiedLogs.ts
      const exerciseType: ExerciseType = logData.exerciseType || 'strength';
      let firestoreExerciseType: ExerciseType = exerciseType;
      if (exerciseType === 'plyometrics') firestoreExerciseType = 'plyometric' as ExerciseType;

      const collectionType = getCollectionTypeFromExerciseType(exerciseType.toString());
      
      // Convert templated sets to legacy format for existing services
      const convertedSets = this.convertUniversalSetsToLegacy(logData.sets, template.type);
      
      console.log('🎯 Template routing decision:', {
        templateId: logData.templateId,
        templateType: template.type,
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
          sets: convertedSets,
          exerciseType: firestoreExerciseType,
          categories: logData.categories,
          // Add template metadata
          templateId: logData.templateId,
          templateData: logData.sets // Store original templated data
        };
        console.log('💪 Calling addStrengthExercise with templated data:', strengthData);
        return await addStrengthExercise(strengthData, selectedDate, existingId);
      } else {
        // Route to activities collection
        const activityType = mapExerciseTypeToActivityType(exerciseType.toString());
        const activityData = {
          activityName: logData.activityName || logData.exerciseName || 'Unknown Activity',
          userId: logData.userId,
          sets: convertedSets,
          activityType,
          categories: logData.categories,
          notes: logData.notes,
          // Add template metadata
          templateId: logData.templateId,
          templateData: logData.sets // Store original templated data
        };
        console.log('🏃 Calling addActivityLog with templated data:', activityData);
        return await addActivityLog(activityData, selectedDate, existingId);
      }
    } catch (error) {
      console.error('❌ Error in saveTemplatedLog:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        templateId: logData.templateId,
        exerciseType: logData.exerciseType
      });
      throw error;
    }
  }

  /**
   * Convert universal exercise sets to legacy format for backward compatibility
   */
  private static convertUniversalSetsToLegacy(sets: UniversalExerciseSet[], exerciseType: ExerciseType) {
    return sets.map((set, index) => {
      const legacySet: any = {
        setNumber: index + 1,
        ...set
      };

      // Ensure required fields for strength exercises
      if (exerciseType === 'strength') {
        legacySet.weight = set.weight || 0;
        legacySet.reps = set.reps || 0;
        legacySet.difficulty = set.difficulty || 'MODERATE';
      }

      // Convert duration from minutes to seconds if needed
      if (set.duration && exerciseType !== 'strength') {
        legacySet.duration = typeof set.duration === 'number' ? set.duration * 60 : set.duration;
      }

      return legacySet;
    });
  }

  /**
   * Create a new set based on template and previous set data
   */
  static createNewSetFromTemplate(
    templateId: string, 
    previousSet?: UniversalExerciseSet
  ): UniversalExerciseSet {
    const template = TemplateService.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const newSet = TemplateService.createEmptySet(templateId);

    // If we have a previous set, copy non-performance values
    if (previousSet) {
      template.fields.forEach(field => {
        // Copy values that typically stay the same between sets
        if (['weight', 'restTime', 'stretchType', 'drillType', 'position', 'teamName'].includes(field.fieldId)) {
          if (previousSet[field.fieldId] !== undefined) {
            newSet[field.fieldId] = previousSet[field.fieldId];
          }
        }
      });
    }

    return newSet;
  }

  /**
   * Get templated logs with enhanced metadata
   */
  static async getTemplatedLogs(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    exerciseType?: ExerciseType
  ) {
    try {
      console.log('📖 getTemplatedLogs called with:', { userId, startDate, endDate, exerciseType });

      if (!userId) {
        throw new Error('userId is required to fetch logs');
      }

      // Fetch from both collections in parallel
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

      // Enhance logs with template information
      const enhancedLogs = [
        ...strengthExercises.map(ex => this.enhanceLogWithTemplate(ex, 'strength')),
        ...activities.map(act => this.enhanceLogWithTemplate(act, 'activity'))
      ];

      // Filter by exercise type if specified
      const filteredLogs = exerciseType 
        ? enhancedLogs.filter(log => log.exerciseType === exerciseType || log.templateType === exerciseType)
        : enhancedLogs;

      // Sort by timestamp
      filteredLogs.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime; // Descending order (newest first)
      });

      console.log('📖 Enhanced templated logs being returned:', {
        total: filteredLogs.length,
        withTemplates: filteredLogs.filter(log => log.templateId).length
      });

      return filteredLogs;
    } catch (error) {
      console.error('❌ Error in getTemplatedLogs:', error);
      throw new Error('Failed to fetch templated logs');
    }
  }

  /**
   * Enhance a log entry with template information
   */
  private static enhanceLogWithTemplate(log: any, logType: 'strength' | 'activity') {
    const enhanced = { ...log };

    // Add template information if available
    if (log.templateId) {
      const template = TemplateService.getTemplateById(log.templateId);
      if (template) {
        enhanced.templateName = template.name;
        enhanced.templateType = template.type;
        enhanced.templateDescription = template.description;
      }
    }

    // Add log type for UI purposes
    enhanced.logType = logType;
    enhanced.isTemplated = !!log.templateId;

    return enhanced;
  }

  /**
   * Get available templates for exercise selection
   */
  static getAvailableTemplates(exerciseType?: ExerciseType) {
    if (exerciseType) {
      return TemplateService.getTemplatesByType(exerciseType);
    }
    return TemplateService.getAllTemplates();
  }

  /**
   * Convert legacy log to templated format (for migration)
   */
  static convertLegacyToTemplated(
    legacyLog: any, 
    exerciseType: ExerciseType
  ): TemplatedLogData | null {
    const template = TemplateService.getDefaultTemplate(exerciseType);
    if (!template) return null;

    const convertedSets: UniversalExerciseSet[] = legacyLog.sets.map((set: any) => {
      const universalSet: UniversalExerciseSet = {};

      // Map known fields
      template.fields.forEach(field => {
        if (set[field.fieldId] !== undefined) {
          universalSet[field.fieldId] = set[field.fieldId];
        }
      });

      return universalSet;
    });

    return {
      templateId: template.id,
      exerciseName: legacyLog.exerciseName,
      activityName: legacyLog.activityName,
      userId: legacyLog.userId,
      sets: convertedSets,
      exerciseType,
      categories: legacyLog.categories,
      notes: legacyLog.notes,
      timestamp: legacyLog.timestamp
    };
  }
}
