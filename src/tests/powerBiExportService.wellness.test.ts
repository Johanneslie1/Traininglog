import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'coach-1' } })),
}));

jest.mock('@/services/exportService', () => ({
  exportData: jest.fn(async () => ({ sessions: [], exerciseLogs: [], sets: [] })),
  getWellnessExportRows: jest.fn(async () => []),
}));

jest.mock('@/services/coachService', () => ({
  verifyCoachAthleteRelationship: jest.fn(async () => true),
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(async () => []),
  getTeamMembers: jest.fn(async () => []),
  syncCoachAthleteAccess: jest.fn(async () => undefined),
}));

jest.mock('@/services/wellnessService', () => ({
  getWellnessByDateRange: jest.fn(async () => []),
}));

jest.mock('@/services/srpeService', () => ({
  getSrpeByDateRange: jest.fn(async () => []),
}));

import { buildPowerBiFiles } from '@/services/powerBiExportService';

const mockedExportService = jest.requireMock('@/services/exportService') as {
  exportData: any;
  getWellnessExportRows: any;
};
const mockedTeamService = jest.requireMock('@/services/teamService') as {
  getCoachTeams: any;
  getTeamMembers: any;
};
const mockedCoachService = jest.requireMock('@/services/coachService') as {
  verifyCoachAthleteRelationship: any;
};
const mockedSrpeService = jest.requireMock('@/services/srpeService') as {
  getSrpeByDateRange: any;
};

describe('powerBiExportService wellness export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedExportService.exportData.mockResolvedValue({ sessions: [], exerciseLogs: [], sets: [] });
    mockedTeamService.getCoachTeams.mockResolvedValue([]);
    mockedTeamService.getTeamMembers.mockResolvedValue([]);
    mockedCoachService.verifyCoachAthleteRelationship.mockResolvedValue(true);
    mockedSrpeService.getSrpeByDateRange.mockResolvedValue([]);
  });

  it('includes readiness in fact_wellness.csv for self exports', async () => {
    mockedExportService.getWellnessExportRows.mockResolvedValue([
      {
        athleteId: 'user-42',
        athleteName: 'Test Athlete',
        loggedDate: '2026-03-10',
        sleepQuality: 8,
        fatigue: 3,
        muscleSoreness: 2,
        stress: 4,
        mood: 7,
        readiness: 9,
        notes: 'ready to push',
      },
    ]);

    const result = await buildPowerBiFiles(
      { scope: 'self', fromDate: '2026-03-01' },
      {
        id: 'user-42',
        firstName: 'Test',
        lastName: 'Athlete',
        role: 'athlete',
      }
    );

    const wellnessFile = result.files.find((file) => file.name === 'fact_wellness.csv');
    const csv = wellnessFile?.content.replace(/^\uFEFF/, '');

    expect(csv).toContain(
      'athlete_id,athlete_name,logged_date,sleep_quality,fatigue,muscle_soreness,stress,mood,readiness,notes'
    );
    expect(csv).toContain('user-42,Test Athlete,2026-03-10,8,3,2,4,7,9,ready to push');
  });

  it('passes the selected start and end dates to training and wellness exports', async () => {
    await buildPowerBiFiles(
      { scope: 'self', fromDate: '2026-03-01', toDate: '2026-03-15' },
      {
        id: 'user-42',
        firstName: 'Test',
        lastName: 'Athlete',
        role: 'athlete',
      }
    );

    expect(mockedExportService.exportData).toHaveBeenCalledWith(
      'user-42',
      expect.objectContaining({
        startDate: new Date('2026-03-01T00:00:00'),
        endDate: new Date('2026-03-15T23:59:59.999'),
      })
    );
    expect(mockedExportService.getWellnessExportRows).toHaveBeenCalledWith(
      { athleteId: 'user-42', athleteName: 'Test Athlete' },
      '2026-03-01',
      '2026-03-15'
    );
    expect(mockedSrpeService.getSrpeByDateRange).toHaveBeenCalledWith(
      'user-42',
      '2026-03-01',
      '2026-03-15'
    );
  });

  it('includes football load rows from sRPE logs next to wellness data', async () => {
    mockedSrpeService.getSrpeByDateRange.mockResolvedValue([
      {
        id: '2026-03-10',
        userId: 'user-42',
        date: '2026-03-10',
        rpe: 8,
        durationMinutes: 75,
        sessionLoad: 600,
      },
    ]);

    const result = await buildPowerBiFiles(
      { scope: 'self', fromDate: '2026-03-01', toDate: '2026-03-15' },
      {
        id: 'user-42',
        firstName: 'Test',
        lastName: 'Athlete',
        role: 'athlete',
      }
    );

    const footballLoadFile = result.files.find((file) => file.name === 'fact_football_load.csv');
    const csv = footballLoadFile?.content.replace(/^\uFEFF/, '');

    expect(result.footballLoadCount).toBe(1);
    expect(csv).toContain('athlete_id,athlete_name,logged_date,rpe,duration_min,session_load');
    expect(csv).toContain('user-42,Test Athlete,2026-03-10,8,75,600');
  });

  it('includes wellness rows for a selected coach athlete', async () => {
    mockedTeamService.getCoachTeams.mockResolvedValue([{ id: 'team-1', name: 'U19' }]);
    mockedTeamService.getTeamMembers.mockResolvedValue([
      { id: 'athlete-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', status: 'active' },
    ]);
    mockedExportService.getWellnessExportRows.mockResolvedValue([
      {
        athleteId: 'athlete-1',
        athleteName: 'Ada Lovelace',
        loggedDate: '2026-03-11',
        sleepQuality: 7,
        fatigue: 4,
        muscleSoreness: 3,
        stress: '',
        mood: 8,
        readiness: 6,
        notes: '',
      },
    ]);

    const result = await buildPowerBiFiles(
      { scope: 'athlete', targetAthleteId: 'athlete-1', fromDate: '2026-03-01' },
      {
        id: 'coach-1',
        firstName: 'Coach',
        lastName: 'One',
        role: 'coach',
      }
    );

    const wellnessFile = result.files.find((file) => file.name === 'fact_wellness.csv');
    const csv = wellnessFile?.content.replace(/^\uFEFF/, '');

    expect(mockedExportService.getWellnessExportRows).toHaveBeenCalledWith(
      { athleteId: 'athlete-1', athleteName: 'Ada Lovelace' },
      '2026-03-01',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
    expect(csv).toContain('athlete-1,Ada Lovelace,2026-03-11,7,4,3,,8,6,');
  });

  it('exports multiple selected coach athletes only', async () => {
    mockedTeamService.getCoachTeams.mockResolvedValue([{ id: 'team-1', name: 'U19' }]);
    mockedTeamService.getTeamMembers.mockResolvedValue([
      { id: 'athlete-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', status: 'active' },
      { id: 'athlete-2', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', status: 'active' },
      { id: 'athlete-3', firstName: 'Katherine', lastName: 'Johnson', email: 'kat@example.com', status: 'active' },
    ]);

    const result = await buildPowerBiFiles(
      { scope: 'athletes', targetAthleteIds: ['athlete-1', 'athlete-3'], fromDate: '2026-03-01' },
      {
        id: 'coach-1',
        firstName: 'Coach',
        lastName: 'One',
        role: 'coach',
      }
    );

    const athleteFile = result.files.find((file) => file.name === 'dim_athlete.csv');
    const csv = athleteFile?.content.replace(/^\uFEFF/, '');

    expect(result.athleteCount).toBe(2);
    expect(mockedExportService.exportData).toHaveBeenCalledWith('athlete-1', expect.any(Object));
    expect(mockedExportService.exportData).toHaveBeenCalledWith('athlete-3', expect.any(Object));
    expect(mockedExportService.exportData).not.toHaveBeenCalledWith('athlete-2', expect.any(Object));
    expect(csv).toContain('athlete-1,Ada Lovelace,athlete,U19');
    expect(csv).toContain('athlete-3,Katherine Johnson,athlete,U19');
  });

  it('exports one selected team and skips inaccessible athletes', async () => {
    mockedTeamService.getCoachTeams.mockResolvedValue([
      { id: 'team-1', name: 'U19' },
      { id: 'team-2', name: 'U21' },
    ]);
    mockedTeamService.getTeamMembers.mockImplementation(async (teamId: string) => (
      teamId === 'team-1'
        ? [
          { id: 'athlete-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', status: 'active' },
          { id: 'athlete-2', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', status: 'active' },
        ]
        : [
          { id: 'athlete-3', firstName: 'Katherine', lastName: 'Johnson', email: 'kat@example.com', status: 'active' },
        ]
    ));
    mockedCoachService.verifyCoachAthleteRelationship.mockImplementation(async (athleteId: string) => athleteId !== 'athlete-2');

    const result = await buildPowerBiFiles(
      { scope: 'team', targetTeamId: 'team-1' },
      {
        id: 'coach-1',
        firstName: 'Coach',
        lastName: 'One',
        role: 'coach',
      }
    );

    const athleteFile = result.files.find((file) => file.name === 'dim_athlete.csv');
    const csv = athleteFile?.content.replace(/^\uFEFF/, '');

    expect(result.athleteCount).toBe(1);
    expect(mockedExportService.exportData).toHaveBeenCalledWith('athlete-1', expect.any(Object));
    expect(mockedExportService.exportData).not.toHaveBeenCalledWith('athlete-2', expect.any(Object));
    expect(mockedExportService.exportData).not.toHaveBeenCalledWith('athlete-3', expect.any(Object));
    expect(csv).toContain('athlete-1,Ada Lovelace,athlete,U19');
  });
});
