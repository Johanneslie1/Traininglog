import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux'; // Unused after auth removal
// import { db } from '@/services/firebase/config'; // Firebase removed
// import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'; // Firebase removed
// import { RootState } from '@/store/store'; // Unused after auth removal

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
  // const { user } = useSelector((state: RootState) => state.auth); // Auth removed

  useEffect(() => {
    // TODO: Replace with localStorage logic to fetch exercise logs
    setLogs([]); // No-op, Firebase removed
    setLoading(false);
  }, []);

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
