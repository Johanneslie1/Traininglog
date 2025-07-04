import { DifficultyCategory } from './difficulty';

export interface ExerciseSet {
  weight: number;
  reps: number;
  difficulty: DifficultyCategory;
  rpe?: string;
  comment?: string;
}
