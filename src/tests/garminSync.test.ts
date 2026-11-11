import { buildGarminSyncPlan, formatGarminDistance, formatGarminDuration, formatGarminSleep, garminActivityLabel, garminSyncRange } from '@/services/garminSync';

describe('garminSync', () => {
  const source = {
    userId: 'athlete-1',
    rangeStart: '2026-10-11',
    rangeEnd: '2026-11-10',
    syncedAt: '2026-11-10T18:00:00.000Z',
    activities: [
      {
        activityId: 25009493087,
        activityName: 'Bergen Løping',
        activityType: { typeKey: 'running' },
        startTimeLocal: '2026-11-08 14:43:41',
        distance: 2401.4,
        duration: 786,
        calories: 225,
        averageHR: 154.2,
        maxHR: 174,
      },
      {
        activityId: 11,
        activityName: 'Old ride',
        activityType: { typeKey: 'cycling' },
        startTimeLocal: '2026-09-01 08:00:00',
        duration: 3600,
        distance: 20000,
      },
      {
        activityId: 12,
        activityName: 'Elliptical',
        activityType: { typeKey: 'elliptical' },
        startTimeLocal: '2026-11-08 14:11:48',
        duration: 0,
        distance: 0,
        calories: 0,
        averageHR: 0,
      },
    ],
    sleep: [
      {
        calendarDate: '2026-11-08',
        sleepTimeSeconds: 30540,
        sleepScores: { overall: { value: 96 } },
      },
    ],
    hrv: {
      hrvSummaries: [
        { calendarDate: '2026-11-08', lastNightAvg: 58.4, weeklyAvg: 62, status: 'BALANCED' },
      ],
    },
    bodyBattery: [
      {
        date: '2026-11-08',
        charged: 45,
        drained: 30,
        bodyBatteryValuesArray: [[1, 40], [2, 72]],
      },
    ],
    dailySummaries: {
      data: [
        {
          calendarDate: '2026-11-08',
          restingHeartRate: 48,
          averageStressLevel: 25,
          totalSteps: 8432,
          bodyBatteryMostRecentValue: 10,
        },
        { calendarDate: '2026-09-01', restingHeartRate: 50, totalSteps: 1000 },
        {
          calendarDate: '2026-11-09',
          heartRate: { restingValue: 46.2, minValue: 42, maxValue: 161 },
          stress: { avgLevel: 22 },
          movement: { steps: { value: 9100 } },
          bodyBattery: { chargedValue: 50, drainedValue: 20, latestValue: 80 },
        },
      ],
    },
  };

  it('keeps activities and days inside the sync window and drops empty metrics', () => {
    const plan = buildGarminSyncPlan(source);

    expect(plan.activities.map((activity) => activity.garminActivityId)).toEqual(['25009493087', '12']);
    expect(plan.activities[0]).toMatchObject({
      activityName: 'Bergen Løping',
      activityTypeKey: 'running',
      dateKey: '2026-11-08',
      durationSeconds: 786,
      distanceMeters: 2401,
      calories: 225,
      averageHeartRate: 154,
      maxHeartRate: 174,
    });
    expect(plan.activities[1].distanceMeters).toBeUndefined();
    expect(plan.activities[1].calories).toBeUndefined();
    expect(plan.days).toEqual([
      expect.objectContaining({
        date: '2026-11-09',
        restingHeartRate: 46,
        averageStress: 22,
        steps: 9100,
        bodyBatteryCharged: 50,
        bodyBatteryDrained: 20,
        bodyBatteryLatest: 80,
      }),
      expect.objectContaining({
        date: '2026-11-08',
        sleepScore: 96,
        sleepSeconds: 30540,
        hrvLastNight: 58,
        hrvWeeklyAverage: 62,
        hrvStatus: 'BALANCED',
        restingHeartRate: 48,
        averageStress: 25,
        steps: 8432,
        bodyBatteryCharged: 45,
        bodyBatteryDrained: 30,
        bodyBatteryLatest: 72,
      }),
    ]);
    expect(plan.status).toMatchObject({
      userId: 'athlete-1',
      activityCount: 2,
      dayCount: 2,
      rangeStart: '2026-10-11',
      rangeEnd: '2026-11-10',
    });
  });

  it('formats duration, distance, sleep, and activity labels', () => {
    expect(formatGarminDuration(786)).toBe('13 min');
    expect(formatGarminDuration(5400)).toBe('1h 30m');
    expect(formatGarminDistance(2401)).toBe('2.40 km');
    expect(formatGarminDistance(0)).toBeNull();
    expect(formatGarminSleep(30540)).toBe('8h 29m');
    expect(garminActivityLabel('trail_running')).toBe('Trail Running');
  });

  it('stores body battery at waking and before bed', () => {
    const plan = buildGarminSyncPlan({
      userId: 'athlete-1',
      rangeStart: '2026-11-10',
      rangeEnd: '2026-11-11',
      syncedAt: '2026-11-11T18:00:00.000Z',
      activities: [],
      sleep: [
        {
          calendarDate: '2026-11-11',
          sleepStartTimestampLocal: '2026-11-10T23:00:00.0',
          sleepEndTimestampLocal: '2026-11-11T07:00:00.0',
          sleepTimeSeconds: 28800,
          sleepScores: { overall: { value: 90 } },
        },
      ],
      hrv: [],
      bodyBattery: [
        {
          date: '2026-11-10',
          startTimestampLocal: '2026-11-10T06:00:00.0',
          startTimestampGMT: '2026-11-10T05:00:00.0',
          charged: 40,
          drained: 55,
          bodyBatteryValuesArray: [
            [Date.parse('2026-11-10T21:00:00.000Z'), 34],
            [Date.parse('2026-11-10T22:00:00.000Z'), 28],
          ],
        },
        {
          date: '2026-11-11',
          startTimestampLocal: '2026-11-11T06:00:00.0',
          startTimestampGMT: '2026-11-11T05:00:00.0',
          charged: 54,
          drained: 12,
          bodyBatteryValuesArray: [
            [Date.parse('2026-11-11T06:00:00.000Z'), 82],
            [Date.parse('2026-11-11T16:00:00.000Z'), 40],
          ],
        },
      ],
      dailySummaries: [],
    });

    const byDate = new Map(plan.days.map((day) => [day.date, day]));
    expect(byDate.get('2026-11-10')).toMatchObject({ bodyBatteryAtBed: 28 });
    expect(byDate.get('2026-11-11')).toMatchObject({ bodyBatteryAtWake: 82, sleepScore: 90 });
  });

  it('uses a 31-day inclusive window ending today', () => {
    expect(garminSyncRange(new Date(2026, 10, 10))).toEqual({
      start: '2026-10-11',
      end: '2026-11-10',
    });
  });
});
