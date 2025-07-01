
import { useEffect, useState } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import { getExerciseLogsByDate, deleteExerciseLog } from '@/utils/localStorageUtils';
import { ExerciseLog } from '@/types/exercise';


const Dashboard = () => {
  // Local-only dashboard logic
  const [todaysExercises, setTodaysExercises] = useState<ExerciseLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const convertLocalExerciseToExerciseLog = (exercise: any): ExerciseLog => ({
    id: exercise.id || 'temp-id',
    exerciseName: exercise.exerciseName,
    sets: exercise.sets,
    timestamp: exercise.timestamp instanceof Date ? exercise.timestamp : new Date(exercise.timestamp),
    deviceId: exercise.deviceId || ''
  });


  // Fetch exercises from localStorage only
  const fetchExercises = (date: Date = selectedDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const localExercises = getExerciseLogsByDate(date);
      setTodaysExercises(localExercises.map(convertLocalExerciseToExerciseLog));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching exercises:', err);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchExercises();
    // eslint-disable-next-line
  }, [selectedDate]);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
    });
  };



  const handleDeleteExercise = async (exerciseId: string) => {
    if (!exerciseId) {
      setError('Invalid exercise ID');
      return;
    }
    try {
      // Find the exercise object to pass to deleteExerciseLog
      const exerciseToDelete = todaysExercises.find(ex => ex.id === exerciseId);
      if (!exerciseToDelete) {
        setError('Exercise not found');
        return;
      }
      await deleteExerciseLog({
        id: exerciseToDelete.id,
        exerciseName: exerciseToDelete.exerciseName,
        sets: exerciseToDelete.sets,
        timestamp: exerciseToDelete.timestamp instanceof Date ? exerciseToDelete.timestamp : new Date(exerciseToDelete.timestamp),
        deviceId: exerciseToDelete.deviceId || ''
      });
      setTodaysExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      setError('Failed to delete exercise. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-black min-h-screen text-white">
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white">
            ✕
          </button>
        </div>
      )}
      {/* Date and controls header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{formatDate(selectedDate)}</h1>
          <small className="text-gray-400">v0.0.2 - Test Update</small>
        </div>
        <div className="flex gap-4">
          <button className="p-2" onClick={() => handleDateChange(new Date(selectedDate.getTime() - 86400000))}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
          </button>
          <button className="p-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-4">
        {todaysExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No exercises logged today</p>
            <button className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg">
              Add Exercise
            </button>
          </div>
        ) : (
          todaysExercises.map((exercise) => {
            // Ensure timestamp is always a Date
            const exerciseWithDate = {
              ...exercise,
              timestamp: exercise.timestamp instanceof Date
                ? exercise.timestamp
                : new Date(exercise.timestamp)
            };
            return (
              <ExerciseCard
                key={exercise.id || `${exercise.exerciseName}-${new Date(exercise.timestamp).getTime()}`}
                exercise={exerciseWithDate}
                onDelete={() => handleDeleteExercise(exercise.id || '')}
              />
            );
          })
        )}
      </div>

      {/* Floating action button */}
      <button
        className="fixed right-6 bottom-6 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-700"
        onClick={() => console.log('Add new exercise')}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
};

export default Dashboard;
