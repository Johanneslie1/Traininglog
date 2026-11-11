import {
  activityMinutesOn,
  daysInWindow,
  hrvBaseline,
  latestRecordedDay,
  morningFlag,
  spanDateKeys,
  wellnessWindowScores,
} from '@/services/monitoringBoard';
import type { GarminActivityRecord, GarminDayRecord } from '@/types/garmin';

function day(partial: Partial<GarminDayRecord> & Pick<GarminDayRecord, 'date'>): GarminDayRecord {
  return {
    userId: 'athlete-1',
    syncedAt: '2026-11-10T12:00:00.000Z',
    ...partial,
  };
}

function activity(dateKey: string, seconds: number): GarminActivityRecord {
  return {
    garminActivityId: dateKey,
    userId: 'athlete-1',
    activityName: 'Run',
    activityTypeKey: 'running',
    dateKey,
    startTimeLocal: `${dateKey} 08:00:00`,
    durationSeconds: seconds,
    syncedAt: '2026-11-10T12:00:00.000Z',
  };
}

describe('monitoringBoard', () => {
  const keys = spanDateKeys(new Date(2026, 10, 10), 7);

  it('builds an inclusive date window ending today', () => {
    expect(keys).toEqual([
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
  });

  it('flags a morning from sleep, HRV, and recovery against the window average', () => {
    const recorded = [
      day({ date: '2026-11-09', sleepScore: 90, hrvLastNight: 62, bodyBatteryLatest: 74 }),
      day({ date: '2026-11-10', sleepScore: 70, hrvLastNight: 46, bodyBatteryLatest: 32 }),
    ];
    const windowDays = daysInWindow(recorded, keys);

    expect(hrvBaseline(windowDays)).toBe(54);
    expect(morningFlag(recorded[0], 54)).toBe('Clear');
    expect(morningFlag(recorded[1], 54)).toBe('Ease');
    expect(morningFlag(day({ date: '2026-11-08', sleepScore: 80 }), 54)).toBeNull();
    expect(latestRecordedDay(recorded, keys)?.date).toBe('2026-11-10');
  });

  it('sums watch activity minutes and averages wellness across the window', () => {
    expect(activityMinutesOn([
      activity('2026-11-10', 786),
      activity('2026-11-10', 200),
      activity('2026-11-09', 600),
    ], '2026-11-10')).toBe(16);

    const logs = [
      { date: '2026-11-08', readiness: 3, sleepQuality: 5, wellnessScaleVersion: 3 },
      { date: '2026-11-10', readiness: 2, sleepQuality: 4, wellnessScaleVersion: 3 },
      { date: '2026-10-01', readiness: 5, sleepQuality: 1, wellnessScaleVersion: 3 },
      { date: '2026-11-09', readiness: 9, sleepQuality: 9 },
    ];

    expect(wellnessWindowScores(logs, ['2026-11-10'])).toEqual({ readiness: 2, sleepQuality: 4 });
    expect(wellnessWindowScores(logs, keys)).toEqual({ readiness: 2.5, sleepQuality: 4.5 });
  });
});
