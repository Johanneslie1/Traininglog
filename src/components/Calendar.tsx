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

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-text-tertiary font-semibold text-xs py-2">
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
                transition-all duration-200 ease-in-out
                font-semibold text-sm
                ${isWorkoutDay 
                  ? 'bg-status-success text-white shadow-lg shadow-status-success/30 hover:brightness-110 scale-100' 
                  : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary'
                }
                ${isSelected && !isWorkoutDay 
                  ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' 
                  : ''
                }
                ${isSelected && isWorkoutDay 
                  ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary scale-105' 
                  : ''
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
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
