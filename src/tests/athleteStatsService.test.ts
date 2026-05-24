// @ts-nocheck

import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const getWellnessByDateRangeMock = jest.fn();
const getSrpeByDateRangeMock = jest.fn();
const getCoachTeamsMock = jest.fn();
const getTeamMembersMock = jest.fn();
const syncCoachAthleteAccessMock = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'athlete-self',
      email: 'self@example.com',
      displayName: 'Self Athlete',
    },
  })),
}));

jest.mock('@/services/wellnessService', () => ({
  getWellnessByDateRange: (...args: unknown[]) => getWellnessByDateRangeMock(...args),
}));

jest.mock('@/services/srpeService', () => ({
  getSrpeByDateRange: (...args: unknown[]) => getSrpeByDateRangeMock(...args),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: (...args: unknown[]) => getCoachTeamsMock(...args),
  getTeamMembers: (...args: unknown[]) => getTeamMembersMock(...args),
  syncCoachAthleteAccess: (...args: unknown[]) => syncCoachAthleteAccessMock(...args),
}));

import { getAthleteStatsDashboard } from '@/services/athleteStatsService';

function wellnessLog(date: string, metrics: Record<string, unknown>) {
  return {
    id: date,
    userId: 'athlete-self',
    date,
    dateEpochDay: 20522,
    timestamp: { seconds: 1 },
    ...metrics,
  };
}

function srpeLog(date: string, rpe: number, durationMinutes: number) {
  return {
    id: date,
    userId: 'athlete-self',
    date,
    dateEpochDay: 20522,
    timestamp: { seconds: 1 },
    rpe,
    durationMinutes,
    sessionLoad: rpe * durationMinutes,
  };
}

describe('athleteStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getWellnessByDateRangeMock.mockResolvedValue([
      wellnessLog('2026-03-10', {
        sleepQuality: 6,
        fatigue: 2,
        muscleSoreness: 2,
        stress: 2,
        mood: 6,
        readiness: 4,
      }),
    ]);
    getSrpeByDateRangeMock.mockResolvedValue([
      srpeLog('2026-03-10', 7, 60),
    ]);
  });

  it('fetches wellness and sRPE stats only for the signed-in user', async () => {
    const data = await getAthleteStatsDashboard({
      selectedDate: '2026-03-10',
      viewMode: 'day',
    });

    expect(getWellnessByDateRangeMock).toHaveBeenCalledWith('athlete-self', '2026-02-10', '2026-03-15');
    expect(getSrpeByDateRangeMock).toHaveBeenCalledWith('athlete-self', '2026-02-16', '2026-03-15');
    expect(getCoachTeamsMock).not.toHaveBeenCalled();
    expect(getTeamMembersMock).not.toHaveBeenCalled();
    expect(syncCoachAthleteAccessMock).not.toHaveBeenCalled();
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].athleteId).toBe('athlete-self');
    expect(data.rows[0].dailySrpe.sessionLoad).toBe(420);
  });
});
