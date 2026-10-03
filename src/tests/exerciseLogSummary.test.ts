import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '../types/activityTypes';
import { DifficultyCategory } from '../types/difficulty';
import {
  buildActivitySummary,
  buildExerciseLogSummary,
  buildResistanceSummary,
} from '../utils/exerciseLogSummary';

describe('exerciseLogSummary', () => {
  it('summarizes resistance sets with a weight range', () => {
    expect(
      buildResistanceSummary([
        { weight: 80, reps: 5, difficulty: DifficultyCategory.NORMAL },
        { weight: 85, reps: 5, difficulty: DifficultyCategory.NORMAL },
        { weight: 85, reps: 4, difficulty: DifficultyCategory.HARD },
        { weight: 85, reps: 4, difficulty: DifficultyCategory.HARD },
      ])
    ).toBe('4 × 4–5 · 80–85 kg');
  });

  it('summarizes activity sets with reps and best time', () => {
    expect(
      buildActivitySummary(
        [
          { weight: 0, reps: 1, difficulty: DifficultyCategory.NORMAL, duration: 1.72 },
          { weight: 0, reps: 1, difficulty: DifficultyCategory.NORMAL, duration: 1.68 },
        ],
        ActivityType.SPEED_AGILITY
      )
    ).toContain('2 reps');
  });

  it('routes resistance vs activity through buildExerciseLogSummary', () => {
    expect(
      buildExerciseLogSummary({
        isNonResistance: false,
        sets: [{ weight: 70, reps: 8, difficulty: DifficultyCategory.NORMAL }],
      })
    ).toBe('1 × 8 · 70 kg');
  });
});
