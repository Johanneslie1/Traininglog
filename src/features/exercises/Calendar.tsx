import React, { useState, useEffect, useCallback } from 'react';

interface CalendarProps {
  onClose: () => void;
  onSelectExercises: (exercises: never[]) => void; // Keep for compatibility but won't be used
  onDateSelect?: (date: Date) => void;
  selectedDate: Date;
}

// Utility functions
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const Calendar: React.FC<CalendarProps> = ({ 
  onClose, 
  onDateSelect,
  selectedDate
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => normalizeDate(selectedDate));
  const [isLoading, setIsLoading] = useState(false);

  const handleDateSelect = useCallback(async (date: Date) => {
    if (!date) return;
    
    const newDate = normalizeDate(date);
    
    // Only notify parent component about the date change
    // Let the parent handle exercise loading to avoid race conditions
    if (onDateSelect) {
      setIsLoading(true);
      onDateSelect(newDate);
      // Small delay to show loading state, then reset
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [onDateSelect]);

  // Update current month view when selected date changes
  useEffect(() => {
    setCurrentDate(normalizeDate(selectedDate));
  }, [selectedDate]);

  // Get month details
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToPreviousYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()));
  };

  const goToNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()));
  };  

  // Calendar grid array
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    if (day <= 0 || day > daysInMonth) return null;
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const areDatesEqual = (date1: Date, date2: Date): boolean => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
  };

  return (
    <div className="bg-[#1a1a1a] w-full h-screen p-4">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl text-white">Select Date</h2>
        </div>
      </div>

      {/* Month and Year Navigation */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousYear}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={`Go to year ${currentDate.getFullYear() - 1}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M4 12h16" />
            </svg>
          </button>
          <span className="text-white font-medium min-w-[4ch] text-center" aria-label="Current year">
            {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextYear}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={`Go to year ${currentDate.getFullYear() + 1}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M4 12h16" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={`Go to ${monthNames[(currentDate.getMonth() + 11) % 12]}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span 
            className="text-white font-medium min-w-[100px] text-center"
            aria-label="Current month"
          >
            {monthNames[currentDate.getMonth()]}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label={`Go to ${monthNames[(currentDate.getMonth() + 1) % 12]}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div 
            key={day}
            className="text-center text-gray-400 text-sm py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div 
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label="Calendar"
      >
        {calendarDays.map((date, i) => {
          if (!date) return <div key={i} className="h-10" />; // Empty cell for days outside current month
          
          const isSelected = areDatesEqual(date, selectedDate);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          
          return (
            <button
              key={i}
              onClick={() => handleDateSelect(date)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prevDate = new Date(date);
                  prevDate.setDate(date.getDate() - 1);
                  handleDateSelect(prevDate);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const nextDate = new Date(date);
                  nextDate.setDate(date.getDate() + 1);
                  handleDateSelect(nextDate);
                }
              }}
              disabled={isLoading}
              className={`
                h-10 rounded-lg text-sm font-medium relative
                ${isSelected ? 'bg-[#8B5CF6] text-white' : 'text-gray-400'}
                ${isCurrentMonth ? 'hover:bg-white/10' : 'opacity-50'}
                ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
                disabled:cursor-wait disabled:opacity-50
                transition-colors
              `}
              aria-label={`${date.toLocaleDateString()} ${isSelected ? '(Selected)' : ''}`}
              aria-current={isSelected ? 'date' : undefined}
              aria-disabled={isLoading}
            >
              {date.getDate()}
              {isLoading && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
