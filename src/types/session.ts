export interface Session {
  id: string;
  userId: string;
  date: string;
  notes?: string;
  completed: boolean;
  exercises: {
    exerciseId: string;
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
}

export type DifficultyCategory = 'warmUp' | 'easy' | 'moderate' | 'hard' | 'failure' | 'dropSet';
