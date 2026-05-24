import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationIcon,
  RefreshIcon,
} from '@heroicons/react/outline';
import { getAthleteStatsDashboard } from '@/services/athleteStatsService';
import { useCanUseAthleteFeatures } from '@/hooks/useUserRole';
import { addDays, dateKeyToLocalDate, getLocalWeekDateRange, toLocalDateString } from '@/utils/dateUtils';
import { WELLNESS_METRICS, WellnessMetricKey } from '@/types/wellness';
import {
  CoachRatingStatus,
  CoachRatingsDashboardData,
  CoachRatingsRow,
  CoachRatingsViewMode,
} from '@/types/coachRatings';

const viewModeLabels: Record<CoachRatingsViewMode, string> = {
  day: 'Day',
  week: 'Week',
};

const statusLabels: Record<CoachRatingStatus, string> = {
  good: 'Good',
  watch: 'Watch',
  outlier: 'Risk',
  missing: 'Missing',
};

const statusStyles: Record<CoachRatingStatus, string> = {
  good: 'bg-success-bg text-success-text border-success-border',
  watch: 'bg-warning-bg text-warning-text border-warning-border',
  outlier: 'bg-error-bg text-error-text border-error-border',
  missing: 'bg-bg-tertiary text-text-tertiary border-border',
};

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatLoad(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString();
}

function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

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

function metricStatus(row: CoachRatingsRow, key: WellnessMetricKey): CoachRatingStatus {
  return row.wellnessSnapshot.metrics.find((metric) => metric.key === key)?.status || 'missing';
}

function metricClass(status: CoachRatingStatus): string {
  if (status === 'outlier') return 'text-error-text font-semibold';
  if (status === 'watch') return 'text-warning-text font-semibold';
  if (status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}

const AthleteStatsPage: React.FC = () => {
  const canUseAthleteFeatures = useCanUseAthleteFeatures();
  const todayDate = new Date();
  const initialWeek = getLocalWeekDateRange(todayDate);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(todayDate));
  const [periodStartDate, setPeriodStartDate] = useState(() => initialWeek.startDateKey);
  const [periodEndDate, setPeriodEndDate] = useState(() => initialWeek.endDateKey);
  const [viewMode, setViewMode] = useState<CoachRatingsViewMode>('day');
  const [dashboard, setDashboard] = useState<CoachRatingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setLoadError(null);
      const data = await getAthleteStatsDashboard({
        selectedDate,
        viewMode,
        periodStartDate,
        periodEndDate,
      });

      if (requestId !== requestIdRef.current) return;
      setDashboard(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error loading athlete stats dashboard:', error);
      setLoadError('Could not load your stats. Check your connection and try again.');
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [periodEndDate, periodStartDate, selectedDate, viewMode]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (!canUseAthleteFeatures) {
    return <Navigate to="/" replace />;
  }

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
    setSelectedDate(nextStart);
    setPeriodStartDate(nextStart);
    setPeriodEndDate(nextEnd);
  };

  const isDayMode = viewMode === 'day';
  const row = dashboard?.rows[0] ?? null;
  const summary = dashboard?.summary;
  const selectedDateLabel = formatCompactDate(selectedDate);
  const periodRangeLabel = formatWeekRange(periodStartDate, periodEndDate);
  const wellnessLabel = isDayMode ? 'Wellness score' : 'Weekly wellness avg';
  const srpeLabel = isDayMode ? 'sRPE load' : 'Weekly sRPE load';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-secondary p-4">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">Athlete</p>
          <h1 className="text-2xl font-bold text-text-primary">Stats</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your personal health, well-being, and training load overview.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-bg-secondary p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-bg-primary p-1">
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
                <label className="group relative flex h-11 min-w-44 items-center gap-2 rounded-full border border-border bg-bg-primary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
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
                <label className="group relative flex h-11 min-w-56 items-center gap-2 rounded-full border border-border bg-bg-primary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
                  <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
                  <span className="font-medium">Week of {periodRangeLabel}</span>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(event) => selectWeekStart(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Select week"
                  />
                </label>
              )}

              <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-bg-primary">
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
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-accent-hover"
              aria-label="Refresh stats"
            >
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {loadError && !dashboard ? (
          <section className="rounded-xl border border-error-border bg-error-bg p-4 text-error-text">
            <p className="font-medium">Stats unavailable</p>
            <p className="mt-1 text-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-3 inline-flex rounded-full border border-error-border px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              Try again
            </button>
          </section>
        ) : loading && !dashboard ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary-600"></div>
            <span className="ml-3 text-text-tertiary">Loading your stats...</span>
          </div>
        ) : (
          <section className="space-y-4">
            {loadError ? (
              <div className="rounded-lg border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
                {loadError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">{wellnessLabel}</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">
                  {formatNumber(row?.wellnessSnapshot.score)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">Reported wellness days</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">
                  {row?.wellnessSnapshot.submittedDays ?? 0}
                  <span className="text-sm font-medium text-text-tertiary">/{row?.wellnessSnapshot.totalDays ?? 1}</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">{srpeLabel}</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">
                  {formatLoad(isDayMode ? row?.dailySrpe.sessionLoad : row?.weeklySrpe.totalLoad)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">Status</p>
                <p className="mt-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold ${statusStyles[row?.status || 'missing']}`}>
                    {statusLabels[row?.status || 'missing']}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs leading-relaxed text-info-text">
              This view reads only your own wellness and sRPE logs. Coach Hub remains the place for team and athlete-wide stats.
            </div>

            {!dashboard || !row ? (
              <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
                <ExclamationIcon className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
                <p className="font-medium text-text-primary">No stats found</p>
                <p className="mt-1 text-sm text-text-tertiary">
                  Log wellness or sRPE entries to populate this overview.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-bg-secondary">
                <div className="overflow-auto">
                  <table className="min-w-[1040px] w-full text-sm">
                    <thead>
                      <tr className="bg-bg-primary text-xs uppercase tracking-wide text-text-tertiary">
                        <th className="px-3 py-2 text-left" rowSpan={2}>Period</th>
                        <th className="border-r border-border px-3 py-2 text-center" colSpan={3}>Health</th>
                        <th className="border-r border-border px-3 py-2 text-center" colSpan={6}>Well-being</th>
                        <th className="px-3 py-2 text-center" colSpan={5}>Training Load</th>
                      </tr>
                      <tr className="bg-bg-tertiary text-xs text-text-tertiary">
                        <th className="px-3 py-2 text-center">Notes</th>
                        <th className="px-3 py-2 text-center">Score</th>
                        <th className="border-r border-border px-3 py-2 text-center">{isDayMode ? 'Trend' : 'Reported'}</th>
                        {WELLNESS_METRICS.map((metric) => (
                          <th key={metric.key} className="px-3 py-2 text-center">{metric.label}</th>
                        ))}
                        <th className="border-l border-border px-3 py-2 text-center">RPE</th>
                        <th className="px-3 py-2 text-center">Duration</th>
                        <th className="px-3 py-2 text-center">Load</th>
                        <th className="px-3 py-2 text-center">Week load</th>
                        <th className="px-3 py-2 text-center">ACWR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-3 py-3 font-medium text-text-primary">
                          {isDayMode ? selectedDateLabel : periodRangeLabel}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.wellnessSnapshot.hasNotes ? (
                            <span title={row.wellnessSnapshot.notes} className="text-accent-primary">Yes</span>
                          ) : (
                            <span className="text-text-tertiary">No</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-text-primary">
                          {formatNumber(row.wellnessSnapshot.score)}
                        </td>
                        <td className="border-r border-border px-3 py-3 text-center text-text-secondary">
                          {isDayMode
                            ? row.wellnessTrend.label
                            : `${row.wellnessSnapshot.submittedDays}/${row.wellnessSnapshot.totalDays}`}
                        </td>
                        {WELLNESS_METRICS.map((metric) => {
                          const value = row.wellnessSnapshot.metricValues[metric.key] ?? null;
                          const status = metricStatus(row, metric.key);
                          return (
                            <td key={metric.key} className={`px-3 py-3 text-center ${metricClass(status)}`}>
                              {formatNumber(value)}
                            </td>
                          );
                        })}
                        <td className="border-l border-border px-3 py-3 text-center text-text-primary">
                          {formatNumber(isDayMode ? row.dailySrpe.rpe : row.weeklySrpe.averageRpe)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {isDayMode ? `${row.dailySrpe.durationMinutes} min` : `${row.weeklySrpe.submittedDays} days`}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-text-primary">
                          {formatLoad(isDayMode ? row.dailySrpe.sessionLoad : row.weeklySrpe.totalLoad)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {formatLoad(row.weeklySrpe.totalLoad)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          <div className="font-semibold">{formatRatio(row.acwr.ratio)}</div>
                          <div className="text-xs text-text-tertiary">{row.acwr.label}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {summary ? (
              <p className="text-xs text-text-tertiary">
                Weekly wellness average: {formatNumber(summary.weeklyWellnessAverage)} · Weekly sRPE load: {formatLoad(summary.weeklySrpeTotalLoad)}
              </p>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
};

export default AthleteStatsPage;
