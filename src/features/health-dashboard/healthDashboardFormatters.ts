import type {
  CoachRatingStatus,
  CoachRatingsRow,
  CoachRatingsViewMode,
  CoachWellnessTrend,
} from '@/types/coachRatings';
import { WELLNESS_METRICS, type WellnessMetricKey } from '@/types/wellness';
import { dateKeyToLocalDate } from '@/utils/dateUtils';

export const viewModeLabels: Record<CoachRatingsViewMode, string> = {
  day: 'Day',
  week: 'Week',
};

export const statusLabels: Record<CoachRatingStatus, string> = {
  good: 'Good',
  watch: 'Watch',
  outlier: 'Risk',
  missing: 'Missing',
};

export const statusStyles: Record<CoachRatingStatus, string> = {
  good: 'bg-success-bg text-success-text border-success-border',
  watch: 'bg-warning-bg text-warning-text border-warning-border',
  outlier: 'bg-error-bg text-error-text border-error-border',
  missing: 'bg-bg-tertiary text-text-tertiary border-border',
};

export const statusPriority: Record<CoachRatingStatus, number> = {
  outlier: 0,
  watch: 1,
  missing: 2,
  good: 3,
};

const wellnessHelpByKey: Record<WellnessMetricKey, string> = {
  sleepQuality: 'Athlete-reported sleep quality from 1 to 5. Higher is better.',
  readiness: 'Athlete-reported readiness to train from 1 to 5. Higher is better.',
  fatigue: 'Athlete-reported fatigue from 1 to 5. Lower is better.',
  stress: 'Athlete-reported stress from 1 to 5. Lower is better.',
  muscleSoreness: 'Athlete-reported muscle soreness from 1 to 5. Lower is better.',
  mood: 'Athlete-reported mood from 1 to 5. Higher is better.',
};

export const wellnessColumns = WELLNESS_METRICS.map((metric) => ({
  key: metric.key,
  label: metric.label,
  help: wellnessHelpByKey[metric.key],
}));

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatLoad(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString();
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

export function formatCompactDate(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return dateKey;

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatWeekRange(startDateKey: string, endDateKey: string): string {
  const startDate = dateKeyToLocalDate(startDateKey);
  const endDate = dateKeyToLocalDate(endDateKey);
  if (!startDate || !endDate) return `${startDateKey} to ${endDateKey}`;

  const start = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function getMetricStatus(row: CoachRatingsRow, key: WellnessMetricKey): CoachRatingStatus {
  const metric = row.wellnessSnapshot.metrics.find((item) => item.key === key);
  return metric?.status || 'missing';
}

export function getMetricClass(status: CoachRatingStatus, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (status === 'outlier') return 'text-error-text font-semibold';
  if (status === 'watch') return 'text-warning-text font-semibold';
  if (status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}

export function getTrendClass(trend: CoachWellnessTrend, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (trend.severity === 'outlier') return 'text-error-text font-semibold';
  if (trend.severity === 'watch') return 'text-warning-text font-semibold';
  if (trend.category === 'better_than_normal') return 'text-success-text font-semibold';
  if (trend.severity === 'missing') return 'text-text-tertiary';
  return 'text-text-primary';
}

export function formatTrendChange(change: number | null): string {
  if (change === null) return 'No previous log';
  if (change > 0) return `↑ ${formatNumber(Math.abs(change))}`;
  if (change < 0) return `↓ ${formatNumber(Math.abs(change))}`;
  return '→ 0.0';
}

export function getSrpeClass(row: CoachRatingsRow, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (!row.dailySrpe.submitted) return 'text-text-tertiary';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 9) return 'text-error-text font-semibold';
  if (row.dailySrpe.rpe !== null && row.dailySrpe.rpe >= 8) return 'text-warning-text font-semibold';
  return 'text-text-primary';
}

export function getAcwrClass(row: CoachRatingsRow, warningsEnabled: boolean): string {
  if (!warningsEnabled) return 'text-text-primary';
  if (row.acwr.status === 'outlier') return 'text-error-text font-semibold';
  if (row.acwr.status === 'watch') return 'text-warning-text font-semibold';
  if (row.acwr.status === 'missing') return 'text-text-tertiary';
  return 'text-success-text font-semibold';
}
