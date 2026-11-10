import {
  buildBulkPlaceTargets,
  cellKey,
  parseCellKey,
  selectionSummary,
  toggleAthleteAcrossDates,
  toggleCellKey,
  toggleDateAcrossAthletes,
  uniqueSelectedDates,
} from '@/features/coach-shell/calendarSelection';

describe('calendarSelection', () => {
  it('encodes and parses cell keys', () => {
    expect(cellKey({ athleteId: 'a1', date: '2026-11-05' })).toBe('a1|2026-11-05');
    expect(parseCellKey('a1|2026-11-05')).toEqual({ athleteId: 'a1', date: '2026-11-05' });
    expect(parseCellKey('bad')).toBeNull();
  });

  it('toggles cells, athletes, and dates', () => {
    let selected = new Set<string>();
    selected = toggleCellKey(selected, { athleteId: 'a1', date: '2026-11-05' });
    expect(selected.has('a1|2026-11-05')).toBe(true);
    selected = toggleCellKey(selected, { athleteId: 'a1', date: '2026-11-05' });
    expect(selected.has('a1|2026-11-05')).toBe(false);

    selected = toggleAthleteAcrossDates(new Set(), 'a1', ['2026-11-05', '2026-11-06']);
    expect([...selected].sort()).toEqual(['a1|2026-11-05', 'a1|2026-11-06']);
    selected = toggleAthleteAcrossDates(selected, 'a1', ['2026-11-05', '2026-11-06']);
    expect(selected.size).toBe(0);

    selected = toggleDateAcrossAthletes(new Set(), '2026-11-05', ['a1', 'a2']);
    expect([...selected].sort()).toEqual(['a1|2026-11-05', 'a2|2026-11-05']);
  });

  it('summarizes selection and builds pending place targets', () => {
    const selected = new Set(['a1|2026-11-05', 'a1|2026-11-06', 'a2|2026-11-05']);
    expect(selectionSummary(selected)).toEqual({ athleteCount: 2, dayCount: 2, cellCount: 3 });
    expect(uniqueSelectedDates(selected)).toEqual(['2026-11-05', '2026-11-06']);

    const targets = buildBulkPlaceTargets(selected, 'session-1', [
      {
        id: 'assign-1',
        athleteId: 'a1',
        sessionId: 'session-1',
        plannedDates: ['2026-11-05'],
      },
    ]);
    expect(targets).toEqual([
      { athleteId: 'a1', date: '2026-11-06', assignmentId: 'assign-1' },
      { athleteId: 'a2', date: '2026-11-05', assignmentId: undefined },
    ]);
  });
});
