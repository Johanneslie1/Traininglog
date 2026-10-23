import { Habit, HabitDayEntry } from '@/types/habit';
import {
  bestStreak,
  canAdvanceWeek,
  canRetreatWeek,
  combineHabitRates,
  currentStreak,
  habitCompletion,
  habitDayMark,
  isHabitExpectedOnDate,
  monthBounds,
  rankHabitScores,
  shiftSelectedWeek,
  weekBounds,
} from '@/utils/habitStats';

const today = '2026-10-08';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'protein',
    userId: 'user-1',
    name: 'Protein target',
    kind: 'check',
    sortOrder: 0,
    activeFrom: '2026-10-01',
    archived: false,
    ...overrides,
  };
}

function checked(dates: string[]): Record<string, HabitDayEntry | undefined> {
  return Object.fromEntries(dates.map((date) => [date, { completed: true }]));
}

describe('habitStats', () => {
  it('ignores days before the habit starts and after it is archived', () => {
    const archived = habit({ archived: true, archivedOn: '2026-10-06' });

    expect(isHabitExpectedOnDate(habit(), '2026-09-30', today)).toBe(false);
    expect(isHabitExpectedOnDate(habit(), '2026-10-01', today)).toBe(true);
    expect(isHabitExpectedOnDate(habit(), '2026-10-09', today)).toBe(false);
    expect(isHabitExpectedOnDate(archived, '2026-10-05', today)).toBe(true);
    expect(isHabitExpectedOnDate(archived, '2026-10-06', today)).toBe(false);
  });

  it('meets a count habit only when the value reaches the target', () => {
    const water = habit({ kind: 'count', target: 8, unit: 'glasses' });

    expect(habitDayMark(water, '2026-10-07', today, { value: 7 })).toBe('miss');
    expect(habitDayMark(water, '2026-10-07', today, { value: 8 })).toBe('met');
    expect(habitDayMark(water, '2026-10-09', today, { value: 8 })).toBe('future');
    expect(habitDayMark(habit({ activeFrom: '2026-10-08' }), '2026-10-07', today, { completed: true })).toBe('inactive');
  });

  it('keeps the current streak when today is still open', () => {
    const entries = checked(['2026-10-06', '2026-10-07']);

    expect(currentStreak(habit(), entries, today)).toBe(2);
    expect(currentStreak(habit(), { ...entries, [today]: { completed: true } }, today)).toBe(3);
    expect(currentStreak(habit(), checked(['2026-10-05']), today)).toBe(0);
  });

  it('tracks the best streak and the completion rate without counting future days', () => {
    const entries = checked(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06']);

    expect(bestStreak(habit(), entries, today)).toBe(3);
    expect(habitCompletion(habit(), entries, today)).toEqual({
      met: 5,
      expected: 8,
      rate: 5 / 8,
    });
    expect(habitCompletion(habit({ archived: true, archivedOn: '2026-10-04' }), entries, today)).toEqual({
      met: 2,
      expected: 3,
      rate: 2 / 3,
    });
  });

  it('moves a selected day by weeks and stops at the current week', () => {
    expect(weekBounds('2026-10-23')).toEqual({ start: '2026-10-19', end: '2026-10-25' });
    expect(monthBounds('2026-10-23')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(canAdvanceWeek('2026-10-23', '2026-10-23')).toBe(false);
    expect(canAdvanceWeek('2026-10-16', '2026-10-23')).toBe(true);
    expect(canRetreatWeek('2026-10-05', '2026-10-01')).toBe(true);
    expect(canRetreatWeek('2026-10-01', '2026-10-01')).toBe(false);
    expect(shiftSelectedWeek('2026-10-23', '2026-10-23', 1)).toBe('2026-10-23');
    expect(shiftSelectedWeek('2026-10-16', '2026-10-23', 1)).toBe('2026-10-23');
    expect(shiftSelectedWeek('2026-10-17', '2026-10-23', 1)).toBe('2026-10-23');
    expect(shiftSelectedWeek('2026-10-23', '2026-10-23', -1)).toBe('2026-10-16');
  });

  it('ranks habits by the month score and keeps a separate week score', () => {
    const read = habit({ id: 'read', name: 'Read', activeFrom: '2026-10-01' });
    const stretch = habit({ id: 'stretch', name: 'Stretch', activeFrom: '2026-10-01' });
    const old = habit({
      id: 'old',
      name: 'Old',
      activeFrom: '2026-09-01',
      archived: true,
      archivedOn: '2026-09-10',
    });
    const entries = {
      '2026-10-19': { read: { completed: true } },
      '2026-10-20': { read: { completed: true }, stretch: { completed: true } },
      '2026-10-21': { stretch: { completed: true } },
      '2026-10-01': { stretch: { completed: true } },
    };

    const ranked = rankHabitScores(
      [stretch, read, old],
      entries,
      '2026-10-23',
      weekBounds('2026-10-23'),
      monthBounds('2026-10-23'),
    );

    expect(ranked.map((row) => row.habit.id)).toEqual(['read', 'stretch']);
    expect(ranked[0].week).toEqual({ met: 2, expected: 5, rate: 2 / 5 });
    expect(ranked[0].month).toEqual({ met: 2, expected: 23, rate: 2 / 23 });
    expect(ranked[1].week).toEqual({ met: 2, expected: 5, rate: 2 / 5 });
    expect(ranked[1].month.met).toBe(3);
    expect(combineHabitRates(ranked.map((row) => row.week))).toEqual({
      met: 4,
      expected: 10,
      rate: 0.4,
    });
  });
});
