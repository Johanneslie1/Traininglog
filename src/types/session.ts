import { ExerciseSet } from './sets';
import { TrainingType } from './exercise';

export interface Session {
  id: string;
  userId: string;
  date: string;
  notes?: string;
  completed: boolean;
  exercises: {
    exerciseId: string;
    supersetId?: string; // Add superset support
    sets: Array<{
      weight?: number;
      reps?: number;
      time?: number;
      distance?: number;
      rpe?: number;
      difficulty?: DifficultyCategory;
      notes?: string;
    }>;
  }[];
  supersets?: SupersetGroup[]; // Add superset metadata
}

export interface SupersetGroup {
  id: string;
  name?: string;
  exerciseIds: string[];
  order: number;
}

export type DifficultyCategory = 'warmUp' | 'easy' | 'moderate' | 'hard' | 'failure' | 'dropSet';

/**
 * Unified exercise log supporting all training types.
 * Single interface for both strength & activity exercises.
 */
export interface UnifiedExerciseLog {
  // Base identifiers
  id: string;
  userId: string;
  
  // Exercise identity
  exerciseName: string;
  exerciseId?: string; // Reference to Exercise master record
  trainingType: TrainingType;
  
  // Sets/sessions performed
  sets: ExerciseSet[];
  
  // Metadata
  timestamp: Date;
  notes?: string;
  
  // Legacy fields for backward compatibility
  activityType?: string; // Maps to trainingType
  exerciseType?: string; // Maps to trainingType
  deviceId?: string;
  
  // UI state (optional, for edit tracking)
  isEditing?: boolean;
  hasUnsavedChanges?: boolean;
}

/**
 * Input type for creating logs (form data before persistence)
 */
export interface UnifiedExerciseLogInput {
  exerciseName: string;
  exerciseId?: string;
  trainingType: TrainingType;
  sets: Omit<ExerciseSet, 'timestamp'>[];
  notes?: string;
}

/**
 * Daily session summary (aggregated view)
 */
export interface DailySessionSummary {
  date: Date;
  userId: string;
  exercises: UnifiedExerciseLog[];
  
  // Summary metrics per training type
  summaryByType: {
    [key in TrainingType]?: TrainingTypeSummary;
  };
  
  totalDuration?: number; // minutes
  totalDistance?: number; // km
  totalVolume?: number; // kg (strength only)
  totalCalories?: number;
}

export interface TrainingTypeSummary {
  count: number;
  totalVolume?: number; // strength
  totalDuration?: number; // endurance/flexibility
  totalDistance?: number; // endurance
  avgRPE?: number;
  totalCalories?: number; // cardio
}
