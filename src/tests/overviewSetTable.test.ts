import { describe, expect, it } from '@jest/globals';
import {
  buildAthleteSessions,
  chooseSessionId,
  exerciseSetTable,
} from '@/features/coach-shell/overviewSetTable';

describe('session overview set table', () => {
  const squat = {
    id: 'squat',
    name: 'Back squat',
    activityType: 'resistance',
    prescription: { sets: 3, reps: 6, weight: { type: 'absolute' as const, value: 80 }, rpe: 7 },
  };

  it('splits a saved set into reps, load, and RPE', () => {
    const table = exerciseSetTable(squat, [{
      id: 'log-1',
      name: 'Back squat',
      sourceProgramExerciseId: 'squat',
      timestampMs: 10,
      sets: [{ reps: 6, weight: 80, rpe: 7 }],
    }]);
    expect(table.rows.map((row) => [row.setNumber, row.reps, row.load, row.rpe, row.logged])).toEqual([
      ['1', '6', '80', '7', true],
      ['2', '6', '80', '7', false],
      ['3', '6', '80', '7', false],
    ]);
  });

  it('puts duration and distance in the reps and load columns', () => {
    const table = exerciseSetTable(
      { id: 'spin', name: 'Easy spin', activityType: 'endurance' },
      [{ id: 'run', name: 'Easy spin', sets: [{ duration: 2400, distance: 8000 }] }]
    );
    expect(table.rows[0]).toMatchObject({ reps: '40m', load: '8km', rpe: '—', logged: true });
  });

  it('keeps an assigned plan and a self-logged session as separate choices', () => {
    const sessions = buildAthleteSessions(
      [{
        id: 'place-1',
        sessionId: 'lower',
        sessionName: 'Lower Body',
        programName: 'Speed + Strength',
        exercises: [squat],
      }],
      [
        { id: 'squat-log', name: 'Back squat', sourceProgramSessionId: 'lower', timestampMs: 20, sets: [{ reps: 6, weight: 82.5 }] },
        { id: 'clean', name: 'Clean', sessionId: 'free-1', sessionNumberInDay: 2, timestampMs: 50, sets: [{ reps: 5, weight: 60, rpe: 5 }] },
      ]
    );
    expect(sessions.map((session) => session.name)).toEqual(['Lower Body', 'Session 2']);
    expect(chooseSessionId(sessions)).toBe(sessions[1].id);
    expect(chooseSessionId(sessions, sessions[0].id)).toBe(sessions[0].id);
  });
});
