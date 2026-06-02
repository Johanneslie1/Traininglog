export type DateInput = Date | string | number | { toDate?: () => Date } | null | undefined;

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const wholeNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export function formatEmptyValue(fallback = '-'): string {
  return fallback;
}

function coerceDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object') return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumberCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

export function formatDisplayDateTime(value: DateInput): string {
  const date = coerceDate(value);
  if (!date) return 'Unknown date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDisplayDate(value: DateInput): string {
  const date = coerceDate(value);
  if (!date) return 'Unknown date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function formatRelativeDate(value: DateInput): string {
  const date = coerceDate(value);
  if (!date) return 'Unknown date';

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}

export function formatRelativeWithAbsolute(value: DateInput): string {
  const relative = formatRelativeDate(value);
  const absolute = formatDisplayDateTime(value);
  return relative === absolute || absolute === 'Unknown date' ? relative : `${relative} (${absolute})`;
}

export function getDateSectionLabel(value: DateInput): 'Today' | 'This Week' | 'Recent' | 'Older' {
  const date = coerceDate(value);
  if (!date) return 'Recent';

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays > 0 && diffDays < 7) return 'This Week';
  if (diffDays >= 7 && diffDays < 30) return 'Recent';
  return 'Older';
}

export function formatDuration(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0 min';
  if (value < 60) return `${numberFormatter.format(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatDurationSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0s';
  if (value < 60) return `${wholeNumberFormatter.format(value)}s`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatRestTime(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return formatEmptyValue();
  return formatDurationSeconds(value);
}

export function formatWeight(value: number | null | undefined, unit = 'kg'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `0 ${unit}`;
  return `${numberFormatter.format(value)} ${unit}`;
}

export function formatReps(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0 reps';
  return `${Math.round(value)} rep${Math.round(value) === 1 ? '' : 's'}`;
}

export function formatRpe(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'RPE -';
  return `RPE ${numberFormatter.format(value)}`;
}

export function formatDistance(value: number | null | undefined, unit = 'km'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `0 ${unit}`;
  return `${numberFormatter.format(value)} ${unit}`;
}

export function formatPace(value: number | string | null | undefined, unit = '/km'): string {
  if (value === null || value === undefined || value === '') return formatEmptyValue();
  if (typeof value === 'string') return value.includes('/') ? value : `${value}${unit}`;
  if (Number.isNaN(value) || value <= 0) return formatEmptyValue();

  const minutes = Math.floor(value);
  const seconds = Math.round((value - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}${unit}`;
}

export function formatHeartRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '- bpm';
  return `${Math.round(value)} bpm`;
}

export function formatTrainingVolume(value: number | null | undefined, unit = 'kg'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `0 ${unit}`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

export function formatSportsLoad(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return formatEmptyValue();
  return `${wholeNumberFormatter.format(value)} load`;
}

export function formatWellnessValue(value: number | null | undefined, max = 5): string {
  if (value === null || value === undefined || Number.isNaN(value)) return formatEmptyValue();
  return `${numberFormatter.format(value)}/${max}`;
}

export function formatReadinessValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return formatEmptyValue();
  return typeof value === 'number' ? `${wholeNumberFormatter.format(value)}%` : value;
}

export function formatPrescriptionSummary(value: string | null | undefined): string {
  if (!value?.trim()) return 'No prescription';
  return value.trim();
}

export interface DisplaySet {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
  heartRate?: number;
  avgHeartRate?: number;
  intensity?: number;
  pace?: string | number;
  restTime?: number;
}

export function formatSetSummary(set: DisplaySet): string {
  const items: string[] = [];

  if (set.weight !== undefined && set.reps !== undefined) {
    items.push(`${formatWeight(set.weight)} x ${Math.round(set.reps)}`);
  } else if (set.reps !== undefined) {
    items.push(formatReps(set.reps));
  }

  if (set.duration !== undefined) items.push(formatDuration(set.duration));
  if (set.distance !== undefined) items.push(formatDistance(set.distance));
  if (set.rpe !== undefined) items.push(formatRpe(set.rpe));
  if (set.restTime !== undefined) items.push(`Rest ${formatRestTime(set.restTime)}`);

  const heartRate = set.heartRate ?? set.avgHeartRate;
  if (heartRate !== undefined) items.push(formatHeartRate(heartRate));
  if (set.intensity !== undefined) items.push(`Intensity ${numberFormatter.format(set.intensity)}/10`);
  if (set.pace) items.push(formatPace(set.pace));

  return items.join(' • ');
}
