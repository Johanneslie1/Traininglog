import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import AnalyticsService from '@/services/analyticsService';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { PRType, VolumeDataPoint } from '@/types/analytics';

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
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-text-secondary';
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
    <div className="mt-4 overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
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
              className="text-text-tertiary"
              fillOpacity={0.6}
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
            className="text-text-tertiary"
            fillOpacity={0.6}
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

  const range = useMemo(() => getRangeFromTimeframe(timeframe), [timeframe]);

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

        const [current, previous] = await Promise.all([
          AnalyticsService.getExercisesByDateRange(user.id, range.startDate, range.endDate),
          AnalyticsService.getExercisesByDateRange(user.id, previousRange.startDate, previousRange.endDate),
        ]);

        setCurrentExercises(current);
        setPreviousExercises(previous);
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
      []
    );
  }, [currentExercises, range.endDate, range.startDate, user?.id]);

  const periodComparison = useMemo(
    () => AnalyticsService.comparePeriods(currentExercises, previousExercises),
    [currentExercises, previousExercises]
  );

  const recentPRs = useMemo(
    () => AnalyticsService.detectPersonalRecords(currentExercises, user?.id || '').slice(0, 6),
    [currentExercises, user?.id]
  );

  const activityBreakdown = useMemo(() => {
    const buckets = new Map<string, number>();

    currentExercises.forEach((exercise) => {
      const key = exercise.activityType || 'UNKNOWN';
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .map(([activityType, count]) => ({ activityType, count }))
      .sort((a, b) => b.count - a.count);
  }, [currentExercises]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">
            {format(range.startDate, 'MMM d, yyyy')} - {format(range.endDate, 'MMM d, yyyy')}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-bg-secondary p-1">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                timeframe === option.value
                  ? 'bg-accent-primary text-white'
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
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
      )}

      {!isLoading && !error && !user?.id && (
        <div className="rounded-xl border border-border bg-bg-secondary p-6 text-text-secondary">
          Sign in to view your analytics.
        </div>
      )}

      {!isLoading && !error && user?.id && currentExercises.length === 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary p-6 text-center">
          <h2 className="text-lg font-semibold text-text-primary">No training data yet</h2>
          <p className="mt-2 text-text-secondary">
            Log a few sessions to unlock trends, PR tracking, and workload insights.
          </p>
        </div>
      )}

      {!isLoading && !error && user?.id && currentExercises.length > 0 && summary && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-text-tertiary">Volume</p>
                  <p className={`font-semibold ${getChangeClass(periodComparison.changes.volumeChange)}`}>
                    {formatChange(periodComparison.changes.volumeChange)}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary">Workouts</p>
                  <p className={`font-semibold ${getChangeClass(periodComparison.changes.workoutsChange)}`}>
                    {formatChange(periodComparison.changes.workoutsChange)}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary">Unique Exercises</p>
                  <p className={`font-semibold ${getChangeClass(periodComparison.changes.exercisesChange)}`}>
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
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Activity Mix</h2>
              <div className="mt-3 space-y-2">
                {activityBreakdown.map((row) => (
                  <div key={row.activityType} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2 text-sm">
                    <span className="text-text-secondary">{row.activityType}</span>
                    <span className="font-semibold text-text-primary">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
