import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import { prepareExerciseLogForPersistence } from '@/services/exerciseService';

jest.mock('@/services/firebase/activityLogs', () => ({
  addActivityLog: jest.fn(async () => 'activity-log-id'),
  getActivityLogs: jest.fn(async () => []),
  deleteActivityLog: jest.fn(async () => undefined),
}));

import { addActivityLog as addFirebaseActivityLog } from '@/services/firebase/activityLogs';
import { activityLoggingService } from '@/services/activityService';

describe('non-resistance persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves speed/agility set metrics when saving activity logs', async () => {
    await activityLoggingService.logSpeedAgilityExercise(
      'speed-1',
      'Hill Sprints',
      [
        {
          reps: 6,
          time: 14,
          distance: 40,
          height: 33,
          restTime: 75,
          rpe: 8,
          notes: 'Strong first set',
          drillMetric: 'gate-split',
        },
      ],
      'user-1',
      new Date('2026-03-01T09:00:00.000Z')
    );

    const mockedAddActivityLog = addFirebaseActivityLog as unknown as jest.Mock;
    expect(mockedAddActivityLog).toHaveBeenCalledTimes(1);
    const [payload] = mockedAddActivityLog.mock.calls[0] as [
      {
        activityType: ActivityType;
        sets: Array<Record<string, unknown>>;
      }
    ];

    expect(payload.activityType).toBe(ActivityType.SPEED_AGILITY);
    expect(payload.sets[0]).toMatchObject({
      weight: 0,
      reps: 6,
      duration: 14,
      distance: 40,
      height: 33,
      restTime: 75,
      rpe: 8,
      notes: 'Strong first set',
      drillMetric: 'gate-split',
    });
  });

  it('prepares exercise logs without dropping non-resistance fields', () => {
    const prepared = prepareExerciseLogForPersistence({
      id: 'log-1',
      exerciseName: 'Broad Jump',
      timestamp: new Date('2026-03-01T10:00:00.000Z'),
      userId: 'user-1',
      activityType: ActivityType.SPEED_AGILITY,
      sets: [
        {
          weight: 0,
          reps: 5,
          distance: 2.4,
          height: 45,
          duration: 2,
          rpe: 7,
          notes: 'Felt explosive',
          drillMetric: 'jump-distance',
          pace: undefined,
        },
      ],
    });

    expect(prepared.sets).toHaveLength(1);
    expect(prepared.sets[0]).toMatchObject({
      weight: 0,
      reps: 5,
      distance: 2.4,
      height: 45,
      duration: 2,
      rpe: 7,
      notes: 'Felt explosive',
      drillMetric: 'jump-distance',
    });
    expect((prepared.sets[0] as unknown as Record<string, unknown>).pace).toBeUndefined();
  });
});
