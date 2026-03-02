import { describe, it, expect } from '@jest/globals';
import { jest } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import type { ExerciseSet } from '@/types/sets';
import {
  calculateSummary,
  calculateVolume,
  determineTrend,
  type ExerciseHistoryEntry,
} from '@/hooks/useExerciseHistory';

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

describe('useExerciseHistory helpers', () => {
  it('formats resistance summary and volume accurately', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 },
      { weight: 62.5, reps: 8 },
      { weight: 62.5, reps: 8 },
    ];

    expect(calculateSummary(sets, ActivityType.RESISTANCE)).toBe('3×10 @ 60kg');
    expect(calculateVolume(sets, ActivityType.RESISTANCE)).toBe(1600);
  });

  it('normalizes legacy endurance units in summary', () => {
    const sets: ExerciseSet[] = [
      { weight: 0, reps: 0, duration: 60, distance: 10 },
    ];

    expect(calculateSummary(sets, ActivityType.ENDURANCE)).toBe('60m, 10.0km');
    expect(calculateVolume(sets, ActivityType.ENDURANCE)).toBeUndefined();
  });

  it('prefers distance trend for non-resistance history', () => {
    const latest: ExerciseHistoryEntry = {
      id: 'a',
      exerciseName: 'Run',
      sets: [{ weight: 0, reps: 0, duration: 2100, distance: 5200 }],
      timestamp: new Date('2026-02-10T10:00:00Z'),
      summary: '35m, 5.2km',
      activityType: ActivityType.ENDURANCE,
      totalDuration: 2100,
      totalDistance: 5200,
    };

    const previous: ExerciseHistoryEntry = {
      id: 'b',
      exerciseName: 'Run',
      sets: [{ weight: 0, reps: 0, duration: 1980, distance: 5000 }],
      timestamp: new Date('2026-02-03T10:00:00Z'),
      summary: '33m, 5.0km',
      activityType: ActivityType.ENDURANCE,
      totalDuration: 1980,
      totalDistance: 5000,
    };

    const trend = determineTrend([latest, previous]);
    expect(trend.trend).toBe('up');
    expect(trend.details).toContain('distance');
  });

  it('returns none trend when insufficient history exists', () => {
    const entry: ExerciseHistoryEntry = {
      id: 'single',
      exerciseName: 'Squat',
      sets: [{ weight: 100, reps: 5 }],
      timestamp: new Date('2026-02-10T10:00:00Z'),
      summary: '1×5 @ 100kg',
      activityType: ActivityType.RESISTANCE,
      totalVolume: 500,
    };

    expect(determineTrend([entry])).toEqual({ trend: 'none' });
  });
});
