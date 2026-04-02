

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  getAthleteSummaryStats, 
  getAthleteExerciseLogs, 
  getAthleteSessionHistory,
  getAthleteAssignedPrograms,
  getAthleteAssignedSessions,
  exportAllAthletesSessionsCsv,
  AthleteExerciseLog, 
  AthleteSessionHistoryItem,
  AthleteSummaryStats 
} from '@/services/coachService';
import { downloadPowerBiZip } from '@/services/powerBiExportService';
import { RootState } from '@/store/store';

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
  CollectionIcon,
  DownloadIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import AthleteAssignDialog from './AthleteAssignDialog';
import StatTile from './StatTile';

type DateFilter = '7days' | '30days' | '3months' | 'all';
type ExportDateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'allTime' | 'custom';

interface ExportDateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: ExportDateRangePreset;
}

const parseLocalDateInput = (value: string, endOfDay = false): Date | null => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  if (endOfDay) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getDateRangeFromPreset = (preset: ExportDateRangePreset): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'last7days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case 'last30days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: today };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: today };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case 'allTime':
    default:
      return { startDate: null, endDate: null };
  }
};

const SESSION_PAGE_SIZE = 10;
const EXERCISE_PAGE_SIZE = 20;
const HISTORY_FETCH_LIMIT = 500;

const AthleteOverview: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
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
  const [isExportingAthlete, setIsExportingAthlete] = useState(false);
  const [isExportingAllAthletes, setIsExportingAllAthletes] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<ExportDateRange>({
    startDate: null,
    endDate: null,
    preset: 'allTime'
  });

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

  const handleExportPresetChange = (preset: ExportDateRangePreset) => {
    const { startDate, endDate } = getDateRangeFromPreset(preset);
    setExportDateRange({ startDate, endDate, preset });
  };

  const handleCustomExportDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = parseLocalDateInput(value, field === 'endDate');
    setExportDateRange((prev) => ({
      ...prev,
      [field]: date,
      preset: 'custom'
    }));
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExportAthlete = async () => {
    if (!athleteId || isExportingAthlete || isExportingAllAthletes) {
      return;
    }

    if (!user?.id) {
      toast.error('Please log in to export athlete data');
      return;
    }

    setIsExportingAthlete(true);
    try {
      const fromDate = exportDateRange.startDate
        ? `${exportDateRange.startDate.getFullYear()}-${String(exportDateRange.startDate.getMonth() + 1).padStart(2, '0')}-${String(exportDateRange.startDate.getDate()).padStart(2, '0')}`
        : undefined;

      const result = await downloadPowerBiZip(
        {
          scope: 'athlete',
          targetAthleteId: athleteId,
          fromDate,
        },
        {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
        }
      );
      toast.success(
        `Export ready! ${result.gymSetCount} gym sets · ${result.activityCount} activity rows · ${result.athleteCount} athlete(s)`
      );
    } catch (error) {
      console.error('Failed to export athlete Power BI file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export athlete Power BI file');
    } finally {
      setIsExportingAthlete(false);
    }
  };

  const handleExportAllAthletes = async () => {
    if (isExportingAllAthletes || isExportingAthlete) {
      return;
    }

    setIsExportingAllAthletes(true);
    try {
      const result = await exportAllAthletesSessionsCsv(
        exportDateRange.startDate || undefined,
        exportDateRange.endDate || undefined
      );
      toast.success(`Exported ${result.rowCount} rows across ${result.athleteCount} athletes`);
    } catch (error) {
      console.error('Failed to export all athletes CSV:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export all athletes CSV');
    } finally {
      setIsExportingAllAthletes(false);
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-bg-tertiary text-text-tertiary border border-border">
            <ClockIcon className="h-3 w-3 mr-1" />
            Not Started
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning-bg text-warning-text border border-warning-border">
            <PlayIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-success-bg text-success-text border border-success-border">
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
      <div className="flex items-center justify-center min-h-[100dvh] bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-text-primary">Loading athlete data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[100dvh] bg-bg-primary text-text-primary p-4 pb-app-content">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/coach')}
            className="text-accent-primary hover:text-accent-hover mb-4 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Coach Hub
          </button>
          <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center">
            <p className="text-text-tertiary">Athlete data not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary p-4 pb-app-content">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/coach')}
          className="text-accent-primary hover:text-accent-hover mb-4 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Coach Hub
        </button>

        {/* Athlete Info Card */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-bg-tertiary rounded-full flex items-center justify-center border border-border">
                <span className="text-accent-primary text-xl font-bold">
                  A
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Athlete #{athleteId?.slice(0, 8) || 'Unknown'}</h1>
                <p className="text-text-tertiary text-sm">Member since {formatDate(new Date().toISOString())}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAssignDialog(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg text-sm font-medium transition-colors"
            >
              <ShareIcon className="h-4 w-4" />
              Assign Program/Session
            </button>
          </div>

          {/* Last Active */}
          {stats.lastActive && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-text-tertiary" />
              <span className="text-text-tertiary">
                Last active: {formatDate(stats.lastActive)}
              </span>
            </div>
          )}

          <div className="mt-3 text-xs text-text-tertiary">
            Session definition: one session = all exercises/activities logged on the same day.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatTile label="Sessions" value={stats.sessionsLast7Days} helper="last 7 days" />
          <StatTile label="Exercises" value={stats.exercisesLast7Days} helper="last 7 days" />
          <StatTile label="Total Volume" value={`${(stats.totalVolume / 1000).toFixed(1)}k`} helper="kg lifted" />
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-8">
          <h2 className="text-base font-semibold">Assignments</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatTile label="Programs" value={stats.programsAssigned} helper="assigned" />
            <StatTile label="Sessions" value={stats.sessionsAssigned} helper="assigned" />
            <StatTile label="Completed" value={stats.programsCompleted} helper="programs" />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Coach Export</h2>
            <div className="text-xs text-text-tertiary">Player export uses the same Power BI ZIP format as athlete self-export</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'last7days' as ExportDateRangePreset, label: 'Last 7 days' },
                { key: 'last30days' as ExportDateRangePreset, label: 'Last 30 days' },
                { key: 'thisMonth' as ExportDateRangePreset, label: 'This month' },
                { key: 'lastMonth' as ExportDateRangePreset, label: 'Last month' },
                { key: 'allTime' as ExportDateRangePreset, label: 'All time' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleExportPresetChange(key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    exportDateRange.preset === key
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Start Date</label>
              <input
                type="date"
                value={formatDateForInput(exportDateRange.startDate)}
                onChange={(event) => handleCustomExportDateChange('startDate', event.target.value)}
                className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">End Date</label>
              <input
                type="date"
                value={formatDateForInput(exportDateRange.endDate)}
                onChange={(event) => handleCustomExportDateChange('endDate', event.target.value)}
                className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportAthlete}
              disabled={!athleteId || isExportingAthlete || isExportingAllAthletes}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <DownloadIcon className="h-4 w-4" />
              {isExportingAthlete ? 'Exporting athlete...' : 'Export this athlete Power BI ZIP'}
            </button>
            <button
              type="button"
              onClick={handleExportAllAthletes}
              disabled={isExportingAllAthletes || isExportingAthlete}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-primary text-text-primary rounded-lg text-sm font-medium border border-border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <DownloadIcon className="h-4 w-4" />
              {isExportingAllAthletes ? 'Exporting all athletes...' : 'Export all athletes CSV'}
            </button>
          </div>

          <p className="text-xs text-text-tertiary">
            Note: rows with rowType=session indicate sessions without logged exercises.
          </p>
        </div>

        {/* Assigned Programs Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <ClipboardListIcon className="h-6 w-6 mr-2 text-accent-primary" />
            Assigned Programs
          </h2>

          {assignedPrograms.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
              <p className="text-text-tertiary">No programs assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPrograms.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-border-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">
                        Program #{assignment.programId.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-text-tertiary">
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
            <CollectionIcon className="h-6 w-6 mr-2 text-accent-primary" />
            Assigned Sessions
          </h2>

          {assignedSessions.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center">
              <p className="text-text-tertiary">No sessions assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSessions.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-border-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">
                        Session #{assignment.sharedSessionId?.slice(0, 8) || assignment.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-text-tertiary">
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
              <ChartBarIcon className="h-6 w-6 mr-2 text-accent-primary" />
              Session & Exercise History
            </h2>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-text-tertiary" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="3months">Last 3 months</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {sessions.length === 0 && exercises.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center">
              <p className="text-text-tertiary">No sessions in this time period</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <h3 className="font-semibold text-text-primary mb-3">Session History</h3>
                {sessions.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No session history in this period</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, visibleSessions).map((session) => (
                      <div key={session.sessionKey} className="bg-bg-tertiary rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{formatDate(session.date)}</p>
                            <p className="text-xs text-text-tertiary">
                              {session.totalExercises} exercise{session.totalExercises !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-accent-primary font-semibold">{session.totalVolume.toFixed(0)} kg</p>
                            <p className="text-xs text-text-tertiary">{session.activityTypes.length} activity type{session.activityTypes.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {sessions.length > visibleSessions && (
                      <button
                        type="button"
                        onClick={() => setVisibleSessions((current) => current + SESSION_PAGE_SIZE)}
                        className="w-full py-2 text-sm font-medium text-accent-primary border border-border rounded-lg hover:border-accent-primary/60 transition-colors"
                      >
                        Load more sessions
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-bg-secondary border border-border rounded-lg p-4">
                <h3 className="font-semibold text-text-primary mb-3">Exercise History</h3>
                {exercises.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No exercise history in this period</p>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {exercises.slice(0, visibleExercises).map((exercise) => (
                      <div
                        key={`${exercise.sourceCollection}-${exercise.id}-${exercise.date}`}
                        className="bg-bg-tertiary rounded-lg p-3 border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary">{exercise.name}</h4>
                            <p className="text-xs text-text-tertiary">{formatDate(exercise.date)}</p>
                            <p className="text-xs text-text-tertiary capitalize">{exercise.activityType || 'other'} • {exercise.sourceCollection}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">{exercise.totalSets} sets</p>
                            <p className="text-sm text-accent-primary font-semibold">{(exercise.totalVolume || 0).toFixed(0)} kg</p>
                          </div>
                        </div>

                        {exercise.notes && (
                          <p className="mt-2 text-xs text-text-tertiary italic">"{exercise.notes}"</p>
                        )}
                      </div>
                    ))}

                    {exercises.length > visibleExercises && (
                      <button
                        type="button"
                        onClick={() => setVisibleExercises((current) => current + EXERCISE_PAGE_SIZE)}
                        className="w-full py-2 text-sm font-medium text-accent-primary border border-border rounded-lg hover:border-accent-primary/60 transition-colors"
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
