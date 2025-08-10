import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useEffect, useState, useCallback } from 'react';
import { getAllExercisesByDate, UnifiedExerciseData, deleteExercise } from '@/utils/unifiedExerciseUtils';
import ExerciseCard from '@/components/ExerciseCard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [todaysExercises, setTodaysExercises] = useState<UnifiedExerciseData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date utility functions (same as ExerciseLog)
  const normalizeDate = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  // Unified data fetching that combines resistance exercises and activity logs
  const fetchExercises = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);

    if (!user?.id) {
      setTodaysExercises([]);
      setIsLoading(false);
      return;
    }

    const loadedDate = normalizeDate(date);

    try {
      // Get all exercises (resistance + activities) for the date
      const allExercises = await getAllExercisesByDate(loadedDate, user.id);
      
      console.log('📊 Dashboard loaded exercises:', {
        date: loadedDate,
        totalCount: allExercises.length,
        byType: allExercises.reduce((acc, ex) => {
          acc[ex.activityType || 'resistance'] = (acc[ex.activityType || 'resistance'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        exercises: allExercises
      });

      setTodaysExercises(allExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError('Failed to load exercises');
      setTodaysExercises([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizeDate, user?.id]);

  // Load exercises when user or selectedDate changes
  useEffect(() => {
    if (user?.id) {
      fetchExercises(selectedDate);
    } else {
      setTodaysExercises([]);
      setIsLoading(false);
    }
  }, [user?.id, selectedDate]);

  const handleDateChange = useCallback((newDate: Date) => {
    const normalized = normalizeDate(newDate);
    setSelectedDate(normalized);
  }, [normalizeDate]);


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
    });
  };


  const handleDeleteExercise = async (exercise: UnifiedExerciseData) => {
    if (!exercise.id || !user?.id) {
      const errorMessage = 'Cannot delete exercise: missing user ID or exercise ID';
      console.error(errorMessage, { userId: user?.id, exerciseId: exercise.id });
      setError(errorMessage);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${exercise.exerciseName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete exercise:', {
        exerciseId: exercise.id,
        userId: user.id,
        activityType: exercise.activityType
      });

      if (exercise.activityType && exercise.activityType !== 'resistance') {
        // Delete activity log
        const { deleteActivityLog } = await import('@/utils/unifiedExerciseUtils');
        await deleteActivityLog(exercise.id, user.id);
        console.log('✅ Activity log deleted successfully');
      } else {
        // Delete traditional exercise log
        await deleteExercise(exercise, user.id);
        console.log('✅ Exercise deleted from Firestore successfully');
      }

      await fetchExercises(selectedDate);
    } catch (error) {
      console.error('❌ Error deleting exercise:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Failed to delete exercise: ${errorMessage}`);
      await fetchExercises(selectedDate);
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
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Back to Exercise Log"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Dashboard - {formatDate(selectedDate)}</h1>
            <small className="text-gray-400">Exercise Summary</small>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
            onClick={() => handleDateChange(new Date(selectedDate.getTime() - 86400000))}
            aria-label="Previous day"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => handleDateChange(new Date())}
            aria-label="Today"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
            onClick={() => handleDateChange(new Date(selectedDate.getTime() + 86400000))}
            aria-label="Next day"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-4">
        {todaysExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No exercises logged for this date</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Exercise Log
            </button>
          </div>
        ) : (
          todaysExercises.map((exercise) => {
            // Ensure timestamp is always a Date
            const exerciseWithDate = {
              ...exercise,
              timestamp: exercise.timestamp instanceof Date
                ? exercise.timestamp
                : new Date(exercise.timestamp),
              userId: exercise.userId ?? (user ? user.id : '') // Ensure userId is always a string and user is not null
            };
            return (
              <ExerciseCard
                key={exercise.id || `${exercise.exerciseName}-${new Date(exercise.timestamp).getTime()}`}
                exercise={exerciseWithDate}
                onDelete={() => handleDeleteExercise(exerciseWithDate)}
              />
            );
          })
        )}
      </div>

      {/* Floating action button */}
      <button
        className="fixed right-6 bottom-6 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-700 transition-colors"
        onClick={() => navigate('/')}
        aria-label="Go to Exercise Log"
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
