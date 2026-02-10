import React, { useState } from 'react';
import Calendar from '@/components/Calendar';
import { getWorkoutsByDate, copyWorkoutFromDate } from '@/services/calendar';
import ExerciseCard from '@/components/ExerciseCard';
import { ExerciseLog } from '@/types/exercise';
import { format } from 'date-fns';
import { ExerciseData } from '@/services/exerciseDataService';
import { auth } from '@/services/firebase/config';

const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    const dayWorkouts = await getWorkoutsByDate(date);
    setWorkouts(dayWorkouts);
    setLoading(false);
  };

  const handleCopyToDayClick = async () => {
    if (window.confirm('Copy this workout to today?')) {
      const today = new Date();
      const success = await copyWorkoutFromDate(selectedDate, today);
      if (success) {
        alert('Workout copied successfully!');
      } else {
        alert('Failed to copy workout');
      }
    }
  };

  return (
    <div className="p-4 bg-bg-primary min-h-screen text-text-primary">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Calendar selectedDate={selectedDate} onDayClick={handleDateSelect} />
        </div>
        
        <div>
          <div className="bg-bg-secondary rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              {workouts.length > 0 && (
                <button
                  onClick={handleCopyToDayClick}
                  className="bg-accent-primary text-text-primary px-4 py-2 rounded-lg text-sm"
                >
                  Copy to Today
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No workouts found
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map(workout => {
                  // Map ExerciseLog to ExerciseData
                  const exerciseData: ExerciseData = {
                    id: workout.id,
                    exerciseName: workout.exerciseName,
                    timestamp: workout.timestamp instanceof Date ? workout.timestamp : new Date(workout.timestamp),
                    userId: auth.currentUser?.uid || '',
                    sets: workout.sets.map(set => ({
                      reps: set.reps,
                      weight: set.weight,
                      difficulty: set.difficulty
                    })),
                    deviceId: workout.deviceId
                  };
                  return (
                    <ExerciseCard
                      key={workout.id}
                      exercise={exerciseData}
                      showActions={false}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
