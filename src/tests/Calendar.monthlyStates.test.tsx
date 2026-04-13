/** @jest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns';

jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns') as typeof import('date-fns');
  const mockedToday = new Date('2026-04-15T09:00:00.000Z');

  return {
    ...actual,
    isToday: (date: Date) => actual.isSameDay(date, mockedToday),
  };
});

jest.mock('@/services/calendar', () => ({
  getMonthSessionSummaries: jest.fn(),
  getWorkoutsByDate: jest.fn(),
}));

import { getMonthSessionSummaries, getWorkoutsByDate } from '@/services/calendar';
import Calendar from '@/components/Calendar';

const getMonthSessionSummariesMock = getMonthSessionSummaries as jest.MockedFunction<typeof getMonthSessionSummaries>;
const getWorkoutsByDateMock = getWorkoutsByDate as jest.MockedFunction<typeof getWorkoutsByDate>;

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildMonthSummaries = (month: Date) => {
  const counts = new Map<string, number>([
    ['2026-04-15', 1],
    ['2026-04-20', 3],
  ]);

  return eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }).map((date) => {
    const sessionDateKey = toLocalDateKey(date);
    const sessionCount = counts.get(sessionDateKey) || 0;

    return {
      date,
      sessionDateKey,
      sessionCount,
      hasSessions: sessionCount > 0,
    };
  });
};

describe('Calendar monthly session states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMonthSessionSummariesMock.mockResolvedValue(buildMonthSummaries(new Date('2026-04-15T09:00:00.000Z')));
    getWorkoutsByDateMock.mockResolvedValue([]);
  });

  it('renders today, one-session, and multi-session states with visible counts', async () => {
    render(<Calendar selectedDate={new Date('2026-04-15T09:00:00.000Z')} />);

    await waitFor(() => {
      expect(getMonthSessionSummariesMock).toHaveBeenCalled();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(2);
    });

    const todayButton = await screen.findByRole('button', { name: /April 15, 2026, today, 1 session/i });
    const busyDayButton = await screen.findByRole('button', { name: /April 20, 2026, 3 sessions/i });

    expect(screen.getByText('Today')).not.toBeNull();
    expect(screen.getByText('1 session')).not.toBeNull();
    expect(screen.getByText('2+ sessions')).not.toBeNull();
    expect(todayButton.getAttribute('data-is-today')).toBe('true');
    expect(todayButton.getAttribute('data-is-selected')).toBe('true');
    expect(todayButton.getAttribute('data-session-count')).toBe('1');
    expect(todayButton.className).toContain('ring-2');
    expect(todayButton.className).toContain('bg-status-info');
    expect(busyDayButton.getAttribute('data-session-count')).toBe('3');
    expect(busyDayButton.className).toContain('bg-status-success');
  });
});