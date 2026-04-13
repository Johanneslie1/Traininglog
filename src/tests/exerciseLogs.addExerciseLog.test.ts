import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';

const {
  setDocMock,
  getDocMock,
  collectionMock,
  docMock,
  addActivityLogMock,
  getAuthMock,
} = {
  setDocMock: jest.fn(async (..._args: unknown[]) => undefined),
  getDocMock: jest.fn(async () => ({ exists: () => false })),
  collectionMock: jest.fn(() => ({ path: 'users/user-1/exercises' })),
  docMock: jest.fn((...segments: string[]) => ({
    id: segments.length > 0 ? segments[segments.length - 1] : 'generated-id',
    path: segments.join('/'),
  })),
  addActivityLogMock: jest.fn(async () => 'activity-1'),
  getAuthMock: jest.fn(() => ({
    currentUser: {
      uid: 'user-1',
    },
  })),
};

jest.mock('firebase/firestore', () => ({
  collection: collectionMock,
  doc: docMock,
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((value: Date) => value),
    now: jest.fn(() => new Date('2026-03-09T00:00:00.000Z')),
  },
  getDoc: getDocMock,
  setDoc: setDocMock,
}));

jest.mock('firebase/auth', () => ({
  getAuth: getAuthMock,
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

jest.mock('@/services/firebase/activityLogs', () => ({
  addActivityLog: addActivityLogMock,
}));

jest.mock('@/services/firebase/sessionTrackingService', () => ({
  ensureSessionContextForLog: jest.fn(async () => ({
    sessionId: 'session-1',
    sessionType: 'main',
    sessionDateKey: '2026-03-09',
    sessionWeekKey: '2026-W11',
    sessionNumberInDay: 1,
    sessionNumberInWeek: 1,
  })),
}));

import { addExerciseLog } from '@/services/firebase/exerciseLogs';

describe('addExerciseLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as any).window = {
      navigator: {
        userAgent: 'test-agent',
      },
    };
    (globalThis as any).localStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
  });

  it('routes non-resistance logs to activities collection via addActivityLog', async () => {
    const result = await addExerciseLog(
      {
        exerciseName: 'Jogging',
        userId: 'user-1',
        sets: [{ distance: 5, duration: 30 } as any],
        activityType: ActivityType.ENDURANCE,
      },
      new Date('2026-03-09T10:00:00.000Z')
    );

    expect(result).toBe('activity-1');
    expect(addActivityLogMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('uses auth uid when payload userId does not match', async () => {
    getAuthMock.mockReturnValueOnce({
      currentUser: {
        uid: 'different-user',
      },
    });

    docMock.mockImplementationOnce(() => ({ id: 'exercise-2', path: 'users/different-user/exercises/exercise-2' }));

    const result = await addExerciseLog(
      {
        exerciseName: 'Bench Press',
        userId: 'user-1',
        sets: [{ reps: 8, weight: 80 } as any],
        activityType: ActivityType.RESISTANCE,
      },
      new Date('2026-03-09T11:00:00.000Z')
    );

    expect(result).toBe('exercise-2');
    expect(setDocMock).toHaveBeenCalledTimes(1);
    const savedPayload = (setDocMock.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(savedPayload.userId).toBe('different-user');
  });

  it('writes resistance logs to exercises collection', async () => {
    docMock.mockImplementationOnce(() => ({ id: 'exercise-1', path: 'users/user-1/exercises/exercise-1' }));

    const result = await addExerciseLog(
      {
        exerciseName: 'Bench Press',
        userId: 'user-1',
        sets: [{ reps: 5, weight: 100 } as any],
        activityType: ActivityType.RESISTANCE,
      },
      new Date('2026-03-09T12:00:00.000Z')
    );

    expect(result).toBe('exercise-1');
    expect(setDocMock).toHaveBeenCalledTimes(1);
    expect(addActivityLogMock).not.toHaveBeenCalled();
  });
});
