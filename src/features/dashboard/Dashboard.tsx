import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User } from '@/services/firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import ExerciseCard from '@/components/ExerciseCard';
import { getExerciseLogsByDate, ExerciseLog } from '@/utils/localStorageUtils';

const Dashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user) as User;
  const [todaysExercises, setTodaysExercises] = useState<ExerciseLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      setIsLoading(true);
      try {
        // Get exercises from local storage first
        const localExercises = getExerciseLogsByDate(selectedDate);
        if (localExercises.length > 0) {
          setTodaysExercises(localExercises);
          setIsLoading(false);
          return;
        }

        // Fallback to Firebase if no local exercises
        const exercisesRef = collection(db, 'exerciseLogs');
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
          exercisesRef,
          where('userId', '==', user.id),
          where('timestamp', '>=', startOfDay),
          where('timestamp', '<=', endOfDay),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const exercises = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            exerciseName: data.exerciseName,
            sets: data.sets,
            timestamp: data.timestamp.toDate(),
            deviceId: data.deviceId || 'legacy',
          } as ExerciseLog;
        });

        setTodaysExercises(exercises);
      } catch (err) {
        console.error('Error fetching exercises:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchExercises();
    }
  }, [user, selectedDate]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
    });
  };

  const handleAddSet = (exerciseId: string) => {
    // TODO: Implement adding a set
    console.log('Adding set to exercise:', exerciseId);
  };

  const handleMenuClick = (exerciseId: string) => {
    // TODO: Implement menu actions
    console.log('Opening menu for exercise:', exerciseId);
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
      {/* Date and controls header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{formatDate(selectedDate)}</h1>
        <div className="flex gap-4">
          <button className="p-2">
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
          todaysExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id || `${exercise.exerciseName}-${exercise.timestamp.getTime()}`}
              name={exercise.exerciseName}
              sets={exercise.sets}
              onAdd={() => handleAddSet(exercise.id || '')}
              onMenu={() => handleMenuClick(exercise.id || '')}
            />
          ))
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
