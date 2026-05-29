import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getCoachRatingsDashboard } from '@/services/coachRatingsService';
import {
  CoachRatingsRow,
  CoachWellnessTrendPoint,
} from '@/types/coachRatings';
import { HealthDashboardControls } from '@/features/health-dashboard/HealthDashboardControls';
import { HealthLoadTable } from '@/features/health-dashboard/HealthLoadTable';
import { HealthStatusBadge } from '@/features/health-dashboard/HealthStatusBadge';
import { HealthSummaryCards } from '@/features/health-dashboard/HealthSummaryCards';
import {
  formatLoad,
  formatNumber,
  formatRatio,
  formatTrendChange,
  getAcwrClass,
  getInitials,
  getMetricClass,
  getMetricStatus,
  getSrpeClass,
  getTrendClass,
  statusPriority,
  viewModeLabels,
  wellnessColumns,
} from '@/features/health-dashboard/healthDashboardFormatters';
import { useHealthLoadDashboard } from '@/features/health-dashboard/useHealthLoadDashboard';

interface CoachRatingsDashboardProps {
  teamId: string;
  teamName: string;
}

const summaryHelp = {
  athletes: 'Number of active athletes in this selected team.',
  wellnessAvg: 'Daily score: the team average Wellness Readiness Score for the selected date only. Each athlete score combines logged wellness metrics into one 1-7 score where higher is better.',
  weeklyWellness: 'Weekly score: the team average Wellness Readiness Score across submitted days in the selected Monday-Sunday week. Missing days are not counted as zero.',
  missingWellness: 'Athletes without a wellness entry on the selected date.',
  missingSrpe: 'Athletes without an RPE/duration entry on the selected date.',
  srpeLoad: 'Total selected-day sports load for the team. For each athlete: RPE x duration minutes.',
  weeklyLoad: 'Total team sports load across the selected week.',
};

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
        <span className="absolute left-1/2 top-6 z-50 w-72 -translate-x-1/2 rounded-lg border border-border bg-bg-primary p-3 text-left text-xs normal-case leading-relaxed text-text-primary shadow-2xl ring-1 ring-border">
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

interface AthleteWellbeingCardProps {
  row: CoachRatingsRow;
  isDayMode: boolean;
  warningsEnabled: boolean;
  expanded: boolean;
  selectedDate: string;
  onToggle: () => void;
  onOpenAthlete: () => void;
}

const AthleteWellbeingCard: React.FC<AthleteWellbeingCardProps> = ({
  row,
  isDayMode,
  warningsEnabled,
  expanded,
  selectedDate,
  onToggle,
  onOpenAthlete,
}) => {
  const srpeValue = isDayMode ? formatNumber(row.dailySrpe.rpe) : formatNumber(row.weeklySrpe.averageRpe);
  const loadValue = isDayMode ? formatLoad(row.dailySrpe.sessionLoad) : formatLoad(row.weeklySrpe.totalLoad);
  const durationValue = isDayMode
    ? row.dailySrpe.submitted ? `${row.dailySrpe.durationMinutes} min` : '-'
    : `${row.weeklySrpe.submittedDays}/${row.wellnessSnapshot.totalDays} days`;

  return (
    <article className="rounded-xl border border-border bg-bg-secondary p-3 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-tertiary text-sm font-bold text-accent-primary">
          {getInitials(row.athleteName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-text-primary">{row.athleteName}</span>
          <span className="block truncate text-xs text-text-tertiary">{row.email}</span>
          {warningsEnabled && row.outlierReasons.length > 0 ? (
            <span className="mt-2 block rounded-lg border border-warning-border bg-warning-bg px-2.5 py-2 text-xs leading-relaxed text-warning-text">
              {row.outlierReasons.slice(0, 2).join(', ')}
            </span>
          ) : null}
        </span>
        <HealthStatusBadge status={row.status} className="shrink-0 text-xs font-medium" />
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-bg-tertiary px-3 py-2">
          <p className="text-xs text-text-tertiary">{isDayMode ? 'Wellness' : 'Week avg'}</p>
          <p className={`mt-1 font-semibold ${getMetricClass(row.status, warningsEnabled)}`}>
            {formatNumber(row.wellnessSnapshot.score)}
          </p>
          {!isDayMode ? null : !row.wellnessSnapshot.isSelectedDate && row.wellnessSnapshot.date ? (
            <p className="text-[11px] text-text-tertiary">{row.wellnessSnapshot.date}</p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border bg-bg-tertiary px-3 py-2">
          <p className="text-xs text-text-tertiary">{isDayMode ? 'Trend' : 'Reported'}</p>
          <p className={`mt-1 font-semibold ${getTrendClass(row.wellnessTrend, warningsEnabled)}`}>
            {isDayMode
              ? formatTrendChange(row.wellnessTrend.changeFromPrevious)
              : `${row.wellnessSnapshot.submittedDays}/${row.wellnessSnapshot.totalDays}`}
          </p>
          <p className="text-[11px] text-text-tertiary">
            {isDayMode ? row.wellnessTrend.label : 'wellbeing days'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-tertiary px-3 py-2">
          <p className="text-xs text-text-tertiary">{isDayMode ? 'RPE / duration' : 'Avg RPE / days'}</p>
          <p className={`mt-1 font-semibold ${getSrpeClass(row, warningsEnabled)}`}>
            {srpeValue} <span className="text-xs font-normal text-text-tertiary">/ {durationValue}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-bg-tertiary px-3 py-2">
          <p className="text-xs text-text-tertiary">{isDayMode ? 'Load / ACWR' : 'Load / chronic'}</p>
          <p className="mt-1 font-semibold text-text-primary">{loadValue}</p>
          <p className={`text-[11px] ${getAcwrClass(row, warningsEnabled)}`}>
            ACWR {formatRatio(row.acwr.ratio)} · {row.acwr.label}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {wellnessColumns.slice(0, 6).map((column) => {
          const value = row.wellnessSnapshot.metricValues[column.key];
          const status = getMetricStatus(row, column.key);

          return (
            <div key={column.key} className="rounded-lg bg-bg-tertiary px-2 py-2 text-center">
              <p className="truncate text-text-tertiary">{column.label}</p>
              <p className={`mt-0.5 font-semibold ${getMetricClass(status, warningsEnabled)}`}>
                {typeof value === 'number' ? formatNumber(value) : '-'}
              </p>
            </div>
          );
        })}
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <WellnessTrendChart points={row.wellnessTrendPoints} selectedDate={selectedDate} />
          <div className="rounded-xl border border-border bg-bg-tertiary p-4 text-sm">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-text-tertiary">Individual baseline</p>
              <h3 className="font-semibold text-text-primary">{row.athleteName}</h3>
            </div>
            <div className="space-y-2 text-text-secondary">
              <div className="flex justify-between gap-3">
                <span>{isDayMode ? 'Selected day' : 'Week start score'}</span>
                <span className="font-semibold text-text-primary">{formatNumber(row.dailyWellness.score)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>28-day average</span>
                <span className="font-semibold text-text-primary">{formatNumber(row.wellnessTrend.baselineAverage)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Previous entry</span>
                <span className="font-semibold text-text-primary">
                  {row.wellnessTrend.previousDate
                    ? `${formatNumber(row.wellnessTrend.previousScore)} (${row.wellnessTrend.previousDate})`
                    : '-'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAthlete}
              className="mt-3 inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-accent-primary hover:text-accent-primary"
            >
              Open athlete profile
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};

const CoachRatingsDashboard: React.FC<CoachRatingsDashboardProps> = ({ teamId, teamName }) => {
  const navigate = useNavigate();
  const [warningsEnabled, setWarningsEnabled] = useState(true);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);

  const {
    dashboard,
    loading,
    loadError,
    selectedDate,
    periodStartDate,
    periodEndDate,
    viewMode,
    isDayMode,
    refresh,
    selectDay,
    selectWeekStart,
    movePeriod,
    setViewMode,
  } = useHealthLoadDashboard({
    loadDashboard: getCoachRatingsDashboard,
    selectedTeamId: teamId,
    onLoadError: (error) => {
      console.error('Error loading team ratings dashboard:', error);
      toast.error('Failed to load team ratings');
    },
  });

  const summary = dashboard?.summary;
  const wellnessSummaryLabel = isDayMode ? 'Daily wellness' : 'Weekly wellness avg';
  const missingWellnessLabel = isDayMode ? 'Missing wellness' : 'No wellness this week';
  const missingSrpeLabel = isDayMode ? 'Missing RPE' : 'No RPE this week';
  const loadSummaryLabel = isDayMode ? 'Sports load' : 'Weekly sports load';
  const prioritizedRows = [...(dashboard?.rows ?? [])].sort((a, b) => {
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.athleteName.localeCompare(b.athleteName);
  });
  const attentionParts = [
    summary?.outlierCount ? `${summary.outlierCount} risk ${summary.outlierCount === 1 ? 'flag' : 'flags'}` : null,
    summary?.missingDailyWellnessCount ? `${summary.missingDailyWellnessCount} ${missingWellnessLabel.toLowerCase()}` : null,
    summary?.missingDailySrpeCount ? `${summary.missingDailySrpeCount} ${missingSrpeLabel.toLowerCase()}` : null,
  ].filter(Boolean);

  return (
    <section className="bg-bg-secondary border border-border rounded-lg overflow-hidden mb-6">
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary">Selected team</p>
            <h2 className="text-2xl font-bold text-text-primary">Health & Well-being</h2>
            <p className="text-sm text-text-tertiary mt-1">
              {teamName}: {viewModeLabels[viewMode].toLowerCase()} view, sorted by athletes who need attention first.
            </p>
          </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${warningsEnabled ? 'bg-accent-primary' : 'bg-text-tertiary'}`} />
              {loading && dashboard ? 'Updating...' : warningsEnabled ? 'Warnings on' : 'Warnings off'}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-tertiary/70 px-3 py-3">
            <HealthDashboardControls
              selectedDate={selectedDate}
              periodStartDate={periodStartDate}
              periodEndDate={periodEndDate}
              viewMode={viewMode}
              isDayMode={isDayMode}
              onViewModeChange={setViewMode}
              onSelectDay={selectDay}
              onSelectWeekStart={selectWeekStart}
              onMovePeriod={movePeriod}
              onRefresh={() => void refresh()}
              surfaceClassName="bg-bg-secondary"
            >
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
                  aria-label={warningsEnabled ? 'Turn warnings off' : 'Turn warnings on'}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      warningsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </HealthDashboardControls>
          </div>
        </div>
      </div>

      {loadError && !dashboard ? (
        <div className="m-4 rounded-xl border border-error-border bg-error-bg p-4 text-error-text">
          <p className="font-medium">Ratings unavailable</p>
          <p className="mt-1 text-sm">Could not load the dashboard right now.</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 inline-flex rounded-full border border-error-border px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      ) : loading && !dashboard ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-text-tertiary">Loading team ratings...</span>
        </div>
      ) : (
        <div className="p-3 sm:p-4">
          {loadError ? (
            <div className="mb-3 rounded-lg border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
              {loadError}
            </div>
          ) : null}

          <HealthSummaryCards
            columnsClassName="mb-3 grid gap-3 md:grid-cols-3"
            cardClassName="rounded-xl border border-border bg-bg-tertiary px-4 py-3"
            items={[
              {
                id: 'risk-flags',
                label: 'Risk flags',
                value: summary?.outlierCount ?? 0,
                valueClassName: 'text-error-text',
              },
              {
                id: 'missing-wellness',
                label: missingWellnessLabel,
                value: summary?.missingDailyWellnessCount ?? 0,
                valueClassName: 'text-warning-text',
              },
              {
                id: 'missing-srpe',
                label: missingSrpeLabel,
                value: summary?.missingDailySrpeCount ?? 0,
                valueClassName: 'text-warning-text',
              },
            ]}
          />

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
                help={isDayMode ? summaryHelp.wellnessAvg : summaryHelp.weeklyWellness}
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

          <div className="mb-3 rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs leading-relaxed text-info-text">
            Wellness scores combine submitted well-being metrics; weekly averages exclude empty days. ACWR compares recent load to the athlete's 28-day baseline.
          </div>

          {!dashboard || prioritizedRows.length === 0 ? (
            <div className="bg-bg-tertiary border border-border rounded-lg p-8 text-center">
              <ExclamationIcon className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-primary font-medium">No athletes found</p>
              <p className="text-sm text-text-tertiary mt-1">
                Add athletes to this team to see wellness, RPE, and sports load ratings.
              </p>
            </div>
          ) : (
            <>
            <p className="mb-2 text-xs text-text-tertiary">
              On narrow screens, each athlete is shown as a card. Rotate your phone or use a wider screen for the full comparison table.
            </p>

            <div className="coach-ratings-mobile-cards space-y-3">
              {prioritizedRows.map((row) => (
                <AthleteWellbeingCard
                  key={row.athleteId}
                  row={row}
                  isDayMode={isDayMode}
                  warningsEnabled={warningsEnabled}
                  expanded={expandedAthleteId === row.athleteId}
                  selectedDate={selectedDate}
                  onToggle={() => setExpandedAthleteId((current) => (
                    current === row.athleteId ? null : row.athleteId
                  ))}
                  onOpenAthlete={() => navigate(`/coach/athlete/${row.athleteId}`)}
                />
              ))}
            </div>

            <HealthLoadTable
              rows={prioritizedRows}
              isDayMode={isDayMode}
              warningsEnabled={warningsEnabled}
              showStatusColumn
              expandedRowId={expandedAthleteId}
              wrapperClassName="coach-ratings-table-view rounded-lg border border-border"
              scrollClassName="mobile-scroll-area max-h-[72vh] overflow-x-auto overflow-y-auto pb-2"
              tableClassName="min-w-[1080px] w-full text-xs lg:min-w-[1180px] lg:text-sm"
              stickyHeader
              firstColumnHeader="Athlete"
              firstColumnHeaderClassName="sticky left-0 top-0 z-50 w-40 min-w-40 bg-bg-primary px-2 py-2 text-left shadow-[4px_0_12px_rgba(0,0,0,0.25)] border-r border-border lg:w-52 lg:min-w-52 lg:px-3"
              firstColumnCellClassName="sticky left-0 z-10 w-40 min-w-40 max-w-40 bg-bg-secondary px-2 py-3 shadow-[4px_0_12px_rgba(0,0,0,0.18)] border-r border-border lg:w-52 lg:min-w-52 lg:max-w-52 lg:px-3"
              renderHelp={(id, text) => (
                <HelpButton id={id} text={text} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
              )}
              renderFirstColumn={(row) => (
                <button
                  type="button"
                  onClick={() => setExpandedAthleteId((current) => (
                    current === row.athleteId ? null : row.athleteId
                  ))}
                  className="group flex w-full min-w-0 items-center gap-2 text-left lg:gap-3"
                  aria-expanded={expandedAthleteId === row.athleteId}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-tertiary text-xs font-bold text-accent-primary lg:h-9 lg:w-9">
                    {getInitials(row.athleteName)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text-primary group-hover:text-accent-primary">
                      {row.athleteName}
                    </span>
                    <span className="hidden truncate text-xs text-text-tertiary lg:block">{row.email}</span>
                  </span>
                </button>
              )}
              renderStatusColumn={(row) => (
                <>
                  <HealthStatusBadge status={row.status} className="text-xs font-medium" />
                  {warningsEnabled && row.outlierReasons.length > 0 ? (
                    <div className="mt-1 max-w-60 text-xs text-text-tertiary">
                      {row.outlierReasons.slice(0, 3).join(', ')}
                    </div>
                  ) : null}
                </>
              )}
              renderExpandedRow={(row) => (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <WellnessTrendChart points={row.wellnessTrendPoints} selectedDate={selectedDate} />
                  <div className="rounded-xl border border-border bg-bg-secondary p-4 text-sm">
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wide text-text-tertiary">Individual baseline</p>
                      <h3 className="font-semibold text-text-primary">{row.athleteName}</h3>
                    </div>
                    <div className="space-y-2 text-text-secondary">
                      <div className="flex justify-between gap-3">
                        <span>{isDayMode ? 'Selected day' : 'Week start score'}</span>
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
                        <span>{isDayMode ? 'Previous logged day' : 'Previous logged entry'}</span>
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
              )}
            />
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default CoachRatingsDashboard;
