import { describe, it, expect } from '@jest/globals';
import { jest } from '@jest/globals';
import { format } from 'date-fns';
import { ActivityType } from '@/types/activityTypes';
import { DifficultyCategory } from '@/types/difficulty';
import type { ExerciseSet } from '@/types/sets';
import {
  calculateSummary,
  calculateVolume,
  determineTrend,
  getWorkingResistanceSets,
  findHeaviestWorkingSet,
  computeLastHighlight,
  computeBestWeightSet,
  formatResistanceHighlight,
  normalizeHistorySets,
  parseDisplayDate,
  parseSortTimestamp,
  type ExerciseHistoryEntry,
} from '@/hooks/useExerciseHistory';

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

describe('useExerciseHistory helpers', () => {
  it('formats resistance summary from heaviest working set', () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 10 },
      { weight: 62.5, reps: 8 },
      { weight: 62.5, reps: 8 },
    ];

    expect(calculateSummary(sets, ActivityType.RESISTANCE)).toBe('62.5kg × 8');
    expect(calculateVolume(sets, ActivityType.RESISTANCE)).toBe(1600);
  });

  it('excludes warmup and drop sets from working sets and heaviest pick', () => {
    const sets: ExerciseSet[] = [
      { weight: 40, reps: 10, difficulty: DifficultyCategory.WARMUP },
      { weight: 80, reps: 5, difficulty: DifficultyCategory.HARD },
      { weight: 75, reps: 8, difficulty: DifficultyCategory.NORMAL },
      { weight: 60, reps: 12, difficulty: DifficultyCategory.DROP },
    ];

    expect(getWorkingResistanceSets(sets)).toHaveLength(2);
    expect(findHeaviestWorkingSet(sets)).toEqual(
      expect.objectContaining({ weight: 80, reps: 5 })
    );
    expect(calculateSummary(sets, ActivityType.RESISTANCE)).toBe('80kg × 5');
  });

  it('skips zero-weight sessions when picking last best set', () => {
    const history: ExerciseHistoryEntry[] = [
      {
        id: 'zero',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
        ],
        timestamp: new Date('2026-08-08T10:00:00Z'),
        summary: '3 sets, 30 reps',
        activityType: ActivityType.RESISTANCE,
      },
      {
        id: 'weighted',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 100, reps: 5, rpe: 8, difficulty: DifficultyCategory.HARD },
          { weight: 80, reps: 8, difficulty: DifficultyCategory.DROP },
        ],
        timestamp: new Date('2026-08-01T10:00:00Z'),
        summary: '100kg × 5',
        activityType: ActivityType.RESISTANCE,
        totalVolume: 1140,
      },
    ];

    expect(computeLastHighlight(history)).toEqual(
      expect.objectContaining({ weight: 100, reps: 5, rpe: 8 })
    );
    expect(format(computeLastHighlight(history)!.timestamp, 'MMM d')).toBe('Aug 1');
  });

  it('skips last sessions far below PR when choosing reference', () => {
    const history: ExerciseHistoryEntry[] = [
      {
        id: 'deload',
        exerciseName: 'Bench Press',
        sets: [{ weight: 40, reps: 10, difficulty: DifficultyCategory.EASY }],
        timestamp: new Date('2026-08-05T10:00:00Z'),
        displayDate: new Date(2026, 7, 5),
        summary: '40kg × 10',
        activityType: ActivityType.RESISTANCE,
      },
      {
        id: 'real',
        exerciseName: 'Bench Press',
        sets: [{ weight: 90, reps: 5, rpe: 8, difficulty: DifficultyCategory.HARD }],
        timestamp: new Date('2026-08-01T10:00:00Z'),
        displayDate: new Date(2026, 7, 1),
        summary: '90kg × 5',
        activityType: ActivityType.RESISTANCE,
      },
      {
        id: 'pr',
        exerciseName: 'Bench Press',
        sets: [{ weight: 100, reps: 5 }],
        timestamp: new Date('2026-02-26T10:00:00Z'),
        displayDate: new Date(2026, 1, 26),
        summary: '100kg × 5',
        activityType: ActivityType.RESISTANCE,
      },
    ];

    // 40kg is < 70% of 100kg PR → skip; use 90kg session
    expect(computeLastHighlight(history, 100)).toEqual(
      expect.objectContaining({ weight: 90, reps: 5, rpe: 8 })
    );
  });

  it('normalizes string weight/reps/rpe from legacy logs', () => {
    const sets = normalizeHistorySets([
      { weight: '100', reps: '5', rpe: '8.5' },
    ]);
    expect(sets[0]).toEqual(expect.objectContaining({ weight: 100, reps: 5, rpe: 8.5 }));
    expect(findHeaviestWorkingSet(sets)).toEqual(
      expect.objectContaining({ weight: 100, reps: 5 })
    );
  });

  it('uses sessionDateKey for display but sort timestamp for ordering', () => {
    const data = {
      sessionDateKey: '2026-07-15',
      timestamp: { toDate: () => new Date('2026-08-08T10:00:00Z') },
    };
    expect(format(parseDisplayDate(data), 'MMM d')).toBe('Jul 15');
    expect(format(parseSortTimestamp(data), 'MMM d')).toBe('Aug 8');
  });

  it('picks PR as highest weight then highest reps at that weight', () => {
    const entries: ExerciseHistoryEntry[] = [
      {
        id: 'a',
        exerciseName: 'Squat',
        sets: [{ weight: 140, reps: 2 }],
        timestamp: new Date('2026-01-01T10:00:00Z'),
        summary: '140kg × 2',
        activityType: ActivityType.RESISTANCE,
      },
      {
        id: 'b',
        exerciseName: 'Squat',
        sets: [{ weight: 140, reps: 4 }],
        timestamp: new Date('2026-02-01T10:00:00Z'),
        summary: '140kg × 4',
        activityType: ActivityType.RESISTANCE,
      },
      {
        id: 'c',
        exerciseName: 'Squat',
        sets: [{ weight: 130, reps: 8 }],
        timestamp: new Date('2026-03-01T10:00:00Z'),
        summary: '130kg × 8',
        activityType: ActivityType.RESISTANCE,
      },
    ];

    expect(computeBestWeightSet(entries)).toEqual(
      expect.objectContaining({ weight: 140, reps: 4 })
    );
  });

  it('prefers more reps when weights tie for heaviest', () => {
    const sets: ExerciseSet[] = [
      { weight: 100, reps: 3 },
      { weight: 100, reps: 5 },
      { weight: 90, reps: 8 },
    ];

    expect(findHeaviestWorkingSet(sets)).toEqual(
      expect.objectContaining({ weight: 100, reps: 5 })
    );
  });

  it('computes last highlight with RPE when present', () => {
    const history: ExerciseHistoryEntry[] = [
      {
        id: 'latest',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 60, reps: 8, difficulty: DifficultyCategory.WARMUP },
          { weight: 100, reps: 5, rpe: 8, difficulty: DifficultyCategory.HARD },
        ],
        timestamp: new Date('2026-02-10T10:00:00Z'),
        summary: '100kg × 5',
        activityType: ActivityType.RESISTANCE,
        totalVolume: 500,
      },
    ];

    const highlight = computeLastHighlight(history);
    expect(highlight).toEqual(
      expect.objectContaining({
        weight: 100,
        reps: 5,
        rpe: 8,
        setCount: 1,
      })
    );
    expect(formatResistanceHighlight(highlight!)).toBe('100kg × 5 @ RPE 8');
  });

  it('falls back to difficulty in highlight format when RPE is missing', () => {
    expect(
      formatResistanceHighlight({
        weight: 80,
        reps: 5,
        difficulty: DifficultyCategory.HARD,
        timestamp: new Date(),
      })
    ).toBe('80kg × 5 @ Hard');
  });

  it('computes best weight across sessions, not only recent three display entries', () => {
    const olderBest: ExerciseHistoryEntry = {
      id: 'old',
      exerciseName: 'Squat',
      sets: [{ weight: 140, reps: 3, difficulty: DifficultyCategory.HARD }],
      timestamp: new Date('2025-11-01T10:00:00Z'),
      summary: '140kg × 3',
      activityType: ActivityType.RESISTANCE,
      totalVolume: 420,
    };
    const recent: ExerciseHistoryEntry = {
      id: 'new',
      exerciseName: 'Squat',
      sets: [{ weight: 120, reps: 5, difficulty: DifficultyCategory.NORMAL }],
      timestamp: new Date('2026-02-10T10:00:00Z'),
      summary: '120kg × 5',
      activityType: ActivityType.RESISTANCE,
      totalVolume: 600,
    };

    const best = computeBestWeightSet([recent, olderBest]);
    expect(best).toEqual(
      expect.objectContaining({ weight: 140, reps: 3 })
    );

    const last = computeLastHighlight([recent, olderBest], best?.weight);
    expect(last).toEqual(
      expect.objectContaining({ weight: 120, reps: 5 })
    );
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
      summary: '100kg × 5',
      activityType: ActivityType.RESISTANCE,
      totalVolume: 500,
    };

    expect(determineTrend([entry])).toEqual({ trend: 'none' });
  });
});
