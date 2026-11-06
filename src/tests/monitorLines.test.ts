import { describe, expect, it } from '@jest/globals';
import {
  assignLogsToSessions,
  buildMonitorLines,
  formatLoggedSet,
  logMatchesDate,
  plannedSummary,
  toDayTrainingLog,
} from '@/features/coach-shell/monitorLines';

describe('coach session monitor', () => {
  const bench = {
    id: 'bench',
    name: 'Bench press',
    activityType: 'resistance',
    prescription: { sets: 3, reps: 8, weight: { type: 'absolute' as const, value: 60 }, rpe: 7 },
  };

  it('keeps later sets planned until they are saved', () => {
    const lines = buildMonitorLines(bench, [{
      id: 'log-1',
      name: 'Bench press',
      sets: [{ reps: 8, weight: 62.5, rpe: 8 }],
    }]);
    expect(lines.map((line) => line.detail)).toEqual([
      '8 reps · 62.5 kg · RPE 8',
      'Planned',
      'Planned',
    ]);
    expect(lines[0].logged).toBe(true);
    expect(plannedSummary(bench.prescription, bench.activityType)).toBe('3 sets · 8 reps · 60 kg · RPE 7');
  });

  it('matches a saved exercise by its program id when the name differs', () => {
    const lines = buildMonitorLines(bench, [{
      id: 'log-1',
      name: 'Bench',
      sourceProgramExerciseId: 'bench',
      sets: [{ reps: 5, weight: 80 }],
    }]);
    expect(lines[0]).toMatchObject({ detail: '5 reps · 80 kg', logged: true });
  });

  it('gives a tagged log to its session and leaves other training aside', () => {
    const logs = [
      { id: 'upper', name: 'Squat', sourceProgramSessionId: 'upper', sets: [{ reps: 5 }] },
      { id: 'spin', name: 'Easy spin', sourceProgramSessionId: 'spin', sets: [{ duration: 1800 }] },
      { id: 'extra', name: 'Carry', sets: [{ weight: 24 }] },
    ];
    const assigned = assignLogsToSessions([
      { id: 'upper', exercises: [{ id: 'squat', name: 'Squat' }] },
      { id: 'spin', exercises: [{ id: 'spin', name: 'Easy spin' }] },
    ], logs);
    expect(assigned.bySessionId.upper.map((log) => log.id)).toEqual(['upper']);
    expect(assigned.bySessionId.spin.map((log) => log.id)).toEqual(['spin']);
    expect(assigned.extras.map((log) => log.id)).toEqual(['extra']);
    expect(formatLoggedSet({ duration: 90, distance: 1500 })).toBe('2 min · 1.5 km');
  });

  it('keeps an empty saved set planned and matches the shared exercise id', () => {
    const lines = buildMonitorLines(bench, [{
      id: 'log-1',
      name: 'Different name',
      sharedSessionExerciseId: 'bench',
      sets: [{}],
    }]);
    expect(lines.every((line) => line.detail === 'Planned' && line.logged === false)).toBe(true);
    const fromExerciseName = toDayTrainingLog('exercise-1', {
      exerciseName: 'Bench press',
      sets: [{ reps: 8, weight: 60 }, {}],
    });
    expect(fromExerciseName).toMatchObject({
      name: 'Bench press',
      sets: [{ reps: 8, weight: 60 }],
    });
  });

  it('reads today from a date key and from an activity name', () => {
    expect(logMatchesDate({ date: '2026-11-05' }, '2026-11-05')).toBe(true);
    expect(logMatchesDate({ date: '2026-11-04' }, '2026-11-05')).toBe(false);
    expect(logMatchesDate({ sessionDateKey: '2026-11-05', date: '2026-11-04' }, '2026-11-05')).toBe(true);
    const log = toDayTrainingLog('activity-1', {
      activityName: 'Mobility',
      activityType: 'stretching',
      sets: [{ duration: 30 }],
    });
    expect(log).toMatchObject({ name: 'Mobility', activityType: 'stretching', sets: [{ duration: 30 }] });
  });
});
