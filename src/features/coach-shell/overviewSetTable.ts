import type { NumberOrRange, Prescription } from '@/types/program';
import type { SessionProgressStatus } from '@/features/coach-shell/sessionProgress';
import { sessionProgressStatus } from '@/features/coach-shell/sessionProgress';
import {
  assignLogsToSessions,
  exerciseMatchesLog,
  foldSharedTrainingSessions,
  groupUnassignedLogs,
  sessionActivityLabel,
  type DayTrainingLog,
  type LoggedSet,
} from '@/features/coach-shell/monitorLines';

const EMPTY = '—';

export interface SetTableRow {
  id: string;
  setNumber: string;
  reps: string;
  load: string;
  rpe: string;
  logged: boolean;
}

export interface SetTableExercise {
  id: string;
  name: string;
  rows: SetTableRow[];
}

export interface AthleteSessionView {
  id: string;
  name: string;
  detail?: string;
  activityLabel: string;
  status: SessionProgressStatus;
  latestLogMs: number;
  exercises: SetTableExercise[];
}

export interface OverviewPlacement {
  id: string;
  sessionId: string;
  sessionName: string;
  programName?: string;
  exercises: Array<{
    id: string;
    name: string;
    activityType?: string;
    prescription?: Prescription;
  }>;
}

export interface OverviewSportsLoad {
  id: string;
  name: string;
  rpe?: number;
  durationMinutes?: number;
  timestampMs?: number;
}

function numberLabel(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return EMPTY;
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

function rangeLabel(value: NumberOrRange | undefined): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object' && Number.isFinite(value.min) && Number.isFinite(value.max)) {
    return value.min === value.max ? String(value.min) : `${value.min}–${value.max}`;
  }
  return null;
}

function durationLabel(seconds: number | undefined): string {
  if (!seconds) return EMPTY;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

function distanceLabel(meters: number | undefined): string {
  if (!meters) return EMPTY;
  if (meters >= 1000) {
    const km = meters / 1000;
    const label = Number.isInteger(km) ? String(km) : km.toFixed(1);
    return `${label}km`;
  }
  return `${Math.round(meters)}m`;
}

export function cellsFromLoggedSet(set: LoggedSet): { reps: string; load: string; rpe: string } {
  const rpe = numberLabel(set.rpe);
  if (set.reps || set.weight) {
    return {
      reps: numberLabel(set.reps),
      load: set.weight ? numberLabel(set.weight) : (set.distance ? distanceLabel(set.distance) : EMPTY),
      rpe,
    };
  }
  return {
    reps: set.duration ? durationLabel(set.duration) : EMPTY,
    load: set.distance ? distanceLabel(set.distance) : EMPTY,
    rpe,
  };
}

function plannedCells(prescription: Prescription | undefined, activityType?: string): { reps: string; load: string; rpe: string } {
  if (!prescription) return { reps: EMPTY, load: EMPTY, rpe: EMPTY };
  const reps = rangeLabel(prescription.reps);
  const rpe = typeof prescription.rpe === 'number'
    ? String(prescription.rpe)
    : prescription.weight?.type === 'rpe'
      ? rangeLabel(prescription.weight.value)
      : null;
  let load: string | null = null;
  if (prescription.weight && prescription.weight.type !== 'rpe') {
    const value = rangeLabel(prescription.weight.value);
    if (value) load = prescription.weight.type === 'percentage' ? `${value}%` : value;
  }
  const duration = rangeLabel(prescription.duration);
  const distance = rangeLabel(prescription.distance);
  const durationUnit = activityType === 'stretching' || activityType === 'speedAgility' ? 's' : 'min';
  const distanceUnit = activityType === 'speedAgility' ? 'm' : 'km';
  if (reps || load) {
    return {
      reps: reps ?? EMPTY,
      load: load ?? (distance ? `${distance}${distanceUnit}` : EMPTY),
      rpe: rpe ?? EMPTY,
    };
  }
  return {
    reps: duration ? `${duration}${durationUnit}` : EMPTY,
    load: distance ? `${distance}${distanceUnit}` : EMPTY,
    rpe: rpe ?? EMPTY,
  };
}

function plannedCount(prescription?: Prescription): number {
  const sets = prescription?.sets;
  if (typeof sets === 'number' && sets > 0) return Math.max(1, Math.round(sets));
  if (sets && typeof sets === 'object' && sets.max > 0) return Math.max(1, Math.round(sets.max));
  return 1;
}

function latestMs(logs: DayTrainingLog[]): number {
  return logs.reduce((latest, log) => Math.max(latest, log.timestampMs ?? 0), 0);
}

export function exerciseSetTable(
  exercise: OverviewPlacement['exercises'][number],
  logs: DayTrainingLog[]
): SetTableExercise {
  const matched = logs
    .filter((log) => exerciseMatchesLog(exercise, log))
    .sort((a, b) => (a.timestampMs ?? 0) - (b.timestampMs ?? 0));
  const sets = matched.flatMap((log) => log.sets);
  const count = exercise.prescription
    ? Math.max(plannedCount(exercise.prescription), sets.length, 1)
    : Math.max(sets.length, 1);
  const planned = plannedCells(exercise.prescription, exercise.activityType);
  return {
    id: exercise.id,
    name: exercise.name,
    rows: Array.from({ length: count }, (_, index) => {
      const set = sets[index];
      const cells = set ? cellsFromLoggedSet(set) : planned;
      return {
        id: `${exercise.id}-${index}`,
        setNumber: String(index + 1),
        ...cells,
        logged: Boolean(set),
      };
    }),
  };
}

function loggedExerciseTable(log: DayTrainingLog): SetTableExercise {
  return exerciseSetTable({ id: log.id, name: log.name, activityType: log.activityType }, [log]);
}

function sessionFromLogs(
  id: string,
  name: string,
  detail: string | undefined,
  logs: DayTrainingLog[],
  exercises: SetTableExercise[],
  activitySources: Array<{ activityType?: string }>
): AthleteSessionView {
  return {
    id,
    name,
    detail,
    activityLabel: sessionActivityLabel(activitySources),
    status: sessionProgressStatus(logs),
    latestLogMs: latestMs(logs),
    exercises,
  };
}

export function buildAthleteSessions(
  placements: OverviewPlacement[],
  logs: DayTrainingLog[]
): AthleteSessionView[] {
  const assigned = assignLogsToSessions(
    placements.map((placement) => ({ id: placement.sessionId, exercises: placement.exercises })),
    logs
  );
  const folded = foldSharedTrainingSessions(
    placements.map((placement) => ({ id: placement.sessionId })),
    assigned.bySessionId,
    assigned.extras
  );
  const unassigned = groupUnassignedLogs(folded.extras);
  const sessions = placements.map((placement) => {
    const sessionLogs = folded.bySessionId[placement.sessionId] ?? [];
    const planned = placement.exercises.map((exercise) => exerciseSetTable(exercise, sessionLogs));
    const extras = sessionLogs
      .filter((log) => !placement.exercises.some((exercise) => exerciseMatchesLog(exercise, log)))
      .map(loggedExerciseTable);
    return sessionFromLogs(
      `assigned:${placement.id}`,
      placement.sessionName,
      placement.programName,
      sessionLogs,
      [...planned, ...extras],
      placement.exercises
    );
  });

  unassigned.sessions.forEach((group) => {
    sessions.push(sessionFromLogs(
      group.id,
      group.name,
      group.programName ?? 'Logged by the athlete',
      group.logs,
      group.logs.map(loggedExerciseTable),
      group.logs
    ));
  });

  if (unassigned.loose.length > 0) {
    sessions.push(sessionFromLogs(
      'logged-today',
      'Logged today',
      'Logged by the athlete',
      unassigned.loose,
      unassigned.loose.map(loggedExerciseTable),
      unassigned.loose
    ));
  }

  return sessions;
}

export function sportsLoadSession(session: OverviewSportsLoad): AthleteSessionView {
  const logged = Boolean(session.rpe || session.durationMinutes);
  return {
    id: `sports:${session.id}`,
    name: session.name,
    detail: 'Sports load',
    activityLabel: 'Sport',
    status: logged ? 'logging' : 'not-started',
    latestLogMs: session.timestampMs ?? 0,
    exercises: [{
      id: session.id,
      name: session.name,
      rows: [{
        id: `${session.id}-1`,
        setNumber: '1',
        reps: EMPTY,
        load: session.durationMinutes ? `${session.durationMinutes}m` : EMPTY,
        rpe: numberLabel(session.rpe),
        logged,
      }],
    }],
  };
}

export function chooseSessionId(
  sessions: Array<{ id: string; latestLogMs: number }>,
  preferredId?: string
): string | null {
  if (sessions.length === 0) return null;
  if (preferredId && sessions.some((session) => session.id === preferredId)) return preferredId;
  const logging = sessions.filter((session) => session.latestLogMs > 0);
  if (logging.length === 0) return sessions[0].id;
  return logging.reduce((best, session) => (session.latestLogMs >= best.latestLogMs ? session : best)).id;
}
