import React from 'react';
import { Habit, HabitDayEntry } from '@/types/habit';
import { getLocalWeekDateRange, dateKeyToLocalDate } from '@/utils/dateUtils';
import { habitScheduleLabel } from '@/features/habits/habitAppearance';
import { isEntryMet, isHabitExpectedOnDate } from '@/utils/habitStats';
import { HabitMark, StatusMark } from '@/features/habits/HabitMarks';

interface HabitTodayListProps {
  habits: Habit[];
  selectedDate: string;
  todayKey: string;
  entriesForDate: Record<string, HabitDayEntry | undefined>;
  onSelectDate: (dateKey: string) => void;
  onToggle: (habit: Habit, completed: boolean) => void;
  onCount: (habit: Habit, value: number) => void;
}

export function HabitTodayList({
  habits,
  selectedDate,
  todayKey,
  entriesForDate,
  onSelectDate,
  onToggle,
  onCount,
}: HabitTodayListProps) {
  const selected = dateKeyToLocalDate(selectedDate) ?? new Date();
  const week = getLocalWeekDateRange(selected, 1);
  const isFuture = selectedDate > todayKey;
  const visible = habits.filter(
    (habit) => !habit.archived && isHabitExpectedOnDate(habit, selectedDate, todayKey),
  );

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 px-1 pb-2">
        {week.dateKeys.map((dateKey) => {
          const date = dateKeyToLocalDate(dateKey) ?? new Date();
          const selected = dateKey === selectedDate;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              className="flex flex-col items-center gap-1 rounded-lg py-1 text-text-tertiary"
            >
              <span className="text-[11px]">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                  selected ? 'bg-accent-primary text-text-inverse' : 'text-text-secondary'
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {isFuture ? (
        <p className="px-4 py-8 text-center text-sm text-text-secondary">This day is still ahead.</p>
      ) : visible.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-text-secondary">
          No habits for this day. Add one from the Habits view.
        </p>
      ) : (
        <ul>
          {visible.map((habit) => {
            const entry = entriesForDate[habit.id];
            const met = isEntryMet(habit, entry);
            if (habit.kind === 'count') {
              const value = entry?.value ?? 0;
              return (
                <li key={habit.id} className="flex items-center gap-3 px-4 py-2">
                  <HabitMark habit={habit} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{habit.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {value} of {habitScheduleLabel(habit.kind, habit.target, habit.unit)}
                    </p>
                  </div>
                  <RoundStep
                    label={`Remove one from ${habit.name}`}
                    onClick={() => onCount(habit, Math.max(0, value - 1))}
                  >
                    −
                  </RoundStep>
                  <span className="w-5 text-center text-sm text-text-primary">{value}</span>
                  <RoundStep
                    label={`Add one to ${habit.name}`}
                    onClick={() => onCount(habit, Math.min(999, value + 1))}
                  >
                    +
                  </RoundStep>
                </li>
              );
            }

            return (
              <li key={habit.id}>
                <button
                  type="button"
                  onClick={() => onToggle(habit, !met)}
                  aria-pressed={met}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left"
                >
                  <HabitMark habit={habit} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text-primary">{habit.name}</span>
                    <span className="block text-xs text-text-tertiary">{habitScheduleLabel(habit.kind)}</span>
                  </span>
                  <StatusMark met={met} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RoundStep({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-[22px] w-[22px] place-items-center rounded-full border border-border text-sm text-text-secondary"
    >
      {children}
    </button>
  );
}
