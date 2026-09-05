import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import type { Exercise } from '@/types/exercise';
import {
  exerciseMatchesMovementPattern,
  resolveExerciseMovementPattern,
} from '@/utils/exerciseMovementPattern';

const squat: Exercise = {
  id: 'squat-1',
  name: 'Back Squat',
  description: 'Knee dominant squat',
  category: 'compound',
  type: 'strength',
  activityType: ActivityType.RESISTANCE,
  instructions: [],
};

const splitSquat: Exercise = {
  ...squat,
  id: 'split-1',
  name: 'Bulgarian Split Squat',
};

describe('exerciseMovementPattern', () => {
  it('resolves inferred primary patterns for catalog exercises', () => {
    expect(resolveExerciseMovementPattern(squat)).toBe('squat');
    expect(resolveExerciseMovementPattern(splitSquat)).toBe('squat');
  });

  it('matches primary or secondary pattern filters', () => {
    expect(exerciseMatchesMovementPattern(squat, '')).toBe(true);
    expect(exerciseMatchesMovementPattern(squat, 'squat')).toBe(true);
    expect(exerciseMatchesMovementPattern(squat, 'hinge')).toBe(false);
    expect(exerciseMatchesMovementPattern(splitSquat, 'unilateral_lower_body')).toBe(true);
  });

  it('prefers a stored movement pattern', () => {
    expect(
      resolveExerciseMovementPattern({
        ...squat,
        primaryMovementPattern: 'hinge',
      })
    ).toBe('hinge');
  });
});
