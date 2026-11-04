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

  it('leaves the weight off when every set is bodyweight', () => {
    expect(
      buildResistanceSummary([
        { weight: 0, reps: 10, difficulty: DifficultyCategory.NORMAL },
        { weight: 0, reps: 10, difficulty: DifficultyCategory.NORMAL },
        { weight: 0, reps: 10, difficulty: DifficultyCategory.NORMAL },
      ])
    ).toBe('3 × 10');
  });

  it('keeps a zero in the range when a bodyweight set is mixed with a loaded set', () => {
    expect(
      buildResistanceSummary([
        { weight: 0, reps: 10, difficulty: DifficultyCategory.NORMAL },
        { weight: 20, reps: 8, difficulty: DifficultyCategory.NORMAL },
      ])
    ).toBe('2 × 8–10 · 0–20 kg');
  });

  it('summarizes loaded carries by time instead of zero reps', () => {
    expect(
      buildResistanceSummary([
        { weight: 18, reps: 0, duration: 30 },
        { weight: 18, reps: 0, duration: 45 },
      ])
    ).toBe('2 × 30s–45s · 18 kg');
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
