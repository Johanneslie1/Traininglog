export type DifficultyCategory = 'WARMUP' | 'EASY' | 'MODERATE' | 'HARD';

export interface ExerciseSet {
  reps: number;
  weight: number;
  difficulty?: DifficultyCategory;
  rpe?: number;
}

export interface BaseExerciseLog {
  id?: string;
  exerciseName: string;
  sets: ExerciseSet[];
  timestamp: Date | string;
  deviceId?: string;
  userId?: string;
}

export type StoredExerciseLog = Required<BaseExerciseLog>;

export type NewExerciseLog = Omit<BaseExerciseLog, 'id'> & {
  id?: string;
};

export type ExportableExerciseLog = BaseExerciseLog;