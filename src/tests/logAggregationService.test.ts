import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/services/firebase/exerciseLogs', () => ({
  getExerciseLogs: jest.fn(async () => []),
}));

jest.mock('@/services/firebase/activityLogs', () => ({
  getActivityLogs: jest.fn(async () => []),
}));

jest.mock('@/services/firebase/strengthExerciseLogs', () => ({
  getExerciseLogs: jest.fn(async () => []),
}));

import { getAggregatedExportLogs } from '@/services/logAggregationService';

const mockedExerciseLogs = jest.requireMock('@/services/firebase/exerciseLogs') as {
  getExerciseLogs: any;
};
const mockedActivityLogs = jest.requireMock('@/services/firebase/activityLogs') as {
  getActivityLogs: any;
};
const mockedStrengthLogs = jest.requireMock('@/services/firebase/strengthExerciseLogs') as {
  getExerciseLogs: any;
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

describe('logAggregationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('aggregates all configured sources and dedupes by newest timestamp', async () => {
    const startDate = new Date('2026-03-01T00:00:00.000Z');
    const endDate = new Date('2026-03-02T00:00:00.000Z');

    mockedExerciseLogs.getExerciseLogs.mockResolvedValue([
      {
        id: 'shared-1',
        exerciseName: 'Bench Press',
        sets: [{ reps: 8, weight: 80 }],
        timestamp: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
      },
    ]);

    mockedActivityLogs.getActivityLogs.mockResolvedValue([
      {
        id: 'act-1',
        activityName: 'Easy Run',
        sets: [{ duration: 30, distance: 5 }],
        timestamp: new Date('2026-03-01T11:00:00.000Z'),
        userId: 'user-1',
        activityType: 'endurance',
      },
    ]);

    mockedStrengthLogs.getExerciseLogs.mockResolvedValue([
      {
        id: 'str-1',
        exerciseName: 'Front Squat',
        sets: [{ reps: 5, weight: 95 }],
        timestamp: new Date('2026-03-01T12:00:00.000Z'),
        userId: 'user-1',
        exerciseType: 'strength',
      },
    ]);

    localStorage.setItem(
      'exercise_logs',
      JSON.stringify([
        {
          id: 'shared-1',
          exerciseName: 'Bench Press',
          sets: [{ reps: 8, weight: 80 }],
          timestamp: '2026-03-01T09:30:00.000Z',
          userId: 'user-1',
          activityType: 'resistance',
        },
        {
          id: 'local-2',
          exerciseName: 'Mobility Flow',
          sets: [{ duration: 20 }],
          timestamp: '2026-03-01T08:00:00.000Z',
          userId: 'user-1',
          activityType: 'stretching',
        },
      ])
    );

    const result = await getAggregatedExportLogs('user-1', startDate, endDate);

    expect(result).toHaveLength(4);
    expect(result.find((log) => log.id === 'shared-1')?.collectionType).toBe('exercise');
    expect(result.map((log) => log.collectionType)).toEqual(expect.arrayContaining(['exercise', 'activity', 'strength', 'local']));
    expect(result[0].timestamp.getTime()).toBeGreaterThanOrEqual(result[1].timestamp.getTime());
  });

  it('fails with source details when any configured source fails', async () => {
    mockedExerciseLogs.getExerciseLogs.mockResolvedValue([]);
    mockedActivityLogs.getActivityLogs.mockResolvedValue([]);
    mockedStrengthLogs.getExerciseLogs.mockRejectedValue(new Error('network unavailable'));

    await expect(
      getAggregatedExportLogs('user-1', new Date('2026-03-01T00:00:00.000Z'), new Date('2026-03-02T00:00:00.000Z'))
    ).rejects.toThrow('Failed to load export sources: strength: network unavailable');
  });

  it('ignores malformed local storage payload and still returns firestore logs', async () => {
    mockedExerciseLogs.getExerciseLogs.mockResolvedValue([
      {
        id: 'ex-1',
        exerciseName: 'Bench Press',
        sets: [{ reps: 5, weight: 80 }],
        timestamp: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
        activityType: 'resistance',
      },
    ]);
    mockedActivityLogs.getActivityLogs.mockResolvedValue([]);
    mockedStrengthLogs.getExerciseLogs.mockResolvedValue([]);

    localStorage.setItem('exercise_logs', '{invalid-json');

    const result = await getAggregatedExportLogs(
      'user-1',
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-02T00:00:00.000Z')
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ex-1');
  });

  it('reads local entries with loggedAt timestamp fallback', async () => {
    mockedExerciseLogs.getExerciseLogs.mockResolvedValue([]);
    mockedActivityLogs.getActivityLogs.mockResolvedValue([]);
    mockedStrengthLogs.getExerciseLogs.mockResolvedValue([]);

    localStorage.setItem(
      'exercise_logs',
      JSON.stringify([
        {
          id: 'local-fallback-1',
          exerciseName: 'Band Pull Apart',
          sets: [{ reps: 20 }],
          loggedAt: '2026-03-01T06:30:00.000Z',
          userId: 'anonymous',
          activityType: 'resistance',
        },
      ])
    );

    const result = await getAggregatedExportLogs(
      'user-1',
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-02T00:00:00.000Z')
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('local-fallback-1');
    expect(result[0].collectionType).toBe('local');
  });

  it('reclassifies local OTHER logs to RESISTANCE when set shape indicates resistance', async () => {
    mockedExerciseLogs.getExerciseLogs.mockResolvedValue([]);
    mockedActivityLogs.getActivityLogs.mockResolvedValue([]);
    mockedStrengthLogs.getExerciseLogs.mockResolvedValue([]);

    localStorage.setItem(
      'exercise_logs',
      JSON.stringify([
        {
          id: 'local-misclassified-1',
          exerciseName: 'Bench Press',
          sets: [{ reps: 5, weight: 80 }],
          timestamp: '2026-03-01T06:30:00.000Z',
          userId: 'user-1',
          activityType: 'other',
        },
      ])
    );

    const result = await getAggregatedExportLogs(
      'user-1',
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-02T00:00:00.000Z')
    );

    expect(result).toHaveLength(1);
    expect(result[0].activityType).toBe('resistance');
  });
});
