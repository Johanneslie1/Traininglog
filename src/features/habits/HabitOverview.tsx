import { Habit, HabitDayEntry } from '@/types/habit';
import { HabitMark } from '@/features/habits/HabitMarks';
import { dateKeyToLocalDate } from '@/utils/dateUtils';
import { combineHabitRates, DateBounds, HabitRate, rankHabitScores } from '@/utils/habitStats';

interface HabitOverviewProps {
  habits: Habit[];
  entriesByDate: Record<string, Record<string, HabitDayEntry | undefined>>;
  todayKey: string;
  week: DateBounds;
  month: DateBounds;
  monthDateKey: string;
  onOpen: (habitId: string) => void;
}

export function HabitOverview({
  habits,
  entriesByDate,
  todayKey,
  week,
  month,
  monthDateKey,
  onOpen,
}: HabitOverviewProps) {
  const ranked = rankHabitScores(habits, entriesByDate, todayKey, week, month);
  const weekScore = combineHabitRates(ranked.map((row) => row.week));
  const monthScore = combineHabitRates(ranked.map((row) => row.month));
  const monthName = formatMonthName(monthDateKey, todayKey);

  if (ranked.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-text-secondary">
        {habits.length === 0
          ? 'Add a habit from the Habits view to see weekly and monthly scores.'
          : 'No habits counted in this week or month.'}
      </p>
    );
  }

  return (
    <div className="px-3 pb-8">
      <p className="px-1 pb-2 text-xs text-text-tertiary">Sorted by {monthName}, lowest first</p>
      <div className="grid grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] items-end gap-x-2 px-1 pb-2">
        <span className="text-[11px] text-text-tertiary">Habit</span>
        <span className="text-right text-[11px] text-text-tertiary">Week</span>
        <span className="text-right text-[11px] text-text-tertiary">{monthName}</span>
        <span className="py-1 text-sm text-text-secondary">Overall</span>
        <ScoreBlock rate={weekScore} />
        <ScoreBlock rate={monthScore} />
      </div>
      <ul>
        {ranked.map((row) => (
          <li key={row.habit.id}>
            <button
              type="button"
              onClick={() => onOpen(row.habit.id)}
              className="grid w-full grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] items-center gap-2 px-1 py-2 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                <HabitMark habit={row.habit} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-text-primary">{row.habit.name}</span>
                  {row.habit.archived ? <span className="block text-[11px] text-text-tertiary">Archived</span> : null}
                </span>
              </span>
              <ScoreBlock rate={row.week} />
              <ScoreBlock rate={row.month} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreBlock({ rate }: { rate: HabitRate }) {
  const percent = rate.expected === 0 ? '—' : `${Math.round(rate.rate * 100)}%`;
  const detail = rate.expected === 0 ? 'No days' : `${rate.met} of ${rate.expected}`;
  return (
    <span className="block text-right">
      <span className="block text-sm font-semibold text-text-primary">{percent}</span>
      <span className="block text-[11px] text-text-tertiary">{detail}</span>
    </span>
  );
}

function formatMonthName(dateKey: string, todayKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  const today = dateKeyToLocalDate(todayKey);
  if (!date) return 'Month';
  const sameYear = !today || date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' });
}
