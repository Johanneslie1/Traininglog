import { ExerciseSet } from './sets';
import { ActivityType as CanonicalActivityType } from './activityTypes';

// Transitional support for legacy values stored in older documents
export type LegacyActivityType = 'team_sports' | 'outdoor' | 'flexibility' | 'speed_agility';

// Accept both canonical and legacy values at boundaries; normalize before persistence/use
export type ActivityType = CanonicalActivityType | LegacyActivityType;

export type NormalizedActivityType = CanonicalActivityType;

// Base interface for activity logs
export interface ActivityLog {
  /** Unique identifier for the logged activity */
  id: string;
  /** Name of the activity performed */
  activityName: string;
  /** Type of activity */
  activityType: NormalizedActivityType;
  /** Categories this activity belongs to */
  categories?: string[];
  /** Array of sets/sessions performed */
  sets: ExerciseSet[];
  /** When the activity was performed */
  timestamp: Date;
  /** Device ID for syncing */
  deviceId?: string;
  /** User ID who owns this activity log */
  userId: string;
  /** Superset group identifier */
  supersetId?: string;
  /** Deterministic per-exercise superset label (e.g. 1a, 1b) */
  supersetLabel?: string;
  /** Optional superset display name */
  supersetName?: string;
  /** Additional notes */
  notes?: string;
}

// Input type for creating activity logs
export type ActivityLogInput = {
  activityName: string;
  userId: string;
  sets: ExerciseSet[];
  activityType: ActivityType;
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
  categories?: string[];
  notes?: string;
};

export const normalizeActivityType = (
  activityType: ActivityType | string | undefined
): NormalizedActivityType => {
  const normalizedInput = String(activityType ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .toLowerCase();

  switch (normalizedInput) {
    case CanonicalActivityType.RESISTANCE:
    case 'strength':
    case 'plyometric':
    case 'plyometrics':
    case 'bodyweight':
      return CanonicalActivityType.RESISTANCE;
    case CanonicalActivityType.ENDURANCE:
    case 'cardio':
      return CanonicalActivityType.ENDURANCE;
    case CanonicalActivityType.SPORT:
    case 'team_sports':
    case 'teamsports':
      return CanonicalActivityType.SPORT;
    case CanonicalActivityType.STRETCHING:
    case 'flexibility':
      return CanonicalActivityType.STRETCHING;
    case CanonicalActivityType.SPEED_AGILITY:
    case 'speed_agility':
    case 'speedagility':
      return CanonicalActivityType.SPEED_AGILITY;
    case CanonicalActivityType.OTHER:
    case 'outdoor':
      return CanonicalActivityType.OTHER;
    default:
      console.warn('🔄 normalizeActivityType: Unknown activity type:', activityType, 'defaulting to OTHER');
      return CanonicalActivityType.OTHER;
  }
};

// Enhanced exercise log for strength/plyometric exercises
export interface StrengthExerciseLog {
  /** Unique identifier for the logged exercise */
  id: string;
  /** Name of the exercise performed */
  exerciseName: string;
  /** Type of exercise (strength or plyometric) */
  exerciseType: 'strength' | 'plyometric';
  /** Categories this exercise belongs to */
  categories?: string[];
  /** Array of sets performed */
  sets: ExerciseSet[];
  /** When the exercise was performed */
  timestamp: Date;
  /** Device ID for syncing */
  deviceId?: string;
  /** User ID who owns this exercise log */
  userId: string;
  /** Additional notes */
  notes?: string;
}

// Input type for creating strength exercise logs
export type StrengthExerciseLogInput = {
  exerciseName: string;
  userId: string;
  sets: ExerciseSet[];
  exerciseType: 'strength' | 'plyometric';
  categories?: string[];
  notes?: string;
};

// Union type for all logs
export type UnifiedLog = StrengthExerciseLog | ActivityLog;

// Type guard functions
export const isActivityLog = (log: UnifiedLog): log is ActivityLog => {
  return (log as ActivityLog).activityType !== undefined;
};

export const isStrengthExerciseLog = (log: UnifiedLog): log is StrengthExerciseLog => {
  return (log as StrengthExerciseLog).exerciseType !== undefined;
};

// Helper function to determine collection type from exercise type
export const getCollectionTypeFromExerciseType = (exerciseType: string): 'strength' | 'activity' => {
  console.log('🔍 getCollectionTypeFromExerciseType called with:', exerciseType);
  
  if (exerciseType === 'strength' || exerciseType === 'plyometric' || exerciseType === 'plyometrics') {
    console.log('✅ Routing to strength collection for type:', exerciseType);
    return 'strength';
  }
  
  console.log('✅ Routing to activity collection for type:', exerciseType);
  return 'activity';
};

// Helper function to map exercise types to activity types
export const mapExerciseTypeToActivityType = (exerciseType: string): ActivityType => {
  switch (exerciseType) {
    case 'strength':
    case 'plyometric':
    case 'plyometrics':
    case 'bodyweight':
      return CanonicalActivityType.RESISTANCE;
    case 'endurance':
    case 'cardio':
      return CanonicalActivityType.ENDURANCE;
    case 'team_sports':
    case 'teamSports':
      return CanonicalActivityType.SPORT;
    case 'speed_agility':
    case 'speedAgility':
      return CanonicalActivityType.SPEED_AGILITY;
    case 'other':
    case 'outdoor':
      return CanonicalActivityType.OTHER;
    case 'flexibility':
      return CanonicalActivityType.STRETCHING;
    default:
      console.warn('🔄 mapExerciseTypeToActivityType: Unknown exercise type:', exerciseType, 'defaulting to OTHER');
      return CanonicalActivityType.OTHER;
  }
};
