export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'bodyweight';
  category: 'compound' | 'isolation' | 'olympic' | 'cardio' | 'stretching';
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
  | 'lower_back';

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
  exerciseId: string;
  exerciseName: string;
  sets: number;
  order: number;
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
