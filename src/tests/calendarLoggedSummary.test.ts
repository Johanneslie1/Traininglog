import {
  buildCalendarLogSummaries,
  summarizeDayLogs,
} from '@/features/coach-shell/calendarLoggedSummary';

describe('calendarLoggedSummary', () => {
  it('builds resistance, endurance, other, and sports-load chips', () => {
    const summary = summarizeDayLogs(
      'a1',
      '2026-11-05',
      [
        { date: '2026-11-05', activityType: 'resistance' },
        { date: '2026-11-05', sourceCollection: 'exercises' },
        { date: '2026-11-05', activityType: 'endurance' },
        { date: '2026-11-05', activityType: 'stretching' },
        { date: '2026-11-05', activityType: 'sport' },
        { date: '2026-11-06', activityType: 'resistance' },
      ],
      [
        { date: '2026-11-05', sessionLoad: 200 },
        { date: '2026-11-05', sessionLoad: 120 },
      ]
    );

    expect(summary.hasLoggedWork).toBe(true);
    expect(summary.totalSportsLoad).toBe(320);
    expect(summary.chips.map((chip) => chip.label)).toEqual([
      'Resistance · 2',
      'Endurance · 1',
      'Load 320',
    ]);
    expect(summary.collapsedTypeCount).toBe(1);
  });

  it('collapses extra type chips beyond two', () => {
    const summary = summarizeDayLogs(
      'a1',
      '2026-11-05',
      [
        { date: '2026-11-05', activityType: 'resistance' },
        { date: '2026-11-05', activityType: 'endurance' },
        { date: '2026-11-05', activityType: 'other' },
      ],
      []
    );
    expect(summary.chips).toHaveLength(2);
    expect(summary.collapsedTypeCount).toBe(1);
  });

  it('builds a cellKey map for the visible range', () => {
    const map = buildCalendarLogSummaries({
      athleteIds: ['a1', 'a2'],
      dateKeys: ['2026-11-05', '2026-11-06'],
      gymLogsByAthlete: {
        a1: [{ date: '2026-11-05', activityType: 'resistance' }],
        a2: [{ date: '2026-11-06', activityType: 'endurance' }],
      },
      sportsLoadByAthlete: {
        a1: [{ date: '2026-11-05', sessionLoad: 100 }],
        a2: [],
      },
    });

    expect(map.get('a1|2026-11-05')?.chips.map((chip) => chip.kind)).toEqual(['resistance', 'sportsLoad']);
    expect(map.get('a2|2026-11-06')?.chips[0].label).toBe('Endurance · 1');
    expect(map.has('a2|2026-11-05')).toBe(false);
  });
});
