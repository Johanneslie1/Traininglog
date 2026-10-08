import { Habit, HabitDay } from '@/types/habit';
import { buildHabitCsv, HABIT_EXPORT_HEADERS } from '@/services/habitExportService';

const today = '2026-10-03';

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

describe('habitExportService', () => {
  it('exports habit rows only, including misses and quoted names', () => {
    const habits = [
      habit({ name: 'Protein, target' }),
      habit({
        id: 'water',
        name: 'Water',
        kind: 'count',
        target: 8,
        unit: 'glasses',
        sortOrder: 1,
        activeFrom: '2026-10-02',
      }),
    ];
    const days: HabitDay[] = [
      {
        id: '2026-10-01',
        userId: 'user-1',
        date: '2026-10-01',
        entries: { protein: { completed: true } },
      },
      {
        id: '2026-10-02',
        userId: 'user-1',
        date: '2026-10-02',
        entries: { water: { value: 8 } },
      },
    ];

    const csv = buildHabitCsv(habits, days, today).replace(/^\uFEFF/, '');
    const [header, ...rows] = csv.split('\n');

    expect(header).toBe(HABIT_EXPORT_HEADERS.join(','));
    expect(header).not.toContain('exercise');
    expect(header).not.toContain('wellness');
    expect(rows).toEqual([
      '2026-10-01,"Protein, target",check,,,1,true',
      '2026-10-02,"Protein, target",check,,,,false',
      '2026-10-03,"Protein, target",check,,,,false',
      '2026-10-02,Water,count,8,glasses,8,true',
      '2026-10-03,Water,count,8,glasses,,false',
    ]);
  });

  it('stops an archived habit on the archive date', () => {
    const csv = buildHabitCsv(
      [habit({ archived: true, archivedOn: '2026-10-02' })],
      [],
      today,
    ).replace(/^\uFEFF/, '');

    expect(csv.split('\n').slice(1)).toEqual([
      '2026-10-01,Protein target,check,,,,false',
    ]);
  });
});
