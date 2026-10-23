import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '@/store/store';
import { Habit, HabitDay, HabitDayEntry, HabitKind } from '@/types/habit';
import {
  createHabit,
  getHabitDays,
  listHabits,
  saveHabitEntry,
  updateHabit,
} from '@/services/habitService';
import { buildHabitCsv, downloadHabitCsv } from '@/services/habitExportService';
import { getLocalWeekDateRange, dateKeyToLocalDate, toLocalDateString } from '@/utils/dateUtils';
import { canAdvanceWeek, canRetreatWeek, monthBounds, shiftSelectedWeek } from '@/utils/habitStats';
import { HabitTodayList } from '@/features/habits/HabitTodayList';
import { HabitWeekList } from '@/features/habits/HabitWeekList';
import { HabitMonth } from '@/features/habits/HabitMonth';
import { HabitOverview } from '@/features/habits/HabitOverview';
import { HabitWeekNav } from '@/features/habits/HabitWeekNav';

type HabitView =
  | { name: 'today' }
  | { name: 'habits' }
  | { name: 'overview' }
  | { name: 'detail'; habitId: string };

function indexEntries(days: HabitDay[]): Record<string, Record<string, HabitDayEntry>> {
  const indexed: Record<string, Record<string, HabitDayEntry>> = {};
  for (const day of days) indexed[day.date] = day.entries;
  return indexed;
}

const HabitsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const todayKey = toLocalDateString(new Date());
  const [view, setView] = useState<HabitView>({ name: 'today' });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, Record<string, HabitDayEntry>>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const nextHabits = await listHabits(user.id);
      setHabits(nextHabits);
      if (nextHabits.length === 0) {
        setEntriesByDate({});
        return;
      }
      const start = nextHabits.reduce(
        (earliest, habit) => (habit.activeFrom < earliest ? habit.activeFrom : earliest),
        todayKey,
      );
      const days = await getHabitDays(user.id, start, todayKey);
      setEntriesByDate(indexEntries(days));
    } catch (err) {
      console.error('Failed to load habits:', err);
      toast.error('Could not load habits');
    } finally {
      setLoading(false);
    }
  }, [todayKey, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const week = useMemo(
    () => getLocalWeekDateRange(dateKeyToLocalDate(selectedDate) ?? new Date(), 1),
    [selectedDate],
  );
  const month = useMemo(() => monthBounds(selectedDate), [selectedDate]);
  const earliestKey = habits.reduce<string | null>(
    (earliest, habit) => (!earliest || habit.activeFrom < earliest ? habit.activeFrom : earliest),
    null,
  );
  const canGoPrevious = earliestKey ? canRetreatWeek(selectedDate, earliestKey) : false;
  const canGoNext = canAdvanceWeek(selectedDate, todayKey);

  const persistEntry = async (date: string, habitId: string, entry: HabitDayEntry) => {
    const previous = entriesByDate[date]?.[habitId];
    setEntriesByDate((current) => ({
      ...current,
      [date]: { ...current[date], [habitId]: entry },
    }));
    try {
      await saveHabitEntry(date, habitId, entry);
    } catch (err) {
      console.error('Failed to save habit entry:', err);
      setEntriesByDate((current) => {
        const nextDay = { ...current[date] };
        if (previous) nextDay[habitId] = previous;
        else delete nextDay[habitId];
        return { ...current, [date]: nextDay };
      });
      toast.error('Could not save that habit');
    }
  };

  const exportHabits = () => {
    const days: HabitDay[] = Object.entries(entriesByDate).map(([date, entries]) => ({
      id: date,
      userId: user?.id ?? '',
      date,
      entries,
    }));
    downloadHabitCsv(buildHabitCsv(habits, days, todayKey));
  };

  const create = async (input: { name: string; kind: HabitKind; target?: number; unit?: string }) => {
    const sortOrder = habits.reduce((max, habit) => Math.max(max, habit.sortOrder), -1) + 1;
    await createHabit({ ...input, sortOrder }, todayKey);
    toast.success('Habit added');
    await load();
  };

  const move = async (habitId: string, direction: -1 | 1) => {
    const active = habits.filter((habit) => !habit.archived);
    const index = active.findIndex((habit) => habit.id === habitId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= active.length) return;
    const next = [...active];
    const [item] = next.splice(index, 1);
    next.splice(swapIndex, 0, item);
    try {
      await Promise.all(next.map((habit, order) => updateHabit(habit.id, { sortOrder: order })));
      await load();
    } catch (err) {
      console.error('Failed to reorder habits:', err);
      toast.error('Could not reorder habits');
    }
  };

  const archive = async (habit: Habit) => {
    try {
      await updateHabit(habit.id, { archived: true, archivedOn: todayKey });
      await load();
    } catch (err) {
      console.error('Failed to archive habit:', err);
      toast.error('Could not archive that habit');
    }
  };

  const rename = async (habitId: string, name: string) => {
    try {
      await updateHabit(habitId, { name });
      setHabits((current) => current.map((habit) => (habit.id === habitId ? { ...habit, name } : habit)));
    } catch (err) {
      console.error('Failed to rename habit:', err);
      toast.error('Could not rename that habit');
    }
  };

  const detailHabit = view.name === 'detail' ? habits.find((habit) => habit.id === view.habitId) : undefined;
  const title =
    view.name === 'detail'
      ? detailHabit?.name ?? 'Habit'
      : view.name === 'overview'
        ? 'Overview'
        : view.name === 'habits'
          ? 'Habits'
          : selectedDate === todayKey
            ? 'Today'
            : formatDayTitle(selectedDate);

  const shiftWeek = (direction: -1 | 1) => {
    setSelectedDate((current) => shiftSelectedWeek(current, todayKey, direction));
  };

  return (
    <div className="pb-24 text-text-primary">
      <div className="mx-auto max-w-xl">
        {view.name === 'detail' ? null : (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pb-2 pt-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={view.name === 'today'}
                onClick={() => {
                  setSelectedDate(todayKey);
                  setView({ name: 'today' });
                }}
                className={`rounded-full px-3 py-1 text-sm ${view.name === 'today' ? 'bg-accent-primary text-text-inverse' : 'text-text-secondary'}`}
              >
                Today
              </button>
              <button
                type="button"
                aria-pressed={view.name === 'habits'}
                onClick={() => setView({ name: 'habits' })}
                className={`rounded-full px-3 py-1 text-sm ${view.name === 'habits' ? 'bg-accent-primary text-text-inverse' : 'text-text-secondary'}`}
              >
                Habits
              </button>
              <button
                type="button"
                aria-pressed={view.name === 'overview'}
                onClick={() => setView({ name: 'overview' })}
                className={`rounded-full px-3 py-1 text-sm ${view.name === 'overview' ? 'bg-accent-primary text-text-inverse' : 'text-text-secondary'}`}
              >
                Overview
              </button>
            </div>
          </div>
        )}

        {loading || view.name === 'detail' ? null : (
          <HabitWeekNav
            startKey={week.startDateKey}
            endKey={week.endDateKey}
            todayKey={todayKey}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-accent-primary" />
          </div>
        ) : view.name === 'detail' && detailHabit ? (
          <HabitMonth
            habit={detailHabit}
            todayKey={todayKey}
            entriesByDate={entriesByDate}
            onBack={() => setView({ name: 'habits' })}
            onRename={(name) => rename(detailHabit.id, name)}
            onExport={exportHabits}
          />
        ) : view.name === 'habits' ? (
          <HabitWeekList
            habits={habits}
            weekKeys={week.dateKeys}
            todayKey={todayKey}
            entriesByDate={entriesByDate}
            editing={editing}
            onToggleEditing={() => setEditing((current) => !current)}
            onOpen={(habitId) => setView({ name: 'detail', habitId })}
            onMove={move}
            onArchive={archive}
            onCreate={create}
            onExport={exportHabits}
          />
        ) : view.name === 'overview' ? (
          <HabitOverview
            habits={habits}
            entriesByDate={entriesByDate}
            todayKey={todayKey}
            week={{ start: week.startDateKey, end: week.endDateKey }}
            month={month}
            monthDateKey={selectedDate}
            onOpen={(habitId) => setView({ name: 'detail', habitId })}
          />
        ) : (
          <HabitTodayList
            habits={habits}
            selectedDate={selectedDate}
            todayKey={todayKey}
            entriesForDate={entriesByDate[selectedDate] ?? {}}
            onSelectDate={setSelectedDate}
            onToggle={(habit, completed) => persistEntry(selectedDate, habit.id, { completed })}
            onCount={(habit, value) => persistEntry(selectedDate, habit.id, { value })}
          />
        )}
      </div>
    </div>
  );
};

function formatDayTitle(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return 'Today';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default HabitsPage;
