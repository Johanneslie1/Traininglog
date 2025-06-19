import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '@/services/firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { RootState } from '@/store/store';

interface ExerciseLog {
  id: string;
  exerciseName: string;
  timestamp: Date;
  sets: Array<{
    reps: number;
    weight: number;
    rpe?: number;
  }>;
}

export const ExerciseHistory: React.FC = () => {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;

      try {
        const logsRef = collection(db, 'exerciseLogs');
        const q = query(
          logsRef,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        const exerciseLogs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as ExerciseLog[];

        setLogs(exerciseLogs);
      } catch (error) {
        console.error('Error fetching exercise logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{log.exerciseName}</h3>
            <span className="text-sm text-gray-500">
              {new Date(log.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="space-y-2">
            {log.sets.map((set, index) => (
              <div key={index} className="text-sm text-gray-600">
                Set {index + 1}: {set.weight}kg × {set.reps} reps
                {set.rpe && ` @ RPE ${set.rpe}`}
              </div>
            ))}
          </div>
        </div>
      ))}

      {logs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No exercise logs found
        </div>
      )}
    </div>
  );
};

export default ExerciseHistory;
