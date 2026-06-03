import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const getAuthMock = jest.fn();
const collectionMock = jest.fn((...segments: string[]) => ({ path: segments.join('/') }));
const whereMock = jest.fn((field: string, op: string, value: string) => ({ field, op, value }));
const queryMock = jest.fn((target: unknown, ...constraints: unknown[]) => ({ target, constraints }));
const getDocsMock: jest.Mock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: getAuthMock,
}));

jest.mock('firebase/firestore', () => ({
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  where: whereMock,
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

jest.mock('@/utils/unifiedExerciseUtils', () => ({
  getAllExercisesByDate: jest.fn(),
}));

jest.mock('@/services/firebase/exerciseLogs', () => ({
  addExerciseLog: jest.fn(),
}));

jest.mock('@/services/firebase/activityLogs', () => ({
  addActivityLog: jest.fn(),
}));

import { getMonthSessionSummaries } from '@/services/calendar';

describe('getMonthSessionSummaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates session counts for each visible day in the month', async () => {
    getAuthMock.mockReturnValue({ currentUser: { uid: 'user-1' } });
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          { id: 'session-1', data: () => ({ sessionDateKey: '2026-04-02' }) },
          { id: 'session-2', data: () => ({ sessionDateKey: '2026-04-02' }) },
          { id: 'session-3', data: () => ({ sessionDateKey: '2026-04-15' }) },
        ],
      } as never)
      .mockResolvedValueOnce({ docs: [] } as never);

    const summaries = await getMonthSessionSummaries(new Date('2026-04-15T12:00:00.000Z'));

    expect(summaries).toHaveLength(30);
    expect(summaries[0]).toMatchObject({ sessionDateKey: '2026-04-01', sessionCount: 0, hasSessions: false });
    expect(summaries[1]).toMatchObject({ sessionDateKey: '2026-04-02', sessionCount: 2, hasSessions: true });
    expect(summaries[14]).toMatchObject({ sessionDateKey: '2026-04-15', sessionCount: 1, hasSessions: true });
    expect(whereMock).toHaveBeenCalledWith('sessionDateKey', '>=', '2026-04-01');
    expect(whereMock).toHaveBeenCalledWith('sessionDateKey', '<=', '2026-04-30');
    expect(whereMock).toHaveBeenCalledWith('date', '>=', '2026-04-01');
    expect(whereMock).toHaveBeenCalledWith('date', '<=', '2026-04-30');
  });

  it('counts unlinked legacy sports load sessions without double-counting linked ones', async () => {
    getAuthMock.mockReturnValue({ currentUser: { uid: 'user-1' } });
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          { id: 'canonical-srpe-1', data: () => ({ sessionDateKey: '2026-04-10', sessionType: 'srpe' }) },
        ],
      } as never)
      .mockResolvedValueOnce({
        docs: [
          { id: 'sports-load-1', data: () => ({ date: '2026-04-10', sessionId: 'canonical-srpe-1' }) },
          { id: 'sports-load-legacy', data: () => ({ date: '2026-04-10' }) },
        ],
      } as never);

    const summaries = await getMonthSessionSummaries(new Date('2026-04-15T12:00:00.000Z'));

    expect(summaries[9]).toMatchObject({ sessionDateKey: '2026-04-10', sessionCount: 2, hasSessions: true });
  });

  it('returns zeroed day summaries when there is no authenticated user', async () => {
    getAuthMock.mockReturnValue({ currentUser: null });

    const summaries = await getMonthSessionSummaries(new Date('2026-04-15T12:00:00.000Z'));

    expect(summaries).toHaveLength(30);
    expect(summaries.every((summary) => summary.sessionCount === 0)).toBe(true);
    expect(getDocsMock).not.toHaveBeenCalled();
  });
});