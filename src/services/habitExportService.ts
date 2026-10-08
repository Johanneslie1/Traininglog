import { Habit, HabitDay, HabitDayEntry } from '@/types/habit';
import { eachDateKey, isEntryMet, isHabitExpectedOnDate } from '@/utils/habitStats';

export const HABIT_EXPORT_HEADERS = [
  'date',
  'habit name',
  'kind',
  'target',
  'unit',
  'value',
  'met',
] as const;

/**
 * Habits-only CSV. This module is separate from training, wellness, and backup export.
 */
export function buildHabitCsv(habits: Habit[], days: HabitDay[], todayKey: string): string {
  const entriesByHabit = new Map<string, Record<string, HabitDayEntry | undefined>>();
  for (const habit of habits) entriesByHabit.set(habit.id, {});
  for (const day of days) {
    for (const [habitId, entry] of Object.entries(day.entries)) {
      const bucket = entriesByHabit.get(habitId);
      if (bucket) bucket[day.date] = entry;
    }
  }

  const rows: string[] = [HABIT_EXPORT_HEADERS.join(',')];
  const ordered = [...habits].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  for (const habit of ordered) {
    const entries = entriesByHabit.get(habit.id) ?? {};
    for (const date of eachDateKey(habit.activeFrom, todayKey)) {
      if (!isHabitExpectedOnDate(habit, date, todayKey)) continue;
      const entry = entries[date];
      const met = isEntryMet(habit, entry);
      const value = habit.kind === 'count'
        ? entry?.value ?? ''
        : entry?.completed === true
          ? 1
          : entry?.completed === false
            ? 0
            : '';
      rows.push([
        date,
        csvCell(habit.name),
        habit.kind,
        habit.kind === 'count' ? String(habit.target ?? '') : '',
        csvCell(habit.unit ?? ''),
        value === '' ? '' : String(value),
        met ? 'true' : 'false',
      ].join(','));
    }
  }

  return `\uFEFF${rows.join('\n')}`;
}

export function downloadHabitCsv(csv: string, filename = 'habits.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
