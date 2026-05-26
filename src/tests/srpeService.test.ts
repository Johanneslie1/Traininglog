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

import {
  calculateSessionLoad,
  getSportsLoadSessionsByDate,
  getSrpeByDate,
  getSrpeByDateRange,
  saveSrpeLog,
} from '@/services/srpeService';

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
      const isGeneratedDoc = normalizedSegments.length === 1;
      const path = isGeneratedDoc
        ? `${normalizedSegments[0]}/generated-id`
        : normalizedSegments.join('/');

      return {
        kind: 'doc',
        path,
        id: isGeneratedDoc ? 'generated-id' : String(normalizedSegments[normalizedSegments.length - 1]),
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

  it('saves logged RPE with derived sports load as an individual session', async () => {
    await saveSrpeLog('2026-03-10', {
      rpe: 8,
      durationMinutes: 75,
      sportType: 'football',
      sportName: 'Football',
    });

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/user-42/sportsLoadSessions/generated-id',
      }),
      expect.objectContaining({
        userId: 'user-42',
        date: '2026-03-10',
        dateEpochDay: 20522,
        rpe: 8,
        durationMinutes: 75,
        sessionLoad: 600,
        sportType: 'football',
        sportName: 'Football',
        timestamp: { __serverTimestamp: true },
      })
    );
  });

  it('saves optional sports load metrics while keeping load derived from RPE and duration', async () => {
    await saveSrpeLog('2026-03-10', {
      rpe: 8,
      durationMinutes: 75,
      sportType: 'football',
      sportName: 'Football',
      distanceMeters: 9000,
      calories: 720,
      averageHeartRate: 152,
      maxHeartRate: 188,
      notes: '  Controlled tempo match  ',
    });

    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'users/user-42/sportsLoadSessions/generated-id',
      }),
      expect.objectContaining({
        rpe: 8,
        durationMinutes: 75,
        sessionLoad: 600,
        distanceMeters: 9000,
        calories: 720,
        averageHeartRate: 152,
        maxHeartRate: 188,
        notes: 'Controlled tempo match',
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
    await expect(saveSrpeLog('2026-03-10', { rpe: 7, durationMinutes: 75, sportType: ' ' })).rejects.toThrow(
      'Sport type must not be empty'
    );
    await expect(saveSrpeLog('2026-03-10', { rpe: 7, durationMinutes: 75, distanceMeters: 0 })).rejects.toThrow(
      'Distance must be a positive whole number when provided'
    );
    await expect(saveSrpeLog('2026-03-10', { rpe: 7, durationMinutes: 75, notes: 'x'.repeat(1001) })).rejects.toThrow(
      'Notes must be 1000 characters or fewer'
    );

    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('loads an existing legacy RPE/load log by date when no session docs exist', async () => {
    getDocsMock.mockResolvedValueOnce({ empty: true, docs: [] });
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
        sportType: 'basketball',
        sportName: 'Basketball',
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
      sportType: 'basketball',
      sportName: 'Basketball',
      sessionCount: 1,
    });
  });

  it('falls back to the legacy daily RPE/load log when session reads are denied', async () => {
    getDocsMock.mockRejectedValueOnce({ code: 'permission-denied' });
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
        sportType: 'basketball',
        sportName: 'Basketball',
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
      sessionCount: 1,
    });
  });

  it('aggregates multiple sports load sessions into one daily row with duration-weighted RPE', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: [
        {
          id: 'session-1',
          data: () => ({
            userId: 'user-42',
            date: '2026-03-10',
            dateEpochDay: 20522,
            rpe: 6,
            durationMinutes: 30,
            sessionLoad: 180,
            sportType: 'football',
            sportName: 'Football',
            timestamp: new Date('2026-03-10T10:00:00'),
          }),
        },
        {
          id: 'session-2',
          data: () => ({
            userId: 'user-42',
            date: '2026-03-10',
            dateEpochDay: 20522,
            rpe: 9,
            durationMinutes: 90,
            sessionLoad: 810,
            sportType: 'basketball',
            sportName: 'Basketball',
            timestamp: new Date('2026-03-10T18:00:00'),
          }),
        },
      ],
    });

    await expect(getSrpeByDate('user-42', '2026-03-10')).resolves.toMatchObject({
      id: '2026-03-10',
      userId: 'user-42',
      date: '2026-03-10',
      rpe: 8.3,
      durationMinutes: 120,
      sessionLoad: 990,
      sportType: 'multiple',
      sportName: 'Multiple sports',
      sessionCount: 2,
      isAggregate: true,
    });

    expect(getDocMock).not.toHaveBeenCalled();
  });

  it('returns session docs by date for the Sports Load page', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: [
        {
          id: 'session-1',
          data: () => ({
            userId: 'user-42',
            date: '2026-03-10',
            dateEpochDay: 20522,
            rpe: 7,
            durationMinutes: 60,
            sessionLoad: 420,
            sportType: 'football',
            sportName: 'Football',
            timestamp: new Date('2026-03-10T10:00:00'),
          }),
        },
      ],
    });

    await expect(getSportsLoadSessionsByDate('user-42', '2026-03-10')).resolves.toMatchObject([
      {
        id: 'session-1',
        sportType: 'football',
        sportName: 'Football',
        sessionLoad: 420,
      },
    ]);
  });

  it('returns one aggregate row per date and falls back to legacy rows without sessions', async () => {
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-1',
            data: () => ({
              userId: 'user-42',
              date: '2026-03-10',
              dateEpochDay: 20522,
              rpe: 7,
              durationMinutes: 60,
              sessionLoad: 420,
              sportType: 'football',
              sportName: 'Football',
              timestamp: new Date('2026-03-10T10:00:00'),
            }),
          },
          {
            id: 'session-2',
            data: () => ({
              userId: 'user-42',
              date: '2026-03-10',
              dateEpochDay: 20522,
              rpe: 8,
              durationMinutes: 30,
              sessionLoad: 240,
              sportType: 'football',
              sportName: 'Football',
              timestamp: new Date('2026-03-10T16:00:00'),
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: '2026-03-10',
            data: () => ({
              userId: 'user-42',
              date: '2026-03-10',
              dateEpochDay: 20522,
              rpe: 5,
              durationMinutes: 20,
              sessionLoad: 100,
              timestamp: { seconds: 1 },
            }),
          },
          {
            id: '2026-03-11',
            data: () => ({
              userId: 'user-42',
              date: '2026-03-11',
              dateEpochDay: 20523,
              rpe: 6,
              durationMinutes: 40,
              sessionLoad: 240,
              timestamp: { seconds: 1 },
            }),
          },
        ],
      });

    await expect(getSrpeByDateRange('user-42', '2026-03-10', '2026-03-11')).resolves.toMatchObject([
      {
        date: '2026-03-10',
        rpe: 7.3,
        durationMinutes: 90,
        sessionLoad: 660,
        sessionCount: 2,
      },
      {
        date: '2026-03-11',
        rpe: 6,
        durationMinutes: 40,
        sessionLoad: 240,
        sessionCount: 1,
      },
    ]);
  });

  it('falls back to legacy range rows when session range reads are denied', async () => {
    getDocsMock
      .mockRejectedValueOnce({ code: 'permission-denied' })
      .mockResolvedValueOnce({
        docs: [
          {
            id: '2026-03-10',
            data: () => ({
              userId: 'user-42',
              date: '2026-03-10',
              dateEpochDay: 20522,
              rpe: 5,
              durationMinutes: 20,
              sessionLoad: 100,
              timestamp: { seconds: 1 },
            }),
          },
        ],
      });

    await expect(getSrpeByDateRange('user-42', '2026-03-10', '2026-03-11')).resolves.toMatchObject([
      {
        id: '2026-03-10',
        date: '2026-03-10',
        rpe: 5,
        durationMinutes: 20,
        sessionLoad: 100,
        sessionCount: 1,
      },
    ]);
  });
});
