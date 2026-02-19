

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getAthleteSummaryStats, 
  getAthleteExerciseLogs, 
  getAthleteAssignedPrograms,
  AthleteExerciseLog, 
  AthleteSummaryStats 
} from '@/services/coachService';

import { 
  ArrowLeftIcon, 
  CalendarIcon,
  ChartBarIcon,
  ClipboardListIcon,
  FilterIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

type DateFilter = '7days' | '30days' | '3months' | 'all';

const AthleteOverview: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AthleteSummaryStats | null>(null);
  const [exercises, setExercises] = useState<AthleteExerciseLog[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');

  useEffect(() => {
    if (athleteId) {
      loadAthleteData();
    }
  }, [athleteId, dateFilter]);

  const loadAthleteData = async () => {
    if (!athleteId) return;

    try {
      setLoading(true);

      // Load stats
      const statsData = await getAthleteSummaryStats(athleteId);
      setStats(statsData);

      // Load athlete basic info (we need to get this from team members)
      // In a real app, you'd have a dedicated endpoint for this
      // For now, we'll set athlete after we find them in teams
      
      // Load exercises with date filter
      const { startDate, endDate } = getDateRange(dateFilter);
      const exerciseLogs = await getAthleteExerciseLogs(athleteId, startDate, endDate);
      setExercises(exerciseLogs);

      // Load assigned programs
      const programs = await getAthleteAssignedPrograms(athleteId);
      setAssignedPrograms(programs);

    } catch (error) {
      console.error('Error loading athlete data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load athlete data');
      navigate('/coach');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter: DateFilter): { startDate?: Date; endDate?: Date } => {
    const now = new Date();
    const endDate = now;
    
    switch (filter) {
      case '7days':
        return { 
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate
        };
      case '30days':
        return { 
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate
        };
      case '3months':
        return { 
          startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          endDate
        };
      case 'all':
      default:
        return {};
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-started':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
            <ClockIcon className="h-3 w-3 mr-1" />
            Not Started
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-900/30 text-yellow-400">
            <PlayIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading athlete data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/coach')}
            className="text-primary-500 hover:text-primary-400 mb-4 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Coach Hub
          </button>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Athlete data not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/coach')}
          className="text-primary-500 hover:text-primary-400 mb-4 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Coach Hub
        </button>

        {/* Athlete Info Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-400 text-2xl font-bold">
                A
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Athlete #{athleteId?.slice(0, 8) || 'Unknown'}</h1>
              <p className="text-gray-400">Member since {formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Last Active */}
          {stats.lastActive && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span className="text-gray-400">
                Last active: {formatDate(stats.lastActive)}
              </span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-2xl font-bold">{stats.workoutsThisWeek}</div>
            <div className="text-xs text-gray-500">workouts</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">This Month</div>
            <div className="text-2xl font-bold">{stats.workoutsThisMonth}</div>
            <div className="text-xs text-gray-500">workouts</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Volume</div>
            <div className="text-2xl font-bold">{(stats.totalVolume / 1000).toFixed(1)}k</div>
            <div className="text-xs text-gray-500">kg lifted</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Programs</div>
            <div className="text-2xl font-bold">{stats.programsAssigned}</div>
            <div className="text-xs text-gray-500">assigned</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Sessions</div>
            <div className="text-2xl font-bold">{stats.sessionsAssigned}</div>
            <div className="text-xs text-gray-500">assigned</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold">{stats.programsCompleted}</div>
            <div className="text-xs text-gray-500">programs</div>
          </div>
        </div>

        {/* Assigned Programs Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <ClipboardListIcon className="h-6 w-6 mr-2 text-primary-500" />
            Assigned Programs
          </h2>

          {assignedPrograms.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">No programs assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPrograms.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Program #{assignment.programId.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Assigned {formatDate(assignment.assignedAt)}
                      </p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workout History Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-primary-500" />
              Workout History
            </h2>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="3months">Last 3 months</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No workouts in this time period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{exercise.name}</h3>
                      <p className="text-sm text-gray-500">{formatDate(exercise.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">{exercise.totalSets} sets</div>
                      {exercise.totalVolume && exercise.totalVolume > 0 && (
                        <div className="text-sm text-primary-400 font-semibold">
                          {exercise.totalVolume.toFixed(0)} kg
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sets Preview */}
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {exercise.sets.slice(0, 5).map((set, index) => (
                        <div
                          key={index}
                          className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300"
                        >
                          {set.weight && set.reps && `${set.weight}kg × ${set.reps}`}
                          {set.duration && `${Math.floor(set.duration / 60)}:${(set.duration % 60).toString().padStart(2, '0')}`}
                        </div>
                      ))}
                      {exercise.sets.length > 5 && (
                        <div className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-500">
                          +{exercise.sets.length - 5} more
                        </div>
                      )}
                    </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-2 text-sm text-gray-400 italic">
                      "{exercise.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteOverview;
