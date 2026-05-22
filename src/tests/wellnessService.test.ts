// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const collectionMock = jest.fn();
const docMock = jest.fn();
const queryMock = jest.fn();
const whereMock = jest.fn();
const getDocsMock = jest.fn();
const setDocMock = jest.fn();
const updateDocMock = jest.fn();
const serverTimestampMock = jest.fn();
const deleteFieldMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-42' } })),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  deleteField: (...args: unknown[]) => deleteFieldMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  serverTimestamp: (...args: unknown[]) => serverTimestampMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

import { saveWellnessLog } from '@/services/wellnessService';

describe('wellnessService', () => {
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

    getDocsMock.mockResolvedValue({ empty: true, docs: [] });
    serverTimestampMock.mockReturnValue({ __serverTimestamp: true });
    deleteFieldMock.mockReturnValue({ __deleteField: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates new wellness logs with the selected date as the document id', async () => {
    await saveWellnessLog('2026-03-10', { readiness: 8, sleepQuality: 7 }, 'Ready');

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/user-42/wellnessLogs/2026-03-10',
      }),
      expect.objectContaining({
        userId: 'user-42',
        date: '2026-03-10',
        dateEpochDay: 20522,
        wellnessScaleVersion: 2,
        readiness: 8,
        sleepQuality: 7,
        notes: 'Ready',
        timestamp: { __serverTimestamp: true },
      })
    );
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('updates an existing same-date wellness log instead of creating a duplicate', async () => {
    getDocsMock.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'legacy-random-id' }],
    });

    await saveWellnessLog('2026-03-10', { readiness: 9 }, undefined);

    expect(updateDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/user-42/wellnessLogs/legacy-random-id',
      }),
      expect.objectContaining({
        userId: 'user-42',
        date: '2026-03-10',
        dateEpochDay: 20522,
        wellnessScaleVersion: 2,
        readiness: 9,
        notes: { __deleteField: true },
        timestamp: { __serverTimestamp: true },
      })
    );
    expect(setDocMock).not.toHaveBeenCalled();
  });
});
