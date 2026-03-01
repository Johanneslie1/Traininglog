import { 
  ActivityType, 
  ActivityExercise, 
  ActivityLog, 
  ActivityFilter,
  ResistanceLog,
  SportLog,
  StretchingLog,
  EnduranceLog,
  OtherLog
} from '@/types/activityTypes';
import { activityDatabases, getActivitiesByType } from '@/data/activityDatabase';
import { loadExerciseDatabases, getExercisesByActivityType } from './exerciseDatabaseService';
import {
  addActivityLog as addFirebaseActivityLog,
  getActivityLogs as getFirebaseActivityLogs,
  deleteActivityLog as deleteFirebaseActivityLog
} from '@/services/firebase/activityLogs';
import { ExerciseSet } from '@/types/sets';

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

/**
 * Service for managing different types of activity exercises
 */
class ActivityService {
  
  /**
   * Get all activities of a specific type
   */
  getActivitiesByType(activityType: ActivityType): Omit<ActivityExercise, 'id'>[] {
    // Pull from new JSON exercise databases first
    const newExercises = getExercisesByActivityType(activityType);
    if (newExercises.length > 0) {
      return newExercises.map(ex => {
        const m: any = ex.metrics || {};
        const base = {
          name: ex.name,
          description: ex.description || '',
          activityType: (ex.activityType || activityType) as ActivityType,
          category: ex.category || 'general',
          createdBy: ex.createdBy || 'system',
          isDefault: ex.isDefault !== undefined ? ex.isDefault : true,
          userId: undefined as string | undefined
        };

        switch (base.activityType) {
          case ActivityType.ENDURANCE:
            return {
              ...base,
              enduranceType: 'other',
              environment: (ex as any).environment || 'both',
              intensity: 'moderate',
              equipment: ex.equipment || [],
              metrics: {
                trackDistance: !!m.trackDistance,
                trackDuration: !!m.trackTime || !!m.trackDuration,
                trackPace: !!m.trackPace,
                trackHeartRate: !!m.trackHeartRate,
                trackCalories: !!m.trackCalories,
                trackElevation: !!m.trackElevation
              }
            } as any;
          case ActivityType.SPORT:
            return {
              ...base,
              sportType: (ex as any).sportType || 'general',
              position: undefined,
              skillLevel: 'intermediate',
              teamBased: (ex as any).teamBased || false,
              equipment: ex.equipment || [],
              primarySkills: (ex as any).skills || [],
              metrics: {
                trackDuration: !!m.trackDuration || !!m.trackTime,
                trackScore: !!m.trackScore,
                trackIntensity: !!m.trackIntensity || !!m.trackRPE,
                trackOpponent: !!m.trackOpponent,
                trackPerformance: !!m.trackPerformance
              }
            } as any;
          case ActivityType.STRETCHING:
            return {
              ...base,
              stretchType: 'static',
              targetMuscles: ex.primaryMuscles || [],
              bodyRegion: ['full_body'],
              difficulty: (ex as any).difficulty || 'beginner',
              instructions: ex.instructions || [],
              metrics: {
                trackDuration: true,
                trackHoldTime: true,
                trackIntensity: !!ex.metrics?.trackRPE,
                trackFlexibility: true
              }
            } as any;
          case ActivityType.OTHER:
            return {
              ...base,
              customCategory: base.category,
              customFields: [],
              instructions: ex.instructions || [],
              metrics: Object.keys(ex.metrics || {}).reduce((acc: any, k) => { acc[k] = true; return acc; }, {})
            } as any;
          case ActivityType.SPEED_AGILITY:
            return {
              ...base,
              drillType: (ex as any).drillType || 'agility',
              equipment: ex.equipment || [],
              difficulty: (ex as any).difficulty || 'beginner',
              setup: (ex as any).setup || [],
              instructions: ex.instructions || [],
              metrics: {
                trackTime: !!m.trackTime,
                trackDistance: !!m.trackDistance,
                trackReps: !!m.trackReps,
                trackHeight: !!m.trackHeight,
                trackRPE: !!m.trackRPE
              }
            } as any;
          case ActivityType.RESISTANCE:
          default:
            return {
              ...base,
              primaryMuscles: ex.primaryMuscles || [],
              secondaryMuscles: ex.secondaryMuscles || [],
              equipment: ex.equipment || [],
              instructions: ex.instructions || [],
              tips: ex.tips || [],
              defaultUnit: (ex as any).defaultUnit || 'kg',
              metrics: {
                trackWeight: !!m.trackWeight,
                trackReps: !!m.trackReps,
                trackRPE: !!m.trackRPE
              }
            } as any;
        }
      });
    }

    // Fallback to legacy hardcoded database
    return getActivitiesByType(activityType);
  }

  /**
   * Search activities with filters
   */
  searchActivities(filters: ActivityFilter): Omit<ActivityExercise, 'id'>[] {
    // Get from new exercise databases first
    const allNewExercises = loadExerciseDatabases();
    let activities: any[] = [];
    
    // Combine all exercises from new databases
    Object.values(allNewExercises).forEach(exerciseArray => {
      activities = activities.concat(exerciseArray);
    });
    
    // Add from old databases as fallback
    const oldActivities = Object.values(activityDatabases).flat();
    activities = activities.concat(oldActivities);

    // Filter by activity type
    if (filters.activityType && filters.activityType.length > 0) {
      activities = activities.filter(activity => 
        filters.activityType!.includes(activity.activityType)
      );
    }

    // Filter by category
    if (filters.category && filters.category.length > 0) {
      activities = activities.filter(activity => 
        filters.category!.includes(activity.category)
      );
    }

    // Filter by search text
    if (filters.searchText) {
      const searchTerm = filters.searchText.toLowerCase();
      activities = activities.filter(activity => 
        activity.name.toLowerCase().includes(searchTerm) ||
        activity.description?.toLowerCase().includes(searchTerm) ||
        activity.category.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by equipment (for activities that have equipment)
    if (filters.equipment && filters.equipment.length > 0) {
      activities = activities.filter(activity => {
        if ('equipment' in activity) {
          return filters.equipment!.some(eq => 
            activity.equipment.includes(eq)
          );
        }
        return false;
      });
    }

    return activities;
  }

  /**
   * Get categories for a specific activity type
   */
  getCategoriesByType(activityType: ActivityType): string[] {
    const activities = this.getActivitiesByType(activityType);
    return [...new Set(activities.map(activity => activity.category))];
  }

  /**
   * Create a new custom activity
   */
  async createCustomActivity(
    activityData: Omit<ActivityExercise, 'id' | 'isDefault'>,
    userId: string
  ): Promise<string> {
    // This would save to Firebase/database
    // For now, return a mock ID
    const customActivity = {
      ...activityData,
      id: `custom-${Date.now()}`,
      isDefault: false,
      createdBy: userId,
      userId: userId
    };
    
    console.log('Creating custom activity:', customActivity);
    return customActivity.id;
  }

  /**
   * Get activity by ID (would query database)
   */
  async getActivityById(id: string): Promise<ActivityExercise | null> {
    // This would query the database
    // For now, search in default activities
    const allActivities = Object.values(activityDatabases).flat();
    const found = allActivities.find(activity => 
      `${activity.activityType}-${activity.name.replace(/\s+/g, '-').toLowerCase()}` === id
    );
    
    if (found) {
      return {
        ...found,
        id: id
      } as ActivityExercise;
    }
    
    return null;
  }
}

/**
 * Service for logging different types of activities
 */
class ActivityLoggingService {

  private normalizeSetForStorage(input: Record<string, unknown>): ExerciseSet {
    const normalized: ExerciseSet = {
      ...(input as unknown as Partial<ExerciseSet>),
      duration: (input.duration as number | undefined) ?? (input.time as number | undefined),
      averageHeartRate: (input.averageHeartRate as number | undefined) ?? (input.averageHR as number | undefined),
      maxHeartRate: (input.maxHeartRate as number | undefined) ?? (input.maxHR as number | undefined),
      notes: (input.notes as string | undefined) ?? (input.comment as string | undefined),
      weight: typeof input.weight === 'number' ? (input.weight as number) : 0,
      reps: typeof input.reps === 'number' ? (input.reps as number) : 0
    };

    return removeUndefinedFields(normalized);
  }

  private mapLogDataToSets(logData: any): ExerciseSet[] {
    switch (logData.activityType) {
      case ActivityType.RESISTANCE:
        return (logData.sets || []).map((set: any) => this.normalizeSetForStorage({
          ...set,
          weight: set.weight || 0,
          reps: set.reps || 0,
          rpe: set.rpe,
          restTime: set.restTime,
          notes: set.notes
        }));
      case ActivityType.SPORT:
        return (logData.sessions || []).map((session: any) => this.normalizeSetForStorage({
          ...session,
          duration: session.duration || 0,
          distance: session.distance,
          calories: session.calories,
          intensity: session.intensity,
          score: session.score,
          opponent: session.opponent,
          performance: session.performance,
          notes: session.notes
        }));
      case ActivityType.STRETCHING:
        return (logData.stretches || []).map((stretch: any) => this.normalizeSetForStorage({
          ...stretch,
          duration: stretch.duration || 0,
          holdTime: stretch.holdTime,
          intensity: stretch.intensity,
          flexibility: stretch.flexibility,
          stretchType: stretch.stretchType,
          bodyPart: stretch.bodyPart,
          notes: stretch.notes
        }));
      case ActivityType.ENDURANCE:
        return (logData.sessions || []).map((session: any) => this.normalizeSetForStorage({
          ...session,
          duration: session.duration || 0,
          distance: session.distance,
          pace: session.pace,
          averageHeartRate: session.averageHeartRate,
          maxHeartRate: session.maxHeartRate,
          calories: session.calories,
          elevation: session.elevation,
          rpe: session.rpe,
          hrZone1: session.hrZone1,
          hrZone2: session.hrZone2,
          hrZone3: session.hrZone3,
          hrZone4: session.hrZone4,
          hrZone5: session.hrZone5,
          notes: session.notes
        }));
      case ActivityType.SPEED_AGILITY:
        return (logData.sessions || []).map((session: any) => this.normalizeSetForStorage({
          ...session,
          reps: session.reps || 0,
          duration: session.time,
          distance: session.distance,
          height: session.height,
          restTime: session.restTime,
          rpe: session.rpe,
          notes: session.notes
        }));
      case ActivityType.OTHER:
      default:
        return (logData.customData || []).map((data: any) => this.normalizeSetForStorage({
          ...data,
          duration: data.duration,
          distance: data.distance,
          height: data.height,
          rpe: data.rpe,
          holdTime: data.holdTime,
          pace: data.pace,
          elevation: data.elevation,
          calories: data.calories,
          heartRate: data.heartRate,
          intensity: data.intensity,
          notes: data.notes,
          ...(data.customValues || {})
        }));
    }
  }

  /**
   * Create a resistance exercise log
   */
  async logResistanceExercise(
    activityId: string,
    activityName: string,
    sets: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    const logData: Omit<ResistanceLog, 'id'> = {
      activityId,
      activityType: ActivityType.RESISTANCE,
      activityName,
      userId,
      timestamp,
      sets: sets.map((set, index) => ({
        setNumber: index + 1,
        weight: set.weight || 0,
        reps: set.reps || 0,
        rpe: set.rpe,
        restTime: set.restTime,
        notes: set.notes
      }))
    };

    // Save to database
    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Create a sport activity log
   */
  async logSportActivity(
    activityId: string,
    activityName: string,
    sessions: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    const logData: Omit<SportLog, 'id'> = {
      activityId,
      activityType: ActivityType.SPORT,
      activityName,
      userId,
      timestamp,
      sessions: sessions.map((session, index) => ({
        ...session,
        sessionNumber: index + 1,
        duration: session.duration || 0,
        distance: session.distance, // Include distance
        calories: session.calories, // Include calories
        intensity: session.intensity || 5,
        score: session.score,
        opponent: session.opponent,
        performance: session.performance || 5,
        skills: session.skills || [],
        notes: session.notes
      }))
    };

    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Create a stretching exercise log
   */
  async logStretchingExercise(
    activityId: string,
    activityName: string,
    stretches: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    const logData: Omit<StretchingLog, 'id'> = {
      activityId,
      activityType: ActivityType.STRETCHING,
      activityName,
      userId,
      timestamp,
      stretches: stretches.map((stretch, index) => ({
        ...stretch,
        setNumber: index + 1,
        duration: stretch.duration || 0,
        holdTime: stretch.holdTime,
        intensity: stretch.intensity || 5,
        flexibility: stretch.flexibility || 5,
        stretchType: stretch.stretchType,
        bodyPart: stretch.bodyPart,
        notes: stretch.notes
      }))
    };

    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Create an endurance exercise log
   */
  async logEnduranceExercise(
    activityId: string,
    activityName: string,
    sessions: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    console.log('🏃 Logging endurance exercise with sessions:', sessions);
    
    const logData: Omit<EnduranceLog, 'id'> = {
      activityId,
      activityType: ActivityType.ENDURANCE,
      activityName,
      userId,
      timestamp,
      sessions: sessions.map((session, index) => {
        console.log('🏃 Processing endurance session:', session);
        return {
          ...session,
          sessionNumber: index + 1,
          distance: session.distance,
          duration: session.duration || 0,
          pace: session.pace,
          // Handle both field name variations
          averageHeartRate: session.averageHeartRate || session.averageHR,
          maxHeartRate: session.maxHeartRate || session.maxHR,
          calories: session.calories,
          elevation: session.elevation,
          rpe: session.rpe, // Add RPE field
          hrZone1: session.hrZone1, // Add heart rate zone fields
          hrZone2: session.hrZone2,
          hrZone3: session.hrZone3,
          hrZone4: session.hrZone4,
          hrZone5: session.hrZone5,
          notes: session.notes
        };
      })
    };

    console.log('🏃 Final endurance log data:', logData);
    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Create an other activity log
   */
  async logOtherActivity(
    activityId: string,
    activityName: string,
    customData: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    const logData: Omit<OtherLog, 'id'> = {
      activityId,
      activityType: ActivityType.OTHER,
      activityName,
      userId,
      timestamp,
      customData: customData.map((data, index) => ({
        sessionNumber: index + 1,
        duration: data.duration,
        calories: data.calories,
        heartRate: data.heartRate,
        intensity: data.intensity,
        notes: data.notes,
        customValues: data.customValues || {},
        ...data // Include all other fields
      }))
    };

    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Create a speed & agility exercise log
   */
  async logSpeedAgilityExercise(
    activityId: string,
    activityName: string,
    sessions: any[],
    userId: string,
    timestamp: Date = new Date()
  ): Promise<string> {
    console.log('⚡ Logging speed & agility exercise with sessions:', sessions);
    
    const logData = {
      activityId,
      activityType: ActivityType.SPEED_AGILITY,
      activityName,
      userId,
      timestamp,
      sessions: sessions.map((session, index) => {
        console.log('⚡ Processing speed & agility session:', session);
        return {
          ...session,
          sessionNumber: index + 1,
          reps: session.reps || 0,
          time: session.time, // Time for drills in seconds
          distance: session.distance, // Distance for sprint drills
          height: session.height, // Height for jumping drills
          restTime: session.restTime, // Rest between reps
          drillMetric: session.drillMetric,
          rpe: session.rpe || 0,
          notes: session.notes
        };
      })
    };

    console.log('⚡ Final speed & agility log data:', logData);
    const logId = await this.saveActivityLog(logData);
    return logId;
  }

  /**
   * Generic save method - would integrate with Firebase
   */
  private async saveActivityLog(logData: Omit<ActivityLog, 'id'>): Promise<string> {
    const sets = this.mapLogDataToSets(logData);

    const payload = removeUndefinedFields({
      activityName: logData.activityName,
      userId: logData.userId,
      sets,
      activityType: logData.activityType,
      notes: logData.notes
    });

    const logId = await addFirebaseActivityLog(
      payload,
      logData.timestamp
    );

    return logId;
  }

  /**
   * Get activity logs by user and date range
   */
  async getActivityLogs(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    activityType?: ActivityType
  ): Promise<ActivityLog[]> {
    const queryStart = startDate || new Date('1970-01-01T00:00:00.000Z');
    const queryEnd = endDate || new Date('9999-12-31T23:59:59.999Z');

    const logs = await getFirebaseActivityLogs(userId, queryStart, queryEnd);

    const filteredLogs = activityType
      ? logs.filter((log) => log.activityType === activityType)
      : logs;

    return filteredLogs.map((log) => ({
      id: log.id,
      activityId: log.id,
      activityType: log.activityType as ActivityType,
      activityName: log.activityName,
      userId: log.userId,
      timestamp: log.timestamp,
      notes: log.notes,
      sessions: log.sets
    } as any));
  }

  /**
   * Delete activity log
   */
  async deleteActivityLog(logId: string, userId: string): Promise<boolean> {
    try {
      await deleteFirebaseActivityLog(logId, userId);
      return true;
    } catch (error) {
      console.error('Error deleting activity log:', error);
      return false;
    }
  }
}

// Export service instances
export const activityService = new ActivityService();
export const activityLoggingService = new ActivityLoggingService();
