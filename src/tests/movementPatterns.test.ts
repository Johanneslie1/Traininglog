import { describe, expect, it } from '@jest/globals';
import { inferMovementPatterns } from '@/data/movementPatterns';

describe('inferMovementPatterns', () => {
  it('classifies the core S&C pattern list', () => {
    expect(inferMovementPatterns({ name: 'Back Squat', activityType: 'resistance' })).toEqual({
      primary: 'squat',
      secondary: '',
      laterality: 'bilateral',
    });
    expect(inferMovementPatterns({ name: 'Romanian Deadlift', activityType: 'resistance' }).primary).toBe('hinge');
    expect(inferMovementPatterns({ name: 'Bench Press', activityType: 'resistance' }).primary).toBe('horizontal_push');
    expect(inferMovementPatterns({ name: 'Overhead Press', activityType: 'resistance' }).primary).toBe('vertical_push');
    expect(inferMovementPatterns({ name: 'Barbell Row', activityType: 'resistance' }).primary).toBe('horizontal_pull');
    expect(inferMovementPatterns({ name: 'Pull-Up', activityType: 'resistance' }).primary).toBe('vertical_pull');
    expect(inferMovementPatterns({ name: 'Farmer Carry', activityType: 'resistance' }).primary).toBe('carry');
    expect(inferMovementPatterns({ name: 'Cable Woodchop', activityType: 'resistance' }).primary).toBe('rotation');
    expect(inferMovementPatterns({ name: 'Pallof Press', activityType: 'resistance' }).primary).toBe('anti_rotation');
    expect(inferMovementPatterns({ name: 'Dead Bug', activityType: 'resistance' }).primary).toBe('anti_extension');
    expect(inferMovementPatterns({ name: 'Front Plank', activityType: 'resistance' }).primary).toBe('anti_extension');
    expect(inferMovementPatterns({ name: 'Side Plank', activityType: 'resistance' }).primary).toBe('anti_lateral_flexion');
    expect(inferMovementPatterns({ name: 'Turkish Get-Up', activityType: 'resistance' }).primary).toBe('ground_work');
  });

  it('uses squat plus unilateral lower body for split squats and lunges', () => {
    expect(inferMovementPatterns({ name: 'Bulgarian Split Squat', activityType: 'resistance' })).toEqual({
      primary: 'squat',
      secondary: 'unilateral_lower_body',
      laterality: 'unilateral',
    });
    expect(inferMovementPatterns({ name: 'Walking Lunge', activityType: 'resistance' }).secondary).toBe(
      'unilateral_lower_body'
    );
  });

  it('maps a clearly patterned speed/agility name and leaves endurance empty', () => {
    expect(inferMovementPatterns({ name: 'Box Jump', activityType: 'speedAgility' }).primary).toBe('squat');
    expect(inferMovementPatterns({ name: 'Easy Run', activityType: 'endurance' })).toEqual({
      primary: '',
      secondary: '',
      laterality: 'unknown',
    });
  });

  it('prefers stored values over name inference', () => {
    expect(
      inferMovementPatterns({
        name: 'Bench Press',
        activityType: 'resistance',
        primaryMovementPattern: 'vertical_push',
        secondaryMovementPattern: 'anti_rotation',
        laterality: 'unilateral',
      })
    ).toEqual({
      primary: 'vertical_push',
      secondary: 'anti_rotation',
      laterality: 'unilateral',
    });
  });

  it('does not crash on unknown names', () => {
    expect(inferMovementPatterns({ name: 'Mystery Curl', activityType: 'resistance' })).toEqual({
      primary: '',
      secondary: '',
      laterality: 'unknown',
    });
  });
});
