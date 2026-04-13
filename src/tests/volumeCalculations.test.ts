import { describe, it, expect } from '@jest/globals';
import {
  calculateSetVolume,
  calculateTotalVolume,
  calculateAverageWeight,
  calculateAverageReps,
  findBestVolumeSet,
  findHeaviestSet,
  calculateImprovement,
  estimate1RM,
} from '@/utils/volumeCalculations';
import type { ExerciseSet } from '@/types/sets';

describe('calculateSetVolume', () => {
  it('multiplies weight by reps', () => {
    expect(calculateSetVolume({ weight: 100, reps: 5 })).toBe(500);
  });

  it('returns 0 when weight is 0', () => {
    expect(calculateSetVolume({ weight: 0, reps: 10 })).toBe(0);
  });

  it('returns 0 when reps is 0', () => {
    expect(calculateSetVolume({ weight: 80, reps: 0 })).toBe(0);
  });
});

describe('calculateTotalVolume', () => {
  it('sums volume across all sets', () => {
    const sets: ExerciseSet[] = [
      { weight: 100, reps: 5 }, // 500
      { weight: 100, reps: 5 }, // 500
      { weight: 90, reps: 5 },  // 450
    ];
    expect(calculateTotalVolume(sets)).toBe(1450);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });

  it('ignores sets with no numeric data', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 }, // 600
      { weight: 0, reps: 0 },   // 0
    ];
    expect(calculateTotalVolume(sets)).toBe(600);
  });
});

describe('calculateAverageWeight', () => {
  it('averages only sets with weight > 0', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 },
      { weight: 80, reps: 8 },
      { weight: 0, reps: 5 }, // excluded
    ];
    expect(calculateAverageWeight(sets)).toBe(70);
  });

  it('returns 0 when all sets have zero weight', () => {
    expect(calculateAverageWeight([{ weight: 0, reps: 5 }])).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAverageWeight([])).toBe(0);
  });
});

describe('calculateAverageReps', () => {
  it('averages only sets with reps > 0', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 },
      { weight: 60, reps: 8 },
      { weight: 60, reps: 0 }, // excluded
    ];
    expect(calculateAverageReps(sets)).toBe(9);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAverageReps([])).toBe(0);
  });
});

describe('findBestVolumeSet', () => {
  it('returns the set with highest weight × reps', () => {
    const sets: ExerciseSet[] = [
      { weight: 100, reps: 5 }, // 500
      { weight: 80, reps: 8 },  // 640 ← best
      { weight: 60, reps: 10 }, // 600
    ];
    expect(findBestVolumeSet(sets)).toEqual({ weight: 80, reps: 8 });
  });

  it('returns null for empty array', () => {
    expect(findBestVolumeSet([])).toBeNull();
  });
});

describe('findHeaviestSet', () => {
  it('returns the set with highest weight', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 },
      { weight: 100, reps: 3 }, // ← heaviest
      { weight: 80, reps: 5 },
    ];
    expect(findHeaviestSet(sets)).toEqual({ weight: 100, reps: 3 });
  });

  it('returns null for empty array', () => {
    expect(findHeaviestSet([])).toBeNull();
  });
});

describe('calculateImprovement', () => {
  it('returns positive percentage for increase', () => {
    expect(calculateImprovement(110, 100)).toBe(10);
  });

  it('returns negative percentage for decrease', () => {
    expect(calculateImprovement(90, 100)).toBe(-10);
  });

  it('returns 0 when previous value is 0', () => {
    expect(calculateImprovement(100, 0)).toBe(0);
  });

  it('returns 0 for no change', () => {
    expect(calculateImprovement(100, 100)).toBe(0);
  });
});

describe('estimate1RM', () => {
  it('returns the lifted weight for 1 rep', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('estimates 1RM higher than lifted weight for multiple reps', () => {
    const result = estimate1RM(100, 5);
    expect(result).toBeGreaterThan(100);
  });

  it('estimates higher 1RM for same weight with more reps', () => {
    const rm5 = estimate1RM(100, 5);
    const rm10 = estimate1RM(100, 10);
    expect(rm10).toBeGreaterThan(rm5);
  });
});
