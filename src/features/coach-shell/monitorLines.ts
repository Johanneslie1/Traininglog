import type { NumberOrRange, Prescription, WeightPrescription } from '@/types/program';
import { toLocalDateString } from '@/utils/dateUtils';

export interface LoggedSet {
  reps?: number;
  weight?: number;
  rpe?: number;
  duration?: number;
  distance?: number;
}

export interface DayTrainingLog {
  id: string;
  name: string;
  activityType?: string;
  sourceProgramExerciseId?: string;
  sharedSessionExerciseId?: string;
  sourceProgramSessionId?: string;
  timestampMs?: number;
  sets: LoggedSet[];
}

export interface MonitorExercise {
  id: string;
  name: string;
  activityType?: string;
  prescription?: Prescription;
}

export interface MonitorLine {
  id: string;
  label: string;
  detail: string;
  logged: boolean;
}

const ACTIVITY_LABELS: Record<string, string> = {
  resistance: 'Resistance',
  endurance: 'Endurance',
  stretching: 'Stretching',
  speedAgility: 'Speed and agility',
  sport: 'Sport',
  other: 'Training',
};

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function formatNumberOrRange(value: NumberOrRange | undefined): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object' && Number.isFinite(value.min) && Number.isFinite(value.max)) {
    return value.min === value.max ? String(value.min) : `${value.min}–${value.max}`;
  }
  return null;
}

function formatWeight(weight: WeightPrescription): string | null {
  const value = formatNumberOrRange(weight.value);
  if (!value) return null;
  if (weight.type === 'percentage') return `${value}%`;
  if (weight.type === 'absolute') return `${value} kg`;
  return `RPE ${value}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    const label = Number.isInteger(km) ? String(km) : km.toFixed(1);
    return `${label} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatLoggedSet(set: LoggedSet): string {
  const parts: string[] = [];
  if (set.reps) parts.push(`${set.reps} reps`);
  if (set.weight) parts.push(`${set.weight} kg`);
  if (set.duration) parts.push(formatDuration(set.duration));
  if (set.distance) parts.push(formatDistance(set.distance));
  if (set.rpe) parts.push(`RPE ${set.rpe}`);
  return parts.join(' · ') || 'Saved';
}

export function plannedSummary(prescription: Prescription | undefined, activityType?: string): string {
  if (!prescription) return '';
  const parts: string[] = [];
  const sets = formatNumberOrRange(prescription.sets);
  const reps = formatNumberOrRange(prescription.reps);
  if (sets) parts.push(`${sets} sets`);
  if (reps) parts.push(`${reps} reps`);
  if (prescription.weight) {
    const weight = formatWeight(prescription.weight);
    if (weight) parts.push(weight);
  }
  if (typeof prescription.rpe === 'number') parts.push(`RPE ${prescription.rpe}`);
  const duration = formatNumberOrRange(prescription.duration);
  if (duration) {
    const unit = activityType === 'stretching' || activityType === 'speedAgility' ? 'sec' : 'min';
    parts.push(`${duration} ${unit}`);
  }
  const distance = formatNumberOrRange(prescription.distance);
  if (distance) {
    const unit = activityType === 'speedAgility' ? 'm' : 'km';
    parts.push(`${distance} ${unit}`);
  }
  return parts.join(' · ');
}

export function sessionActivityLabel(exercises: Array<{ activityType?: string }>): string {
  const types = [...new Set(exercises.map((exercise) => exercise.activityType).filter((type): type is string => Boolean(type)))];
  if (types.length === 1) return ACTIVITY_LABELS[types[0]] ?? 'Training';
  return 'Training';
}

function parseLogDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    const record = value as { toDate?: () => Date; seconds?: number };
    if (typeof record.toDate === 'function') {
      const parsed = record.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    if (typeof record.seconds === 'number') return new Date(record.seconds * 1000);
  }
  return null;
}

export function logMatchesDate(data: Record<string, unknown>, dateKey: string): boolean {
  if (data.sessionDateKey === dateKey || data.sharedSessionDateKey === dateKey) return true;
  if (typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return data.date === dateKey;
  }
  const parsed = parseLogDate(data.date) ?? parseLogDate(data.timestamp);
  return parsed ? toLocalDateString(parsed) === dateKey : false;
}

function readLoggedSet(value: unknown): LoggedSet | null {
  if (!value || typeof value !== 'object') return null;
  const set = value as Record<string, unknown>;
  return {
    reps: positiveNumber(set.reps),
    weight: positiveNumber(set.weight),
    rpe: positiveNumber(set.rpe),
    duration: positiveNumber(set.duration),
    distance: positiveNumber(set.distance),
  };
}

function readLogName(data: Record<string, unknown>): string {
  for (const key of ['exerciseName', 'activityName', 'name']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function setHasWork(set: LoggedSet): boolean {
  return Boolean(set.reps || set.weight || set.rpe || set.duration || set.distance);
}

export function toDayTrainingLog(id: string, data: Record<string, unknown>): DayTrainingLog | null {
  const name = readLogName(data);
  if (!name) return null;
  const timestamp = parseLogDate(data.timestamp) ?? parseLogDate(data.createdAt);
  return {
    id,
    name,
    activityType: typeof data.activityType === 'string' ? data.activityType : undefined,
    sourceProgramExerciseId: typeof data.sourceProgramExerciseId === 'string' ? data.sourceProgramExerciseId : undefined,
    sharedSessionExerciseId: typeof data.sharedSessionExerciseId === 'string' ? data.sharedSessionExerciseId : undefined,
    sourceProgramSessionId: typeof data.sourceProgramSessionId === 'string' ? data.sourceProgramSessionId : undefined,
    timestampMs: timestamp ? timestamp.getTime() : undefined,
    sets: Array.isArray(data.sets) ? data.sets.flatMap((set) => {
      const logged = readLoggedSet(set);
      return logged && setHasWork(logged) ? [logged] : [];
    }) : [],
  };
}

export function exerciseMatchesLog(
  exercise: { id: string; name: string },
  log: { name: string; sourceProgramExerciseId?: string; sharedSessionExerciseId?: string }
): boolean {
  if (log.sourceProgramExerciseId) return log.sourceProgramExerciseId === exercise.id;
  if (log.sharedSessionExerciseId) return log.sharedSessionExerciseId === exercise.id;
  const left = exercise.name.trim().toLowerCase();
  const right = log.name.trim().toLowerCase();
  return left.length > 0 && left === right;
}

function plannedSetCount(prescription?: Prescription): number {
  const sets = prescription?.sets;
  if (typeof sets === 'number' && sets > 0) return Math.max(1, Math.round(sets));
  if (sets && typeof sets === 'object' && sets.max > 0) return Math.max(1, Math.round(sets.max));
  return 1;
}

export function buildMonitorLines(exercise: MonitorExercise, logs: DayTrainingLog[]): MonitorLine[] {
  const matched = logs
    .filter((log) => exerciseMatchesLog(exercise, log))
    .sort((a, b) => (a.timestampMs ?? 0) - (b.timestampMs ?? 0));
  const sets = matched.flatMap((log) => log.sets).filter(setHasWork);
  const count = Math.max(plannedSetCount(exercise.prescription), sets.length, 1);
  return Array.from({ length: count }, (_, index) => {
    const set = sets[index];
    return {
      id: `${exercise.id}-${index}`,
      label: `${exercise.name} · Set ${index + 1}`,
      detail: set ? formatLoggedSet(set) : 'Planned',
      logged: Boolean(set),
    };
  });
}

export function unmatchedSessionLogs(exercises: MonitorExercise[], logs: DayTrainingLog[]): DayTrainingLog[] {
  return logs.filter((log) => !exercises.some((exercise) => exerciseMatchesLog(exercise, log)));
}

export function linesForLoggedExercise(log: DayTrainingLog): MonitorLine[] {
  const sets = log.sets.filter(setHasWork);
  if (sets.length === 0) {
    return [{ id: log.id, label: log.name, detail: 'Planned', logged: false }];
  }
  return sets.map((set, index) => ({
    id: `${log.id}-${index}`,
    label: `${log.name} · Set ${index + 1}`,
    detail: formatLoggedSet(set),
    logged: true,
  }));
}

export function assignLogsToSessions<T extends { id: string; exercises: Array<{ id: string; name: string }> }>(
  sessions: T[],
  logs: DayTrainingLog[]
): { bySessionId: Record<string, DayTrainingLog[]>; extras: DayTrainingLog[] } {
  const claimed = new Set<string>();
  const bySessionId: Record<string, DayTrainingLog[]> = {};
  sessions.forEach((session) => {
    const matched = logs.filter((log) => {
      if (claimed.has(log.id)) return false;
      if (log.sourceProgramSessionId) return log.sourceProgramSessionId === session.id;
      return session.exercises.some((exercise) => exerciseMatchesLog(exercise, log));
    });
    matched.forEach((log) => claimed.add(log.id));
    bySessionId[session.id] = matched;
  });
  return {
    bySessionId,
    extras: logs.filter((log) => !claimed.has(log.id)),
  };
}
