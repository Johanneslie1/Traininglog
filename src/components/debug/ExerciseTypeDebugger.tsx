import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { getExerciseLogsByDate } from '@/utils/localStorageUtils';
import { ActivityType } from '@/types/activityTypes';

interface DebugData {
  totalExercises: number;
  resistanceCount: number;
  enduranceCount: number;
  sportCount: number;
  stretchingCount: number;
  speedAgilityCount: number;
  otherCount: number;
  undefinedTypeCount: number;
  exerciseDetails: any[];
  localStorageData: any[];
  activityLogsData: any[];
}

const ExerciseTypeDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const analyzeExercises = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get unified exercises (what the dashboard sees)
      const unifiedExercises = await getAllExercisesByDate(selectedDate, user.id);
      
      // Get raw localStorage data for resistance training
      const localStorageExercises = getExerciseLogsByDate(selectedDate);
      
      // Get activity logs from localStorage
      const activityLogsRaw = localStorage.getItem('activity-logs');
      const activityLogs = activityLogsRaw ? JSON.parse(activityLogsRaw) : [];
      
      // Filter activity logs by date
      const dateString = selectedDate.toISOString().split('T')[0];
      const filteredActivityLogs = activityLogs.filter((log: any) => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === dateString;
      });

      // Count by activity type
      const counts = {
        totalExercises: unifiedExercises.length,
        resistanceCount: 0,
        enduranceCount: 0,
        sportCount: 0,
        stretchingCount: 0,
        speedAgilityCount: 0,
        otherCount: 0,
        undefinedTypeCount: 0
      };

      unifiedExercises.forEach(exercise => {
        switch (exercise.activityType) {
          case ActivityType.RESISTANCE:
            counts.resistanceCount++;
            break;
          case ActivityType.ENDURANCE:
            counts.enduranceCount++;
            break;
          case ActivityType.SPORT:
            counts.sportCount++;
            break;
          case ActivityType.STRETCHING:
            counts.stretchingCount++;
            break;
          case ActivityType.SPEED_AGILITY:
            counts.speedAgilityCount++;
            break;
          case ActivityType.OTHER:
            counts.otherCount++;
            break;
          default:
            counts.undefinedTypeCount++;
            break;
        }
      });

      setDebugData({
        ...counts,
        exerciseDetails: unifiedExercises.map(ex => ({
          id: ex.id,
          name: ex.exerciseName,
          activityType: ex.activityType,
          timestamp: ex.timestamp,
          setsCount: ex.sets?.length || 0,
          firstSetData: ex.sets?.[0] || null
        })),
        localStorageData: localStorageExercises,
        activityLogsData: filteredActivityLogs
      });
    } catch (error) {
      console.error('Debug analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      analyzeExercises();
    }
  }, [selectedDate, user?.id]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50 overflow-y-auto">
      <div className="bg-[#1a1a1a] m-4 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Exercise Type Debugger</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Debug Date:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white"
          />
          <p className="text-gray-400 text-sm mt-1">
            Analyzing: {formatDate(selectedDate)}
          </p>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Analyzing exercises...</p>
          </div>
        )}

        {debugData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400">Total</h3>
                <p className="text-2xl font-bold">{debugData.totalExercises}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400">Resistance</h3>
                <p className="text-2xl font-bold">{debugData.resistanceCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-400">Endurance</h3>
                <p className="text-2xl font-bold">{debugData.enduranceCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-400">Sports</h3>
                <p className="text-2xl font-bold">{debugData.sportCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-pink-400">Stretching</h3>
                <p className="text-2xl font-bold">{debugData.stretchingCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-400">Speed/Agility</h3>
                <p className="text-2xl font-bold">{debugData.speedAgilityCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-400">Other</h3>
                <p className="text-2xl font-bold">{debugData.otherCount}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-400">Undefined</h3>
                <p className="text-2xl font-bold">{debugData.undefinedTypeCount}</p>
              </div>
            </div>

            {/* Raw Data Sources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Unified Exercises (Dashboard View)</h3>
                <div className="max-h-64 overflow-y-auto text-xs">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(debugData.exerciseDetails, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">LocalStorage Resistance ({debugData.localStorageData.length})</h3>
                <div className="max-h-64 overflow-y-auto text-xs">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(debugData.localStorageData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Activity Logs ({debugData.activityLogsData.length})</h3>
                <div className="max-h-64 overflow-y-auto text-xs">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(debugData.activityLogsData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">🔍 Diagnostics</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Total unified exercises loaded: {debugData.totalExercises}</li>
                <li>• Raw resistance exercises in localStorage: {debugData.localStorageData.length}</li>
                <li>• Activity logs for this date: {debugData.activityLogsData.length}</li>
                <li>• Expected total: {debugData.localStorageData.length + debugData.activityLogsData.length}</li>
                {(debugData.localStorageData.length + debugData.activityLogsData.length) !== debugData.totalExercises && (
                  <li className="text-red-400">⚠️ Data mismatch detected! Some exercises may not be loading correctly.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseTypeDebugger;
