import { describe, expect, it } from '@jest/globals';
import {
  canConfirmCheckpoint,
  checkpointKey,
  createInitialRehabProgress,
  createSeedSymmetryTest,
  getPainWarnings,
  isRehabWeekUnlocked,
  mapStoredSessionRehabFields,
  symmetryPercent,
  withCheckpointToggle,
  withConfirmedWeek,
  withPainLog,
} from '@/utils/shoulderRehab';

describe('shoulder rehab progress', () => {
  it('calculates symmetry and seeds the first test at 63%', () => {
    expect(symmetryPercent(10, 16)).toBe(63);
    expect(createSeedSymmetryTest('2026-10-01')).toMatchObject({
      weightKg: 3,
      healthyReps: 16,
      injuredReps: 10,
      symmetryPercent: 63,
      date: '2026-10-01',
    });
  });

  it('keeps later weeks locked until the previous checkpoint is confirmed', () => {
    expect(isRehabWeekUnlocked([], undefined)).toBe(true);
    expect(isRehabWeekUnlocked([], 1)).toBe(true);
    expect(isRehabWeekUnlocked([], 2)).toBe(false);
    expect(isRehabWeekUnlocked([1], 2)).toBe(true);
    expect(isRehabWeekUnlocked([1], 3)).toBe(false);
    expect(isRehabWeekUnlocked([1, 2], 3)).toBe(true);
  });

  it('requires every checkpoint item before a week can be confirmed', () => {
    const initial = createInitialRehabProgress('user-1', 'program-1', '2026-10-01');
    expect(canConfirmCheckpoint(initial.checkpointChecks, 1, 3)).toBe(false);

    const ticked = [0, 1, 2].reduce(
      (progress, index) => withCheckpointToggle(progress, 1, index),
      initial
    );
    expect(ticked.checkpointChecks[checkpointKey(1, 0)]).toBe(true);
    expect(canConfirmCheckpoint(ticked.checkpointChecks, 1, 3)).toBe(true);

    const confirmed = withConfirmedWeek(ticked, 1);
    expect(confirmed.confirmedWeeks).toEqual([1]);
    expect(isRehabWeekUnlocked(confirmed.confirmedWeeks, 2)).toBe(true);
  });

  it('warns when pain during exercise is above 3 or the next morning is worse', () => {
    expect(getPainWarnings({ painBefore: 1, painDuring: 3 })).toEqual([]);
    expect(getPainWarnings({ painBefore: 1, painDuring: 4 })).toEqual([
      'Pain during exercise is above 3/10.',
    ]);
    expect(getPainWarnings({ painBefore: 1, painDuring: 2, painNextMorning: 1 })).toEqual([]);
    expect(getPainWarnings({ painBefore: 1, painDuring: 2, painNextMorning: 3 })).toEqual([
      'Next-morning pain is worse than before the session.',
    ]);
  });

  it('stores a pain log without an undefined week for daily activation', () => {
    const initial = createInitialRehabProgress('user-1', 'program-1', '2026-10-01');
    const next = withPainLog(initial, {
      sessionKey: 'daily',
      sessionName: 'Daily shoulder activation',
      date: '2026-10-01',
      painBefore: 1,
      painDuring: 2,
    });
    expect(next.painLogs[0].week).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(next.painLogs[0], 'week')).toBe(false);
  });

  it('reads rehab fields from stored sessions and ignores unrelated data', () => {
    expect(mapStoredSessionRehabFields({
      week: 2,
      sessionsPerWeek: 4,
      sessionKind: 'strength',
      checkpoint: ['Full, pain-free range of motion'],
    })).toEqual({
      week: 2,
      sessionsPerWeek: 4,
      sessionKind: 'strength',
      checkpoint: ['Full, pain-free range of motion'],
    });
    expect(mapStoredSessionRehabFields({ name: 'Lower 1' })).toEqual({});
  });
});
