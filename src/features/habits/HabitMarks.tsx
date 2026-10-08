import { Habit } from '@/types/habit';
import { habitColorClass } from '@/features/habits/habitAppearance';

export function HabitMark({ habit }: { habit: Pick<Habit, 'id' | 'name'> }) {
  const letter = habit.name.trim().charAt(0).toUpperCase() || 'H';
  return (
    <span
      className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-[11px] ${habitColorClass(habit.id)}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

export function StatusMark({ met }: { met: boolean }) {
  return (
    <span
      className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-xs ${
        met ? 'border-emerald-400 text-emerald-400' : 'border-rose-400 text-rose-400'
      }`}
      aria-hidden="true"
    >
      {met ? '✓' : '×'}
    </span>
  );
}

export function DayCircle({
  label,
  colorClass,
  filled,
  faded,
}: {
  label: string;
  colorClass: string;
  filled: boolean;
  faded?: boolean;
}) {
  return (
    <span
      className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[11px] ${
        filled ? colorClass : 'border-text-tertiary text-text-tertiary'
      } ${faded ? 'opacity-40' : ''}`}
    >
      {label}
    </span>
  );
}
