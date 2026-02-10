import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, isToday } from 'date-fns';
import { getWorkoutDaysForWeek } from '@/services/calendar';
import { useScrollCollapse } from '@/hooks/useScrollCollapse';

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
  const [workoutDays, setWorkoutDays] = useState<Date[]>([]);
  const { isCollapsed } = useScrollCollapse(80);

  // Calculate week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Fetch workout days for the current week
  useEffect(() => {
    const loadWorkoutDays = async () => {
      const days = await getWorkoutDaysForWeek(currentWeekStart);
      setWorkoutDays(days);
    };
    loadWorkoutDays();
  }, [currentWeekStart]);

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
        ${isCollapsed ? 'h-14 py-2' : 'h-22 py-4'}
      `}
    >
      <div className="flex items-center justify-center relative px-4">
        {/* Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="absolute left-2 p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Previous Week Arrow */}
        <button
          onClick={handlePreviousWeek}
          className="absolute left-14 p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Days Grid */}
        <div className="flex justify-center items-center gap-2">
          {weekDays.map(day => {
            const isWorkoutDay = workoutDays.some(workoutDay => isSameDay(workoutDay, day));
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(selectedDate, day);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={`
                  flex flex-col items-center
                  transition-all duration-200
                  ${isCollapsed ? 'gap-0' : 'gap-1'}
                `}
              >
                {/* Day Name */}
                <span className={`
                  font-semibold
                  ${isCollapsed ? 'text-xs' : 'text-sm'}
                  ${isWorkoutDay ? 'text-white' : 'text-text-tertiary'}
                  transition-all duration-200
                `}>
                  {isCollapsed ? format(day, 'EEEEE') : format(day, 'EEE')}
                </span>
                
                {/* Date Number with Background */}
                <div className={`
                  rounded-full flex items-center justify-center
                  font-semibold
                  ${isCollapsed ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'}
                  ${isWorkoutDay 
                    ? 'bg-status-success text-white shadow-lg shadow-status-success/30 hover:brightness-110' 
                    : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary'
                  }
                  ${isTodayDay && !isWorkoutDay
                    ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' 
                    : ''
                  }
                  ${isTodayDay && isWorkoutDay
                    ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' 
                    : ''
                  }
                  ${isSelected && !isTodayDay && isWorkoutDay 
                    ? 'scale-105 ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' 
                    : ''
                  }
                  ${isSelected && !isTodayDay && !isWorkoutDay 
                    ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' 
                    : ''
                  }
                  transition-all duration-200
                `}>
                  {format(day, 'd')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next Week Arrow */}
        <button
          onClick={handleNextWeek}
          className="absolute right-14 p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          aria-label="Next week"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Calendar Icon Button */}
        <button
          onClick={onCalendarIconClick}
          className="absolute right-2 p-2 hover:bg-bg-tertiary rounded-lg transition-colors group"
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
    </div>
  );
};

export default WeeklyCalendarHeader;
