// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const docMock = jest.fn();
const getDocMock = jest.fn();
const setDocMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user-42' } })),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
}));

jest.mock('@/services/firebase/config', () => ({
  db: { kind: 'db' },
}));

import { getRehabProgress } from '@/services/rehabProgressService';

describe('rehabProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00'));
    docMock.mockImplementation((...segments: unknown[]) => ({
      path: segments.map((segment) => (
        segment && typeof segment === 'object' && 'path' in (segment as { path?: string })
          ? (segment as { path: string }).path
          : String(segment)
      )).filter((segment) => segment !== '[object Object]' && segment !== '').join('/'),
    }));
    setDocMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('seeds the first symmetry test when no progress exists', async () => {
    getDocMock.mockResolvedValue({ exists: () => false });

    const progress = await getRehabProgress('program-1');

    expect(progress.symmetryTests[0]).toMatchObject({
      weightKg: 3,
      healthyReps: 16,
      injuredReps: 10,
      symmetryPercent: 63,
      date: '2026-10-01',
    });
    expect(progress.confirmedWeeks).toEqual([]);
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('users/user-42/rehabProgress/program-1') }),
      expect.objectContaining({
        userId: 'user-42',
        programId: 'program-1',
      })
    );
  });

  it('returns stored progress without reseeding', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'user-42',
        programId: 'program-1',
        programKey: 'shoulder-rehab-3-week',
        confirmedWeeks: [1],
        checkpointChecks: { '1:0': true },
        painLogs: [],
        symmetryTests: [],
        updatedAt: '2026-10-01T00:00:00.000Z',
      }),
    });

    const progress = await getRehabProgress('program-1');

    expect(progress.confirmedWeeks).toEqual([1]);
    expect(progress.symmetryTests).toEqual([]);
    expect(setDocMock).not.toHaveBeenCalled();
  });
});
