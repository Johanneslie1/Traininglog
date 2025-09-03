import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { getAllExercisesByDate } from '../../utils/unifiedExerciseUtils';
import { ActivityType } from '../../types/activityTypes';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [recentExercises, setRecentExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent exercises for the dashboard
  useEffect(() => {
    const loadRecentData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get exercises from the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const exercises = await getAllExercisesByDate(endDate, user.id);
        setRecentExercises(exercises.slice(0, 10)); // Show last 10 exercises
      } catch (error) {
        console.error('Error loading recent exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentData();
  }, [user?.id]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActivityTypeColor = (activityType?: ActivityType) => {
    switch (activityType) {
      case ActivityType.RESISTANCE: return 'bg-blue-500';
      case ActivityType.ENDURANCE: return 'bg-green-500';
      case ActivityType.SPORT: return 'bg-orange-500';
      case ActivityType.STRETCHING: return 'bg-purple-500';
      case ActivityType.SPEED_AGILITY: return 'bg-red-500';
      case ActivityType.OTHER: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Training Dashboard</h1>
            <p className="text-gray-400">Overview of your training data</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Back to Log
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Recent Workouts</h3>
            <p className="text-2xl font-bold text-primary-400">{recentExercises.length}</p>
            <p className="text-sm text-gray-400">in the last 30 days</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Activity Types</h3>
            <p className="text-2xl font-bold text-purple-400">
              {new Set(recentExercises.map(ex => ex.activityType)).size}
            </p>
            <p className="text-sm text-gray-400">different activities</p>
          </div>
        </div>

        {/* Recent Exercises */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent Exercises</h3>
          {recentExercises.length > 0 ? (
            <div className="space-y-3">
              {recentExercises.map((exercise, index) => (
                <div key={exercise.id || index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getActivityTypeColor(exercise.activityType)}`}></div>
                    <div>
                      <p className="font-medium">{exercise.exerciseName}</p>
                      <p className="text-sm text-gray-400">
                        {exercise.activityType || 'resistance'} • {formatDate(exercise.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {exercise.sets?.length || 0} sets
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No recent exercises found</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h4 className="font-medium">Log Exercise</h4>
              <p className="text-sm text-gray-400">Add new workout data</p>
            </button>

            <button
              onClick={() => navigate('/exercises')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h4 className="font-medium">Exercise Library</h4>
              <p className="text-sm text-gray-400">Browse and manage exercises</p>
            </button>

            <button
              onClick={() => navigate('/programs')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h4 className="font-medium">Programs</h4>
              <p className="text-sm text-gray-400">View training programs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
