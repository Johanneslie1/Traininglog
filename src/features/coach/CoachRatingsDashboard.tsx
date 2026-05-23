import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationIcon,
  RefreshIcon,
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getCoachRatingsDashboard } from '@/services/coachRatingsService';
import { addDays, dateKeyToLocalDate, getLocalWeekDateRange, toLocalDateString } from '@/utils/dateUtils';
import {
  CoachRatingStatus,
  CoachRatingsDashboardData,
  CoachRatingsRow,
  CoachRatingsViewMode,
  CoachWellnessTrend,
  CoachWellnessTrendPoint,
} from '@/types/coachRatings';
import { WellnessMetricKey } from '@/types/wellness';

interface CoachRatingsDashboardProps {
  teamId: string;
  teamName: string;
}

interface WellnessColumn {
  key: WellnessMetricKey;
  label: string;
  help: string;
}

const wellnessColumns: WellnessColumn[] = [
  { key: 'sleepQuality', label: 'Sleep', help: 'Athlete-reported sleep quality from 1 to 7. Higher is better.' },
  { key: 'readiness', label: 'Readiness', help: 'Athlete-reported readiness to train from 1 to 5. Higher is better.' },
  { key: 'fatigue', label: 'Fatigue', help: 'Athlete-reported fatigue from 1 to 7. Lower is better.' },
  { key: 'stress', label: 'Stress', help: 'Athlete-reported stress from 1 to 7. Lower is better.' },
  { key: 'muscleSoreness', label: 'Soreness', help: 'Athlete-reported muscle soreness from 1 to 7. Lower is better.' },
  { key: 'mood', label: 'Mood', help: 'Athlete-reported mood from 1 to 7. Higher is better.' },
];

const summaryHelp = {
  athletes: 'Number of active athletes in this selected team.',
  wellnessAvg: 'Daily score: the team average Wellness Readiness Score for the selected date only. Each athlete score combines logged wellness metrics into one 1-7 score where higher is better.',
  weeklyWellness: 'Weekly score: the team average Wellness Readiness Score across submitted days in the selected Monday-Sunday week. Missing days are not counted as zero.',
  missingWellness: 'Athletes without a wellness entry on the selected date.',
  missingSrpe: 'Athletes without an RPE/duration entry on the selected date.',
  srpeLoad: 'Total selected-day sRPE session load for the team. For each athlete: RPE x duration minutes.',
  weeklyLoad: 'Total team sRPE session load across the selected week.',
};

const statusStyles: Record<CoachRatingStatus, string> = {
  good: 'bg-success-bg text-success-text border-success-border',
  watch: 'bg-warning-bg text-warning-text border-warning-border',
  outlier: 'bg-error-bg text-error-text border-error-border',
  missing: 'bg-bg-tertiary text-text-tertiary border-border',
};

const statusLabels: Record<CoachRatingStatus, string> = {
  good: 'Good',
  watch: 'Watch',
  outlier: 'Risk',
  missing: 'Missing',
};

const viewModeLabels: Record<CoachRatingsViewMode, string> = {
  day: 'Day',
  week: 'Week',
};

function formatNumber(value: number | null): string {
  if (value === null) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatLoad(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString();
}

function formatRatio(value: number | null): string {
  if (value === null) return '-';
  return value.toFixed(2);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getMetricStatus(row: CoachRatingsRow, key: WellnessMetricKey): CoachRatingStatus {
  const metric = row.wellnessSnapshot.metrics.find((item) => item.key === key);
  return metric?.status || 'missing';
}

function getMetricClass(status: CoachRatingStatus, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (status === 'outlier') return 'text-error-text font-semibold';
  if (status === 'watch') return 'text-warning-text font-semibold';
  if (status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}

function getTrendClass(trend: CoachWellnessTrend, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (trend.severity === 'outlier') return 'text-error-text font-semibold';
  if (trend.severity === 'watch') return 'text-warning-text font-semibold';
  if (trend.category === 'better_than_normal') return 'text-success-text font-semibold';
  if (trend.severity === 'missing') return 'text-text-tertiary';
  return 'text-text-primary';
}

function formatTrendChange(change: number | null): string {
  if (change === null) return 'No previous log';
  if (change > 0) return `↑ ${formatNumber(Math.abs(change))}`;
  if (change < 0) return `↓ ${formatNumber(Math.abs(change))}`;
  return '→ 0.0';
}

function getSrpeClass(row: CoachRatingsRow, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (!row.dailySrpe.submitted) return 'text-text-tertiary';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 9) return 'text-error-text font-semibold';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 8) return 'text-warning-text font-semibold';
  return 'text-text-primary';
}

function getAcwrClass(row: CoachRatingsRow, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (row.acwr.status === 'outlier') return 'text-error-text font-semibold';
  if (row.acwr.status === 'watch') return 'text-warning-text font-semibold';
  if (row.acwr.status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}

interface HelpButtonProps {
  id: string;
  text: string;
  activeHelp: string | null;
  setActiveHelp: React.Dispatch<React.SetStateAction<string | null>>;
}

const HelpButton: React.FC<HelpButtonProps> = ({ id, text, activeHelp, setActiveHelp }) => {
  const isActive = activeHelp === id;

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        title={text}
        aria-label="Show explanation"
        onClick={(event) => {
          event.stopPropagation();
          setActiveHelp((current) => (current === id ? null : id));
        }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-text-tertiary hover:border-accent-primary hover:text-accent-primary"
      >
        ?
      </button>
      {isActive ? (
        <span className="absolute left-1/2 top-6 z-50 w-72 -translate-x-1/2 rounded-lg border border-border bg-[#050505] p-3 text-left text-xs normal-case leading-relaxed text-white shadow-2xl ring-1 ring-white/15">
          {text}
        </span>
      ) : null}
    </span>
  );
};

interface SummaryItemProps {
  id: string;
  label: string;
  value: string | number;
  help: string;
  activeHelp: string | null;
  setActiveHelp: React.Dispatch<React.SetStateAction<string | null>>;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  id,
  label,
  value,
  help,
  activeHelp,
  setActiveHelp,
}) => (
  <div className="flex items-center gap-1.5 whitespace-nowrap">
    <span className="text-text-tertiary">{label}</span>
    <span className="font-semibold text-text-primary">{value}</span>
    <HelpButton id={id} text={help} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
  </div>
);

function formatCompactDate(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return dateKey;

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatWeekRange(startDateKey: string, endDateKey: string): string {
  const startDate = dateKeyToLocalDate(startDateKey);
  const endDate = dateKeyToLocalDate(endDateKey);
  if (!startDate || !endDate) return `${startDateKey} to ${endDateKey}`;

  const start = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
}

interface WellnessTrendChartProps {
  points: CoachWellnessTrendPoint[];
  selectedDate: string;
}

const WellnessTrendChart: React.FC<WellnessTrendChartProps> = ({ points, selectedDate }) => {
  const width = 560;
  const height = 190;
  const padding = { top: 16, right: 18, bottom: 30, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xForIndex = (index: number) =>
    padding.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * chartWidth);
  const yForScore = (score: number) => padding.top + ((7 - score) / 6) * chartHeight;
  const selectedIndex = points.findIndex((point) => point.date === selectedDate);
  const selectedPoint = selectedIndex >= 0 ? points[selectedIndex] : null;

  const pathFor = (key: 'score' | 'rollingAverage' | 'teamAverage') => {
    let hasStarted = false;
    const commands = points.flatMap((point, index) => {
      const value = point[key];
      if (value === null) return [];

      const command = hasStarted ? 'L' : 'M';
      hasStarted = true;
      return [`${command} ${xForIndex(index).toFixed(1)} ${yForScore(value).toFixed(1)}`];
    });

    return commands.join(' ');
  };

  const hasScores = points.some((point) => point.score !== null);

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-tertiary">
        <span className="font-medium text-text-primary">28-day wellness trend</span>
        <span>Score, rolling average, and team average</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
        {[1, 4, 7].map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yForScore(tick)}
              y2={yForScore(tick)}
              className="stroke-border"
              strokeDasharray={tick === 4 ? '4 4' : undefined}
            />
            <text x={8} y={yForScore(tick) + 4} className="fill-text-tertiary text-[10px]">
              {tick}
            </text>
          </g>
        ))}
        <path d={pathFor('teamAverage')} className="fill-none stroke-text-tertiary opacity-40" strokeWidth={2} />
        <path d={pathFor('rollingAverage')} className="fill-none stroke-warning-text" strokeWidth={2} strokeDasharray="6 5" />
        <path d={pathFor('score')} className="fill-none stroke-accent-primary" strokeWidth={3} />
        {points.map((point, index) =>
          point.score === null ? null : (
            <circle
              key={point.date}
              cx={xForIndex(index)}
              cy={yForScore(point.score)}
              r={2.8}
              className="fill-accent-primary"
            />
          )
        )}
        {selectedPoint?.score !== null && selectedPoint?.score !== undefined ? (
          <g>
            <line
              x1={xForIndex(selectedIndex)}
              x2={xForIndex(selectedIndex)}
              y1={padding.top}
              y2={height - padding.bottom}
              className="stroke-text-primary opacity-30"
              strokeDasharray="4 4"
            />
            <circle
              cx={xForIndex(selectedIndex)}
              cy={yForScore(selectedPoint.score)}
              r={5}
              className="fill-bg-secondary stroke-accent-primary"
              strokeWidth={3}
            />
          </g>
        ) : null}
        {hasScores ? null : (
          <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-text-tertiary text-xs">
            No wellness scores in this window
          </text>
        )}
        <text x={padding.left} y={height - 8} className="fill-text-tertiary text-[10px]">
          {points[0]?.date || ''}
        </text>
        <text x={width - padding.right} y={height - 8} textAnchor="end" className="fill-text-tertiary text-[10px]">
          {points[points.length - 1]?.date || ''}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-text-tertiary">
        <span><span className="mr-1 inline-block h-2 w-4 rounded-full bg-accent-primary" />Athlete</span>
        <span><span className="mr-1 inline-block h-2 w-4 rounded-full bg-warning-text" />Rolling avg</span>
        <span><span className="mr-1 inline-block h-2 w-4 rounded-full bg-text-tertiary opacity-40" />Team avg</span>
      </div>
    </div>
  );
};

const CoachRatingsDashboard: React.FC<CoachRatingsDashboardProps> = ({ teamId, teamName }) => {
  const navigate = useNavigate();
  const todayDate = new Date();
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(todayDate));
  const [periodStartDate, setPeriodStartDate] = useState(() => getLocalWeekDateRange(todayDate).startDateKey);
  const [periodEndDate, setPeriodEndDate] = useState(() => getLocalWeekDateRange(todayDate).endDateKey);
  const [dashboard, setDashboard] = useState<CoachRatingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningsEnabled, setWarningsEnabled] = useState(true);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CoachRatingsViewMode>('day');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getCoachRatingsDashboard({
        selectedDate,
        selectedTeamId: teamId,
        viewMode,
        periodStartDate,
        periodEndDate,
      });
      setDashboard(data);
    } catch (error) {
      console.error('Error loading team ratings dashboard:', error);
      toast.error('Failed to load team ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedDate, teamId, viewMode, periodStartDate, periodEndDate]);

  const selectDay = (dateKey: string) => {
    const date = dateKeyToLocalDate(dateKey);
    if (!date) return;
    const nextWeek = getLocalWeekDateRange(date);
    setSelectedDate(dateKey);
    setPeriodStartDate(nextWeek.startDateKey);
    setPeriodEndDate(nextWeek.endDateKey);
  };

  const selectWeekStart = (dateKey: string) => {
    const date = dateKeyToLocalDate(dateKey);
    if (!date) return;
    const nextWeek = getLocalWeekDateRange(date);
    setSelectedDate(nextWeek.startDateKey);
    setPeriodStartDate(nextWeek.startDateKey);
    setPeriodEndDate(nextWeek.endDateKey);
  };

  const movePeriod = (direction: -1 | 1) => {
    if (viewMode === 'day') {
      const current = dateKeyToLocalDate(selectedDate);
      if (!current) return;
      selectDay(toLocalDateString(addDays(current, direction)));
      return;
    }

    const start = dateKeyToLocalDate(periodStartDate);
    const end = dateKeyToLocalDate(periodEndDate);
    if (!start || !end) return;
    const nextStart = toLocalDateString(addDays(start, direction * 7));
    const nextEnd = toLocalDateString(addDays(end, direction * 7));
    setPeriodStartDate(nextStart);
    setPeriodEndDate(nextEnd);
    setSelectedDate(nextStart);
  };

  const summary = dashboard?.summary;
  const selectedDateLabel = formatCompactDate(selectedDate);
  const periodRangeLabel = formatWeekRange(periodStartDate, periodEndDate);
  const isDayMode = viewMode === 'day';
  const wellnessSummaryLabel = isDayMode ? 'Daily wellness' : 'Weekly wellness avg';
  const missingWellnessLabel = isDayMode ? 'Missing wellness' : 'No wellness this week';
  const missingSrpeLabel = isDayMode ? 'Missing RPE' : 'No RPE this week';
  const loadSummaryLabel = isDayMode ? 'sRPE load' : 'Weekly load';
  const attentionParts = [
    summary?.outlierCount ? `${summary.outlierCount} risk ${summary.outlierCount === 1 ? 'flag' : 'flags'}` : null,
    summary?.missingDailyWellnessCount ? `${summary.missingDailyWellnessCount} ${missingWellnessLabel.toLowerCase()}` : null,
    summary?.missingDailySrpeCount ? `${summary.missingDailySrpeCount} ${missingSrpeLabel.toLowerCase()}` : null,
  ].filter(Boolean);

  return (
    <section className="bg-bg-secondary border border-border rounded-lg overflow-hidden mb-6">
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Selected team</p>
            <h2 className="text-2xl font-bold text-text-primary">Health & Well-being</h2>
            <p className="text-sm text-text-tertiary mt-1">
              {teamName}: {viewModeLabels[viewMode].toLowerCase()} view with empty days excluded from calculations. ACWR is color-coded in the table.
            </p>
          </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${warningsEnabled ? 'bg-accent-primary' : 'bg-text-tertiary'}`} />
              {warningsEnabled ? 'Warnings on' : 'Warnings off'}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-tertiary/70 px-3 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-bg-secondary p-1">
                  {(Object.keys(viewModeLabels) as CoachRatingsViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setViewMode(mode);
                        if (mode === 'day') {
                          selectDay(selectedDate);
                        } else {
                          selectWeekStart(selectedDate);
                        }
                      }}
                      className={`h-full rounded-full px-3 text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? 'bg-accent-primary text-text-inverse'
                          : 'text-text-secondary hover:text-accent-primary'
                      }`}
                      aria-pressed={viewMode === mode}
                    >
                      {viewModeLabels[mode]}
                    </button>
                  ))}
                </div>

                {isDayMode ? (
                  <label className="group relative flex h-11 min-w-44 items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
                    <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
                    <span className="font-medium">{selectedDateLabel}</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => selectDay(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Daily date"
                    />
                  </label>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="group relative flex h-11 min-w-36 items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
                      <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
                      <span className="font-medium">{periodStartDate}</span>
                      <input
                        type="date"
                        value={periodStartDate}
                        onChange={(event) => {
                          setPeriodStartDate(event.target.value);
                          setSelectedDate(event.target.value);
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Period start date"
                      />
                    </label>
                    <span className="text-xs text-text-tertiary">to</span>
                    <label className="group relative flex h-11 min-w-36 items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
                      <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
                      <span className="font-medium">{periodEndDate}</span>
                      <input
                        type="date"
                        value={periodEndDate}
                        onChange={(event) => setPeriodEndDate(event.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Period end date"
                      />
                    </label>
                  </div>
                )}

                <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-bg-secondary">
                  <button
                    type="button"
                    onClick={() => movePeriod(-1)}
                    className="flex h-full w-10 items-center justify-center text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
                    aria-label={isDayMode ? 'Previous day' : 'Previous week'}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="border-x border-border px-4 text-center">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      {isDayMode ? 'Day' : 'Period'}
                    </div>
                    <div className="text-sm font-semibold leading-tight text-text-primary">
                      {isDayMode ? selectedDateLabel : periodRangeLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => movePeriod(1)}
                    className="flex h-full w-10 items-center justify-center text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
                    aria-label={isDayMode ? 'Next day' : 'Next week'}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>

              <button
                type="button"
                onClick={loadDashboard}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-accent-hover"
                aria-label="Refresh ratings"
              >
                <RefreshIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

              <div className="flex h-11 items-center justify-between gap-3 rounded-full border border-border bg-bg-secondary px-4 text-sm text-text-secondary xl:justify-start">
                <div>
                  <div className="font-medium text-text-primary">Warnings</div>
                </div>
              <button
                type="button"
                onClick={() => setWarningsEnabled((current) => !current)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    warningsEnabled ? 'bg-accent-primary' : 'bg-bg-primary ring-1 ring-border'
                }`}
                aria-pressed={warningsEnabled}
              >
                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      warningsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && !dashboard ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-text-tertiary">Loading team ratings...</span>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-3 rounded-lg border border-border bg-bg-tertiary px-3 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <SummaryItem
                id="summary-athletes"
                label="Athletes"
                value={summary?.athleteCount ?? 0}
                help={summaryHelp.athletes}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-wellness"
                label={wellnessSummaryLabel}
                value={formatNumber(summary?.dailyWellnessAverage ?? null)}
                help={summaryHelp.wellnessAvg}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              {isDayMode ? (
                <SummaryItem
                  id="summary-weekly-wellness"
                  label="Weekly wellness avg"
                  value={formatNumber(summary?.weeklyWellnessAverage ?? null)}
                  help={summaryHelp.weeklyWellness}
                  activeHelp={activeHelp}
                  setActiveHelp={setActiveHelp}
                />
              ) : null}
              <SummaryItem
                id="summary-missing-wellness"
                label={missingWellnessLabel}
                value={summary?.missingDailyWellnessCount ?? 0}
                help={summaryHelp.missingWellness}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-missing-srpe"
                label={missingSrpeLabel}
                value={summary?.missingDailySrpeCount ?? 0}
                help={summaryHelp.missingSrpe}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-srpe-load"
                label={loadSummaryLabel}
                value={formatLoad(summary?.dailySrpeTotalLoad ?? 0)}
                help={isDayMode ? summaryHelp.srpeLoad : summaryHelp.weeklyLoad}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              {isDayMode ? (
                <SummaryItem
                  id="summary-weekly-load"
                  label="Weekly load"
                  value={formatLoad(summary?.weeklySrpeTotalLoad ?? 0)}
                  help={summaryHelp.weeklyLoad}
                  activeHelp={activeHelp}
                  setActiveHelp={setActiveHelp}
                />
              ) : null}
            </div>
            {attentionParts.length > 0 ? (
              <div className="mt-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning-text">
                Needs attention: {attentionParts.join(' · ')}
              </div>
            ) : null}
          </div>

          {!dashboard || dashboard.rows.length === 0 ? (
            <div className="bg-bg-tertiary border border-border rounded-lg p-8 text-center">
              <ExclamationIcon className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-primary font-medium">No athletes found</p>
              <p className="text-sm text-text-tertiary mt-1">
                Add athletes to this team to see wellness, RPE, and sRPE load ratings.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full text-sm">
                  <thead>
                    <tr className="bg-bg-primary text-xs uppercase tracking-wide text-text-tertiary">
                      <th className="px-3 py-2 text-left border-r border-border" rowSpan={2}>Athlete</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={3}>Health</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={6}>Well-being</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={5}>Training</th>
                      <th className="px-3 py-2 text-left" rowSpan={2}>Warnings</th>
                    </tr>
                    <tr className="bg-bg-tertiary text-xs text-text-tertiary">
                      <th className="px-3 py-2 text-center">Notes</th>
                      <th className="px-3 py-2 text-center border-r border-border">
                        {isDayMode ? 'Total' : 'Week Avg'}
                        <HelpButton
                          id="table-total"
                          text={summaryHelp.wellnessAvg}
                          activeHelp={activeHelp}
                          setActiveHelp={setActiveHelp}
                        />
                      </th>
                      <th className="px-3 py-2 text-center border-r border-border">
                        {isDayMode ? 'Trend' : 'Reported'}
                        <HelpButton
                          id="table-trend"
                          text={isDayMode
                            ? "Change from the athlete's previous logged wellness day plus a simple status from their own 28-day baseline. Z-scores are used behind the scenes."
                            : 'Number of reported well-being days included in this weekly average. Empty days are not included.'}
                          activeHelp={activeHelp}
                          setActiveHelp={setActiveHelp}
                        />
                      </th>
                      {wellnessColumns.map((column) => (
                        <th key={column.key} className="px-3 py-2 text-center">
                          {column.label}
                          <HelpButton
                            id={`table-${column.key}`}
                            text={column.help}
                            activeHelp={activeHelp}
                            setActiveHelp={setActiveHelp}
                          />
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center">
                        {isDayMode ? 'RPE' : 'Avg RPE'}
                        <HelpButton id="table-srpe" text="Logged session RPE from 1 to 10. Weekly view averages only reported days." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        {isDayMode ? 'Min' : 'RPE Days'}
                        <HelpButton id="table-min" text="Duration for day view, or number of reported RPE days in week view." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        sRPE Load
                        <HelpButton id="table-load" text={summaryHelp.srpeLoad} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        {isDayMode ? 'Week Load' : 'Chronic Avg'}
                        <HelpButton id="table-week-load" text={isDayMode ? summaryHelp.weeklyLoad : 'Chronic average sRPE load per reported day over the last 28 days. Empty days are excluded.'} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center border-r border-border">
                        ACWR
                        <HelpButton id="table-acwr" text="ACWR = acute average daily load divided by chronic average daily load, using reported days only. Amber starts around 1.3; red starts at 1.5." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.rows.map((row) => (
                      <React.Fragment key={row.athleteId}>
                      <tr className="hover:bg-bg-tertiary/60 transition-colors">
                        <td className="px-3 py-3 border-r border-border">
                          <button
                            type="button"
                            onClick={() => setExpandedAthleteId((current) => (
                              current === row.athleteId ? null : row.athleteId
                            ))}
                            className="flex items-center gap-3 text-left group"
                            aria-expanded={expandedAthleteId === row.athleteId}
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-tertiary border border-border text-accent-primary text-xs font-bold">
                              {getInitials(row.athleteName)}
                            </span>
                            <span>
                              <span className="block font-semibold text-text-primary group-hover:text-accent-primary">
                                {row.athleteName}
                              </span>
                              <span className="block text-xs text-text-tertiary">{row.email}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={row.wellnessSnapshot.hasNotes ? 'text-success-text font-semibold' : 'text-text-tertiary'}
                            title={row.wellnessSnapshot.notes || undefined}
                          >
                            {row.wellnessSnapshot.hasNotes ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-center border-r border-border ${getMetricClass(row.status, warningsEnabled)}`}>
                          <div>{formatNumber(row.wellnessSnapshot.score)}</div>
                          {!isDayMode ? null : !row.wellnessSnapshot.isSelectedDate && row.wellnessSnapshot.date ? (
                            <div className="text-[11px] text-text-tertiary">{row.wellnessSnapshot.date}</div>
                          ) : null}
                        </td>
                        <td className={`px-3 py-3 text-center border-r border-border ${getTrendClass(row.wellnessTrend, warningsEnabled)}`}>
                          {isDayMode ? (
                            <>
                              <div>{formatTrendChange(row.wellnessTrend.changeFromPrevious)}</div>
                              <div className="text-[11px] text-current opacity-80">{row.wellnessTrend.label}</div>
                            </>
                          ) : (
                            <>
                              <div>{row.wellnessSnapshot.submittedDays}/{row.wellnessSnapshot.totalDays}</div>
                              <div className="text-[11px] text-current opacity-80">reported days</div>
                            </>
                          )}
                        </td>
                        {wellnessColumns.map((column) => {
                          const value = row.wellnessSnapshot.metricValues[column.key];
                          const status = getMetricStatus(row, column.key);

                          return (
                            <td
                              key={column.key}
                              className={`px-3 py-3 text-center ${getMetricClass(status, warningsEnabled)}`}
                            >
                              {typeof value === 'number' ? formatNumber(value) : '-'}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-3 text-center ${getSrpeClass(row, warningsEnabled)}`}>
                          {isDayMode ? formatNumber(row.dailySrpe.rpe) : formatNumber(row.weeklySrpe.averageRpe)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {isDayMode
                            ? row.dailySrpe.submitted ? row.dailySrpe.durationMinutes : '-'
                            : `${row.weeklySrpe.submittedDays}/${row.wellnessSnapshot.totalDays}`}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {isDayMode ? formatLoad(row.dailySrpe.sessionLoad) : formatLoad(row.weeklySrpe.totalLoad)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {isDayMode ? (
                            formatLoad(row.weeklySrpe.totalLoad)
                          ) : (
                            <>
                              <div>{formatLoad(row.acwr.chronicDailyAverageLoad)}</div>
                              <div className="text-[11px] text-text-tertiary">{row.acwr.chronicReportedDays} days</div>
                            </>
                          )}
                        </td>
                        <td className={`px-3 py-3 text-center border-r border-border ${getAcwrClass(row, warningsEnabled)}`}>
                          <div>{formatRatio(row.acwr.ratio)}</div>
                          <div className="text-[11px] text-current opacity-80">{row.acwr.label}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[row.status]}`}>
                            {statusLabels[row.status]}
                          </span>
                          {warningsEnabled && row.outlierReasons.length > 0 ? (
                            <div className="mt-1 max-w-60 text-xs text-text-tertiary">
                              {row.outlierReasons.slice(0, 3).join(', ')}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                      {expandedAthleteId === row.athleteId ? (
                        <tr className="bg-bg-tertiary/40">
                          <td colSpan={16} className="border-t border-border px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                              <WellnessTrendChart points={row.wellnessTrendPoints} selectedDate={selectedDate} />
                              <div className="rounded-xl border border-border bg-bg-secondary p-4 text-sm">
                                <div className="mb-3">
                                  <p className="text-xs uppercase tracking-wide text-text-tertiary">Individual baseline</p>
                                  <h3 className="font-semibold text-text-primary">{row.athleteName}</h3>
                                </div>
                                <div className="space-y-2 text-text-secondary">
                                  <div className="flex justify-between gap-3">
                                    <span>Selected day</span>
                                    <span className="font-semibold text-text-primary">{formatNumber(row.dailyWellness.score)}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span>Table snapshot</span>
                                    <span className="font-semibold text-text-primary">
                                      {row.wellnessSnapshot.date
                                        ? `${formatNumber(row.wellnessSnapshot.score)} (${row.wellnessSnapshot.date})`
                                        : '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span>Previous logged day</span>
                                    <span className="font-semibold text-text-primary">
                                      {row.wellnessTrend.previousDate
                                        ? `${formatNumber(row.wellnessTrend.previousScore)} (${row.wellnessTrend.previousDate})`
                                        : '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span>28-day average</span>
                                    <span className="font-semibold text-text-primary">{formatNumber(row.wellnessTrend.baselineAverage)}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span>Baseline SD</span>
                                    <span className="font-semibold text-text-primary">{formatNumber(row.wellnessTrend.baselineSd)}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span>Internal z-score</span>
                                    <span className="font-semibold text-text-primary">{formatNumber(row.wellnessTrend.zScore)}</span>
                                  </div>
                                </div>
                                <p className="mt-3 rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-xs leading-relaxed text-text-tertiary">
                                  Higher wellness is better. The table keeps the z-score translated into plain language so coaches can scan for meaningful changes quickly.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/coach/athlete/${row.athleteId}`)}
                                  className="mt-3 inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary"
                                >
                                  Open athlete profile
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CoachRatingsDashboard;
