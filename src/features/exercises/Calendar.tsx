import React, { useState } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface CalendarProps {
  onClose: () => void;
  onSelectExercises: (exercises: any[]) => void;
  onDateSelect?: (date: Date) => void;
}

interface User {
  id: string;
  email: string | null;
}

export const Calendar: React.FC<CalendarProps> = ({ onClose, onSelectExercises, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

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
  const handleDateSelect = async (date: Date) => {
    if (!user) return;
    setSelectedDate(date);
    
    // Notify parent component about the date change
    if (onDateSelect) {
      onDateSelect(date);
    }

    try {
      const exercisesRef = collection(db, 'exerciseLogs');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        exercisesRef,
        where('userId', '==', user.id),
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );

      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      onSelectExercises(exercises);
      onClose();
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
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
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M4 12h16" />
            </svg>
          </button>
          <span className="text-white font-medium">{currentDate.getFullYear()}</span>
          <button
            onClick={goToNextYear}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M4 12h16" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white font-medium min-w-[100px] text-center">
            {monthNames[currentDate.getMonth()]
            }
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 text-gray-400 hover:text-white"
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
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => (
          <button
            key={i}
            onClick={() => date && handleDateSelect(date)}
            disabled={!date}
            className={`
              aspect-square flex items-center justify-center rounded-lg text-sm
              ${!date ? 'bg-transparent' : 
                date.toDateString() === selectedDate.toDateString()
                  ? 'bg-blue-600 text-white' 
                  : date.toDateString() === new Date().toDateString()
                    ? 'bg-[#333] text-white ring-1 ring-blue-500'
                    : 'bg-[#222] text-gray-300 hover:bg-[#333]'
              }
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
