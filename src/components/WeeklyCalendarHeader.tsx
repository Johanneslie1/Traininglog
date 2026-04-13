import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, isToday } from 'date-fns';
import { CalendarDaySummary, getWeekSessionSummaries } from '@/services/calendar';
import { useScrollCollapse } from '@/hooks/useScrollCollapse';
import { toLocalDateString } from '@/utils/dateUtils';

interface WeeklyCalendarHeaderProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendarIconClick: () => void;
  onMenuClick?: () => void;
}

const WeeklyCalendarHeader: React.FC<WeeklyCalendarHeaderProps> = ({
  selectedDate,
  onDateSelect,
  onCalendarIconClick,
  onMenuClick
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekDaySummaries, setWeekDaySummaries] = useState<CalendarDaySummary[]>([]);
  const { isCollapsed } = useScrollCollapse(80);

  // Calculate week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Fetch session summaries for the current week
  useEffect(() => {
    const loadWeekSessionSummaries = async () => {
      const summaries = await getWeekSessionSummaries(currentWeekStart);
      setWeekDaySummaries(summaries);
    };
    loadWeekSessionSummaries();
  }, [currentWeekStart]);

  // Create map for quick lookup of day summaries
  const daySummaryMap = useMemo(() => {
    const map = new Map<string, CalendarDaySummary>();
    weekDaySummaries.forEach((summary) => {
      map.set(summary.sessionDateKey, summary);
    });
    return map;
  }, [weekDaySummaries]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    onDateSelect(day);
  };

  return (
    <div
      className={`
        sticky top-0 z-40
        bg-bg-secondary border-b border-border
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Top Bar - Menu and Calendar Icons */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        {/* Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Title/Date */}
        <h1 className="text-text-primary text-base font-medium">
          {format(selectedDate, 'MMMM yyyy')}
        </h1>

        {/* Calendar Icon Button */}
        <button
          onClick={onCalendarIconClick}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors group"
          aria-label="Open monthly calendar"
        >
          <svg
            className="w-6 h-6 text-text-primary group-hover:text-accent-primary transition-colors"
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

      {/* Week Navigation */}
      <div className={`flex items-center justify-between px-2 ${isCollapsed ? 'py-2' : 'py-3'} transition-all duration-300`}>
        {/* Previous Week Arrow */}
        <button
          onClick={handlePreviousWeek}
          className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors flex-shrink-0"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Days Grid */}
        <div className="flex justify-center items-center gap-1 flex-1 overflow-x-auto px-1">
          {weekDays.map(day => {
            const daySummary = daySummaryMap.get(toLocalDateString(day));
            const sessionCount = daySummary?.sessionCount || 0;
            const hasSessions = sessionCount > 0;
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(selectedDate, day);

            // Three-state styling based on session count
            const sessionStateClass = sessionCount >= 2
              ? 'bg-status-success text-white shadow-md shadow-status-success/20'
              : sessionCount === 1
                ? 'bg-status-info text-white shadow-md shadow-status-info/25'
                : 'text-text-tertiary';

            const todayRingClass = isTodayDay ? 'ring-2 ring-accent-primary' : '';
            const selectedScaleClass = isSelected && !isTodayDay ? 'scale-105 ring-2 ring-accent-primary' : '';

            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                aria-label={`${format(day, 'EEEE, MMMM d')}${isTodayDay ? ', today' : ''}${sessionCount === 1 ? ', 1 session' : sessionCount > 1 ? `, ${sessionCount} sessions` : ', no sessions'}`}
                data-session-count={sessionCount}
                data-is-selected={isSelected ? 'true' : 'false'}
                data-is-today={isTodayDay ? 'true' : 'false'}
                className={`
                  flex flex-col items-center justify-center
                  transition-all duration-200
                  flex-shrink-0
                  ${isCollapsed ? 'gap-0 min-w-[36px]' : 'gap-0.5 min-w-[40px]'}
                `}
              >
                {/* Day Name */}
                <span className={`
                  font-medium
                  ${isCollapsed ? 'text-[10px]' : 'text-xs'}
                  ${hasSessions ? 'text-text-secondary' : 'text-text-tertiary'}
                  transition-all duration-200
                `}>
                  {format(day, 'EEE')[0]}
                </span>

                {/* Date Number with Background */}
                <div className={`
                  rounded-full flex items-center justify-center
                  font-semibold relative
                  ${isCollapsed ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}
                  ${sessionStateClass}
                  ${!hasSessions && 'hover:bg-bg-tertiary hover:text-text-secondary'}
                  ${todayRingClass}
                  ${selectedScaleClass}
                  transition-all duration-200
                `}>
                  {format(day, 'd')}
                  {hasSessions && (
                    <span className="pointer-events-none absolute -bottom-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-black/40 px-1 py-0 text-[8px] font-bold leading-none text-white">
                      {sessionCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next Week Arrow */}
        <button
          onClick={handleNextWeek}
          className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors flex-shrink-0"
          aria-label="Next week"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WeeklyCalendarHeader;
