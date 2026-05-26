import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import AnalyticsService from '@/services/analyticsService';
import { allExercises } from '@/data/exercises';
import { getSrpeByDateRange } from '@/services/srpeService';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { ActivityAnalytics, MuscleGroupAnalytics, PRType, VolumeDataPoint } from '@/types/analytics';
import { Exercise } from '@/types/exercise';
import { SrpeLog } from '@/types/srpe';
import { WellnessLog } from '@/types/wellness';

type Timeframe = 'day' | 'week' | 'month' | 'year';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const timeframeOptions: Array<{ value: Timeframe; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const getRangeFromTimeframe = (timeframe: Timeframe): DateRange => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);

  switch (timeframe) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const dayOfWeek = startDate.getDay(); // 0 = Sunday
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
};

const getPreviousRange = (range: DateRange): DateRange => {
  const durationMs = range.endDate.getTime() - range.startDate.getTime();

  const previousEnd = new Date(range.startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  previousStart.setHours(0, 0, 0, 0);
  previousEnd.setHours(23, 59, 59, 999);

  return {
    startDate: previousStart,
    endDate: previousEnd,
  };
};

const formatChange = (value: number): string => {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return '0%';
};

const getChangeClass = (value: number): string => {
  if (value > 0) return 'text-success-text';
  if (value < 0) return 'text-error-text';
  return 'text-text-secondary';
};

const formatMetric = (value: number): string => {
  if (value >= 1000) return value.toLocaleString();
  return String(value);
};

const formatMuscleName = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStatusLabel = (status: MuscleGroupAnalytics['status']): string => {
  switch (status) {
    case 'fatigue_risk':
      return 'Fatigue risk';
    case 'high_spike':
      return 'High spike';
    case 'undertrained':
      return 'Undertrained';
    case 'productive':
      return 'Productive';
    case 'stable':
    default:
      return 'Stable';
  }
};

const getStatusClass = (status: MuscleGroupAnalytics['status']): string => {
  switch (status) {
    case 'fatigue_risk':
      return 'border-error-border bg-error-bg text-error-text';
    case 'high_spike':
      return 'border-warning-border bg-warning-bg text-warning-text';
    case 'undertrained':
      return 'border-border bg-bg-tertiary text-text-secondary';
    case 'productive':
      return 'border-success-border bg-success-bg text-success-text';
    case 'stable':
    default:
      return 'border-border bg-bg-tertiary text-text-secondary';
  }
};

// ── SVG area chart for daily training volume ──────────────────────────────────
interface AreaChartProps {
  dataPoints: VolumeDataPoint[];
}

const VolumeAreaChart: React.FC<AreaChartProps> = ({ dataPoints }) => {
  const W = 600;
  const H = 120;
  const PADDING = { top: 8, right: 8, bottom: 28, left: 44 };
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const maxVol = Math.max(...dataPoints.map((p) => p.volume), 1);

  const toX = (i: number) =>
    dataPoints.length === 1
      ? PADDING.left + innerW / 2
      : PADDING.left + (i / (dataPoints.length - 1)) * innerW;

  const toY = (v: number) => PADDING.top + innerH - (v / maxVol) * innerH;

  const linePath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.volume)}`)
    .join(' ');

  const areaPath =
    `${linePath} L${toX(dataPoints.length - 1)},${PADDING.top + innerH}` +
    ` L${toX(0)},${PADDING.top + innerH} Z`;

  // Show up to 6 evenly-spaced x-axis labels
  const labelStep = Math.max(1, Math.ceil(dataPoints.length / 6));
  const labelIndices = dataPoints
    .map((_, i) => i)
    .filter((i) => i % labelStep === 0 || i === dataPoints.length - 1);

  // Y-axis: 0, mid, max
  const yAxisValues = [0, Math.round(maxVol / 2), maxVol];

  const gradientId = 'vol-gradient';

  return (
    <div className="mt-4 overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-w-[520px] w-full"
        role="img"
        aria-label="Daily volume area chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-primary, #6366f1)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-primary, #6366f1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yAxisValues.map((v) => (
          <g key={v}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + innerW}
              y1={toY(v)}
              y2={toY(v)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
              className="text-text-tertiary"
            />
            <text
              x={PADDING.left - 6}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              className="text-text-secondary"
              fillOpacity={0.9}
            >
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent-primary, #6366f1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data point dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={p.date}
            cx={toX(i)}
            cy={toY(p.volume)}
            r={3}
            fill="var(--color-accent-primary, #6366f1)"
          />
        ))}

        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text
            key={dataPoints[i].date}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            className="text-text-secondary"
            fillOpacity={0.9}
          >
            {format(new Date(dataPoints[i].date), 'MMM d')}
          </text>
        ))}
      </svg>
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExercises, setCurrentExercises] = useState<UnifiedExerciseData[]>([]);
  const [previousExercises, setPreviousExercises] = useState<UnifiedExerciseData[]>([]);
  const [currentSrpeLogs, setCurrentSrpeLogs] = useState<SrpeLog[]>([]);
  const [previousSrpeLogs, setPreviousSrpeLogs] = useState<SrpeLog[]>([]);
  const [currentWellnessLogs, setCurrentWellnessLogs] = useState<WellnessLog[]>([]);

  const range = useMemo(() => getRangeFromTimeframe(timeframe), [timeframe]);
  const exerciseDatabase = useMemo<Exercise[]>(
    () => allExercises.map((exercise) => ({ ...exercise, id: exercise.name })),
    []
  );

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const previousRange = getPreviousRange(range);
        const currentStart = format(range.startDate, 'yyyy-MM-dd');
        const currentEnd = format(range.endDate, 'yyyy-MM-dd');
        const previousStart = format(previousRange.startDate, 'yyyy-MM-dd');
        const previousEnd = format(previousRange.endDate, 'yyyy-MM-dd');

        const [current, previous, currentSrpe, previousSrpe, currentWellness] = await Promise.all([
          AnalyticsService.getExercisesByDateRange(user.id, range.startDate, range.endDate),
          AnalyticsService.getExercisesByDateRange(user.id, previousRange.startDate, previousRange.endDate),
          getSrpeByDateRange(user.id, currentStart, currentEnd),
          getSrpeByDateRange(user.id, previousStart, previousEnd),
          getWellnessByDateRange(user.id, currentStart, currentEnd),
        ]);

        setCurrentExercises(current);
        setPreviousExercises(previous);
        setCurrentSrpeLogs(currentSrpe);
        setPreviousSrpeLogs(previousSrpe);
        setCurrentWellnessLogs(currentWellness);
      } catch (loadError) {
        console.error('Failed to load analytics:', loadError);
        setError('Could not load analytics right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, [range, user?.id]);

  const dailyVolume = useMemo(
    () => AnalyticsService.calculateDailyVolumes(currentExercises, 'day'),
    [currentExercises]
  );

  const summary = useMemo(() => {
    if (!user?.id) return null;
    return AnalyticsService.calculateAnalyticsSummary(
      currentExercises,
      range.startDate,
      range.endDate,
      user.id,
      exerciseDatabase
    );
  }, [currentExercises, exerciseDatabase, range.endDate, range.startDate, user?.id]);

  const periodComparison = useMemo(
    () => AnalyticsService.comparePeriods(currentExercises, previousExercises),
    [currentExercises, previousExercises]
  );

  const recentPRs = useMemo(
    () => AnalyticsService.detectPersonalRecords(currentExercises, user?.id || '').slice(0, 6),
    [currentExercises, user?.id]
  );

  const activityAnalytics = useMemo<ActivityAnalytics[]>(
    () => AnalyticsService.calculateActivityAnalytics(
      currentExercises,
      previousExercises,
      currentSrpeLogs,
      previousSrpeLogs
    ),
    [currentExercises, currentSrpeLogs, previousExercises, previousSrpeLogs]
  );

  const muscleGroupAnalytics = useMemo<MuscleGroupAnalytics[]>(
    () => AnalyticsService.calculateMuscleGroupAnalytics(
      currentExercises,
      previousExercises,
      exerciseDatabase
    ),
    [currentExercises, exerciseDatabase, previousExercises]
  );

  const latestWellness = useMemo(
    () => [...currentWellnessLogs].sort((a, b) => b.date.localeCompare(a.date))[0],
    [currentWellnessLogs]
  );

  const footballLoad = useMemo(
    () => currentSrpeLogs.reduce((sum, log) => sum + (log.sessionLoad || 0), 0),
    [currentSrpeLogs]
  );

  const hasAnalyticsData =
    currentExercises.length > 0 || currentSrpeLogs.length > 0 || currentWellnessLogs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">
            {format(range.startDate, 'MMM d, yyyy')} - {format(range.endDate, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border bg-bg-secondary p-1">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                timeframe === option.value
                  ? 'bg-accent-primary text-text-inverse'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-border bg-bg-secondary p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-accent-primary" />
          <p className="mt-3 text-text-secondary">Loading analytics...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-error-border bg-error-bg p-4 text-error-text">{error}</div>
      )}

      {!isLoading && !error && !user?.id && (
        <div className="rounded-xl border border-border bg-bg-secondary p-6 text-text-secondary">
          Sign in to view your analytics.
        </div>
      )}

      {!isLoading && !error && user?.id && !hasAnalyticsData && (
        <div className="rounded-xl border border-border bg-bg-secondary p-6 text-center">
          <h2 className="text-lg font-semibold text-text-primary">No training data yet</h2>
          <p className="mt-2 text-text-secondary">
            Log a few sessions to unlock trends, PR tracking, and workload insights.
          </p>
        </div>
      )}

      {!isLoading && !error && user?.id && hasAnalyticsData && summary && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Workouts</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{summary.totalWorkouts}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Volume</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{summary.totalVolume.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Sets</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{summary.totalSets}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Current Streak</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{summary.currentStreak}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Sports Load</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{footballLoad.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Readiness</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {latestWellness?.readiness ?? '-'}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {latestWellness?.fatigue ? `Fatigue ${latestWellness.fatigue}/7` : 'No wellness log'}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-secondary p-4 lg:col-span-2">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Daily Volume</h2>
              {dailyVolume.length === 0 ? (
                <p className="mt-4 text-sm text-text-secondary">No volume data for this period.</p>
              ) : (
                <VolumeAreaChart dataPoints={dailyVolume} />
              )}
            </div>

            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Vs Previous Period</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-lg bg-bg-tertiary px-3 py-2">
                  <p className="text-text-tertiary">Volume</p>
                  <p className={`mt-1 text-lg font-semibold ${getChangeClass(periodComparison.changes.volumeChange)}`}>
                    {formatChange(periodComparison.changes.volumeChange)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-tertiary px-3 py-2">
                  <p className="text-text-tertiary">Workouts</p>
                  <p className={`mt-1 text-lg font-semibold ${getChangeClass(periodComparison.changes.workoutsChange)}`}>
                    {formatChange(periodComparison.changes.workoutsChange)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-tertiary px-3 py-2">
                  <p className="text-text-tertiary">Unique Exercises</p>
                  <p className={`mt-1 text-lg font-semibold ${getChangeClass(periodComparison.changes.exercisesChange)}`}>
                    {formatChange(periodComparison.changes.exercisesChange)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Recent PRs</h2>
              {recentPRs.length === 0 ? (
                <p className="mt-3 text-sm text-text-secondary">No PRs in this period yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {recentPRs.map((record) => (
                    <div key={record.id} className="rounded-lg border border-border bg-bg-tertiary px-3 py-2">
                      <p className="text-sm font-medium text-text-primary">{record.exerciseName}</p>
                      <p className="text-xs text-text-secondary">
                        {record.recordType === PRType.ONE_REP_MAX ? 'Estimated 1RM' : record.recordType}: {Math.round(record.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Activity Load</h2>
              {activityAnalytics.length === 0 ? (
                <p className="mt-3 text-sm text-text-secondary">No activity load data for this period.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activityAnalytics.slice(0, 5).map((row) => (
                    <div key={row.activityKey} className="rounded-lg bg-bg-tertiary px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-text-primary">{row.label}</span>
                        <span className={`font-semibold ${getChangeClass(row.loadChange)}`}>
                          {formatChange(row.loadChange)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                        <span>{row.sessionCount} sessions</span>
                        <span>Load {formatMetric(row.totalLoad)}</span>
                        {row.totalSets > 0 && <span>{row.totalSets} sets</span>}
                        {row.totalDurationMinutes > 0 && <span>{row.totalDurationMinutes} min</span>}
                        {row.averageRpe > 0 && <span>RPE {row.averageRpe}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg-secondary p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Muscle Group Analytics</h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Resistance volume is mapped to primary and secondary muscles, then compared with the previous period.
                </p>
              </div>
            </div>

            {muscleGroupAnalytics.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">No muscle-group data for this period.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[720px] space-y-2">
                  <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-3 px-3 text-xs uppercase tracking-wide text-text-tertiary">
                    <span>Muscle group</span>
                    <span>Sets</span>
                    <span>Volume</span>
                    <span>Change</span>
                    <span>RPE</span>
                    <span>Status</span>
                  </div>

                  {muscleGroupAnalytics.slice(0, 10).map((row) => (
                    <div
                      key={row.muscleGroup}
                      className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_1.2fr] items-center gap-3 rounded-lg bg-bg-tertiary px-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{formatMuscleName(row.muscleGroup)}</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {row.topExercises.length > 0 ? row.topExercises.join(', ') : 'No contributors'}
                        </p>
                      </div>
                      <span className="font-semibold text-text-primary">{row.totalSets}</span>
                      <span className="text-text-secondary">{formatMetric(row.totalVolume)}</span>
                      <span className={getChangeClass(row.volumeChange)}>{formatChange(row.volumeChange)}</span>
                      <span className="text-text-secondary">{row.averageRpe || '-'}</span>
                      <span className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(row.status)}`}>
                        {getStatusLabel(row.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
