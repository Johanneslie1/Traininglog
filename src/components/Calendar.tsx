import React, { useState, useEffect } from 'react';
import { getWorkoutsByDate, getWorkoutDays } from '@/services/calendar';
import { ExerciseLog } from '@/types/exercise';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface CalendarProps {
  onDayClick?: (date: Date) => void;
  selectedDate?: Date;
}

const Calendar: React.FC<CalendarProps> = ({ onDayClick, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<Date[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<ExerciseLog[]>([]);
  useEffect(() => {
    const loadWorkoutDays = async () => {
      const days = await getWorkoutDays(currentMonth);
      setWorkoutDays(days);
    };
    loadWorkoutDays();
  }, [currentMonth]);

  useEffect(() => {
    const loadSelectedDayWorkouts = async () => {
      if (!selectedDate) return;
      const workouts = await getWorkoutsByDate(selectedDate);
      setSelectedWorkout(workouts);
    };
    loadSelectedDayWorkouts();
  }, [selectedDate]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handleDayClick = (date: Date) => {
    onDayClick?.(date);
  };

  /* Copy feature to be implemented later */

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-gray-400 font-medium py-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const isWorkoutDay = workoutDays.some(workoutDay => isSameDay(workoutDay, day));
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          
          return (
            <button
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square p-2 rounded-lg text-center relative
                ${isSelected ? 'bg-[#8B5CF6] text-white' : 'hover:bg-[#2a2a2a]'}
                ${isWorkoutDay ? 'font-bold' : 'text-gray-400'}
              `}
            >
              {format(day, 'd')}
              {isWorkoutDay && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Workouts */}
      {selectedWorkout.length > 0 && (
        <div className="mt-4 border-t border-[#2a2a2a] pt-4">
          <h3 className="text-white font-medium mb-2">
            {format(selectedDate!, 'MMMM d, yyyy')} Workouts
          </h3>
          <div className="space-y-2">
            {selectedWorkout.map(workout => (
              <div key={workout.id} className="bg-[#2a2a2a] p-3 rounded">
                <div className="text-white">{workout.exerciseName}</div>
                <div className="text-sm text-gray-400">
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
