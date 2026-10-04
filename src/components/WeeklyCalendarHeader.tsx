import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, isToday, addDays } from 'date-fns';
import { CalendarDaySummary, getWeekSessionSummaries } from '@/services/calendar';
import { toLocalDateString } from '@/utils/dateUtils';

interface WeeklyCalendarHeaderProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendarIconClick: () => void;
  onMenuClick?: () => void;
  refreshKey?: number;
}

const WeeklyCalendarHeader: React.FC<WeeklyCalendarHeaderProps> = ({
  selectedDate,
  onDateSelect,
  onCalendarIconClick,
  onMenuClick,
  refreshKey = 0
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );
  const [weekDaySummaries, setWeekDaySummaries] = useState<CalendarDaySummary[]>([]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentWeekStart]);

  useEffect(() => {
    const loadWeekSessionSummaries = async () => {
      const summaries = await getWeekSessionSummaries(currentWeekStart);
      setWeekDaySummaries(summaries);
    };
    loadWeekSessionSummaries();
  }, [currentWeekStart, refreshKey]);

  useEffect(() => {
    setCurrentWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
  }, [selectedDate]);

  const daySummaryMap = useMemo(() => {
    const map = new Map<string, CalendarDaySummary>();
    weekDaySummaries.forEach((summary) => {
      map.set(summary.sessionDateKey, summary);
    });
    return map;
  }, [weekDaySummaries]);

  const handlePreviousDay = () => {
    onDateSelect(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateSelect(addDays(selectedDate, 1));
  };

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-bg-secondary">
      <div className="flex items-center justify-between px-4 py-2.5">
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 transition-colors hover:bg-bg-tertiary"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : (
          <span className="w-10" aria-hidden="true" />
        )}

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousDay}
            className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Previous day"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="truncate text-base font-semibold text-text-primary">
            {format(selectedDate, 'EEE d MMM')}
          </h1>
          <button
            type="button"
            onClick={handleNextDay}
            className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Next day"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={onCalendarIconClick}
          className="rounded-lg p-2 transition-colors hover:bg-bg-tertiary group"
          aria-label="Open monthly calendar"
        >
          <svg
            className="h-6 w-6 text-text-primary transition-colors group-hover:text-accent-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 pb-3">
        <button
          type="button"
          onClick={() => setCurrentWeekStart((prev) => addWeeks(prev, -1))}
          className="rounded-lg p-1 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Previous week"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center justify-center gap-2" role="list" aria-label="Week days">
          {weekDays.map((day) => {
            const daySummary = daySummaryMap.get(toLocalDateString(day));
            const sessionCount = daySummary?.sessionCount || 0;
            const hasSessions = sessionCount > 0;
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(selectedDate, day);
            const size = isSelected ? 8 : 5;

            return (
              <button
                key={day.toString()}
                type="button"
                role="listitem"
                onClick={() => onDateSelect(day)}
                aria-label={`${format(day, 'EEEE, MMMM d')}${isTodayDay ? ', today' : ''}${sessionCount === 1 ? ', 1 session' : sessionCount > 1 ? `, ${sessionCount} sessions` : ', no sessions'}`}
                aria-current={isSelected ? 'date' : undefined}
                data-session-count={sessionCount}
                data-is-selected={isSelected ? 'true' : 'false'}
                data-is-today={isTodayDay ? 'true' : 'false'}
                className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-bg-tertiary"
              >
                <span
                  className={`rounded-full transition-all ${
                    isSelected
                      ? 'bg-accent-primary'
                      : hasSessions
                        ? 'bg-text-secondary'
                        : 'bg-text-tertiary/40'
                  } ${isTodayDay && !isSelected ? 'ring-1 ring-accent-primary ring-offset-1 ring-offset-bg-secondary' : ''}`}
                  style={{ width: size, height: size }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCurrentWeekStart((prev) => addWeeks(prev, 1))}
          className="rounded-lg p-1 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Next week"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WeeklyCalendarHeader;
