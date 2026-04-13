import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDaySummary, getMonthSessionSummaries, getWorkoutsByDate } from '@/services/calendar';
import { ExerciseLog } from '@/types/exercise';
import { endOfMonth, format, getDay, isSameDay, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { toLocalDateString } from '@/utils/dateUtils';

interface CalendarProps {
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({ onDayClick, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDaySummary[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<ExerciseLog[]>([]);

  useEffect(() => {
    const loadCalendarDays = async () => {
      const days = await getMonthSessionSummaries(currentMonth);
      setCalendarDays(days);
    };

    loadCalendarDays();
  }, [currentMonth]);

  useEffect(() => {
    const loadSelectedDayWorkouts = async () => {
      if (!selectedDate) return;
      const workouts = await getWorkoutsByDate(selectedDate);
      setSelectedWorkout(workouts);
    };
    loadSelectedDayWorkouts();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && !isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(selectedDate);
    }
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

  /* Copy feature to be implemented later */

  return (
    <div className="bg-bg-secondary rounded-xl p-6 shadow-xl border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-3 hover:bg-bg-tertiary rounded-lg transition-all duration-200 text-text-primary font-bold hover:text-accent-primary"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-3 hover:bg-bg-tertiary rounded-lg transition-all duration-200 text-text-primary font-bold hover:text-accent-primary"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-text-secondary">
        <div className="inline-flex items-center gap-2 rounded-full bg-bg-tertiary px-3 py-1.5">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-accent-primary bg-transparent" aria-hidden="true"></span>
          <span>Today</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-bg-tertiary px-3 py-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-status-info shadow-sm shadow-status-info/25" aria-hidden="true"></span>
          <span>1 session</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-bg-tertiary px-3 py-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-status-success shadow-sm shadow-status-success/30" aria-hidden="true"></span>
          <span>2+ sessions</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-text-tertiary font-semibold text-xs py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: leadingEmptyDays }).map((_, index) => (
          <div key={`leading-${index}`} aria-hidden="true" className="aspect-square"></div>
        ))}
        {days.map(day => {
          const daySummary = calendarDayMap.get(toLocalDateString(day));
          const sessionCount = daySummary?.sessionCount || 0;
          const hasSessions = sessionCount > 0;
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const isTodayDay = isToday(day);
          const sessionStateClass = sessionCount >= 2
            ? 'bg-status-success text-white shadow-lg shadow-status-success/30 hover:brightness-110'
            : sessionCount === 1
              ? 'bg-status-info text-white shadow-lg shadow-status-info/25 hover:brightness-110'
              : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary';
          const selectedStateClass = isSelected
            ? hasSessions
              ? 'scale-[1.03] -translate-y-0.5 shadow-xl'
              : 'bg-bg-tertiary text-text-primary scale-[1.03] -translate-y-0.5 shadow-lg'
            : '';
          const todayStateClass = isTodayDay
            ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary'
            : '';
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
                aspect-square min-h-[48px] p-2 rounded-lg text-center relative
                transition-all duration-200 ease-in-out
                font-semibold text-sm
                ${sessionStateClass}
                ${todayStateClass}
                ${selectedStateClass}
              `}
            >
              <span className="pointer-events-none inline-flex h-full w-full items-start justify-start">
                {format(day, 'd')}
              </span>
              {hasSessions && (
                <span className="pointer-events-none absolute bottom-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {sessionCount}
                </span>
              )}
            </button>
          );
        })}
        {Array.from({ length: trailingEmptyDays }).map((_, index) => (
          <div key={`trailing-${index}`} aria-hidden="true" className="aspect-square"></div>
        ))}
      </div>

      {/* Selected Day Workouts */}
      {selectedWorkout.length > 0 && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-text-primary font-semibold text-lg mb-3">
            {format(selectedDate!, 'MMMM d, yyyy')} Workouts
          </h3>
          <div className="space-y-2">
            {selectedWorkout.map(workout => (
              <div key={workout.id} className="bg-bg-tertiary p-4 rounded-lg hover:bg-bg-quaternary transition-colors duration-200 border border-border">
                <div className="text-text-primary font-medium">{workout.exerciseName}</div>
                <div className="text-sm text-text-secondary mt-1">
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
