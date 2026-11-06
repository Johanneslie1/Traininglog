// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const updateDocMock = jest.fn(async () => undefined);
const getDocsMock = jest.fn();
const arrayUnionMock = jest.fn((value: unknown) => ({ union: value }));
const arrayRemoveMock = jest.fn((value: unknown) => ({ remove: value }));
const shareSessionMock = jest.fn();

jest.mock('firebase/firestore', () => ({
  arrayRemove: (value: unknown) => arrayRemoveMock(value),
  arrayUnion: (value: unknown) => arrayUnionMock(value),
  collection: jest.fn(),
  doc: (...args: unknown[]) => ({ id: args[2] }),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: jest.fn(),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'coach-1' } }),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

jest.mock('@/services/sessionService', () => ({
  shareSession: (...args: unknown[]) => shareSessionMock(...args),
}));

import { clearPlannedDate, listCoachPlacements, placeSessionOnDate } from '@/services/coachPlacementService';

const session = {
  id: 'session-1',
  name: 'Upper',
  userId: 'coach-1',
  exercises: [{ id: 'ex-1', name: 'Bench' }],
};

describe('coach placement service', () => {
  beforeEach(() => {
    updateDocMock.mockClear();
    getDocsMock.mockReset();
    shareSessionMock.mockReset();
  });

  it('adds a date to an existing assignment', async () => {
    await placeSessionOnDate({
      session,
      athleteId: 'athlete-1',
      date: '2026-11-05',
      assignmentId: 'assign-1',
    });

    expect(shareSessionMock).not.toHaveBeenCalled();
    expect(updateDocMock).toHaveBeenCalledWith(
      { id: 'assign-1' },
      { plannedDates: { union: '2026-11-05' } }
    );
  });

  it('shares a new session with the planned date in the same write', async () => {
    shareSessionMock.mockResolvedValue('shared-1');
    getDocsMock.mockResolvedValue({
      docs: [{
        ref: { id: 'assign-2' },
        data: () => ({ userId: 'athlete-1' }),
      }],
    });

    await placeSessionOnDate({
      session,
      athleteId: 'athlete-1',
      date: '2026-11-05',
      programId: 'program-1',
      programName: 'Strength',
    });

    expect(shareSessionMock).toHaveBeenCalledWith(
      session,
      ['athlete-1'],
      undefined,
      'program-1',
      'Strength',
      ['2026-11-05']
    );
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('removes one planned date and lists the coach assignments', async () => {
    await clearPlannedDate('assign-1', '2026-11-05');
    expect(updateDocMock).toHaveBeenCalledWith(
      { id: 'assign-1' },
      { plannedDates: { remove: '2026-11-05' } }
    );

    getDocsMock.mockResolvedValue({
      docs: [{
        id: 'assign-1',
        data: () => ({
          userId: 'athlete-1',
          plannedDates: ['2026-11-05'],
          sessionData: { id: 'session-1', name: 'Upper', exercises: [] },
        }),
      }],
    });
    const placements = await listCoachPlacements('coach-1');
    expect(placements).toHaveLength(1);
    expect(placements[0].sessionName).toBe('Upper');
  });
});
