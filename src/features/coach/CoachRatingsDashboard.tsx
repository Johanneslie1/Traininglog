import React, { useEffect, useMemo, useState } from 'react';
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
  missingSrpe: 'Athletes without an sRPE entry on the selected date.',
  srpeLoad: 'Total selected-day training load for the team. For each athlete: sRPE x duration minutes.',
  weeklyLoad: 'Total team sRPE load across the selected week.',
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

function formatNumber(value: number | null): string {
  if (value === null) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatLoad(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString();
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
  const metric = row.dailyWellness.metrics.find((item) => item.key === key);
  return metric?.status || 'missing';
}

function getMetricClass(status: CoachRatingStatus, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (status === 'outlier') return 'text-error-text font-semibold';
  if (status === 'watch') return 'text-warning-text font-semibold';
  if (status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}

function getSrpeClass(row: CoachRatingsRow, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (!row.dailySrpe.submitted) return 'text-text-tertiary';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 9) return 'text-error-text font-semibold';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 8) return 'text-warning-text font-semibold';
  return 'text-text-primary';
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

const CoachRatingsDashboard: React.FC<CoachRatingsDashboardProps> = ({ teamId, teamName }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const [dashboard, setDashboard] = useState<CoachRatingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningsEnabled, setWarningsEnabled] = useState(true);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const weekRange = useMemo(() => {
    const date = dateKeyToLocalDate(selectedDate) || new Date();
    return getLocalWeekDateRange(date);
  }, [selectedDate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getCoachRatingsDashboard({
        selectedDate,
        selectedTeamId: teamId,
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
  }, [selectedDate, teamId]);

  const moveWeek = (days: number) => {
    const current = dateKeyToLocalDate(selectedDate);
    if (!current) return;
    setSelectedDate(toLocalDateString(addDays(current, days)));
  };

  const summary = dashboard?.summary;
  const selectedDateLabel = formatCompactDate(selectedDate);
  const weekRangeLabel = formatWeekRange(weekRange.startDateKey, weekRange.endDateKey);
  const attentionParts = [
    summary?.outlierCount ? `${summary.outlierCount} risk ${summary.outlierCount === 1 ? 'flag' : 'flags'}` : null,
    summary?.missingDailyWellnessCount ? `${summary.missingDailyWellnessCount} missing wellness` : null,
    summary?.missingDailySrpeCount ? `${summary.missingDailySrpeCount} missing sRPE` : null,
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
              {teamName}: daily wellness and sRPE with weekly team context.
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
                <label className="group relative flex h-11 min-w-44 items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 text-sm text-text-primary transition-colors hover:border-accent-primary">
                  <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
                  <span className="font-medium">{selectedDateLabel}</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Daily date"
                  />
                </label>

                <div className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-bg-secondary">
                  <button
                    type="button"
                    onClick={() => moveWeek(-7)}
                    className="flex h-full w-10 items-center justify-center text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
                    aria-label="Previous week"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <div className="border-x border-border px-4 text-center">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">Week</div>
                    <div className="text-sm font-semibold leading-tight text-text-primary">{weekRangeLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveWeek(7)}
                    className="flex h-full w-10 items-center justify-center text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
                    aria-label="Next week"
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
                label="Daily wellness"
                value={formatNumber(summary?.dailyWellnessAverage ?? null)}
                help={summaryHelp.wellnessAvg}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-weekly-wellness"
                label="Weekly wellness avg"
                value={formatNumber(summary?.weeklyWellnessAverage ?? null)}
                help={summaryHelp.weeklyWellness}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-missing-wellness"
                label="Missing wellness"
                value={summary?.missingDailyWellnessCount ?? 0}
                help={summaryHelp.missingWellness}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-missing-srpe"
                label="Missing sRPE"
                value={summary?.missingDailySrpeCount ?? 0}
                help={summaryHelp.missingSrpe}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-srpe-load"
                label="sRPE load"
                value={formatLoad(summary?.dailySrpeTotalLoad ?? 0)}
                help={summaryHelp.srpeLoad}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
              <SummaryItem
                id="summary-weekly-load"
                label="Weekly load"
                value={formatLoad(summary?.weeklySrpeTotalLoad ?? 0)}
                help={summaryHelp.weeklyLoad}
                activeHelp={activeHelp}
                setActiveHelp={setActiveHelp}
              />
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
                Add athletes to this team to see wellness and sRPE ratings.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full text-sm">
                  <thead>
                    <tr className="bg-bg-primary text-xs uppercase tracking-wide text-text-tertiary">
                      <th className="px-3 py-2 text-left border-r border-border" rowSpan={2}>Athlete</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={2}>Health</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={7}>Well-being</th>
                      <th className="px-3 py-2 text-center border-r border-border" colSpan={5}>Training</th>
                      <th className="px-3 py-2 text-left" rowSpan={2}>Warnings</th>
                    </tr>
                    <tr className="bg-bg-tertiary text-xs text-text-tertiary">
                      <th className="px-3 py-2 text-center">Notes</th>
                      <th className="px-3 py-2 text-center border-r border-border">
                        Total
                        <HelpButton
                          id="table-total"
                          text={summaryHelp.wellnessAvg}
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
                      <th className="px-3 py-2 text-center border-r border-border">Week Avg</th>
                      <th className="px-3 py-2 text-center">
                        sRPE
                        <HelpButton id="table-srpe" text="Session RPE from 1 to 10 for the selected day. Higher means the session felt harder." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        Min
                        <HelpButton id="table-min" text="Duration in minutes for the selected-day sRPE entry." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        Load
                        <HelpButton id="table-load" text={summaryHelp.srpeLoad} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center">
                        Week RPE
                        <HelpButton id="table-week-rpe" text="Average sRPE across submitted days in the selected week. Missing days are not counted." activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                      <th className="px-3 py-2 text-center border-r border-border">
                        Week Load
                        <HelpButton id="table-week-load" text={summaryHelp.weeklyLoad} activeHelp={activeHelp} setActiveHelp={setActiveHelp} />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboard.rows.map((row) => (
                      <tr key={row.athleteId} className="hover:bg-bg-tertiary/60 transition-colors">
                        <td className="px-3 py-3 border-r border-border">
                          <button
                            type="button"
                            onClick={() => navigate(`/coach/athlete/${row.athleteId}`)}
                            className="flex items-center gap-3 text-left group"
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
                            className={row.dailyWellness.hasNotes ? 'text-success-text font-semibold' : 'text-text-tertiary'}
                            title={row.dailyWellness.notes || undefined}
                          >
                            {row.dailyWellness.hasNotes ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-center border-r border-border ${getMetricClass(row.status, warningsEnabled)}`}>
                          {formatNumber(row.dailyWellness.score)}
                        </td>
                        {wellnessColumns.map((column) => {
                          const value = row.dailyWellness.metricValues[column.key];
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
                        <td className="px-3 py-3 text-center border-r border-border text-text-primary">
                          <div>{formatNumber(row.weeklyWellness.average)}</div>
                          <div className="text-[11px] text-text-tertiary">{row.weeklyWellness.submittedDays}/7</div>
                        </td>
                        <td className={`px-3 py-3 text-center ${getSrpeClass(row, warningsEnabled)}`}>
                          {formatNumber(row.dailySrpe.rpe)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {row.dailySrpe.submitted ? row.dailySrpe.durationMinutes : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          {formatLoad(row.dailySrpe.sessionLoad)}
                        </td>
                        <td className="px-3 py-3 text-center text-text-primary">
                          <div>{formatNumber(row.weeklySrpe.averageRpe)}</div>
                          <div className="text-[11px] text-text-tertiary">{row.weeklySrpe.submittedDays}/7</div>
                        </td>
                        <td className="px-3 py-3 text-center border-r border-border text-text-primary">
                          {formatLoad(row.weeklySrpe.totalLoad)}
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
