// @ts-nocheck

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const docMock = jest.fn();
const collectionMock = jest.fn();
const queryMock = jest.fn();
const whereMock = jest.fn();
const getDocMock = jest.fn();
const getDocsMock = jest.fn();
const runTransactionMock = jest.fn();

let transactionGetMock: jest.Mock;
let transactionSetMock: jest.Mock;
let transactionUpdateMock: jest.Mock;

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  deleteField: jest.fn(),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ __ts: true })),
  },
  updateDoc: jest.fn(),
  where: (...args: unknown[]) => whereMock(...args),
  writeBatch: jest.fn(),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

import { ensureDefaultSessionForDate } from '@/services/firebase/sessionTrackingService';

describe('sessionTrackingService baseline defaults', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    collectionMock.mockImplementation((...segments: string[]) => ({
      kind: 'collection',
      path: segments.join('/'),
    }));

    docMock.mockImplementation((...segments: Array<any>) => {
      const normalizedSegments = segments
        .flatMap((segment) => {
          if (segment && typeof segment === 'object' && 'path' in segment) {
            return [String((segment as { path: string }).path)];
          }
          return [String(segment)];
        });

      const path = normalizedSegments.join('/');
      const id = normalizedSegments[normalizedSegments.length - 1];

      return { kind: 'doc', path, id };
    });

    whereMock.mockImplementation((field: string, op: string, value: unknown) => ({
      kind: 'where',
      field,
      op,
      value,
    }));

    queryMock.mockImplementation((coll: { path: string }, ...constraints: unknown[]) => ({
      kind: 'query',
      path: coll.path,
      constraints,
    }));

    getDocMock.mockResolvedValue({ exists: () => false });

    getDocsMock.mockImplementation(async (target: any) => {
      if (target?.kind === 'query') {
        const hasWeekConstraint = target.constraints.some(
          (constraint: any) => constraint?.field === 'sessionWeekKey'
        );

        if (hasWeekConstraint) {
          return { docs: [], size: 0 };
        }

        return { docs: [] };
      }

      return { docs: [], size: 0 };
    });

    transactionGetMock = jest.fn(async (target: any) => {
      if (target.kind === 'doc' && String(target.id).startsWith('default-')) {
        return { exists: () => false, id: target.id, data: () => ({}) };
      }

      if (target.kind === 'query' && target.path.endsWith('/sessions')) {
        const hasWeekConstraint = target.constraints.some(
          (constraint: any) => constraint?.field === 'sessionWeekKey'
        );

        if (hasWeekConstraint) {
          return { docs: [], size: 0 };
        }

        return { docs: [] };
      }

      return { docs: [], size: 0, exists: () => false, data: () => ({}) };
    });

    transactionSetMock = jest.fn();
    transactionUpdateMock = jest.fn();

    runTransactionMock.mockImplementation(async (_db: unknown, updateFn: any) => {
      return updateFn({
        get: transactionGetMock,
        set: transactionSetMock,
        update: transactionUpdateMock,
      });
    });
  });

  it('creates baseline main session with deterministic id', async () => {
    const result = await ensureDefaultSessionForDate('user-1', new Date('2026-03-31T00:00:00.000Z'), 'main');

    expect(result.sessionId).toBe('default-2026-03-31-main');
    expect(result.sessionType).toBe('main');
    expect(result.sessionNumberInDay).toBe(1);

    expect(transactionSetMock).toHaveBeenCalledTimes(1);
    const [sessionRef] = transactionSetMock.mock.calls[0];
    expect(sessionRef.id).toBe('default-2026-03-31-main');
  });

  it('reuses existing deterministic baseline without creating duplicate', async () => {
    transactionGetMock.mockImplementation(async (target: any) => {
      if (target.kind === 'doc' && target.id === 'default-2026-03-31-warmup') {
        return {
          exists: () => true,
          id: target.id,
          data: () => ({
            sessionType: 'warmup',
            sessionDateKey: '2026-03-31',
            sessionWeekKey: '2026-W14',
            sessionNumberInDay: 1,
            sessionNumberInWeek: 3,
          }),
        };
      }

      return { docs: [], size: 0 };
    });

    const result = await ensureDefaultSessionForDate('user-1', new Date('2026-03-31T00:00:00.000Z'), 'warmup');

    expect(result.sessionId).toBe('default-2026-03-31-warmup');
    expect(result.sessionType).toBe('warmup');
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
