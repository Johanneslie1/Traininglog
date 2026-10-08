import { useState } from 'react';
import { Habit, HabitDayEntry, HabitKind } from '@/types/habit';
import { habitColorClass, habitScheduleLabel } from '@/features/habits/habitAppearance';
import { DayCircle, HabitMark } from '@/features/habits/HabitMarks';
import { habitCompletion, habitDayMark } from '@/utils/habitStats';

function readableError(err: unknown, fallback: string): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
  if (code === 'permission-denied' || code.endsWith('permission-denied')) {
    return 'Could not save that habit. Sign in again, then try once more.';
  }
  return fallback;
}

interface HabitWeekListProps {
  habits: Habit[];
  weekKeys: string[];
  todayKey: string;
  entriesByDate: Record<string, Record<string, HabitDayEntry | undefined>>;
  editing: boolean;
  onToggleEditing: () => void;
  onOpen: (habitId: string) => void;
  onMove: (habitId: string, direction: -1 | 1) => void;
  onArchive: (habit: Habit) => void;
  onCreate: (input: { name: string; kind: HabitKind; target?: number; unit?: string }) => Promise<void>;
  onExport: () => void;
}

export function HabitWeekList({
  habits,
  weekKeys,
  todayKey,
  entriesByDate,
  editing,
  onToggleEditing,
  onOpen,
  onMove,
  onArchive,
  onCreate,
  onExport,
}: HabitWeekListProps) {
  const active = habits.filter((habit) => !habit.archived);
  const archived = habits.filter((habit) => habit.archived);

  return (
    <div className="space-y-3 px-3 pb-8">
      <div className="flex items-center justify-end gap-3 px-1">
        <button type="button" onClick={onExport} className="text-sm text-accent-primary">
          Export habits
        </button>
        <button type="button" onClick={onToggleEditing} className="text-sm text-text-secondary">
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {active.length === 0 ? (
        <p className="px-1 py-6 text-sm text-text-secondary">Add a habit to start logging.</p>
      ) : (
        active.map((habit, index) => (
          <HabitWeekCard
            key={habit.id}
            habit={habit}
            weekKeys={weekKeys}
            todayKey={todayKey}
            entriesByDate={entriesByDate}
            editing={editing}
            canMoveUp={index > 0}
            canMoveDown={index < active.length - 1}
            onOpen={() => onOpen(habit.id)}
            onMove={onMove}
            onArchive={() => onArchive(habit)}
          />
        ))
      )}

      <AddHabitForm onCreate={onCreate} />

      {archived.length > 0 ? (
        <div className="space-y-2 pt-2">
          <p className="px-1 text-xs text-text-tertiary">Archived</p>
          {archived.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => onOpen(habit.id)}
              className="block w-full truncate px-1 py-2 text-left text-sm text-text-secondary"
            >
              {habit.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HabitWeekCard({
  habit,
  weekKeys,
  todayKey,
  entriesByDate,
  editing,
  canMoveUp,
  canMoveDown,
  onOpen,
  onMove,
  onArchive,
}: {
  habit: Habit;
  weekKeys: string[];
  todayKey: string;
  entriesByDate: Record<string, Record<string, HabitDayEntry | undefined>>;
  editing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpen: () => void;
  onMove: (habitId: string, direction: -1 | 1) => void;
  onArchive: () => void;
}) {
  const rate = habitCompletion(
    habit,
    Object.fromEntries(Object.entries(entriesByDate).map(([date, entries]) => [date, entries[habit.id]])),
    todayKey,
  );

  return (
    <div className="rounded-xl bg-bg-tertiary px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm text-text-primary">{habit.name}</span>
          <span className="block text-xs text-text-tertiary">
            {habitScheduleLabel(habit.kind, habit.target, habit.unit)}
            {rate.expected > 0 ? ` · ${Math.round(rate.rate * 100)}%` : ''}
          </span>
        </button>
        <HabitMark habit={habit} />
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${habit.name}`}
        className="mt-2 grid w-full grid-cols-7 gap-1"
      >
        {weekKeys.map((dateKey) => {
          const mark = habitDayMark(habit, dateKey, todayKey, entriesByDate[dateKey]?.[habit.id]);
          const day = Number(dateKey.slice(-2));
          return (
            <DayCircle
              key={dateKey}
              label={String(day)}
              colorClass={habitColorClass(habit.id)}
              filled={mark === 'met'}
              faded={mark === 'future' || mark === 'inactive'}
            />
          );
        })}
      </button>
      {editing ? (
        <div className="mt-2 flex items-center gap-3">
          <button type="button" disabled={!canMoveUp} onClick={() => onMove(habit.id, -1)} className="text-sm text-text-secondary disabled:opacity-30">
            Up
          </button>
          <button type="button" disabled={!canMoveDown} onClick={() => onMove(habit.id, 1)} className="text-sm text-text-secondary disabled:opacity-30">
            Down
          </button>
          <button type="button" onClick={onArchive} className="ml-auto text-sm text-text-secondary">
            Archive
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddHabitForm({
  onCreate,
}: {
  onCreate: (input: { name: string; kind: HabitKind; target?: number; unit?: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HabitKind>('check');
  const [target, setTarget] = useState('8');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a habit name.');
      return;
    }
    const parsedTarget = Number(target);
    if (kind === 'count' && (!Number.isInteger(parsedTarget) || parsedTarget < 1)) {
      setError('Enter a target of at least 1.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreate({
        name: trimmed,
        kind,
        target: kind === 'count' ? parsedTarget : undefined,
        unit: kind === 'count' ? unit.trim() : undefined,
      });
      setName('');
      setUnit('');
      setKind('check');
      setTarget('8');
      setOpen(false);
    } catch (err) {
      setError(readableError(err, 'Could not add the habit. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="px-1 py-2 text-sm text-accent-primary">
        Add habit
      </button>
    );
  }

  return (
    <form
      className="space-y-3 px-1 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block text-sm text-text-secondary">
        Name
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={kind === 'check'}
          onClick={() => setKind('check')}
          className={`rounded-full px-3 py-1.5 text-sm ${kind === 'check' ? 'bg-accent-primary text-text-inverse' : 'bg-bg-tertiary text-text-secondary'}`}
        >
          Checkbox
        </button>
        <button
          type="button"
          aria-pressed={kind === 'count'}
          onClick={() => setKind('count')}
          className={`rounded-full px-3 py-1.5 text-sm ${kind === 'count' ? 'bg-accent-primary text-text-inverse' : 'bg-bg-tertiary text-text-secondary'}`}
        >
          Daily number
        </button>
      </div>
      {kind === 'count' ? (
        <div className="flex gap-2">
          <label className="block flex-1 text-sm text-text-secondary">
            Target
            <input
              type="number"
              min={1}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <label className="block flex-1 text-sm text-text-secondary">
            Unit
            <input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              maxLength={40}
              className="mt-1 w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
            />
          </label>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="text-sm text-accent-primary disabled:opacity-40">
          {saving ? 'Adding…' : 'Add habit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
