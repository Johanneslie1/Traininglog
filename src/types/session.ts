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
