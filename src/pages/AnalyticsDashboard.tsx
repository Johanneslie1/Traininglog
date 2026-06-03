import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import AnalyticsService from '@/services/analyticsService';
import { buildSingleAthleteHealthDashboardData } from '@/services/athleteStatsService';
import { allExercises } from '@/data/exercises';
import { getSrpeByDateRange } from '@/services/srpeService';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { ActivityAnalytics, MuscleGroupAnalytics, PRType, VolumeDataPoint } from '@/types/analytics';
import { Exercise } from '@/types/exercise';
import { SrpeLog } from '@/types/srpe';
import { WellnessLog } from '@/types/wellness';
import { addDays, dateKeyToLocalDate, endOfDay, startOfDay, startOfLocalWeek, toLocalDateString } from '@/utils/dateUtils';
import type { CoachRatingsDashboardData } from '@/types/coachRatings';
import { EmptyState, DashboardSection, MetricChip } from '@/components/ui';
import { formatNumberCompact, formatTrainingVolume } from '@/utils/displayFormatters';
import { formatMuscleName } from '@/utils/chartDataFormatters';
import { calculateAverageReps, calculateAverageWeight, calculateTotalVolume } from '@/utils/volumeCalculations';

type Timeframe = 'day' | 'week' | 'month' | 'year';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

type LoadChartResolution = 'day' | 'week' | 'month';

interface LoadChartPoint extends VolumeDataPoint {
  periodStartDate: string;
  periodEndDate: string;
  label: string;
  isPartial?: boolean;
  daysIncluded: number;
  expectedDays: number;
}

const timeframeOptions: Array<{ value: Timeframe; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const getRangeFromTimeframe = (timeframe: Timeframe): DateRange => {
  const now = new Date();
  const endDate = endOfDay(now);

  let startDate = startOfDay(now);

  switch (timeframe) {
    case 'day':
      break;
    case 'week': {
      startDate = startOfDay(addDays(endDate, -4));
      break;
    }
    case 'month':
      startDate = startOfLocalWeek(addDays(endDate, -27));
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

const getLoadChartResolution = (timeframe: Timeframe): LoadChartResolution => {
  if (timeframe === 'month') return 'week';
  if (timeframe === 'year') return 'month';
  return 'day';
};

const normaliseDurationMinutes = (value?: number): number => {
  if (!value || value <= 0) return 0;
  return value > 240 ? Math.round((value / 60) * 10) / 10 : value;
};

const getExerciseLoad = (exercise: UnifiedExerciseData): number => {
  const sets = exercise.sets || [];
  const volume = calculateTotalVolume(sets);
  const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  const totalDuration = sets.reduce((sum, set) => sum + normaliseDurationMinutes(set.duration), 0);
  const effortValues = sets
    .map((set) => set.rpe || set.intensity || 0)
    .filter((effort) => effort > 0);
  const averageEffort = effortValues.length > 0
    ? effortValues.reduce((sum, effort) => sum + effort, 0) / effortValues.length
    : 0;
  const durationLoad = totalDuration > 0 && averageEffort > 0 ? totalDuration * averageEffort : 0;
  const repLoad = totalReps > 0 && averageEffort > 0 ? totalReps * averageEffort : 0;

  return Math.round(Math.max(volume, durationLoad, repLoad) * 10) / 10;
};

const getDateKeysInRange = (startDate: Date, endDate: Date): string[] => {
  const keys: string[] = [];
  const current = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (current <= end) {
    keys.push(toLocalDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return keys;
};

const buildDailyLoadPoints = (
  exercises: UnifiedExerciseData[],
  srpeLogs: SrpeLog[],
  range: DateRange
): LoadChartPoint[] => {
  const pointsByDate = new Map<string, LoadChartPoint>();

  const ensurePoint = (date: string): LoadChartPoint => {
    if (!pointsByDate.has(date)) {
      pointsByDate.set(date, {
        date,
        periodStartDate: date,
        periodEndDate: date,
        label: format(dateKeyToLocalDate(date) || new Date(date), 'MMM d'),
        volume: 0,
        totalSets: 0,
        averageWeight: 0,
        averageReps: 0,
        exerciseName: 'Training load',
        exerciseCount: 0,
        daysIncluded: 1,
        expectedDays: 1,
      });
    }

    return pointsByDate.get(date)!;
  };

  getDateKeysInRange(range.startDate, range.endDate).forEach(ensurePoint);

  exercises
    .filter((exercise) => !exercise.isWarmup)
    .forEach((exercise) => {
      const date = toLocalDateString(exercise.timestamp);
      const point = ensurePoint(date);
      const sets = exercise.sets || [];
      const allWeights = sets.filter((set) => (set.weight || 0) > 0);

      point.volume += getExerciseLoad(exercise);
      point.totalSets += sets.length;
      point.exerciseCount = (point.exerciseCount || 0) + 1;
      point.averageWeight += allWeights.length > 0 ? calculateAverageWeight(sets) : 0;
      point.averageReps += sets.length > 0 ? calculateAverageReps(sets) : 0;
    });

  srpeLogs.forEach((log) => {
    const point = ensurePoint(log.date);
    point.volume += log.sessionLoad || 0;
    point.exerciseCount = (point.exerciseCount || 0) + (log.sessionCount || 1);
  });

  return Array.from(pointsByDate.values())
    .map((point) => {
      const divisor = point.exerciseCount || 1;

      return {
        ...point,
        volume: Math.round(point.volume),
        averageWeight: Math.round((point.averageWeight / divisor) * 10) / 10,
        averageReps: Math.round((point.averageReps / divisor) * 10) / 10,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

const aggregateLoadPoints = (
  dailyPoints: LoadChartPoint[],
  resolution: LoadChartResolution
): LoadChartPoint[] => {
  if (resolution === 'day') return dailyPoints;

  const groups = new Map<string, LoadChartPoint[]>();

  dailyPoints.forEach((point) => {
    const pointDate = dateKeyToLocalDate(point.date);
    if (!pointDate) return;

    const groupKey = resolution === 'week'
      ? toLocalDateString(startOfLocalWeek(pointDate))
      : point.date.slice(0, 7);
    const existing = groups.get(groupKey) || [];
    groups.set(groupKey, [...existing, point]);
  });

  return Array.from(groups.entries())
    .map(([groupKey, points]): LoadChartPoint => {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const totalLoad = points.reduce((sum, point) => sum + point.volume, 0);
      const totalSets = points.reduce((sum, point) => sum + point.totalSets, 0);
      const totalExerciseCount = points.reduce((sum, point) => sum + (point.exerciseCount || 0), 0);
      const expectedDays = resolution === 'week'
        ? 7
        : new Date(Number(groupKey.slice(0, 4)), Number(groupKey.slice(5, 7)), 0).getDate();
      const daysIncluded = points.length;
      const isPartial = daysIncluded < expectedDays;
      const startDate = firstPoint.date;
      const endDate = lastPoint.date;
      const start = dateKeyToLocalDate(startDate) || new Date(startDate);
      const end = dateKeyToLocalDate(endDate) || new Date(endDate);
      const label = resolution === 'week'
        ? `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
        : format(start, 'MMM');

      return {
        date: startDate,
        periodStartDate: startDate,
        periodEndDate: endDate,
        label,
        volume: Math.round(totalLoad),
        totalSets,
        averageWeight: 0,
        averageReps: 0,
        exerciseName: resolution === 'week' ? 'Weekly load' : 'Monthly load',
        exerciseCount: totalExerciseCount,
        isPartial,
        daysIncluded,
        expectedDays,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getLoadChartTitle = (timeframe: Timeframe): string => {
  if (timeframe === 'month') return 'Weekly Load';
  if (timeframe === 'year') return 'Monthly Load';
  return 'Daily Load';
};

const getLoadChartLegend = (timeframe: Timeframe): string => {
  if (timeframe === 'month') return 'Weekly total load';
  if (timeframe === 'year') return 'Monthly total load';
  return 'Daily load';
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
  dataPoints: LoadChartPoint[];
  legendLabel: string;
}

const VolumeAreaChart: React.FC<AreaChartProps> = ({ dataPoints, legendLabel }) => {
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
    <div className="mobile-scroll-area mt-4 overflow-x-auto pb-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-w-[520px] w-full"
        role="img"
        aria-label={`${legendLabel} area chart`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-primary, #54acbf)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-accent-primary, #54acbf)" stopOpacity="0" />
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
          stroke="var(--color-accent-primary, #54acbf)"
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
            r={p.isPartial ? 4 : 3}
            fill={p.isPartial ? 'var(--color-bg-secondary, #e9f6f8)' : 'var(--color-accent-primary, #54acbf)'}
            stroke="var(--color-accent-primary, #54acbf)"
            strokeWidth={p.isPartial ? 2 : 0}
            className="drop-shadow"
          >
            <title>
              {`${p.label}: ${formatTrainingVolume(p.volume)} load, ${p.totalSets} sets${p.exerciseCount ? `, ${p.exerciseCount} entries` : ''}${p.isPartial ? `, partial (${p.daysIncluded}/${p.expectedDays} days)` : ''}`}
            </title>
          </circle>
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
            {dataPoints[i].label}
            {dataPoints[i].isPartial ? '*' : ''}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-primary shadow-glow" />
          {legendLabel}
        </span>
        {dataPoints.some((point) => point.isPartial) && (
          <span className="inline-flex items-center gap-2 text-warning-text">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-accent-primary bg-bg-secondary" />
            * Partial period
          </span>
        )}
        <span>Point tooltips include period, total load, sets, and entries.</span>
      </div>
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
  const [healthDashboard, setHealthDashboard] = useState<CoachRatingsDashboardData | null>(null);

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
        const currentStart = toLocalDateString(range.startDate);
        const currentEnd = toLocalDateString(range.endDate);
        const previousStart = toLocalDateString(previousRange.startDate);
        const previousEnd = toLocalDateString(previousRange.endDate);
        const wellnessBaselineStart = toLocalDateString(addDays(range.endDate, -28));
        const srpeBaselineStart = toLocalDateString(addDays(range.endDate, -27));
        const healthWellnessStart = currentStart < wellnessBaselineStart ? currentStart : wellnessBaselineStart;
        const healthSrpeStart = currentStart < srpeBaselineStart ? currentStart : srpeBaselineStart;

        const [current, previous, previousSrpe, healthWellness, healthSrpe] = await Promise.all([
          AnalyticsService.getExercisesByDateRange(user.id, range.startDate, range.endDate),
          AnalyticsService.getExercisesByDateRange(user.id, previousRange.startDate, previousRange.endDate),
          getSrpeByDateRange(user.id, previousStart, previousEnd),
          getWellnessByDateRange(user.id, healthWellnessStart, currentEnd),
          getSrpeByDateRange(user.id, healthSrpeStart, currentEnd),
        ]);
        const currentSrpe = healthSrpe.filter((log) => log.date >= currentStart && log.date <= currentEnd);
        const currentWellness = healthWellness.filter((log) => log.date >= currentStart && log.date <= currentEnd);
        const nextHealthDashboard = buildSingleAthleteHealthDashboardData({
          athleteId: user.id,
          email: user.email,
          displayName: `${user.firstName} ${user.lastName}`.trim(),
          selectedDate: currentEnd,
          viewMode: 'week',
          periodStartDate: currentStart,
          periodEndDate: currentEnd,
          wellnessLogs: healthWellness,
          srpeLogs: healthSrpe,
        });

        setCurrentExercises(current);
        setPreviousExercises(previous);
        setCurrentSrpeLogs(currentSrpe);
        setPreviousSrpeLogs(previousSrpe);
        setCurrentWellnessLogs(currentWellness);
        setHealthDashboard(nextHealthDashboard);
      } catch (loadError) {
        console.error('Failed to load analytics:', loadError);
        setError('Could not load analytics right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAnalytics();
  }, [range, user?.id]);

  const loadChartResolution = useMemo(() => getLoadChartResolution(timeframe), [timeframe]);
  const loadChartData = useMemo(() => {
    const dailyLoadPoints = buildDailyLoadPoints(currentExercises, currentSrpeLogs, range);
    return aggregateLoadPoints(dailyLoadPoints, loadChartResolution);
  }, [currentExercises, currentSrpeLogs, loadChartResolution, range]);
  const hasLoadChartData = loadChartData.some((point) => point.volume > 0);
  const loadChartTitle = useMemo(() => getLoadChartTitle(timeframe), [timeframe]);
  const loadChartLegend = useMemo(() => getLoadChartLegend(timeframe), [timeframe]);

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

  const healthRow = healthDashboard?.rows[0] ?? null;

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
          <EmptyState
            illustration="chart"
            title="No training data yet"
            description="Log a few sessions to unlock trends, PR tracking, and workload insights."
          />
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
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {(healthRow?.weeklySrpe.totalLoad ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                ACWR {healthRow?.acwr.ratio?.toFixed(2) ?? '-'} · {healthRow?.acwr.label ?? 'No load baseline'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wide">Readiness</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {healthRow?.wellnessSnapshot.metricValues.readiness ?? '-'}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {healthRow?.wellnessSnapshot.metricValues.fatigue
                  ? `Fatigue ${healthRow.wellnessSnapshot.metricValues.fatigue}/5 · ${healthRow.status}`
                  : 'No wellness log'}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardSection title={loadChartTitle} className="lg:col-span-2">
              {!hasLoadChartData ? (
                <div className="mt-4 rounded-xl border border-border bg-bg-tertiary p-4">
                  <EmptyState
                    title="No load data"
                    description="Log sets, activity effort, or sports load in this period to populate the load chart."
                    illustration="chart"
                  />
                </div>
              ) : (
                <VolumeAreaChart dataPoints={loadChartData} legendLabel={loadChartLegend} />
              )}
            </DashboardSection>

            <DashboardSection title="Vs Previous Period">
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
                <MetricChip label="Volume" value={formatChange(periodComparison.changes.volumeChange)} tone={periodComparison.changes.volumeChange > 0 ? 'success' : periodComparison.changes.volumeChange < 0 ? 'error' : 'default'} />
                <MetricChip label="Workouts" value={formatChange(periodComparison.changes.workoutsChange)} tone={periodComparison.changes.workoutsChange > 0 ? 'success' : periodComparison.changes.workoutsChange < 0 ? 'error' : 'default'} />
                <MetricChip label="Exercises" value={formatChange(periodComparison.changes.exercisesChange)} tone={periodComparison.changes.exercisesChange > 0 ? 'success' : periodComparison.changes.exercisesChange < 0 ? 'error' : 'default'} />
              </div>
            </DashboardSection>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardSection title="Recent PRs">
              {recentPRs.length === 0 ? (
                <p className="mt-3 rounded-xl border border-border bg-bg-tertiary p-3 text-sm text-text-secondary">
                  No PRs in this period yet. Log heavier, faster, longer, or higher-quality efforts to see records here.
                </p>
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
            </DashboardSection>

            <DashboardSection title="Activity Load">
              {activityAnalytics.length === 0 ? (
                <p className="mt-3 rounded-xl border border-border bg-bg-tertiary p-3 text-sm text-text-secondary">
                  No activity load data for this period. Log duration, intensity, or sports load values to populate this view.
                </p>
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
                        <span>Load {formatNumberCompact(row.totalLoad)}</span>
                        {row.totalSets > 0 && <span>{row.totalSets} sets</span>}
                        {row.totalDurationMinutes > 0 && <span>{row.totalDurationMinutes} min</span>}
                        {row.averageRpe > 0 && <span>RPE {row.averageRpe}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>
          </section>

          <DashboardSection
            title="Muscle Group Analytics"
            subtitle="Resistance volume is mapped to primary and secondary muscles, then compared with the previous period."
          >
            {muscleGroupAnalytics.length === 0 ? (
              <p className="mt-4 rounded-xl border border-border bg-bg-tertiary p-3 text-sm text-text-secondary">
                No muscle-group data for this period. Resistance exercises need muscle metadata and logged sets to appear here.
              </p>
            ) : (
              <div className="mobile-scroll-area mt-4 overflow-x-auto pb-2">
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
                      <span className="text-text-secondary">{formatNumberCompact(row.totalVolume)}</span>
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
          </DashboardSection>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
