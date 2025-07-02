export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'bodyweight';
  category: 'compound' | 'isolation' | 'olympic' | 'cardio' | 'stretching' | 'power';
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment?: string[];
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  customExercise?: boolean; // If true, this exercise was created by a user
  userId?: string; // Only set if customExercise is true
  defaultUnit: 'kg' | 'lbs' | 'time' | 'distance' | 'reps';
  metrics: {
    trackWeight?: boolean;
    trackReps?: boolean;
    trackTime?: boolean;
    trackDistance?: boolean;
    trackRPE?: boolean;
  };
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

export enum DifficultyCategory {
  WARMUP = 'WARMUP',
  EASY = 'EASY',
  MODERATE = 'MODERATE',
  HARD = 'HARD'
}

/** Maps difficulty categories to RPE ranges */
export const DIFFICULTY_RPE_MAP: Record<DifficultyCategory, { min: number; max: number }> = {
  [DifficultyCategory.WARMUP]: { min: 3, max: 4 },
  [DifficultyCategory.EASY]: { min: 5, max: 6 },
  [DifficultyCategory.MODERATE]: { min: 7, max: 8 },
  [DifficultyCategory.HARD]: { min: 9, max: 10 }
};

/** Represents a set of an exercise with reps and optional weight */
export interface ExerciseSet {
  /** Number of repetitions performed */
  reps: number;
  /** Weight used in kg (optional for bodyweight exercises) */
  weight: number;
  /** Rating of Perceived Exertion (1-10) */
  rpe?: string;
  /** Optional comment for this set */
  comment?: string;
  /** Difficulty level of the set */
  difficulty?: DifficultyCategory;
}

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
}

export type ExerciseType = Exercise['type'];
export type ExerciseCategory = Exercise['category'];
export type UnitType = Exercise['defaultUnit'];

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'medium',
  HARD = 'hard'
}
