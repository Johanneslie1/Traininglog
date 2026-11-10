import { sportsLoadOverviewLine } from '@/features/coach-shell/overviewSportsLoad';
import type { SportsLoadSession } from '@/types/srpe';

describe('sportsLoadOverviewLine', () => {
  it('formats name, rpe, duration, and load', () => {
    const session: SportsLoadSession = {
      id: 'sl-1',
      userId: 'athlete-1',
      date: '2026-11-08',
      dateEpochDay: 0,
      timestamp: new Date('2026-11-08T12:00:00.000Z'),
      rpe: 7,
      durationMinutes: 60,
      sessionLoad: 420,
      sportName: 'Football',
      sessionName: 'Team practice',
    };

    expect(sportsLoadOverviewLine(session)).toEqual({
      id: 'sl-1',
      label: 'Team practice',
      detail: 'RPE 7 · 60 min · Load 420',
    });
  });

  it('falls back when optional labels are missing', () => {
    const session: SportsLoadSession = {
      id: 'sl-2',
      userId: 'athlete-1',
      date: '2026-11-08',
      dateEpochDay: 0,
      timestamp: new Date('2026-11-08T12:00:00.000Z'),
      rpe: 5,
      durationMinutes: 30,
      sessionLoad: 150,
    };

    expect(sportsLoadOverviewLine(session).label).toBe('Sports load');
    expect(sportsLoadOverviewLine(session).detail).toBe('RPE 5 · 30 min · Load 150');
  });
});
