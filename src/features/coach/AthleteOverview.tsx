

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getAthleteSummaryStats, 
  getAthleteExerciseLogs, 
  getAthleteSessionHistory,
  getAthleteAssignedPrograms,
  getAthleteAssignedSessions,
  AthleteExerciseLog, 
  AthleteSessionHistoryItem,
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
  PlayIcon,
  ShareIcon,
  CollectionIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import AthleteAssignDialog from './AthleteAssignDialog';

type DateFilter = '7days' | '30days' | '3months' | 'all';

const SESSION_PAGE_SIZE = 10;
const EXERCISE_PAGE_SIZE = 20;
const HISTORY_FETCH_LIMIT = 500;

const AthleteOverview: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AthleteSummaryStats | null>(null);
  const [exercises, setExercises] = useState<AthleteExerciseLog[]>([]);
  const [sessions, setSessions] = useState<AthleteSessionHistoryItem[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
  const [assignedSessions, setAssignedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [visibleSessions, setVisibleSessions] = useState(SESSION_PAGE_SIZE);
  const [visibleExercises, setVisibleExercises] = useState(EXERCISE_PAGE_SIZE);

  useEffect(() => {
    if (athleteId) {
      loadAthleteData();
    }
  }, [athleteId, dateFilter]);

  const loadAthleteData = async () => {
    if (!athleteId) return;

    try {
      setLoading(true);

      const { startDate, endDate } = getDateRange(dateFilter);
      const [
        statsData,
        exerciseLogs,
        sessionHistory,
        programs,
        sessionsData
      ] = await Promise.all([
        getAthleteSummaryStats(athleteId),
        getAthleteExerciseLogs(athleteId, startDate, endDate, { maxResults: HISTORY_FETCH_LIMIT }),
        getAthleteSessionHistory(athleteId, startDate, endDate, { maxResults: HISTORY_FETCH_LIMIT }),
        getAthleteAssignedPrograms(athleteId),
        getAthleteAssignedSessions(athleteId)
      ]);

      setStats(statsData);
      setExercises(exerciseLogs);
      setSessions(sessionHistory);
      setAssignedPrograms(programs);
      setAssignedSessions(sessionsData);
      setVisibleSessions(SESSION_PAGE_SIZE);
      setVisibleExercises(EXERCISE_PAGE_SIZE);

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
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
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

            <button
              type="button"
              onClick={() => setShowAssignDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
              Assign Program/Session
            </button>
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

          <div className="mt-3 text-xs text-gray-500">
            Session definition: one session = all exercises/activities logged on the same day.
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Today</div>
            <div className="text-2xl font-bold">{stats.sessionsToday}</div>
            <div className="text-xs text-gray-500">sessions</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Last 7 Days</div>
            <div className="text-2xl font-bold">{stats.sessionsLast7Days}</div>
            <div className="text-xs text-gray-500">sessions</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Today</div>
            <div className="text-2xl font-bold">{stats.exercisesToday}</div>
            <div className="text-xs text-gray-500">exercises</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Last 7 Days</div>
            <div className="text-2xl font-bold">{stats.exercisesLast7Days}</div>
            <div className="text-xs text-gray-500">exercises</div>
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

        {/* Assigned Sessions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <CollectionIcon className="h-6 w-6 mr-2 text-primary-500" />
            Assigned Sessions
          </h2>

          {assignedSessions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400">No sessions assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSessions.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Session #{assignment.sharedSessionId?.slice(0, 8) || assignment.id.slice(0, 8)}
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

        {/* Session & Exercise History Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-primary-500" />
              Session & Exercise History
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

          {sessions.length === 0 && exercises.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No sessions in this time period</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Session History</h3>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No session history in this period</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, visibleSessions).map((session) => (
                      <div key={session.sessionKey} className="bg-gray-800/60 rounded-lg p-3 border border-gray-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{formatDate(session.date)}</p>
                            <p className="text-xs text-gray-500">
                              {session.totalExercises} exercise{session.totalExercises !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-primary-400 font-semibold">{session.totalVolume.toFixed(0)} kg</p>
                            <p className="text-xs text-gray-500">{session.activityTypes.length} activity type{session.activityTypes.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {sessions.length > visibleSessions && (
                      <button
                        type="button"
                        onClick={() => setVisibleSessions((current) => current + SESSION_PAGE_SIZE)}
                        className="w-full py-2 text-sm font-medium text-primary-400 border border-gray-700 rounded-lg hover:border-primary-500/60 transition-colors"
                      >
                        Load more sessions
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Exercise History</h3>
                {exercises.length === 0 ? (
                  <p className="text-sm text-gray-500">No exercise history in this period</p>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {exercises.slice(0, visibleExercises).map((exercise) => (
                      <div
                        key={`${exercise.sourceCollection}-${exercise.id}-${exercise.date}`}
                        className="bg-gray-800/60 rounded-lg p-3 border border-gray-800"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{exercise.name}</h4>
                            <p className="text-xs text-gray-500">{formatDate(exercise.date)}</p>
                            <p className="text-xs text-gray-500 capitalize">{exercise.activityType || 'other'} • {exercise.sourceCollection}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-300">{exercise.totalSets} sets</p>
                            <p className="text-sm text-primary-400 font-semibold">{(exercise.totalVolume || 0).toFixed(0)} kg</p>
                          </div>
                        </div>

                        {exercise.notes && (
                          <p className="mt-2 text-xs text-gray-400 italic">"{exercise.notes}"</p>
                        )}
                      </div>
                    ))}

                    {exercises.length > visibleExercises && (
                      <button
                        type="button"
                        onClick={() => setVisibleExercises((current) => current + EXERCISE_PAGE_SIZE)}
                        className="w-full py-2 text-sm font-medium text-primary-400 border border-gray-700 rounded-lg hover:border-primary-500/60 transition-colors"
                      >
                        Load more exercises
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssignDialog && athleteId && (
        <AthleteAssignDialog
          athleteId={athleteId}
          onClose={() => setShowAssignDialog(false)}
          onAssigned={loadAthleteData}
        />
      )}
    </div>
  );
};

export default AthleteOverview;
