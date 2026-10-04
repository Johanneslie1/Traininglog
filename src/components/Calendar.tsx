import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDaySummary, getMonthSessionSummaries, getWorkoutsByDate } from '@/services/calendar';
import { ExerciseLog } from '@/types/exercise';
import { endOfMonth, format, getDay, isSameDay, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { toLocalDateString } from '@/utils/dateUtils';

interface CalendarProps {
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
  refreshKey?: number;
  showSelectedWorkouts?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  onDayClick,
  selectedDate,
  refreshKey = 0,
  showSelectedWorkouts = true,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDaySummary[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<ExerciseLog[]>([]);

  useEffect(() => {
    const loadCalendarDays = async () => {
      const days = await getMonthSessionSummaries(currentMonth);
      setCalendarDays(days);
    };

    loadCalendarDays();
  }, [currentMonth, refreshKey]);

  useEffect(() => {
    const loadSelectedDayWorkouts = async () => {
      if (!selectedDate) return;
      const workouts = await getWorkoutsByDate(selectedDate);
      setSelectedWorkout(workouts);
    };
    loadSelectedDayWorkouts();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setCurrentMonth((visibleMonth) =>
      isSameMonth(selectedDate, visibleMonth) ? visibleMonth : selectedDate
    );
  }, [selectedDate]);

  const calendarDayMap = useMemo(() => {
    const dayMap = new Map<string, CalendarDaySummary>();
    calendarDays.forEach((day) => {
      dayMap.set(day.sessionDateKey, day);
    });
    return dayMap;
  }, [calendarDays]);

  const days = useMemo(() => calendarDays.map((day) => day.date), [calendarDays]);

  const leadingEmptyDays = useMemo(() => {
    if (days.length === 0) {
      return getDay(startOfMonth(currentMonth));
    }

    return getDay(days[0]);
  }, [currentMonth, days]);

  const trailingEmptyDays = useMemo(() => {
    const lastVisibleDay = days.length === 0 ? endOfMonth(currentMonth) : days[days.length - 1];
    return (6 - getDay(lastVisibleDay) + 7) % 7;
  }, [currentMonth, days]);

  const handleDayClick = (date: Date) => {
    onDayClick?.(date);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          className="rounded-lg p-2 text-text-primary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold text-text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          className="rounded-lg p-2 text-text-primary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="py-1.5 text-center text-[11px] font-medium text-text-tertiary"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: leadingEmptyDays }).map((_, index) => (
          <div key={`leading-${index}`} aria-hidden="true" className="h-10" />
        ))}
        {days.map(day => {
          const daySummary = calendarDayMap.get(toLocalDateString(day));
          const sessionCount = daySummary?.sessionCount || 0;
          const hasSessions = sessionCount > 0;
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const isTodayDay = isToday(day);
          const labelParts = [format(day, 'MMMM d, yyyy')];

          if (isTodayDay) {
            labelParts.push('today');
          }

          if (sessionCount === 1) {
            labelParts.push('1 session');
          } else if (sessionCount > 1) {
            labelParts.push(`${sessionCount} sessions`);
          } else {
            labelParts.push('no sessions');
          }

          return (
            <button
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              aria-label={labelParts.join(', ')}
              data-session-count={sessionCount}
              data-is-selected={isSelected ? 'true' : 'false'}
              data-is-today={isTodayDay ? 'true' : 'false'}
              className={`
                flex h-10 flex-col items-center justify-center gap-1 rounded-md
                text-sm text-text-secondary transition-colors
                hover:bg-bg-tertiary hover:text-text-primary
                ${isSelected ? 'ring-1 ring-accent-primary text-text-primary' : ''}
                ${isTodayDay && !isSelected ? 'text-accent-primary' : ''}
              `}
            >
              <span className="leading-none">{format(day, 'd')}</span>
              <span
                className={`h-1 w-1 rounded-full ${hasSessions ? 'bg-accent-primary' : 'bg-transparent'}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
        {Array.from({ length: trailingEmptyDays }).map((_, index) => (
          <div key={`trailing-${index}`} aria-hidden="true" className="h-10" />
        ))}
      </div>

      {showSelectedWorkouts && selectedWorkout.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <h3 className="mb-3 text-base font-semibold text-text-primary">
            {format(selectedDate!, 'MMMM d, yyyy')} Workouts
          </h3>
          <div className="space-y-2">
            {selectedWorkout.map(workout => (
              <div
                key={workout.id}
                className="rounded-lg border border-border bg-bg-tertiary p-3 transition-colors hover:bg-bg-quaternary"
              >
                <div className="font-medium text-text-primary">{workout.exerciseName}</div>
                <div className="mt-1 text-sm text-text-secondary">
                  {workout.sets.length} sets
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
