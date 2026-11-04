import { describe, expect, it } from '@jest/globals';
import { ActivityType } from '@/types/activityTypes';
import { DifficultyCategory } from '@/types/difficulty';
import { buildDiaryImportPlan, toIsoWeekKey } from '@/services/diaryImport';

const sampleCsv = `Date,Type,Name,№,Val_1,Unit_1,Val_2,Unit_2,Comment
04.11.2020,📅,,,,,,,"65 min | Økt 1"
04.11.2020,🏋️‍♂️,"Bench Press · Barbell",,,,,,""
04.11.2020,🔹,"Bench Press · Barbell",1,60,kg,8,rep,"Hard"
04.11.2020,🔹,"Bench Press · Barbell",2,60,kg,6,rep,""
04.11.2020,🏋️‍♂️,"Pull Up",,,,,,""
04.11.2020,🔹,"Pull Up",1,0,kg,7,rep,""
04.11.2020,🏋️‍♂️🔗,"Face pulls",,,,,,""
04.11.2020,🔹,"Face pulls",1,40,kg,12,rep,""
05.11.2020,📅,,,,,,,"0 min"
08.11.2020,📅,,,,,,,"0 min"
08.11.2020,🏋️‍♂️,"Plank",,,,,,""
08.11.2020,🔹,"Plank",1,60,sec,0,kg,""
08.11.2020,🏋️‍♂️,"Farmer's Walk · Dumbbell",,,,,,""
08.11.2020,🔹,"Farmer's Walk · Dumbbell",1,30,sec,18,kg,""
08.11.2020,🏋️‍♂️,"Intervaller sykkel 15x60",,,,,,""
08.11.2020,🔹,"Intervaller sykkel 15x60",1,15,sec,0,km,""
08.11.2020,🏋️‍♂️,"stretching",,,,,,""
08.11.2020,🔹,"stretching",1,2700,sec,0,km,""
08.11.2020,🏋️‍♂️,"rowing machine",,,,,,""
08.11.2020,🔹,"rowing machine",1,360,sec,1407,m," (240W)"
26.11.2020,📏,"Weight",1,82.8,,,,""
`;

describe('buildDiaryImportPlan', () => {
  const plan = buildDiaryImportPlan(sampleCsv);

  it('turns each training day into one named session', () => {
    expect(plan.warnings).toEqual([]);
    expect(plan.stats.sessions).toBe(3);
    expect(plan.stats.firstDate).toBe('2020-11-04');
    expect(plan.stats.lastDate).toBe('2020-11-26');

    const first = plan.sessions[0];
    expect(first.id).toBe('diary-2020-11-04-main');
    expect(first.name).toBe('Økt 1 · 65 min');
    expect(first.durationMinutes).toBe(65);
    expect(first.sessionWeekKey).toBe('2020-W45');
    expect(first.sessionNumberInWeek).toBe(1);
    expect(toIsoWeekKey(new Date(2020, 10, 4))).toBe('2020-W45');
  });

  it('keeps strength sets and links superset exercises', () => {
    const entries = plan.sessions[0].entries;
    expect(entries.map((entry) => entry.name)).toEqual([
      'Bench Press · Barbell',
      'Pull Up',
      'Face pulls',
    ]);

    expect(entries[0].collection).toBe('exercises');
    expect(entries[0].activityType).toBe(ActivityType.RESISTANCE);
    expect(entries[0].sets[0]).toEqual({
      weight: 60,
      reps: 8,
      difficulty: DifficultyCategory.HARD,
    });
    expect(entries[0].supersetId).toBeUndefined();

    expect(entries[1].supersetId).toBe('diary-2020-11-04-ss-1');
    expect(entries[1].supersetLabel).toBe('1a');
    expect(entries[2].supersetLabel).toBe('1b');
    expect(entries[1].sets[0]).toMatchObject({ weight: 0, reps: 7 });
  });

  it('skips calendar days that have no logged work', () => {
    expect(plan.sessions.map((session) => session.dateKey)).not.toContain('2020-11-05');
  });

  it('maps holds, loaded carries, short intervals, and distance', () => {
    const byName = new Map(plan.sessions[1].entries.map((entry) => [entry.name, entry]));

    expect(byName.get('Plank')).toMatchObject({
      collection: 'activities',
      activityType: ActivityType.STRETCHING,
      sets: [{ holdTime: 60 }],
    });
    expect(byName.get("Farmer's Walk · Dumbbell")).toMatchObject({
      collection: 'exercises',
      activityType: ActivityType.RESISTANCE,
      sets: [{ weight: 18, reps: 0, duration: 30 }],
    });
    expect(byName.get('Intervaller sykkel 15x60')).toMatchObject({
      collection: 'activities',
      activityType: ActivityType.ENDURANCE,
      sets: [{ holdTime: 15 }],
    });
    expect(byName.get('stretching')?.sets[0].duration).toBe(2700);
    expect(byName.get('rowing machine')).toMatchObject({
      activityType: ActivityType.ENDURANCE,
      sets: [{ duration: 360, distance: 1407, notes: '(240W)' }],
    });
  });

  it('stores a weigh-in on its own day', () => {
    const weighIn = plan.sessions[2];
    expect(weighIn.name).toBe('Body weight');
    expect(weighIn.entries[0]).toMatchObject({
      collection: 'activities',
      activityType: ActivityType.OTHER,
      sets: [{ weight: 82.8, notes: '82.8 kg' }],
    });
  });
});
