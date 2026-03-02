import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@/services/firebase/workouts', () => ({
  getUserWorkouts: jest.fn(async () => []),
}));

jest.mock('@/services/logAggregationService', () => ({
  getAggregatedExportLogs: jest.fn(async () => []),
}));

import { exportData, getExportPreview, serializeSetForExport } from '@/services/exportService';
import { ActivityType } from '@/types/activityTypes';

const mockedWorkouts = jest.requireMock('@/services/firebase/workouts') as {
  getUserWorkouts: any;
};
const mockedLogAggregationService = jest.requireMock('@/services/logAggregationService') as {
  getAggregatedExportLogs: any;
};

const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] ?? null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

describe('exportService serialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('serializes a non-resistance set with all ExerciseSet fields', () => {
    const logTimestamp = new Date('2026-03-01T10:00:00.000Z');
    const setTimestamp = new Date('2026-03-01T10:05:00.000Z');

    const row = serializeSetForExport(
      'user-1',
      {
        id: 'log-1',
        exerciseName: 'Hill Sprints',
        collectionType: 'activity',
        activityType: ActivityType.SPEED_AGILITY,
        timestamp: logTimestamp,
        supersetId: 'ss-1',
        supersetLabel: '1a',
        supersetName: 'Sprint Pair',
      },
      {
        weight: 0,
        reps: 8,
        duration: 15,
        distance: 50,
        height: 42,
        rpe: 8,
        notes: 'Felt sharp',
        drillMetric: 'cone-lap',
        restTime: 90,
        intensity: 7,
        heartRate: 162,
        calories: 35,
        comment: 'tailwind on final rep',
        timestamp: setTimestamp,
      },
      0
    );

    expect(row).toMatchObject({
      userId: 'user-1',
      exerciseLogId: 'log-1',
      exerciseName: 'Hill Sprints',
      activityType: ActivityType.SPEED_AGILITY,
      supersetId: 'ss-1',
      supersetLabel: '1a',
      supersetName: 'Sprint Pair',
      setNumber: 1,
      reps: 8,
      weight: 0,
      duration: 15,
      distance: 50,
      durationSec: 15,
      distanceMeters: 50,
      height: 42,
      rpe: 8,
      restTime: 90,
      restTimeSec: 90,
      notes: 'Felt sharp',
      drillMetric: 'cone-lap',
      intensity: 7,
      heartRate: 162,
      calories: 35,
      comment: 'tailwind on final rep',
    });

    expect(row.loggedTimestamp).toBe(logTimestamp.toISOString());
    expect(row.timestamp).toBe(setTimestamp.toISOString());
  });

  it('propagates persisted superset fields into exerciseLogs and sets export', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'ex-1',
        exerciseName: 'Bench Press',
        sets: [{ reps: 8, weight: 80 }],
        timestamp: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
        supersetId: 'ss-1',
        supersetLabel: '1a',
        supersetName: 'Press Pair',
        collectionType: 'exercise',
      },
    ]);

    const result = await exportData('user-1', {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
    });

    expect(result.exerciseLogs[0]).toMatchObject({
      exerciseLogId: 'ex-1',
      supersetId: 'ss-1',
      supersetLabel: '1a',
      supersetName: 'Press Pair',
    });

    expect(result.sets[0]).toMatchObject({
      exerciseLogId: 'ex-1',
      supersetId: 'ss-1',
      supersetLabel: '1a',
      supersetName: 'Press Pair',
    });
  });

  it('keeps export backward compatible when supersets are missing', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'ex-legacy',
        exerciseName: 'Squat',
        sets: [{ reps: 5, weight: 100 }],
        timestamp: new Date('2026-03-01T12:00:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
        collectionType: 'exercise',
      },
    ]);

    const result = await exportData('user-1', {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
    });

    expect(result.exerciseLogs[0].supersetLabel).toBe('');
    expect(result.exerciseLogs[0].supersetName).toBe('');
    expect(result.sets[0].supersetLabel).toBe('');
    expect(result.sets[0].supersetName).toBe('');
  });

  it('derives deterministic supersetId when only supersetLabel is present', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'ex-a',
        exerciseName: 'Bench Press',
        sets: [{ reps: 8, weight: 80 }],
        timestamp: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
        supersetLabel: '1a',
        collectionType: 'exercise',
      },
      {
        id: 'ex-b',
        exerciseName: 'Barbell Row',
        sets: [{ reps: 10, weight: 70 }],
        timestamp: new Date('2026-03-01T10:05:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
        supersetLabel: '1b',
        collectionType: 'exercise',
      },
    ]);

    const result = await exportData('user-1', {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
    });

    const logA = result.exerciseLogs.find((row) => row.exerciseLogId === 'ex-a');
    const logB = result.exerciseLogs.find((row) => row.exerciseLogId === 'ex-b');
    expect(logA?.supersetId).toBeTruthy();
    expect(logA?.supersetId).toBe(logB?.supersetId);
    expect(logA?.supersetName).toBe('Superset 1');

    const setA = result.sets.find((row) => row.exerciseLogId === 'ex-a');
    const setB = result.sets.find((row) => row.exerciseLogId === 'ex-b');
    expect(setA?.supersetId).toBe(logA?.supersetId);
    expect(setB?.supersetId).toBe(logB?.supersetId);
    expect(setA?.supersetLabel).toBe('1a');
    expect(setB?.supersetLabel).toBe('1b');
  });

  it('infers non-resistance activity type from set metrics when activityType is missing', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'legacy-endurance-1',
        exerciseName: 'Morning Run',
        sets: [
          {
            duration: 35,
            distance: 6.2,
            pace: '5:38',
            averageHeartRate: 149,
          },
        ],
        timestamp: new Date('2026-03-01T08:30:00.000Z'),
        userId: 'user-1',
        collectionType: 'local',
      },
    ]);

    const result = await exportData('user-1', {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
    });

    expect(result.exerciseLogs[0].type).toBe(ActivityType.ENDURANCE);
    expect(result.sets[0].activityType).toBe(ActivityType.ENDURANCE);
  });

  it('returns best-effort preview counts when sessions source fails', async () => {
    const startDate = new Date(2026, 1, 23, 0, 0, 0, 0);
    const endDate = new Date(2026, 2, 2, 23, 59, 59, 999);

    mockedWorkouts.getUserWorkouts.mockRejectedValue(new Error('session source unavailable'));
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'ex-1',
        exerciseName: 'Bench Press',
        sets: [
          { reps: 8, weight: 0 },
          { reps: 6, weight: 80 },
        ],
        timestamp: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
        activityType: ActivityType.RESISTANCE,
        collectionType: 'exercise',
      },
      {
        id: 'ac-1',
        exerciseName: 'Easy Run',
        sets: [{ duration: 30, distance: 5 }],
        timestamp: new Date('2026-03-01T12:00:00.000Z'),
        userId: 'user-1',
        activityType: ActivityType.ENDURANCE,
        collectionType: 'activity',
      },
    ]);

    const preview = await getExportPreview('user-1', startDate, endDate);

    expect(preview).toEqual({
      sessionCount: 0,
      exerciseCount: 2,
      setCount: 3,
    });

    expect(mockedLogAggregationService.getAggregatedExportLogs).toHaveBeenCalledWith('user-1', startDate, endDate);
  });

  it('counts zero-weight sets in export preview range', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'ex-zw',
        exerciseName: 'Technique Bench',
        sets: [
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 },
        ],
        timestamp: new Date('2026-02-25T09:00:00.000Z'),
        userId: 'user-1',
        activityType: ActivityType.RESISTANCE,
        collectionType: 'exercise',
      },
    ]);

    const preview = await getExportPreview('user-1');

    expect(preview.exerciseCount).toBe(1);
    expect(preview.setCount).toBe(2);
  });

  it('throws preview error when log aggregation fails', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockRejectedValue(new Error('source failure'));

    await expect(getExportPreview('user-1')).rejects.toThrow(
      'Failed to load export preview logs: Failed to export data: source failure'
    );
  });

  it('includes strength and local-source logs in unified export', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockResolvedValue([
      {
        id: 'strength-1',
        exerciseName: 'Front Squat',
        sets: [{ reps: 5, weight: 90 }],
        timestamp: new Date('2026-03-01T07:30:00.000Z'),
        userId: 'user-1',
        activityType: ActivityType.RESISTANCE,
        collectionType: 'strength',
      },
      {
        id: 'local-1',
        exerciseName: 'Evening Walk',
        sets: [{ duration: 40, distance: 3.2 }],
        timestamp: new Date('2026-03-01T18:00:00.000Z'),
        userId: 'user-1',
        activityType: ActivityType.ENDURANCE,
        collectionType: 'local',
      },
    ]);

    const result = await exportData('user-1', {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
    });

    expect(result.exerciseLogs).toHaveLength(2);
    expect(result.sets).toHaveLength(2);
    expect(result.exerciseLogs.map((row) => row.category)).toEqual(expect.arrayContaining(['strength', 'local']));
  });

  it('throws clear export error when any source fails in aggregator', async () => {
    mockedWorkouts.getUserWorkouts.mockResolvedValue([]);
    mockedLogAggregationService.getAggregatedExportLogs.mockRejectedValue(
      new Error('Failed to load export sources: strength: permission-denied')
    );

    await expect(
      exportData('user-1', {
        includeSessions: false,
        includeExerciseLogs: true,
        includeSets: true,
      })
    ).rejects.toThrow('Failed to export data: Failed to load export sources: strength: permission-denied');
  });
});
