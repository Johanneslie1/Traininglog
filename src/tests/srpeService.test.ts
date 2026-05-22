// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const collectionMock = jest.fn();
const docMock = jest.fn();
const getDocMock = jest.fn();
const getDocsMock = jest.fn();
const queryMock = jest.fn();
const whereMock = jest.fn();
const setDocMock = jest.fn();
const serverTimestampMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-42' } })),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  serverTimestamp: (...args: unknown[]) => serverTimestampMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

import { calculateSessionLoad, getSrpeByDate, saveSrpeLog } from '@/services/srpeService';

describe('srpeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-15T12:00:00'));

    const normalizeFirestorePathSegments = (segments: unknown[]) =>
      segments.flatMap((segment) => {
        if (segment && typeof segment === 'object') {
          if ('path' in (segment as Record<string, unknown>)) {
            return [String((segment as { path: string }).path)];
          }
          return [];
        }
        return [String(segment)];
      });

    collectionMock.mockImplementation((...segments: unknown[]) => ({
      kind: 'collection',
      path: normalizeFirestorePathSegments(segments).join('/'),
    }));

    docMock.mockImplementation((...segments: unknown[]) => {
      const normalizedSegments = normalizeFirestorePathSegments(segments);

      return {
        kind: 'doc',
        path: normalizedSegments.join('/'),
        id: String(normalizedSegments[normalizedSegments.length - 1]),
      };
    });

    whereMock.mockImplementation((field: string, op: string, value: unknown) => ({
      kind: 'where',
      field,
      op,
      value,
    }));

    queryMock.mockImplementation((collectionRef: { path: string }, ...constraints: unknown[]) => ({
      kind: 'query',
      path: collectionRef.path,
      constraints,
    }));

    getDocMock.mockResolvedValue({
      exists: () => false,
    });
    getDocsMock.mockResolvedValue({ empty: true, docs: [] });
    serverTimestampMock.mockReturnValue({ __serverTimestamp: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates session load from RPE and duration', () => {
    expect(calculateSessionLoad({ rpe: 7, durationMinutes: 90 })).toBe(630);
  });

  it('saves logged RPE with derived sRPE load under the selected date document id', async () => {
    await saveSrpeLog('2026-03-10', { rpe: 8, durationMinutes: 75 });

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/user-42/srpeLogs/2026-03-10',
      }),
      expect.objectContaining({
        userId: 'user-42',
        date: '2026-03-10',
        dateEpochDay: 20522,
        rpe: 8,
        durationMinutes: 75,
        sessionLoad: 600,
        timestamp: { __serverTimestamp: true },
      })
    );
  });

  it('rejects invalid RPE/load inputs before writing', async () => {
    await expect(saveSrpeLog('2026-03-10', { rpe: 11, durationMinutes: 75 })).rejects.toThrow(
      'RPE must be an integer from 1 to 10'
    );
    await expect(saveSrpeLog('2026-03-10', { rpe: 7, durationMinutes: 0 })).rejects.toThrow(
      'Session duration must be a positive whole number of minutes'
    );

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('loads an existing RPE/load log by date', async () => {
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      id: '2026-03-10',
      data: () => ({
        userId: 'user-42',
        date: '2026-03-10',
        dateEpochDay: 20522,
        rpe: 6,
        durationMinutes: 80,
        sessionLoad: 480,
        timestamp: { seconds: 1 },
      }),
    });

    await expect(getSrpeByDate('user-42', '2026-03-10')).resolves.toMatchObject({
      id: '2026-03-10',
      userId: 'user-42',
      date: '2026-03-10',
      rpe: 6,
      durationMinutes: 80,
      sessionLoad: 480,
    });
  });
});
