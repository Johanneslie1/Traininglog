import { describe, expect, it } from '@jest/globals';
import {
  chunkWeeks,
  memberLabel,
  programPlacementDates,
  rangeDates,
  sessionsInProgramOrder,
  shiftAnchor,
  toCoachPlacement,
} from '@/features/coach-shell/deskPlan';

describe('coach desk plan', () => {
  const thursday = new Date(2026, 10, 5);

  it('builds Monday-first ranges around the anchor', () => {
    expect(rangeDates(thursday, 'week')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(rangeDates(thursday, 'biweek')).toHaveLength(14);
    const fourWeeks = rangeDates(thursday, 'fourweek');
    expect(fourWeeks[0]).toBe('2026-11-02');
    expect(fourWeeks[fourWeeks.length - 1]).toBe('2026-11-29');
    expect(fourWeeks).toHaveLength(28);
  });

  it('covers the calendar year with full weeks', () => {
    const year = rangeDates(thursday, 'year');
    expect(year[0]).toBe('2025-12-29');
    expect(year[year.length - 1]).toBe('2027-01-03');
    expect(year).toContain('2026-01-01');
    expect(year).toContain('2026-12-31');
    expect(chunkWeeks(year).every((week) => week.length === 7)).toBe(true);
  });

  it('moves the anchor by the selected range', () => {
    expect(shiftAnchor(thursday, 'week', 1).getDate()).toBe(12);
    expect(shiftAnchor(thursday, 'fourweek', 1).getDate()).toBe(3);
    expect(shiftAnchor(thursday, 'year', 1).getFullYear()).toBe(2027);
  });

  it('lays a program onto successive days and keeps session order', () => {
    expect(programPlacementDates('2026-11-05', 3)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
    const ordered = sessionsInProgramOrder([
      { id: 'later', week: 2, order: 1 },
      { id: 'first', week: 1, order: 2 },
      { id: 'early', week: 1, order: 1 },
    ]);
    expect(ordered.map((session) => session.id)).toEqual(['early', 'first', 'later']);
  });

  it('reads a placement and ignores assignments without a session', () => {
    expect(memberLabel({ firstName: 'Nora', lastName: 'Hansen' })).toBe('Nora Hansen');
    const placement = toCoachPlacement('assign-1', {
      userId: 'athlete-1',
      assignedAt: '2026-11-01T00:00:00.000Z',
      plannedDates: ['2026-11-05', 'not-a-date', '2026-11-05'],
      sourceProgramName: 'Strength',
      coachMessage: '  Push pace  ',
      sessionData: {
        id: 'session-1',
        name: 'Upper',
        exercises: [{ id: 'ex-1', name: 'Bench' }],
      },
    });
    expect(placement).toMatchObject({
      id: 'assign-1',
      athleteId: 'athlete-1',
      sessionId: 'session-1',
      sessionName: 'Upper',
      programName: 'Strength',
      coachMessage: 'Push pace',
      plannedDates: ['2026-11-05'],
    });
    expect(toCoachPlacement('broken', { userId: 'athlete-1' })).toBeNull();
  });
});
