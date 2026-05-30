

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  getAthleteSummaryStats, 
  getAthleteExerciseLogs, 
  getAthleteSessionHistory,
  getAthleteAssignedPrograms,
  getAthleteAssignedSessions,
  getAllAthletes,
  AthleteExerciseLog, 
  AthleteSessionHistoryItem,
  AthleteSummaryStats,
  AthleteData,
} from '@/services/coachService';
import { downloadPowerBiZip } from '@/services/powerBiExportService';
import { getCoachTeams, type Team } from '@/services/teamService';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { getSrpeByDateRange } from '@/services/srpeService';
import { buildSingleAthleteHealthDashboardData } from '@/services/athleteStatsService';
import type { PowerBiExportScope } from '@/types/powerBiExport';
import type { CoachRatingsDashboardData } from '@/types/coachRatings';
import { RootState } from '@/store/store';
import { addDays, toLocalDateString } from '@/utils/dateUtils';
import { HealthStatusBadge } from '@/features/health-dashboard/HealthStatusBadge';
import { HealthSummaryCards } from '@/features/health-dashboard/HealthSummaryCards';
import { formatLoad, formatNumber } from '@/features/health-dashboard/healthDashboardFormatters';

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
  const [healthDashboard, setHealthDashboard] = useState<CoachRatingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [visibleSessions, setVisibleSessions] = useState(SESSION_PAGE_SIZE);
  const [visibleExercises, setVisibleExercises] = useState(EXERCISE_PAGE_SIZE);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isLoadingExportOptions, setIsLoadingExportOptions] = useState(false);
  const [exportScope, setExportScope] = useState<PowerBiExportScope>('athlete');
  const [exportAthletes, setExportAthletes] = useState<AthleteData[]>([]);
  const [exportTeams, setExportTeams] = useState<Team[]>([]);
  const [selectedExportAthleteIds, setSelectedExportAthleteIds] = useState<string[]>([]);
  const [selectedExportTeamId, setSelectedExportTeamId] = useState('');
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

  useEffect(() => {
    loadExportOptions();
  }, [athleteId]);

  const loadAthleteData = async () => {
    if (!athleteId) return;

    try {
      setLoading(true);

      const { startDate, endDate } = getDateRange(dateFilter);
      const healthEndDate = endDate || new Date();
      const periodStartDate = startDate || addDays(healthEndDate, -29);
      const periodStartDateKey = toLocalDateString(periodStartDate);
      const periodEndDateKey = toLocalDateString(healthEndDate);
      const wellnessBaselineStart = toLocalDateString(addDays(healthEndDate, -28));
      const srpeBaselineStart = toLocalDateString(addDays(healthEndDate, -27));
      const healthWellnessStart = periodStartDateKey < wellnessBaselineStart ? periodStartDateKey : wellnessBaselineStart;
      const healthSrpeStart = periodStartDateKey < srpeBaselineStart ? periodStartDateKey : srpeBaselineStart;
      const [
        statsData,
        exerciseLogs,
        sessionHistory,
        programs,
        sessionsData,
        athleteDirectory,
        wellnessLogs,
        srpeLogs,
      ] = await Promise.all([
        getAthleteSummaryStats(athleteId),
        getAthleteExerciseLogs(athleteId, startDate, endDate, { maxResults: HISTORY_FETCH_LIMIT }),
        getAthleteSessionHistory(athleteId, startDate, endDate, { maxResults: HISTORY_FETCH_LIMIT }),
        getAthleteAssignedPrograms(athleteId),
        getAthleteAssignedSessions(athleteId),
        getAllAthletes(),
        getWellnessByDateRange(athleteId, healthWellnessStart, periodEndDateKey),
        getSrpeByDateRange(athleteId, healthSrpeStart, periodEndDateKey),
      ]);
      const athleteProfile = athleteDirectory.find((athlete) => athlete.id === athleteId);
      const healthData = buildSingleAthleteHealthDashboardData({
        athleteId,
        email: athleteProfile?.email || athleteId,
        displayName: athleteProfile ? `${athleteProfile.firstName} ${athleteProfile.lastName}`.trim() : athleteId,
        selectedDate: periodEndDateKey,
        viewMode: 'week',
        periodStartDate: periodStartDateKey,
        periodEndDate: periodEndDateKey,
        wellnessLogs,
        srpeLogs,
      });

      setStats(statsData);
      setExercises(exerciseLogs);
      setSessions(sessionHistory);
      setAssignedPrograms(programs);
      setAssignedSessions(sessionsData);
      setHealthDashboard(healthData);
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

  const loadExportOptions = async () => {
    try {
      setIsLoadingExportOptions(true);
      const [athletesData, teamsData] = await Promise.all([
        getAllAthletes(),
        getCoachTeams(),
      ]);

      setExportAthletes(athletesData);
      setExportTeams(teamsData);

      if (athleteId) {
        setSelectedExportAthleteIds((current) => current.length > 0 ? current : [athleteId]);
      }
      if (teamsData.length > 0) {
        setSelectedExportTeamId((current) => current || teamsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load export options:', error);
      toast.error('Could not load export options');
    } finally {
      setIsLoadingExportOptions(false);
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

  const dateToExportKey = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getAthleteDisplayName = (athlete: AthleteData): string =>
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || athlete.email || athlete.id;

  const toggleSelectedExportAthlete = (id: string) => {
    setSelectedExportAthleteIds((current) =>
      current.includes(id)
        ? current.filter((athleteId) => athleteId !== id)
        : [...current, id]
    );
  };

  const handleExportData = async () => {
    if (isExportingData) return;

    if (!user?.id) {
      toast.error('Please log in to export data');
      return;
    }

    if (exportScope === 'athlete' && !athleteId) {
      toast.error('No athlete selected for export');
      return;
    }

    if (exportScope === 'athletes' && selectedExportAthleteIds.length === 0) {
      toast.error('Select at least one athlete to export');
      return;
    }

    if (exportScope === 'team' && !selectedExportTeamId) {
      toast.error('Select a team to export');
      return;
    }

    setIsExportingData(true);
    try {
      const result = await downloadPowerBiZip(
        {
          scope: exportScope,
          targetAthleteId: exportScope === 'athlete' ? athleteId : undefined,
          targetAthleteIds: exportScope === 'athletes' ? selectedExportAthleteIds : undefined,
          targetTeamId: exportScope === 'team' ? selectedExportTeamId : undefined,
          fromDate: dateToExportKey(exportDateRange.startDate),
          toDate: dateToExportKey(exportDateRange.endDate),
        },
        {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
        }
      );

      toast.success(
        `Export ready: ${result.athleteCount} athlete(s), ${result.sessionCount} sessions, ${result.gymSetCount + result.activityCount} set/activity rows, ${result.wellnessCount} wellness rows, ${result.footballLoadCount} football load rows`
      );
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExportingData(false);
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

  const healthRow = healthDashboard?.rows[0] ?? null;

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

        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-8 space-y-3">
          <div>
            <h2 className="text-base font-semibold">Health & Load Snapshot</h2>
            <p className="mt-1 text-xs text-text-tertiary">
              Uses the same wellness, sports load, and ACWR calculations as athlete stats and team health.
            </p>
          </div>
          <HealthSummaryCards
            columnsClassName="grid grid-cols-1 gap-3 sm:grid-cols-4"
            items={[
              {
                id: 'wellness-score',
                label: 'Wellness score',
                value: formatNumber(healthRow?.wellnessSnapshot.score),
              },
              {
                id: 'sports-load',
                label: 'Sports load',
                value: formatLoad(healthRow?.weeklySrpe.totalLoad),
              },
              {
                id: 'acwr',
                label: 'ACWR',
                value: formatNumber(healthRow?.acwr.ratio),
              },
              {
                id: 'health-status',
                label: 'Status',
                value: <HealthStatusBadge status={healthRow?.status || 'missing'} />,
              },
            ]}
          />
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
            <h2 className="text-base font-semibold">Export Data</h2>
            <div className="text-xs text-text-tertiary">CSV ZIP includes sessions, sets, activities, wellness, football load, and athlete fields</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Scope</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'self' as PowerBiExportScope, label: 'My own data' },
                { key: 'athlete' as PowerBiExportScope, label: 'This athlete' },
                { key: 'athletes' as PowerBiExportScope, label: 'Selected athletes' },
                { key: 'team' as PowerBiExportScope, label: 'One team' },
                { key: 'allCoachAthletes' as PowerBiExportScope, label: 'All athletes I coach' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExportScope(key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    exportScope === key
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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

          {exportScope === 'athletes' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">Athletes</label>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedExportAthleteIds(exportAthletes.map((athlete) => athlete.id))}
                    className="text-accent-primary hover:text-accent-hover"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExportAthleteIds([])}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {isLoadingExportOptions ? (
                <p className="text-sm text-text-tertiary">Loading athletes...</p>
              ) : exportAthletes.length === 0 ? (
                <p className="text-sm text-text-tertiary">No athletes found.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                  {exportAthletes.map((athlete) => (
                    <label key={athlete.id} className="flex items-center gap-2 text-sm text-text-secondary bg-bg-tertiary border border-border rounded-lg px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedExportAthleteIds.includes(athlete.id)}
                        onChange={() => toggleSelectedExportAthlete(athlete.id)}
                        className="rounded border-border bg-bg-tertiary text-accent-primary focus:ring-accent-primary"
                      />
                      <span>{getAthleteDisplayName(athlete)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {exportScope === 'team' && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Team</label>
              {isLoadingExportOptions ? (
                <p className="text-sm text-text-tertiary">Loading teams...</p>
              ) : exportTeams.length === 0 ? (
                <p className="text-sm text-text-tertiary">No teams found.</p>
              ) : (
                <select
                  value={selectedExportTeamId}
                  onChange={(event) => setSelectedExportTeamId(event.target.value)}
                  className="w-full bg-bg-tertiary text-text-primary px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  {exportTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleExportData}
            disabled={
              isExportingData ||
              isLoadingExportOptions ||
              !user?.id ||
              (exportScope === 'athlete' && !athleteId) ||
              (exportScope === 'athletes' && selectedExportAthleteIds.length === 0) ||
              (exportScope === 'team' && !selectedExportTeamId)
            }
            className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-accent-primary hover:bg-accent-hover text-text-inverse rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="h-4 w-4" />
            {isExportingData ? 'Exporting data...' : 'Export Data'}
          </button>

          <p className="text-xs text-text-tertiary">
            Downloads one ZIP with analysis-ready CSV files for Excel or Power BI, including wellness and football load.
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
