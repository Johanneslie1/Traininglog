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
  SET_EXPORT_HEADERS: ['userId', 'exerciseLogId', 'exerciseName'],
  serializeSetForExport: jest.fn((userId: string, log: any, set: any, index: number) => ({
    userId,
    sessionId: '',
    exerciseLogId: log.id,
    exerciseName: log.exerciseName,
    exerciseType: log.collectionType,
    activityType: log.activityType,
    supersetId: log.supersetId || '',
    supersetLabel: log.supersetLabel || '',
    supersetName: log.supersetName || '',
    loggedDate: '2026-03-01',
    loggedTimestamp: log.timestamp?.toISOString?.() || '2026-03-01T09:15:00.000Z',
    setNumber: index + 1,
    reps: set?.reps ?? 0,
    weight: set?.weight ?? 0,
    duration: 0,
    distance: 0,
    durationSec: 0,
    distanceMeters: 0,
    rpe: set?.rpe ?? 0,
    rir: 0,
    restTime: 0,
    restTimeSec: 0,
    isWarmup: false,
    setVolume: (set?.reps ?? 0) * (set?.weight ?? 0),
    comment: '',
    notes: '',
    hrZone1: 0,
    hrZone2: 0,
    hrZone3: 0,
    hrZone4: 0,
    hrZone5: 0,
    averageHeartRate: 0,
    maxHeartRate: 0,
    averageHR: 0,
    maxHR: 0,
    heartRate: 0,
    calories: 0,
    height: 0,
    drillMetric: '',
    score: 0,
    opponent: '',
    performance: '',
    stretchType: '',
    intensity: 0,
    bodyPart: '',
    holdTime: 0,
    flexibility: 0,
    pace: '',
    elevation: 0
  })),
  exportData: jest.fn(async (userId: string) => {
    const isFirstAthlete = userId === 'athlete-1';
    return {
      sessions: [
        {
          userId,
          sessionId: `session-${userId}`,
          sessionDate: isFirstAthlete ? '2026-03-01T09:00:00.000Z' : '2026-03-01T10:00:00.000Z',
          startTime: '',
          endTime: '',
          notes: isFirstAthlete ? 'Recovery day' : '',
          totalVolume: 0,
          sessionRPE: 0,
          exerciseCount: 1,
          setCount: 1,
          durationMinutes: 0,
          createdAt: '',
          updatedAt: ''
        }
      ],
      exerciseLogs: [
        {
          userId,
          sessionId: '',
          exerciseLogId: `log-${userId}`,
          exerciseId: '',
          exerciseName: isFirstAthlete ? 'Tempo Run' : 'Intervals',
          supersetId: '',
          supersetLabel: '',
          supersetName: '',
          category: 'exercise',
          type: 'endurance',
          setCount: 1,
          totalReps: 1,
          maxWeight: 0,
          totalVolume: 0,
          averageRPE: 0,
          notes: isFirstAthlete ? 'Easy pace' : 'Hard effort',
          createdAt: isFirstAthlete ? '2026-03-01T09:15:00.000Z' : '2026-03-01T10:15:00.000Z'
        }
      ],
      sets: [
        {
          userId,
          sessionId: '',
          exerciseLogId: `log-${userId}`,
          exerciseName: isFirstAthlete ? 'Tempo Run' : 'Intervals',
          exerciseType: 'exercise',
          activityType: 'endurance',
          supersetId: '',
          supersetLabel: '',
          supersetName: '',
          loggedDate: '2026-03-01',
          loggedTimestamp: isFirstAthlete ? '2026-03-01T09:15:00.000Z' : '2026-03-01T10:15:00.000Z',
          setNumber: 1,
          reps: 1,
          weight: 0,
          duration: 0,
          distance: 0,
          durationSec: 0,
          distanceMeters: 0,
          rpe: 0,
          rir: 0,
          restTime: 0,
          restTimeSec: 0,
          isWarmup: false,
          setVolume: 0,
          comment: '',
          notes: isFirstAthlete ? 'Easy pace' : 'Hard effort',
          hrZone1: 0,
          hrZone2: 0,
          hrZone3: 0,
          hrZone4: 0,
          hrZone5: 0,
          averageHeartRate: 0,
          maxHeartRate: 0,
          averageHR: 0,
          maxHR: 0,
          heartRate: 0,
          calories: 0,
          height: 0,
          drillMetric: '',
          score: 0,
          opponent: '',
          performance: '',
          stretchType: '',
          intensity: 0,
          bodyPart: '',
          holdTime: 0,
          flexibility: 0,
          pace: '',
          elevation: 0
        }
      ]
    };
  }),
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
  exportData: jest.MockedFunction<
    (userId: string, options?: unknown) => Promise<{ sessions: any[]; exerciseLogs: any[]; sets: any[] }>
  >;
};
const mockedFirestore = jest.requireMock('firebase/firestore') as {
  getDoc: jest.Mock;
};

describe('coachService CSV exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCoachAccessCache();

    mockedFirestore.getDoc.mockImplementation(async (ref: any) => {
      const segments: string[] = Array.isArray(ref?.segments) ? ref.segments : [];

      if (segments[0] === 'coachAthleteAccess') {
        return {
          exists: () => true,
          data: () => ({ coachId: 'coach-1', athleteId: segments[1] || 'athlete-1' })
        };
      }

      return {
        exists: () => false,
        data: () => ({})
      };
    });
  });

  it('exports single athlete exercise logs only', async () => {
    const result = await exportAthleteSessionsCsv('athlete-1');

    expect(result.athleteName).toBe('Ada Lovelace');
    expect(result.rowCount).toBe(1);
    expect(mockedExportService.downloadCSV).toHaveBeenCalledTimes(1);

    const [exerciseLogRows, , exerciseLogsFilename] = mockedExportService.downloadCSV.mock.calls[0] as [Array<Record<string, any>>, string[], string];

    expect(exerciseLogRows.length).toBe(1);

    expect(exerciseLogsFilename).toBe('exercise_sets.csv');

    expect(exerciseLogRows[0].exerciseName).toBe('Tempo Run');
    expect(exerciseLogRows[0].setNumber).toBe(1);
  });

  it('forwards selected date range to exportData for coach export parity', async () => {
    const startDate = new Date('2026-02-24T00:00:00.000Z');
    const endDate = new Date('2026-03-02T23:59:59.999Z');

    await exportAthleteSessionsCsv('athlete-1', startDate, endDate);

    expect(mockedExportService.exportData).toHaveBeenCalledWith('athlete-1', expect.objectContaining({
      includeSessions: true,
      includeExerciseLogs: true,
      includeSets: true,
      startDate,
      endDate
    }));
  });

  it('throws explicit access error when coach-athlete access doc is missing (previously surfaced as no-data)', async () => {
    mockedFirestore.getDoc.mockImplementationOnce(async (ref: any) => {
      const segments: string[] = Array.isArray(ref?.segments) ? ref.segments : [];
      if (segments[0] === 'coachAthleteAccess') {
        return {
          exists: () => false,
          data: () => ({})
        };
      }

      return {
        exists: () => false,
        data: () => ({})
      };
    });

    await expect(exportAthleteSessionsCsv('athlete-1')).rejects.toThrow(
      'Coach-athlete access is not configured for export'
    );

    expect(mockedExportService.downloadCSV).not.toHaveBeenCalled();
  });

  it('falls back to direct source aggregation when exportData returns no exercise logs', async () => {
    mockedExportService.exportData.mockResolvedValueOnce({
      sessions: [],
      exerciseLogs: [],
      sets: []
    });

    const result = await exportAthleteSessionsCsv('athlete-1');
    expect(result.rowCount).toBeGreaterThan(0);
    expect(result.athleteName).toBe('Ada Lovelace');
  });

  it('exports all athletes into one set-schema CSV', async () => {
    const result = await exportAllAthletesSessionsCsv();

    expect(result.athleteCount).toBe(2);
    expect(result.rowCount).toBe(2);

    const [rows, , filename] = mockedExportService.downloadCSV.mock.calls[0] as [Array<Record<string, any>>, string[], string];
    const userIds = new Set(rows.map((row) => row.userId));

    expect(userIds.has('athlete-1')).toBe(true);
    expect(userIds.has('athlete-2')).toBe(true);
    expect(rows.every((row) => row.setNumber === 1)).toBe(true);
    expect(filename.startsWith('coach_exercise_sets_all_athletes_')).toBe(true);
  });
});
