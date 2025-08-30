import { ExerciseSet } from './sets';

// Activity types for the new activity logs collection
export type ActivityType = 'endurance' | 'team_sports' | 'outdoor' | 'flexibility' | 'speedAgility';

// Base interface for activity logs
export interface ActivityLog {
  /** Unique identifier for the logged activity */
  id: string;
  /** Name of the activity performed */
  activityName: string;
  /** Type of activity */
  activityType: ActivityType;
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
  /** Additional notes */
  notes?: string;
}

// Input type for creating activity logs
export type ActivityLogInput = {
  activityName: string;
  userId: string;
  sets: ExerciseSet[];
  activityType: ActivityType;
  categories?: string[];
  notes?: string;
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
    case 'endurance':
      return 'endurance';
    case 'team_sports':
    case 'teamSports':
      return 'team_sports';    case 'speed_agility':
    case 'speedAgility':
      return 'speedAgility';
    case 'other':
    case 'outdoor':
      return 'outdoor';
    case 'flexibility':
      return 'flexibility';
    default:
      console.warn('🔄 mapExerciseTypeToActivityType: Unknown exercise type:', exerciseType, 'defaulting to endurance');
      return 'endurance'; // Default fallback
  }
};
