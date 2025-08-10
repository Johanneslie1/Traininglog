import { ActivityType } from './activityTypes';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type?: 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'plyometrics' | 'endurance' | 'teamSports' | 'speedAgility' | 'other';
  activityType?: ActivityType;
  category: string; // More flexible category system
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // Core muscle/target areas
  primaryMuscles?: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  targetAreas?: string[]; // For non-resistance exercises
  
  // Equipment and setup
  equipment?: string[];
  environment?: string;
  space?: string;
  setup?: string[];
  
  // Instructions and guidance
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  
  // Metrics tracking
  primaryMetrics?: string[];
  optionalMetrics?: string[];
  defaultUnit?: 'kg' | 'lbs' | 'time' | 'distance' | 'reps';
  metrics?: {
    trackWeight?: boolean;
    trackReps?: boolean;
    trackTime?: boolean;
    trackDistance?: boolean;
    trackRPE?: boolean;
    trackDuration?: boolean;
    trackHeight?: boolean;
  };
  
  // Activity-specific fields
  skills?: string[]; // For sports and skill-based activities
  teamBased?: boolean; // For sports
  sportType?: string;
  drillType?: string; // For speed & agility
  
  // Classification and discovery
  tags?: string[];
  isDefault?: boolean;
  customExercise?: boolean; // If true, this exercise was created by a user
  userId?: string; // Only set if customExercise is true
  createdBy?: string;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'core'
  | 'traps'
  | 'lats'
  | 'lower_back'
  | 'full_body'; // Added full_body as a valid muscle group

export interface ExerciseFilter {
  type?: Exercise['type'][];
  category?: Exercise['category'][];
  muscles?: MuscleGroup[];
  equipment?: string[];
  searchText?: string;
}



import { ExerciseSet } from './sets';

/** A logged exercise entry with sets performed */
export interface ExerciseLog {
  /** Unique identifier for the logged exercise */
  id: string;
  /** Name of the exercise performed */
  exerciseName: string;
  /** Array of sets performed */
  sets: ExerciseSet[];
  /** When the exercise was performed */
  timestamp: Date;
  /** Device ID for syncing */
  deviceId?: string;
  /** User ID who owns this exercise log */
  userId?: string;
  /** Type of exercise for training template compatibility */
  exerciseType?: string;
}

export type ExerciseType = Exercise['type'];
export type ExerciseCategory = Exercise['category'];
export type UnitType = Exercise['defaultUnit'];

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'medium',
  HARD = 'hard'
}
