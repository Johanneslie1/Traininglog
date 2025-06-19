import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User } from '@/services/firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

interface WorkoutSummary {
  id: string;
  date: string;
  totalVolume: number;
  exerciseCount: number;
  sessionRPE: number;
}

const Dashboard = () => {
  const user = useSelector((state: RootState) => state.auth.user) as User;
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRecentWorkouts = async () => {
      try {
        const workoutsRef = collection(db, 'trainingSessions');
        const q = query(
          workoutsRef,
          where('userId', '==', user.id),
          orderBy('date', 'desc'),
          limit(5)
        );

        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
        } catch (indexError: any) {          if (indexError.code === 'failed-precondition') {
            const indexUrl = indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
            console.error('Creating required index...');
            setError(
              `Setting up the database index. This might take a few minutes. Please wait and refresh the page in a moment.${
                indexUrl ? `\n\nIf this message persists, click this link to create the index manually: ${indexUrl}` : ''
              }`
            );
            // Fallback to an unordered query while index is being created
            const fallbackQuery = query(
              workoutsRef,
              where('userId', '==', user.id),
              limit(5)
            );
            querySnapshot = await getDocs(fallbackQuery);
          } else {
            throw indexError;
          }
        }

        const workouts: WorkoutSummary[] = [];
        querySnapshot?.forEach((doc) => {
          const data = doc.data();
          workouts.push({
            id: doc.id,
            date: data.date,
            totalVolume: data.totalVolume,
            exerciseCount: data.exercises?.length || 0,
            sessionRPE: data.sessionRPE,
          });
        });

        setRecentWorkouts(workouts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRecentWorkouts();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-blue-50 text-blue-700 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Database Setup in Progress</h3>
        {error.split('\n').map((line, i) => (
          <p key={i} className="mb-2">
            {line.includes('https://console.firebase.google.com') ? (
              <a href={line.trim()} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Create index manually
              </a>
            ) : (
              line
            )}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Workouts</h2>
        {recentWorkouts.length === 0 ? (
          <p className="text-gray-600">No workouts found. Start logging your training!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{new Date(workout.date).toLocaleDateString()}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workout.exerciseCount} exercises
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                    RPE {workout.sessionRPE}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">Total Volume: {workout.totalVolume}kg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
