// @ts-nocheck

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'coach-1' } })),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(),
  getTeamMembers: jest.fn(),
  syncCoachAthleteAccess: jest.fn(),
}));

jest.mock('@/services/wellnessService', () => ({
  getWellnessByDateRange: jest.fn(),
}));

jest.mock('@/services/srpeService', () => ({
  getSrpeByDateRange: jest.fn(),
}));

import { buildCoachRatingsDashboardData, calculateWellnessScore } from '@/services/coachRatingsService';

const team = {
  id: 'team-1',
  name: 'First Team',
  description: '',
  coachId: 'coach-1',
  coachName: 'Coach',
  inviteCode: 'ABC123',
  createdAt: '2026-03-01',
  updatedAt: '2026-03-01',
  isActive: true,
};

const secondTeam = {
  ...team,
  id: 'team-2',
  name: 'Second Team',
};

const memberA = {
  id: 'athlete-a',
  teamId: 'team-1',
  email: 'a@example.com',
  firstName: 'Ada',
  lastName: 'Athlete',
  joinedAt: '2026-03-01',
  status: 'active',
};

const memberB = {
  id: 'athlete-b',
  teamId: 'team-1',
  email: 'b@example.com',
  firstName: 'Ben',
  lastName: 'Athlete',
  joinedAt: '2026-03-01',
  status: 'active',
};

function wellnessLog(userId, date, metrics) {
  return {
    id: date,
    userId,
    date,
    dateEpochDay: 20522,
    timestamp: { seconds: 1 },
    ...metrics,
  };
}

function srpeLog(userId, date, rpe, durationMinutes) {
  return {
    id: date,
    userId,
    date,
    dateEpochDay: 20522,
    timestamp: { seconds: 1 },
    rpe,
    durationMinutes,
    sessionLoad: rpe * durationMinutes,
  };
}

describe('coachRatingsService aggregation', () => {
  it('calculates a wellness score from available metrics only', () => {
    expect(calculateWellnessScore(wellnessLog('athlete-a', '2026-03-10', {
      sleepQuality: 6,
      readiness: 4,
    }))).toBe(5.8);
  });

  it('computes daily values, weekly averages, weekly totals, and missing counts', () => {
    const data = buildCoachRatingsDashboardData({
      selectedDate: '2026-03-10',
      teamsWithMembers: [{ team, members: [memberA, memberB] }],
      wellnessLogsByAthleteId: new Map([
        ['athlete-a', [
          wellnessLog('athlete-a', '2026-03-10', {
            sleepQuality: 6,
            fatigue: 2,
            muscleSoreness: 2,
            stress: 2,
            mood: 6,
            readiness: 4,
            notes: 'Felt sharp before training',
          }),
          wellnessLog('athlete-a', '2026-03-11', {
            sleepQuality: 5,
            fatigue: 4,
            muscleSoreness: 4,
            stress: 4,
            mood: 5,
            readiness: 3,
          }),
        ]],
      ]),
      srpeLogsByAthleteId: new Map([
        ['athlete-a', [
          srpeLog('athlete-a', '2026-03-10', 7, 60),
          srpeLog('athlete-a', '2026-03-11', 5, 40),
        ]],
      ]),
    });

    const athleteA = data.rows.find((row) => row.athleteId === 'athlete-a');
    const athleteB = data.rows.find((row) => row.athleteId === 'athlete-b');

    expect(data.weekStartDate).toBe('2026-03-09');
    expect(data.weekEndDate).toBe('2026-03-15');
    expect(athleteA?.dailyWellness.score).toBe(5.9);
    expect(athleteA?.dailyWellness.metricValues).toMatchObject({
      sleepQuality: 6,
      fatigue: 2,
      muscleSoreness: 2,
      stress: 2,
      mood: 6,
      readiness: 4,
    });
    expect(athleteA?.dailyWellness.hasNotes).toBe(true);
    expect(athleteA?.dailyWellness.notes).toBe('Felt sharp before training');
    expect(athleteA?.weeklyWellness.average).toBe(5.1);
    expect(athleteA?.weeklyWellness.total).toBe(10.2);
    expect(athleteA?.dailySrpe.sessionLoad).toBe(420);
    expect(athleteA?.weeklySrpe.averageRpe).toBe(6);
    expect(athleteA?.weeklySrpe.totalLoad).toBe(620);
    expect(athleteB?.dailyWellness.submitted).toBe(false);
    expect(athleteB?.dailySrpe.submitted).toBe(false);
    expect(data.summary.missingDailyWellnessCount).toBe(1);
    expect(data.summary.missingDailySrpeCount).toBe(1);
    expect(data.summary.weeklySrpeTotalLoad).toBe(620);
  });

  it('deduplicates athletes across teams while retaining team names', () => {
    const data = buildCoachRatingsDashboardData({
      selectedDate: '2026-03-10',
      teamsWithMembers: [
        { team, members: [memberA] },
        { team: secondTeam, members: [{ ...memberA, teamId: 'team-2' }] },
      ],
      wellnessLogsByAthleteId: new Map(),
      srpeLogsByAthleteId: new Map(),
    });

    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].teamNames).toEqual(['First Team', 'Second Team']);
  });

  it('scopes rows to the selected team when a team id is provided', () => {
    const data = buildCoachRatingsDashboardData({
      selectedDate: '2026-03-10',
      selectedTeamId: 'team-2',
      teamsWithMembers: [
        { team, members: [memberA] },
        { team: secondTeam, members: [{ ...memberB, teamId: 'team-2' }] },
      ],
      wellnessLogsByAthleteId: new Map([
        ['athlete-a', [wellnessLog('athlete-a', '2026-03-10', { readiness: 5 })]],
        ['athlete-b', [wellnessLog('athlete-b', '2026-03-10', { readiness: 4 })]],
      ]),
      srpeLogsByAthleteId: new Map(),
    });

    expect(data.selectedTeamId).toBe('team-2');
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].athleteId).toBe('athlete-b');
    expect(data.rows[0].teamNames).toEqual(['Second Team']);
    expect(data.summary.athleteCount).toBe(1);
  });

  it('flags clear team outliers without treating missing data as an outlier', () => {
    const data = buildCoachRatingsDashboardData({
      selectedDate: '2026-03-10',
      teamsWithMembers: [{ team, members: [memberA, memberB] }],
      wellnessLogsByAthleteId: new Map([
        ['athlete-a', [
          wellnessLog('athlete-a', '2026-03-10', {
            sleepQuality: 6,
            fatigue: 2,
            muscleSoreness: 2,
            stress: 2,
            mood: 6,
            readiness: 4,
          }),
        ]],
        ['athlete-b', [
          wellnessLog('athlete-b', '2026-03-10', {
            sleepQuality: 2,
            fatigue: 6,
            muscleSoreness: 6,
            stress: 6,
            mood: 2,
            readiness: 1,
          }),
        ]],
      ]),
      srpeLogsByAthleteId: new Map([
        ['athlete-a', [srpeLog('athlete-a', '2026-03-10', 5, 45)]],
        ['athlete-b', [srpeLog('athlete-b', '2026-03-10', 9, 120)]],
      ]),
    });

    const athleteA = data.rows.find((row) => row.athleteId === 'athlete-a');
    const athleteB = data.rows.find((row) => row.athleteId === 'athlete-b');

    expect(athleteA?.status).toBe('good');
    expect(athleteB?.status).toBe('outlier');
    expect(athleteB?.outlierReasons).toEqual(
      expect.arrayContaining(['Low daily wellness', 'Very high daily sRPE'])
    );
    expect(data.summary.outlierCount).toBe(1);
  });
});
