import { ActivityType } from './activityTypes';
import { Prescription } from './program';
import { SuggestedPrescriptionSet } from './sets';

// Training type enum for unified system
export enum TrainingType {
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  SPEED_AGILITY = 'speedAgility',
  FLEXIBILITY = 'flexibility',
  TEAM_SPORTS = 'teamSports',
  OTHER = 'other'
}

export interface MetricsConfig {
  trackWeight?: boolean;
  trackReps?: boolean;
  trackDuration?: boolean;
  trackDistance?: boolean;
  trackRPE?: boolean;
  trackHeartRate?: boolean;
  trackCalories?: boolean;
  trackHoldTime?: boolean;
  trackIntensity?: boolean;
  trackPace?: boolean;
  trackElevation?: boolean;
  trackPerformance?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  nameLower?: string;
  description: string;
  trainingType?: TrainingType; // NEW: unified training type
  type?: 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'plyometrics' | 'endurance' | 'teamSports' | 'speedAgility' | 'other' | 'speed_agility';
  activityType?: ActivityType;
  category: string; // More flexible category system
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  metricsConfig?: MetricsConfig; // NEW: metrics this exercise tracks
  
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
    trackSets?: boolean;
    trackTime?: boolean;
    trackDistance?: boolean;
    trackRPE?: boolean;
    trackDuration?: boolean;
    trackHeight?: boolean;
    trackPower?: boolean;
    trackIntensity?: boolean;
    trackIncline?: boolean;
    trackElevation?: boolean;
    trackFloors?: boolean;
  };
  
  // Intensity levels for exercises that support variable intensity
  intensityLevels?: string[];
  
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
  
  // Program prescription data (when exercise comes from a program)
  prescription?: Prescription; // Prescription from program
  instructionMode?: 'structured' | 'freeform'; // Instruction mode from program
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
}

export interface ExercisePrescriptionAssistantData {
  uiHint: string;
  suggestedPrescription: SuggestedPrescriptionSet[];
  progressionNote: string;
  warnings: string[];
  alternatives: string[];
  source?: 'llm' | 'fallback';
  generatedAt?: string;
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
  /** Activity type for non-resistance exercises */
  activityType?: string;
  /** Shared session assignment link (if exercise was imported from assigned session) */
  sharedSessionAssignmentId?: string;
  /** Shared session document id */
  sharedSessionId?: string;
  /** Exercise id inside shared session */
  sharedSessionExerciseId?: string;
  /** ISO date key (yyyy-mm-dd) used for assignment import dedupe */
  sharedSessionDateKey?: string;
  /** Marks that this imported exercise was actually logged/updated by athlete */
  sharedSessionExerciseCompleted?: boolean;
  /** Program prescription metadata for showing guide during later edits */
  prescription?: Prescription;
  /** Indicates whether guidance is structured or freeform */
  instructionMode?: 'structured' | 'freeform';
  /** Freeform coach instructions */
  instructions?: string;
  /** Assistant-generated suggestion payload for log editor */
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
}

export type ExerciseType = Exercise['type'];
export type ExerciseCategory = Exercise['category'];
export type UnitType = Exercise['defaultUnit'];

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'medium',
  HARD = 'hard'
}

