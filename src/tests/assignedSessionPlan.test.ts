import { describe, expect, it } from '@jest/globals';
import { assignmentStartedOnDate, openAssignmentsForDate } from '@/features/exercises/assignedSessionPlan';
import type { SharedSessionAssignment } from '@/types/program';

const assignment = (id: string, date: string, name: string): SharedSessionAssignment => ({
  id,
  sharedSessionId: `shared-${id}`,
  sessionData: {
    id: `session-${id}`,
    name,
    exercises: [],
    userId: 'coach',
  },
  userId: 'athlete',
  sharedBy: 'coach',
  assignedAt: id === 'later' ? '2026-11-06T12:00:00.000Z' : '2026-11-06T08:00:00.000Z',
  status: 'not-started',
  plannedDates: [date],
  sourceProgramName: 'Strength',
});

describe('assigned session cards', () => {
  it('shows only the unstarted sessions planned for the selected day', () => {
    const upper = assignment('upper', '2026-11-06', 'Upper');
    const mobility = assignment('later', '2026-11-06', 'Mobility');
    const friday = assignment('friday', '2026-11-07', 'Lower');
    const open = openAssignmentsForDate(
      [mobility, friday, upper],
      '2026-11-06',
      [{ sharedSessionAssignmentId: 'upper', sharedSessionDateKey: '2026-11-06' }]
    );
    expect(open.map((item) => item.id)).toEqual(['later']);
  });

  it('treats a started session on another day as still open today', () => {
    const upper = assignment('upper', '2026-11-06', 'Upper');
    expect(assignmentStartedOnDate(upper, '2026-11-06', [
      { sharedSessionAssignmentId: 'upper', sharedSessionDateKey: '2026-11-05' },
    ])).toBe(false);
  });

  it('hides a session after that day is removed from the plan', () => {
    const declined = {
      ...assignment('upper', '2026-11-06', 'Upper'),
      plannedDates: ['2026-11-07'],
    };
    expect(openAssignmentsForDate([declined], '2026-11-06', [])).toEqual([]);
  });
});
