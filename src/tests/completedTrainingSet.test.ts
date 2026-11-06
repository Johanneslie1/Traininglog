import { describe, expect, it } from '@jest/globals';
import { isCompletedTrainingSet } from '@/utils/completedTrainingSet';

describe('completed training sets', () => {
  it('ignores an empty set and keeps a set with a saved number', () => {
    expect(isCompletedTrainingSet({})).toBe(false);
    expect(isCompletedTrainingSet({ reps: 0, weight: 0 })).toBe(false);
    expect(isCompletedTrainingSet({ duration: 30 })).toBe(true);
  });
});
