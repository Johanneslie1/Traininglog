import { describe, it, expect, jest } from '@jest/globals';
import { AnalyticsService } from '@/services/analyticsService';
import type { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { ActivityType } from '@/types/activityTypes';
import { IntensityLevel } from '@/types/analytics';
import type { TrainingFrequencyData } from '@/types/analytics';

jest.mock('@/services/firebase/config', () => ({ db: {}, auth: {} }));
jest.mock('@/utils/unifiedExerciseUtils', () => ({ getAllExercisesByDate: jest.fn() }));
jest.mock('@/utils/prDetection', () => ({ getAllPRsByExercise: jest.fn(() => []) }));
jest.mock('@/utils/chartDataFormatters', () => ({ MUSCLE_COLORS: {} }));

// Helper to build a minimal UnifiedExerciseData
const makeExercise = (overrides: Partial<UnifiedExerciseData> = {}): UnifiedExerciseData => ({
  id: 'test-id',
  exerciseName: 'Squat',
  timestamp: new Date('2026-03-01T10:00:00Z'),
  userId: 'user1',
  sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }],
  activityType: ActivityType.RESISTANCE,
  ...overrides,
});

// Helper to build TrainingFrequencyData rows
const makeFrequency = (
  entries: Array<{ date: string; worked: boolean }>
): TrainingFrequencyData[] =>
  entries.map(({ date, worked }) => ({
    date,
    workoutCount: worked ? 1 : 0,
    totalVolume: worked ? 1000 : 0,
    totalSets: worked ? 10 : 0,
    intensity: worked ? IntensityLevel.MODERATE : IntensityLevel.REST,
    exercises: [],
  }));

// ──────────────────────────────────────────────────────────────────────────────
describe('AnalyticsService.calculateExerciseVolume', () => {
  it('sums weight × reps across all sets', () => {
    const ex = makeExercise({ sets: [{ weight: 100, reps: 5 }, { weight: 80, reps: 8 }] });
    expect(AnalyticsService.calculateExerciseVolume(ex)).toBe(1140);
  });

  it('returns 0 for an exercise with no sets', () => {
    expect(AnalyticsService.calculateExerciseVolume(makeExercise({ sets: [] }))).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('AnalyticsService.calculateDailyVolumes – groupBy:day', () => {
  it('groups exercises from the same day correctly', () => {
    const exercises: UnifiedExerciseData[] = [
      makeExercise({
        timestamp: new Date('2026-03-01T08:00:00Z'),
        exerciseName: 'Squat',
        sets: [{ weight: 100, reps: 5 }], // 500
      }),
      makeExercise({
        timestamp: new Date('2026-03-01T09:00:00Z'),
        exerciseName: 'Bench',
        sets: [{ weight: 80, reps: 8 }], // 640
      }),
      makeExercise({
        timestamp: new Date('2026-03-02T08:00:00Z'),
        exerciseName: 'Deadlift',
        sets: [{ weight: 140, reps: 3 }], // 420
      }),
    ];

    const result = AnalyticsService.calculateDailyVolumes(exercises, 'day');
    expect(result).toHaveLength(2);

    const day1 = result.find((p) => p.date === '2026-03-01');
    const day2 = result.find((p) => p.date === '2026-03-02');

    expect(day1?.volume).toBe(1140);
    expect(day2?.volume).toBe(420);
  });

  it('excludes warmup exercises', () => {
    const exercises: UnifiedExerciseData[] = [
      makeExercise({ sets: [{ weight: 100, reps: 5 }] }),            // 500
      makeExercise({ sets: [{ weight: 50, reps: 10 }], isWarmup: true }), // excluded
    ];

    const result = AnalyticsService.calculateDailyVolumes(exercises, 'day');
    expect(result[0].volume).toBe(500);
  });

  it('returns empty array when given no exercises', () => {
    expect(AnalyticsService.calculateDailyVolumes([], 'day')).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('AnalyticsService.comparePeriods', () => {
  it('calculates positive volume change correctly', () => {
    const current = [makeExercise({ sets: [{ weight: 110, reps: 10 }] })]; // 1100
    const previous = [makeExercise({ sets: [{ weight: 100, reps: 10 }] })]; // 1000
    const result = AnalyticsService.comparePeriods(current, previous);
    expect(result.changes.volumeChange).toBe(10);
  });

  it('calculates negative volume change correctly', () => {
    const current = [makeExercise({ sets: [{ weight: 90, reps: 10 }] })];  // 900
    const previous = [makeExercise({ sets: [{ weight: 100, reps: 10 }] })]; // 1000
    const result = AnalyticsService.comparePeriods(current, previous);
    expect(result.changes.volumeChange).toBe(-10);
  });

  it('returns 0 changes when previous period is empty', () => {
    const result = AnalyticsService.comparePeriods([makeExercise()], []);
    expect(result.changes.volumeChange).toBe(0);
    expect(result.changes.workoutsChange).toBe(0);
    expect(result.changes.exercisesChange).toBe(0);
  });

  it('excludes warmups from both periods', () => {
    const current = [
      makeExercise({ sets: [{ weight: 100, reps: 10 }] }),
      makeExercise({ sets: [{ weight: 50, reps: 10 }], isWarmup: true }), // excluded
    ];
    const previous = [makeExercise({ sets: [{ weight: 100, reps: 10 }] })];
    const result = AnalyticsService.comparePeriods(current, previous);
    expect(result.changes.volumeChange).toBe(0); // 1000 vs 1000 after warmup stripped
  });

  it('exposes raw totals in current and previous objects', () => {
    const current = [makeExercise({ sets: [{ weight: 100, reps: 5 }] })]; // 500
    const previous: UnifiedExerciseData[] = [];
    const result = AnalyticsService.comparePeriods(current, previous);
    expect(result.current.volume).toBe(500);
    expect(result.previous.volume).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('AnalyticsService.calculateStreak', () => {
  it('returns current streak for consecutive recent sessions', () => {
    const data = makeFrequency([
      { date: '2026-03-28', worked: false },
      { date: '2026-03-29', worked: true },
      { date: '2026-03-30', worked: true },
      { date: '2026-03-31', worked: true },
    ]);
    const streak = AnalyticsService.calculateStreak(data);
    expect(streak.currentStreak).toBe(3);
  });

  it('returns 0 current streak when most recent day has no session', () => {
    const data = makeFrequency([
      { date: '2026-03-28', worked: true },
      { date: '2026-03-29', worked: true },
      { date: '2026-03-30', worked: false }, // most recent has no session
    ]);
    const streak = AnalyticsService.calculateStreak(data);
    expect(streak.currentStreak).toBe(0);
  });

  it('tracks longest streak independently of current streak', () => {
    const data = makeFrequency([
      { date: '2026-03-01', worked: true },
      { date: '2026-03-02', worked: true },
      { date: '2026-03-03', worked: true }, // longest run of 3
      { date: '2026-03-04', worked: false },
      { date: '2026-03-05', worked: true }, // current streak of 1
    ]);
    const streak = AnalyticsService.calculateStreak(data);
    expect(streak.longestStreak).toBe(3);
    expect(streak.currentStreak).toBe(1);
  });

  it('returns 0 for empty frequency data', () => {
    const streak = AnalyticsService.calculateStreak([]);
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
  });
});
