import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const getDocMock = jest.fn();
const updateDocMock = jest.fn(async () => undefined);
const arrayRemoveMock = jest.fn((value: unknown) => ({ remove: value }));
const docMock = jest.fn((...args: unknown[]) => ({ path: args.join('/') }));

jest.mock('firebase/firestore', () => ({
  arrayRemove: (value: unknown) => arrayRemoveMock(value),
  collection: jest.fn(),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: jest.fn(),
  query: jest.fn(),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'athlete-1', displayName: 'Athlete' } }),
}));

jest.mock('@/services/firebase/config', () => ({ db: {} }));
jest.mock('@/services/exerciseSnapshotService', () => ({
  withExerciseSnapshots: jest.fn(async (exercises: unknown) => exercises),
}));

import { declinePlannedSession } from '@/services/sessionService';

describe('declinePlannedSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'athlete-1',
        plannedDates: ['2026-11-06', '2026-11-07'],
      }),
    });
  });

  it('removes only the chosen day from the athlete assignment', async () => {
    await declinePlannedSession('assign-1', '2026-11-06');

    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        plannedDates: { remove: '2026-11-06' },
      })
    );
  });

  it('rejects decline for another athlete assignment', async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ userId: 'someone-else', plannedDates: ['2026-11-06'] }),
    });

    await expect(declinePlannedSession('assign-1', '2026-11-06')).rejects.toThrow(
      /only decline your own/i
    );
    expect(updateDocMock).not.toHaveBeenCalled();
  });
});
