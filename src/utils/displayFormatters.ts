type DateInput = Date | string | number | null | undefined;

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function formatNumberCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

export function formatDisplayDateTime(value: DateInput): string {
  if (!value) return 'Unknown date';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeDate(value: DateInput): string {
  if (!value) return 'Unknown date';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

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

export function getDateSectionLabel(value: DateInput): 'Today' | 'This Week' | 'Recent' {
  if (!value) return 'Recent';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays > 0 && diffDays < 7) return 'This Week';
  return 'Recent';
}

export function formatDuration(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0 min';
  if (value < 60) return `${numberFormatter.format(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
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

export function formatHeartRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '- bpm';
  return `${Math.round(value)} bpm`;
}

export function formatTrainingVolume(value: number | null | undefined, unit = 'kg'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `0 ${unit}`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k ${unit}`;
  return `${Math.round(value)} ${unit}`;
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
  pace?: string;
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

  const heartRate = set.heartRate ?? set.avgHeartRate;
  if (heartRate !== undefined) items.push(formatHeartRate(heartRate));
  if (set.intensity !== undefined) items.push(`Intensity ${numberFormatter.format(set.intensity)}/10`);
  if (set.pace) items.push(`${set.pace}/km`);

  return items.join(' • ');
}
