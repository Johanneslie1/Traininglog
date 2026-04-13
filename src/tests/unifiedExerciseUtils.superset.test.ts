import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/services/firebase/exerciseLogs', () => ({
  getExerciseLogs: jest.fn(async () => []),
  deleteExerciseLog: jest.fn(async () => undefined),
}));

jest.mock('@/services/firebase/activityLogs', () => ({
  getActivityLogs: jest.fn(async () => []),
  deleteActivityLog: jest.fn(async () => undefined),
}));

jest.mock('@/utils/localStorageUtils', () => ({
  getExerciseLogs: jest.fn(() => []),
  deleteLocalExerciseLog: jest.fn(),
}));

import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { getExerciseLogs as getFirebaseExerciseLogs } from '@/services/firebase/exerciseLogs';
import { getActivityLogs as getFirebaseActivityLogs } from '@/services/firebase/activityLogs';

describe('unifiedExerciseUtils superset mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retains superset metadata from resistance logs', async () => {
    const mockedGetExerciseLogs = getFirebaseExerciseLogs as jest.MockedFunction<typeof getFirebaseExerciseLogs>;
    const mockedGetActivityLogs = getFirebaseActivityLogs as jest.MockedFunction<typeof getFirebaseActivityLogs>;

    mockedGetExerciseLogs.mockResolvedValueOnce([
      {
        id: 'log-1',
        exerciseName: 'Bench Press',
        timestamp: new Date('2026-03-02T09:00:00.000Z'),
        userId: 'user-1',
        sets: [],
        activityType: 'RESISTANCE',
        supersetId: 'superset-1',
        supersetLabel: '1a',
        supersetName: 'Push Pair',
      },
    ] as Awaited<ReturnType<typeof getFirebaseExerciseLogs>>);
    mockedGetActivityLogs.mockResolvedValueOnce([] as Awaited<ReturnType<typeof getFirebaseActivityLogs>>);

    const result = await getAllExercisesByDate(new Date('2026-03-02T00:00:00.000Z'), 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'log-1',
      supersetId: 'superset-1',
      supersetLabel: '1a',
      supersetName: 'Push Pair',
    });
  });
});
