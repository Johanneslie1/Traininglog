import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'coach-1' } })),
}));

const firestoreGetDocsMock = jest.fn(async (_target?: unknown) => ({ docs: [] }));

jest.mock('firebase/firestore', () => ({
  collection: (...segments: unknown[]) => ({
    path: segments.map((segment) => {
      if (segment && typeof segment === 'object' && 'path' in (segment as Record<string, unknown>)) {
        return String((segment as { path: string }).path);
      }
      return String(segment);
    }).join('/'),
  }),
  getDocs: (target: unknown) => firestoreGetDocsMock(target),
  query: (collectionRef: unknown, ...constraints: unknown[]) => ({ collectionRef, constraints }),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
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
  getSportsLoadSessionsByDateRange: jest.fn(async () => []),
}));

jest.mock('@/services/exerciseDatabaseService', () => ({
  getMergedExercisesForExport: jest.fn(async () => []),
}));

import { buildPowerBiFiles } from '@/services/powerBiExportService';
import { ActivityType } from '@/types/activityTypes';
import type { Exercise } from '@/types/exercise';

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
  getSportsLoadSessionsByDateRange: any;
};
const mockedExerciseDatabaseService = jest.requireMock('@/services/exerciseDatabaseService') as {
  getMergedExercisesForExport: any;
};

const currentAthlete = {
  id: 'user-42',
  firstName: 'Test',
  lastName: 'Athlete',
  role: 'athlete' as const,
};

const getFileContent = (
  result: Awaited<ReturnType<typeof buildPowerBiFiles>>,
  fileName: string
): string => result.files.find((file) => file.name === fileName)?.content.replace(/^\uFEFF/, '') ?? '';

describe('powerBiExportService wellness export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedExportService.exportData.mockResolvedValue({ sessions: [], exerciseLogs: [], sets: [] });
    mockedTeamService.getCoachTeams.mockResolvedValue([]);
    mockedTeamService.getTeamMembers.mockResolvedValue([]);
    mockedCoachService.verifyCoachAthleteRelationship.mockResolvedValue(true);
    mockedSrpeService.getSrpeByDateRange.mockResolvedValue([]);
    mockedSrpeService.getSportsLoadSessionsByDateRange.mockResolvedValue([]);
    mockedExerciseDatabaseService.getMergedExercisesForExport.mockResolvedValue([]);
    firestoreGetDocsMock.mockResolvedValue({ docs: [] });
  });

  it('includes readiness in fact_wellness.csv for self exports', async () => {
    mockedExportService.getWellnessExportRows.mockResolvedValue([
      {
        athleteId: 'user-42',
        athleteName: 'Test Athlete',
        loggedDate: '2026-03-10',
        sleepQuality: 5,
        fatigue: 3,
        muscleSoreness: 2,
        stress: 4,
        mood: 5,
        readiness: 5,
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
    expect(csv).toContain('user-42,Test Athlete,2026-03-10,5,3,2,4,5,5,ready to push');
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
    expect(mockedSrpeService.getSportsLoadSessionsByDateRange).toHaveBeenCalledWith(
      'user-42',
      '2026-03-01',
      '2026-03-15'
    );
  });

  it('assigns deterministic fallback session ids to gym sets and includes gym sessions', async () => {
    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          sessionId: '',
          sessionType: 'main',
          exerciseLogId: 'bench-log',
          exerciseName: 'Bench Press',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          exerciseNumber: 1,
          setNumber: 1,
          reps: 5,
          weight: 100,
          rpe: 8,
        },
        {
          sessionId: '',
          sessionType: 'main',
          exerciseLogId: 'bench-log',
          exerciseName: 'Bench Press',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          exerciseNumber: 1,
          setNumber: 2,
          reps: 5,
          weight: 105,
          rpe: 8,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const gymCsv = getFileContent(result, 'fact_gym_sets.csv');
    const sessionCsv = getFileContent(result, 'fact_sessions.csv');

    expect(gymCsv).toContain('default-user-42-2026-03-10-main');
    expect(result.gymSetCount).toBe(2);
    expect(result.sessionCount).toBe(1);
    expect(sessionCsv).toContain(
      'user-42,Test Athlete,default-user-42-2026-03-10-main,Session 1,main,2026-03-10,2026-W11,resistance,false,,2,0,0,2,10,1025'
    );
  });

  it('populates activity session duration and computed session load when available', async () => {
    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          sessionId: 'activity-session-1',
          sessionType: 'main',
          exerciseLogId: 'run-log',
          exerciseName: 'Easy Run',
          exerciseType: 'endurance',
          activityType: 'endurance',
          loggedDate: '2026-03-10',
          setNumber: 1,
          durationSec: 1800,
          distanceMeters: 5000,
          rpe: 7,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const sessionLines = getFileContent(result, 'fact_sessions.csv').split('\n');

    expect(sessionLines).toContain(
      'user-42,Test Athlete,activity-session-1,Session 1,main,2026-03-10,2026-W11,endurance,false,30,0,1,0,1,,,5000,,,,,,,,,7,,,210'
    );
  });

  it('exports each sports load session and every supported session metric', async () => {
    mockedSrpeService.getSportsLoadSessionsByDateRange.mockResolvedValue([
      {
        id: 'session-1',
        userId: 'user-42',
        date: '2026-03-10',
        sportType: 'basketball',
        sportName: 'Basketball',
        rpe: 8,
        durationMinutes: 75,
        sessionLoad: 600,
        distanceMeters: 9200,
        calories: 710,
        averageHeartRate: 151,
        maxHeartRate: 184,
        notes: 'High tempo small-sided game',
      },
      {
        id: 'session-2',
        userId: 'user-42',
        date: '2026-03-10',
        sportType: 'football',
        sportName: 'Football',
        rpe: 6,
        durationMinutes: 30,
        sessionLoad: 180,
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
    const lines = csv?.split('\n') ?? [];

    const sportsLoadFile = result.files.find((file) => file.name === 'fact_sports_load.csv');
    const sportsCsv = sportsLoadFile?.content.replace(/^\uFEFF/, '');

    expect(result.sportsLoadCount).toBe(2);
    expect(result.footballLoadCount).toBe(2);
    expect(sportsCsv).toBe(csv);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('athlete_id,athlete_name,session_id,session_name,logged_date,sport_type,sport_name,rpe,duration_min,session_load,distance_meters,calories,avg_hr,max_hr,notes');
    expect(lines.filter((line) => line.includes(',2026-03-10,'))).toHaveLength(2);
    expect(lines).toContain('user-42,Test Athlete,session-1,Basketball,2026-03-10,basketball,Basketball,8,75,600,9200,710,151,184,High tempo small-sided game');
    expect(lines).toContain('user-42,Test Athlete,session-2,Football,2026-03-10,football,Football,6,30,180,,,,,');
  });

  it('exports legacy daily sRPE rows when no per-session sports load exists for that date', async () => {
    mockedSrpeService.getSrpeByDateRange.mockResolvedValue([
      {
        id: '2026-03-12',
        userId: 'user-42',
        date: '2026-03-12',
        sportType: 'football',
        sportName: 'Football',
        rpe: 7,
        durationMinutes: 60,
        sessionLoad: 420,
        distanceMeters: 7800,
        calories: 640,
        averageHeartRate: 146,
        maxHeartRate: 181,
        notes: 'Legacy daily entry',
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
    expect(csv).toContain('user-42,Test Athlete,legacy-2026-03-12,Football,2026-03-12,football,Football,7,60,420,7800,640,146,181,Legacy daily entry');
  });

  it('keeps sports-load metadata counts logical while emitting the compatibility alias', async () => {
    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          sessionId: '',
          sessionType: 'main',
          exerciseLogId: 'mobility-log',
          exerciseName: 'Meditation',
          exerciseType: 'other',
          activityType: 'resistance',
          loggedDate: '2026-03-12',
          durationSec: 600,
        },
      ],
    });
    mockedSrpeService.getSportsLoadSessionsByDateRange.mockResolvedValue([
      {
        id: 'sports-1',
        userId: 'user-42',
        date: '2026-03-12',
        sportType: 'basketball',
        sportName: 'Basketball',
        rpe: 6,
        durationMinutes: 45,
        sessionLoad: 270,
      },
    ]);

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const meta = JSON.parse(getFileContent(result, 'export_meta.json')) as { row_count: number };

    expect(result.files.some((file) => file.name === 'fact_sports_load.csv')).toBe(true);
    expect(result.files.some((file) => file.name === 'fact_football_load.csv')).toBe(true);
    expect(result.activityCount).toBe(1);
    expect(result.gymSetCount).toBe(0);
    expect(result.sportsLoadCount).toBe(1);
    expect(meta.row_count).toBe(
      result.gymSetCount +
        result.activityCount +
        result.sessionCount +
        result.wellnessCount +
        result.sportsLoadCount
    );
  });

  it('normalizes obvious activity classifications and exercise dimension keys at export time', async () => {
    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          exerciseLogId: 'basketball-log',
          exerciseName: 'Basketball',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          durationSec: 3600,
          rpe: 6,
        },
        {
          exerciseLogId: 'jump-log',
          exerciseName: 'High Plyometric Box Jump',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-11',
          reps: 5,
          height: 60,
          rpe: 8,
        },
        {
          exerciseLogId: 'row-log',
          exerciseName: 'Uprigth Row',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-12',
          reps: 10,
          weight: 20,
        },
        {
          exerciseLogId: 'soccer-log-a',
          exerciseName: 'Soccer',
          exerciseType: 'endurance',
          activityType: 'endurance',
          loggedDate: '2026-03-13',
          durationSec: 3600,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const activityCsv = getFileContent(result, 'fact_activity.csv');
    const gymCsv = getFileContent(result, 'fact_gym_sets.csv');
    const dimExerciseCsv = getFileContent(result, 'dim_exercise.csv');

    expect(activityCsv).toContain('basketball__sport,Basketball,sport');
    expect(activityCsv).toContain('high_plyometric_box_jump__speedagility,High Plyometric Box Jump,speedAgility');
    expect(activityCsv).toContain('soccer__sport,Soccer,sport');
    expect(gymCsv).toContain('upright_row__resistance,Upright Row');
    expect(dimExerciseCsv).toContain('basketball__sport,Basketball,strength,sport');
    expect(dimExerciseCsv).toContain('soccer__sport,Soccer,endurance,sport');
  });

  it('includes unused catalog exercises and unmatched logged names in dim_exercise', async () => {
    mockedExerciseDatabaseService.getMergedExercisesForExport.mockResolvedValue([
      {
        id: 'bench-press-1',
        name: 'Bench Press',
        description: 'A compound chest exercise performed on a flat bench.',
        category: 'compound',
        type: 'strength',
        activityType: ActivityType.RESISTANCE,
        difficulty: 'intermediate',
        equipment: ['barbell', 'bench'],
        instructions: [],
        primaryMuscles: ['chest'],
        secondaryMuscles: ['shoulders', 'triceps'],
        isDefault: true,
      },
      {
        id: 'unused-rdl',
        name: 'Romanian Deadlift',
        description: 'Hip hinge',
        category: 'compound',
        type: 'strength',
        activityType: ActivityType.RESISTANCE,
        difficulty: 'intermediate',
        equipment: ['barbell'],
        instructions: [],
        primaryMuscles: ['hamstrings', 'glutes'],
        secondaryMuscles: ['lower_back'],
        isDefault: true,
      },
    ] satisfies Exercise[]);

    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          exerciseLogId: 'bench-log',
          exerciseName: 'Bench Press',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          reps: 5,
          weight: 100,
        },
        {
          exerciseLogId: 'mystery-log',
          exerciseName: 'Mystery Curl',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          reps: 12,
          weight: 15,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const dimExerciseCsv = getFileContent(result, 'dim_exercise.csv');
    const gymCsv = getFileContent(result, 'fact_gym_sets.csv');
    const header = dimExerciseCsv.split('\n')[0];

    expect(header).toBe(
      'exercise_id,exercise_name,exercise_type,activity_type,catalog_id,is_custom,in_catalog,category,difficulty,primary_muscles,secondary_muscles,equipment,laterality,exercise_factor_category,primary_movement_pattern,secondary_movement_pattern'
    );
    expect(dimExerciseCsv).toContain(
      'bench_press__resistance,Bench Press,strength,resistance,bench-press-1,false,true,compound,intermediate,chest,shoulders|triceps,barbell|bench,bilateral,bilateral_compound,horizontal_push,'
    );
    expect(dimExerciseCsv).toContain(
      'romanian_deadlift__resistance,Romanian Deadlift,strength,resistance,unused-rdl,false,true,compound,intermediate,hamstrings|glutes,lower_back,barbell,bilateral,bilateral_compound,hinge,'
    );
    expect(dimExerciseCsv).toContain(
      'mystery_curl__resistance,Mystery Curl,strength,resistance,,false,false,,,,,,bilateral,isolation_accessory,horizontal_pull,'
    );
    expect(gymCsv).toContain('bench_press__resistance,Bench Press');
    expect(gymCsv).not.toContain('romanian_deadlift__resistance');
  });

  it('enriches aliased logged names from the catalog while keeping the logged exercise_id', async () => {
    mockedExerciseDatabaseService.getMergedExercisesForExport.mockResolvedValue([
      {
        id: 'squat-1',
        name: 'Squats',
        description: 'A fundamental compound exercise for lower body strength.',
        category: 'compound',
        type: 'strength',
        activityType: ActivityType.RESISTANCE,
        difficulty: 'intermediate',
        equipment: ['barbell', 'rack'],
        instructions: [],
        primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
        secondaryMuscles: ['core'],
        isDefault: true,
      },
    ] satisfies Exercise[]);

    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          exerciseLogId: 'squat-log',
          exerciseName: 'Squat',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-10',
          reps: 5,
          weight: 120,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const dimExerciseCsv = getFileContent(result, 'dim_exercise.csv');
    const gymCsv = getFileContent(result, 'fact_gym_sets.csv');

    expect(gymCsv).toContain('squat__resistance,Squat');
    expect(dimExerciseCsv).toContain(
      'squat__resistance,Squat,strength,resistance,squat-1,false,true,compound,intermediate,quadriceps|glutes|hamstrings,core,barbell|rack,bilateral,bilateral_compound,squat,'
    );
    expect(dimExerciseCsv).toContain('squats__resistance,Squats,strength,resistance,squat-1,false,true');
  });

  it('joins activity facts to dim_exercise on exercise_id', async () => {
    mockedExportService.exportData.mockResolvedValue({
      sessions: [],
      exerciseLogs: [],
      sets: [
        {
          exerciseLogId: 'jump-log',
          exerciseName: 'High Plyometric Box Jump',
          exerciseType: 'strength',
          activityType: 'resistance',
          loggedDate: '2026-03-11',
          reps: 5,
          height: 60,
        },
      ],
    });

    const result = await buildPowerBiFiles({ scope: 'self' }, currentAthlete);
    const activityCsv = getFileContent(result, 'fact_activity.csv');
    const dimExerciseCsv = getFileContent(result, 'dim_exercise.csv');

    expect(activityCsv.split('\n')[0]).toContain('exercise_log_id,exercise_id,exercise_name,activity_type');
    expect(activityCsv).toContain('high_plyometric_box_jump__speedagility,High Plyometric Box Jump,speedAgility');
    expect(dimExerciseCsv).toContain('high_plyometric_box_jump__speedagility,High Plyometric Box Jump');
    expect(dimExerciseCsv).toContain('squat');
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
        sleepQuality: 5,
        fatigue: 4,
        muscleSoreness: 3,
        stress: '',
        mood: 5,
        readiness: 4,
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
    expect(csv).toContain('athlete-1,Ada Lovelace,2026-03-11,5,4,3,,5,4,');
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
