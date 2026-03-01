import { describe, expect, test } from '@jest/globals';
import { ActivityType } from '../types/activityTypes';
import { resolveActivityTypeFromExerciseLike } from '../utils/activityTypeResolver';

describe('resolveActivityTypeFromExerciseLike', () => {
  test('derives resistance from strength type when activityType is missing', () => {
    const resolved = resolveActivityTypeFromExerciseLike({ type: 'strength' });
    expect(resolved).toBe(ActivityType.RESISTANCE);
  });

  test('corrects explicit other when hints indicate resistance', () => {
    const resolved = resolveActivityTypeFromExerciseLike({
      activityType: ActivityType.OTHER,
      type: 'bodyweight',
    });

    expect(resolved).toBe(ActivityType.RESISTANCE);
  });

  test('keeps explicit non-other activity type', () => {
    const resolved = resolveActivityTypeFromExerciseLike({
      activityType: ActivityType.ENDURANCE,
      type: 'strength',
    });

    expect(resolved).toBe(ActivityType.ENDURANCE);
  });

  test('derives speed agility from drill metadata', () => {
    const resolved = resolveActivityTypeFromExerciseLike({
      drillType: 'acceleration',
    });

    expect(resolved).toBe(ActivityType.SPEED_AGILITY);
  });

  test('supports explicit fallback override', () => {
    const resolved = resolveActivityTypeFromExerciseLike({}, {
      fallback: ActivityType.RESISTANCE,
    });

    expect(resolved).toBe(ActivityType.RESISTANCE);
  });
});
