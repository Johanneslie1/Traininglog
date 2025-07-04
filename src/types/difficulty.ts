export enum DifficultyCategory {
  WARMUP = 'WARMUP',
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  DROP = 'DROP'
}

export const DIFFICULTY_RPE_MAP: Record<DifficultyCategory, { min: number; max: number }> = {
  [DifficultyCategory.WARMUP]: { min: 3, max: 4 },
  [DifficultyCategory.EASY]: { min: 5, max: 6 },
  [DifficultyCategory.NORMAL]: { min: 7, max: 8 },
  [DifficultyCategory.HARD]: { min: 9, max: 10 },
  [DifficultyCategory.DROP]: { min: 7, max: 9 }
};
