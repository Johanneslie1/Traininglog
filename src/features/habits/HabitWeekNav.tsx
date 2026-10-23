import { dateKeyToLocalDate } from '@/utils/dateUtils';

interface HabitWeekNavProps {
  startKey: string;
  endKey: string;
  todayKey: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function HabitWeekNav({
  startKey,
  endKey,
  todayKey,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: HabitWeekNavProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-2 pb-1">
      <button
        type="button"
        aria-label="Previous week"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="rounded-lg px-2 py-1 text-lg text-text-secondary disabled:opacity-30"
      >
        ‹
      </button>
      <p className="min-w-[9.5rem] text-center text-sm text-text-primary">{formatWeekRange(startKey, endKey, todayKey)}</p>
      <button
        type="button"
        aria-label="Next week"
        disabled={!canGoNext}
        onClick={onNext}
        className="rounded-lg px-2 py-1 text-lg text-text-secondary disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}

function formatWeekRange(startKey: string, endKey: string, todayKey: string): string {
  const start = dateKeyToLocalDate(startKey);
  const end = dateKeyToLocalDate(endKey);
  if (!start || !end) return 'Week';
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  const endMonth = end.toLocaleDateString(undefined, { month: 'short' });
  const range = sameMonth
    ? `${start.getDate()}–${end.getDate()} ${endMonth}`
    : `${start.getDate()} ${start.toLocaleDateString(undefined, { month: 'short' })} – ${end.getDate()} ${endMonth}`;
  return todayKey >= startKey && todayKey <= endKey ? `This week · ${range}` : range;
}
