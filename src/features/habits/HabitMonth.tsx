import { useState } from 'react';
import { Habit, HabitDayEntry } from '@/types/habit';
import { habitColorClass } from '@/features/habits/habitAppearance';
import { DayCircle } from '@/features/habits/HabitMarks';
import { bestStreak, currentStreak, habitCompletion, habitDayMark } from '@/utils/habitStats';
import { dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';

interface HabitMonthProps {
  habit: Habit;
  todayKey: string;
  entriesByDate: Record<string, Record<string, HabitDayEntry | undefined>>;
  onBack: () => void;
  onRename: (name: string) => Promise<void>;
  onExport: () => void;
}

export function HabitMonth({
  habit,
  todayKey,
  entriesByDate,
  onBack,
  onRename,
  onExport,
}: HabitMonthProps) {
  const today = dateKeyToLocalDate(todayKey) ?? new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [name, setName] = useState(habit.name);
  const entries = Object.fromEntries(
    Object.entries(entriesByDate).map(([date, byHabit]) => [date, byHabit[habit.id]]),
  );
  const streak = currentStreak(habit, entries, todayKey);
  const best = bestStreak(habit, entries, todayKey);
  const rate = habitCompletion(habit, entries, todayKey);
  const cells = monthCells(cursor.getFullYear(), cursor.getMonth());
  const atCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 px-3 pt-2">
        <button type="button" onClick={onBack} className="rounded-lg px-2 py-1 text-sm text-text-secondary">
          Back
        </button>
      </div>
      <form
        className="px-4"
        onSubmit={(event) => {
          event.preventDefault();
          const next = name.trim();
          if (!next || next === habit.name) return;
          void onRename(next);
        }}
      >
        <label className="sr-only" htmlFor="habit-name">
          Habit name
        </label>
        <input
          id="habit-name"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            const next = name.trim();
            if (next && next !== habit.name) void onRename(next);
          }}
          className="w-full bg-transparent text-lg font-semibold text-text-primary outline-none"
        />
      </form>

      <div className="flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          className="rounded-lg px-2 py-1 text-text-secondary"
        >
          ‹
        </button>
        <p className="text-sm text-text-primary">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={atCurrentMonth}
          onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          className="rounded-lg px-2 py-1 text-text-secondary disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-3 pt-3">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
          <span key={`${label}-${index}`} className="text-center text-[11px] text-text-tertiary">
            {label}
          </span>
        ))}
        {cells.map((dateKey, index) => {
          if (!dateKey) return <span key={`pad-${index}`} />;
          const mark = habitDayMark(habit, dateKey, todayKey, entries[dateKey]);
          return (
            <DayCircle
              key={dateKey}
              label={String(Number(dateKey.slice(-2)))}
              colorClass={habitColorClass(habit.id)}
              filled={mark === 'met'}
              faded={mark === 'future' || mark === 'inactive'}
            />
          );
        })}
      </div>

      <div className="space-y-4 px-4 pt-6">
        <div>
          <p className="text-xs text-text-tertiary">Streak</p>
          <p className={`text-[22px] font-semibold ${habitColorClass(habit.id)}`}>
            {streak} {streak === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-text-tertiary">Best {best} {best === 1 ? 'day' : 'days'}</p>
        </div>
        <p className="text-sm text-text-secondary">
          {rate.expected === 0
            ? 'No days counted yet'
            : `${Math.round(rate.rate * 100)}% · ${rate.met} of ${rate.expected} days`}
        </p>
        <button type="button" onClick={onExport} className="text-sm text-accent-primary">
          Export habits
        </button>
      </div>
    </div>
  );
}

function monthCells(year: number, monthIndex: number): Array<string | null> {
  const first = new Date(year, monthIndex, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(toLocalDateString(new Date(year, monthIndex, day)));
  }
  return cells;
}
