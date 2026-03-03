import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'coach-1' } })),
}));

jest.mock('@/services/firebase/firebase', () => ({
  db: {},
}));

jest.mock('@/services/teamService', () => ({
  getCoachTeams: jest.fn(async () => [{ id: 'team-1' }]),
  getTeamMembers: jest.fn(async () => [
    {
      id: 'athlete-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
    {
      id: 'athlete-2',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
    },
  ]),
  syncCoachAthleteAccess: jest.fn(async () => undefined),
}));

jest.mock('@/services/firebase/workouts', () => ({
  getUserWorkouts: jest.fn(async (userId: string) => {
    if (userId === 'athlete-1') {
      return [
        {
          id: 'session-1',
          userId,
          date: '2026-03-01T09:00:00.000Z',
          status: 'completed',
          notes: 'Recovery day',
          exercises: [],
          totalVolume: 0,
        },
      ];
    }

    return [
      {
        id: 'session-2',
        userId,
        date: '2026-03-01T10:00:00.000Z',
        status: 'completed',
        notes: '',
        exercises: [],
        totalVolume: 0,
      },
    ];
  }),
}));

jest.mock('@/services/exportService', () => ({
  downloadCSV: jest.fn(),
}));

jest.mock('firebase/firestore', () => {
  const Timestamp = {
    fromDate: (date: Date) => ({ toDate: () => date }),
  };

  const collection = (_db: unknown, ...segments: string[]) => ({ segments, kind: 'collection' });
  const query = (ref: any, ...constraints: any[]) => ({ ref, constraints, kind: 'query' });
  const where = (...args: any[]) => ({ type: 'where', args });
  const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
  const limit = (value: number) => ({ type: 'limit', value });

  const emptySnapshot = { docs: [] as any[], forEach: (_fn: (doc: any) => void) => undefined };

  const getDocs = jest.fn(async (refOrQuery: any) => {
    const base = refOrQuery?.ref ?? refOrQuery;
    const segments: string[] = Array.isArray(base?.segments) ? base.segments : [];

    if (segments[0] === 'users' && segments[2] === 'exercises') {
      const athleteId = segments[1];
      const baseDate = athleteId === 'athlete-1'
        ? new Date('2026-03-01T09:15:00.000Z')
        : new Date('2026-03-01T10:15:00.000Z');

      return {
        docs: [
          {
            id: `log-${athleteId}`,
            data: () => ({
              exerciseName: athleteId === 'athlete-1' ? 'Tempo Run' : 'Intervals',
              activityType: 'endurance',
              timestamp: { toDate: () => baseDate },
              sets: [{ reps: 1, weight: 0 }],
              notes: athleteId === 'athlete-1' ? 'Easy pace' : 'Hard effort',
            }),
          },
        ],
      };
    }

    if (segments[0] === 'users' && (segments[2] === 'activities' || segments[2] === 'strengthExercises')) {
      return emptySnapshot;
    }

    return emptySnapshot;
  });

  const doc = (_db: unknown, ...segments: string[]) => ({ segments, kind: 'doc' });
  const getDoc = jest.fn(async () => ({ exists: () => false, data: () => ({}) }));

  return {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
  };
});

import { exportAthleteSessionsCsv, exportAllAthletesSessionsCsv, invalidateCoachAccessCache } from '@/services/coachService';

const mockedExportService = jest.requireMock('@/services/exportService') as {
  downloadCSV: jest.Mock;
};

describe('coachService CSV exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCoachAccessCache();
  });

  it('includes athleteName and athleteId on all exercise rows and keeps empty-session rows', async () => {
    const result = await exportAthleteSessionsCsv('athlete-1');

    expect(result.athleteName).toBe('Ada Lovelace');
    expect(result.rowCount).toBeGreaterThanOrEqual(2);

    const [rows] = mockedExportService.downloadCSV.mock.calls[0] as [Array<Record<string, any>>, string[], string];
    const exerciseRows = rows.filter((row) => row.rowType === 'exercise');
    const sessionRows = rows.filter((row) => row.rowType === 'session');

    expect(exerciseRows.length).toBeGreaterThan(0);
    exerciseRows.forEach((row) => {
      expect(row.athleteId).toBe('athlete-1');
      expect(row.athleteName).toBe('Ada Lovelace');
      expect(row.exerciseName).toBeTruthy();
    });

    expect(sessionRows.length).toBeGreaterThan(0);
    expect(sessionRows[0].sessionId).toBe('session-1');
  });

  it('exports all athletes into one CSV with athlete identity on exercise rows', async () => {
    const result = await exportAllAthletesSessionsCsv();

    expect(result.athleteCount).toBe(2);
    expect(result.rowCount).toBeGreaterThanOrEqual(4);

    const [rows] = mockedExportService.downloadCSV.mock.calls[0] as [Array<Record<string, any>>, string[], string];
    const exerciseRows = rows.filter((row) => row.rowType === 'exercise');
    const athleteNames = new Set(exerciseRows.map((row) => row.athleteName));
    const athleteIds = new Set(exerciseRows.map((row) => row.athleteId));

    expect(athleteNames.has('Ada Lovelace')).toBe(true);
    expect(athleteNames.has('Grace Hopper')).toBe(true);
    expect(athleteIds.has('athlete-1')).toBe(true);
    expect(athleteIds.has('athlete-2')).toBe(true);
  });
});
