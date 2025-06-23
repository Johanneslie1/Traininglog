import { User } from './user'; // Adjust the import path as necessary

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

// Program management interfaces
export interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  order: number;
  // Additional fields for program-specific exercise data
  suggestedReps?: number;
  suggestedWeight?: number;
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  exercises: ProgramExercise[];
  createdAt: Date;
  lastModified: Date;
  deviceId: string;
}

export type DifficultyCategory = 'easy' | 'moderate' | 'hard' | 'very hard' | 'max effort';

/** Represents a set of an exercise with reps and optional weight */
export interface ExerciseSet {
  /** Number of repetitions performed */
  reps: number;
  /** Weight used in kg (optional for bodyweight exercises) */
  weight: number;
  /** Rating of Perceived Exertion (1-10) */
  rpe?: string;
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
  timestamp: Date | number;
  /** Device ID for syncing */
  deviceId?: string;
  /** User ID who owns this exercise log */
  userId?: string;
}
