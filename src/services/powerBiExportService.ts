/**
 * Power BI multi-athlete export service.
 *
 * Builds on the existing exportData() / coachService pipeline.
 * Does NOT rewrite existing logic — only adds a transformation + ZIP layer.
 *
 * Output files inside training_export_YYYY-MM-DD.zip:
 *   fact_gym_sets.csv   – resistance sets (activityType === 'resistance')
 *   fact_activity.csv   – all other activity rows
 *   dim_exercise.csv    – unique exercise dimension
 *   dim_athlete.csv     – athlete dimension
 *   export_meta.json    – export metadata
 *
 * // NOTE: fact_wellness.csv is intentionally omitted — the wellness/sleep module
 * // does not exist yet. Add it here once that feature is implemented.
 */

import JSZip from 'jszip';
import { getAuth } from 'firebase/auth';
import { exportData } from '@/services/exportService';
import { verifyCoachAthleteRelationship } from '@/services/coachService';
import { getCoachTeams, getTeamMembers, syncCoachAthleteAccess } from '@/services/teamService';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import type {
  DimAthleteRow,
  DimExerciseRow,
  ExportMeta,
  FactActivityRow,
  FactGymSetRow,
  FactSessionRow,
  FactWellnessRow,
  PowerBiExportOptions,
} from '@/types/powerBiExport';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { toLocalDateString, toLocalTimestamp } from '@/utils/dateUtils';
import { rowsToCSVForPowerBi } from '@/utils/powerBiCsv';
import { normalizeSessionType } from '@/types/sessionType';
import {
  getExerciseFactor,
  inferExerciseFactorCategory,
  type ExerciseFactorCategory,
} from '@/data/exerciseFactors';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface PowerBiExportCurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  role: 'athlete' | 'coach';
}

export interface PowerBiExportResult {
  gymSetCount: number;
  activityCount: number;
  athleteCount: number;
}

export interface PowerBiFile {
  name: string;
  content: string;
}

export interface PowerBiFilesResult extends PowerBiExportResult {
  files: PowerBiFile[];
  sessionCount: number;
}

// Re-export so the UI can use without another import
export type { PowerBiExportOptions };

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

/** Returns YYYY-MM-DD string from any date-like value, in LOCAL timezone. */
export const toIsoDate = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val as string | number | Date);
  if (isNaN(d.getTime())) return '';
  return toLocalDateString(d);
};

/** Returns YYYY-MM-DDTHH:mm:ss string (no milliseconds, no Z), in LOCAL timezone. */
export const toIsoTimestamp = (val: unknown): string => {
  if (!val) return '';
  const d = new Date(val as string | number | Date);
  if (isNaN(d.getTime())) return '';
  return toLocalTimestamp(d);
};

/**
 * Returns numeric value if it is a finite positive number, otherwise ''.
 * Power BI compatibility: empty/missing numeric values must be empty string, not 0.
 */
const toEmpty = (val: unknown): number | '' => {
  if (typeof val !== 'number' || !isFinite(val) || val <= 0) return '';
  return val;
};

const asBool = (val: unknown): boolean => Boolean(val);

/** ISO week key (YYYY-Www) from a YYYY-MM-DD date string. */
const dateStringToWeekKey = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return '';
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    (((tmp.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7
  );
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

/** Lowercase snake_case slug used as exercise_id. */
const toSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

// ---------------------------------------------------------------------------
// Row builders  (camelCase set → snake_case Power BI row)
// ---------------------------------------------------------------------------

const buildGymSetRow = (
  athleteId: string,
  athleteName: string,
  s: Record<string, unknown>
): FactGymSetRow => {
  const reps = typeof s.reps === 'number' && s.reps > 0 ? s.reps : null;
  const weight = typeof s.weight === 'number' && s.weight > 0 ? s.weight : null;
  const rawRpe = typeof s.rpe === 'number' && isFinite(s.rpe) ? s.rpe : null;
  const effectiveRpe = rawRpe !== null && rawRpe > 0 ? rawRpe : 7;
  const exerciseName = String(s.exerciseName ?? '');
  const overrideCategory =
    typeof s.exerciseFactorCategory === 'string'
      ? (s.exerciseFactorCategory as ExerciseFactorCategory)
      : undefined;
  const sourceCategory = typeof s.category === 'string' ? s.category : undefined;
  const sourceType = typeof s.exerciseType === 'string' ? s.exerciseType : undefined;
  const inferredFactorCategory = inferExerciseFactorCategory(
    exerciseName,
    sourceCategory,
    sourceType
  );
  const factorCategory = overrideCategory ?? inferredFactorCategory;
  const factor = getExerciseFactor(exerciseName, factorCategory, sourceCategory, sourceType);
  const normalisedLoad =
    reps !== null && weight !== null
      ? Math.round(reps * weight * effectiveRpe * factor * 10) / 10
      : '';

  return {
    athlete_id: athleteId,
    athlete_name: athleteName,
    session_id: String(s.sessionId ?? ''),
    session_type: normalizeSessionType(s.sessionType),
    exercise_log_id: String(s.exerciseLogId ?? ''),
    exercise_id: toSlug(exerciseName),
    exercise_name: exerciseName,
    logged_date: toIsoDate(s.loggedDate ?? s.exerciseDate),
    exercise_order: typeof s.exerciseNumber === 'number' ? s.exerciseNumber : 0,
    set_number: typeof s.setNumber === 'number' ? s.setNumber : 0,
    reps: reps ?? '',
    weight: weight ?? '',
    rpe: toEmpty(s.rpe),
    rest_sec: toEmpty(s.restTimeSec ?? s.restTime),
    is_warmup: asBool(s.isWarmup),
    tonnage: reps !== null && weight !== null ? reps * weight : '',
    exercise_factor_category: factorCategory,
    exercise_factor: factor,
    normalised_load: normalisedLoad,
    set_volume: toEmpty(s.setVolume),
    notes: String(s.notes ?? s.comment ?? ''),
  };
};

const buildActivityRow = (
  athleteId: string,
  athleteName: string,
  s: Record<string, unknown>
): FactActivityRow => ({
  athlete_id: athleteId,
  athlete_name: athleteName,
  session_id: String(s.sessionId ?? ''),
  session_type: normalizeSessionType(s.sessionType),
  exercise_log_id: String(s.exerciseLogId ?? ''),
  exercise_name: String(s.exerciseName ?? ''),
  activity_type: String(s.activityType ?? ''),
  logged_date: toIsoDate(s.loggedDate ?? s.exerciseDate),
  exercise_order: typeof s.exerciseNumber === 'number' ? s.exerciseNumber : 0,
  set_number: typeof s.setNumber === 'number' ? s.setNumber : 0,
  reps: toEmpty(s.reps),
  duration_sec: toEmpty(s.durationSec),
  distance_meters: toEmpty(s.distanceMeters),
  avg_hr: toEmpty(s.averageHR ?? s.averageHeartRate),
  max_hr: toEmpty(s.maxHR ?? s.maxHeartRate),
  hr_zone1: toEmpty(s.hrZone1),
  hr_zone2: toEmpty(s.hrZone2),
  hr_zone3: toEmpty(s.hrZone3),
  hr_zone4: toEmpty(s.hrZone4),
  hr_zone5: toEmpty(s.hrZone5),
  calories: toEmpty(s.calories),
  rpe: toEmpty(s.rpe),
  is_warmup: asBool(s.isWarmup),
  hold_time: toEmpty(s.holdTime),
  intensity: toEmpty(s.intensity),
  height: toEmpty(s.height),
  notes: String(s.notes ?? s.comment ?? ''),
});

// ---------------------------------------------------------------------------
// Dim builders
// ---------------------------------------------------------------------------

const buildDimExercise = (allRawSets: Record<string, unknown>[]): DimExerciseRow[] => {
  const seen = new Map<string, DimExerciseRow>();
  allRawSets.forEach((s) => {
    const name = String(s.exerciseName ?? '');
    if (!name) return;
    const id = toSlug(name);
    if (!seen.has(id)) {
      seen.set(id, {
        exercise_id: id,
        exercise_name: name,
        exercise_type: String(s.exerciseType ?? s.collectionType ?? ''),
        activity_type: String(s.activityType ?? ''),
      });
    }
  });
  return Array.from(seen.values()).sort((a, b) =>
    a.exercise_name.localeCompare(b.exercise_name)
  );
};

// ---------------------------------------------------------------------------
// Session fact builder
// ---------------------------------------------------------------------------

interface SessionAccumulator {
  athlete_id: string;
  athlete_name: string;
  session_id: string;
  session_type: string;
  date: string;
  activity_types: Set<string>;
  has_warmup: boolean;
  total_sets: number;
  total_reps: number;
  total_volume_kg: number;
  total_distance_m: number;
  avg_hr_values: number[];
  max_hr: number;
  hr_zone1_sec: number;
  hr_zone2_sec: number;
  hr_zone3_sec: number;
  hr_zone4_sec: number;
  hr_zone5_sec: number;
  calories: number;
  rpe_values: number[];
  session_normalised_load: number;
}

const buildFactSessions = (
  gymSets: FactGymSetRow[],
  activityRows: FactActivityRow[]
): FactSessionRow[] => {
  const map = new Map<string, SessionAccumulator>();

  const getOrCreate = (
    athleteId: string,
    athleteName: string,
    sessionId: string,
    sessionType: string,
    date: string
  ): SessionAccumulator => {
    const key = `${athleteId}::${sessionId}`;
    if (!map.has(key)) {
      map.set(key, {
        athlete_id: athleteId,
        athlete_name: athleteName,
        session_id: sessionId,
        session_type: sessionType,
        date,
        activity_types: new Set(),
        has_warmup: false,
        total_sets: 0,
        total_reps: 0,
        total_volume_kg: 0,
        total_distance_m: 0,
        avg_hr_values: [],
        max_hr: 0,
        hr_zone1_sec: 0,
        hr_zone2_sec: 0,
        hr_zone3_sec: 0,
        hr_zone4_sec: 0,
        hr_zone5_sec: 0,
        calories: 0,
        rpe_values: [],
        session_normalised_load: 0,
      });
    }
    return map.get(key)!;
  };

  gymSets.forEach((s) => {
    if (!s.session_id) return;
    const acc = getOrCreate(
      s.athlete_id, s.athlete_name, s.session_id, s.session_type, s.logged_date
    );
    acc.activity_types.add('resistance');
    if (s.is_warmup) acc.has_warmup = true;
    acc.total_sets++;
    if (typeof s.reps === 'number') acc.total_reps += s.reps;
    if (typeof s.tonnage === 'number') acc.total_volume_kg += s.tonnage;
    if (typeof s.normalised_load === 'number') acc.session_normalised_load += s.normalised_load;
    if (typeof s.rpe === 'number') acc.rpe_values.push(s.rpe);
  });

  activityRows.forEach((s) => {
    if (!s.session_id) return;
    const acc = getOrCreate(
      s.athlete_id, s.athlete_name, s.session_id, s.session_type, s.logged_date
    );
    acc.activity_types.add(s.activity_type || 'other');
    if (s.is_warmup) acc.has_warmup = true;
    acc.total_sets++;
    if (typeof s.reps === 'number') acc.total_reps += s.reps;
    if (typeof s.distance_meters === 'number' && s.distance_meters > 0)
      acc.total_distance_m += s.distance_meters;
    if (typeof s.avg_hr === 'number' && s.avg_hr > 0) acc.avg_hr_values.push(s.avg_hr);
    if (typeof s.max_hr === 'number' && s.max_hr > acc.max_hr) acc.max_hr = s.max_hr;
    if (typeof s.hr_zone1 === 'number' && s.hr_zone1 > 0) acc.hr_zone1_sec += s.hr_zone1;
    if (typeof s.hr_zone2 === 'number' && s.hr_zone2 > 0) acc.hr_zone2_sec += s.hr_zone2;
    if (typeof s.hr_zone3 === 'number' && s.hr_zone3 > 0) acc.hr_zone3_sec += s.hr_zone3;
    if (typeof s.hr_zone4 === 'number' && s.hr_zone4 > 0) acc.hr_zone4_sec += s.hr_zone4;
    if (typeof s.hr_zone5 === 'number' && s.hr_zone5 > 0) acc.hr_zone5_sec += s.hr_zone5;
    if (typeof s.calories === 'number' && s.calories > 0) acc.calories += s.calories;
    if (typeof s.rpe === 'number') acc.rpe_values.push(s.rpe);
  });

  const rows: FactSessionRow[] = [];
  map.forEach((acc) => {
    const avgRpe =
      acc.rpe_values.length > 0
        ? Math.round(
            (acc.rpe_values.reduce((a, b) => a + b, 0) / acc.rpe_values.length) * 10
          ) / 10
        : undefined;
    const avgHr =
      acc.avg_hr_values.length > 0
        ? Math.round(
            acc.avg_hr_values.reduce((a, b) => a + b, 0) / acc.avg_hr_values.length
          )
        : undefined;

    rows.push({
      athlete_id: acc.athlete_id,
      athlete_name: acc.athlete_name,
      session_id: acc.session_id,
      session_type: acc.session_type,
      date: acc.date,
      week_key: dateStringToWeekKey(acc.date),
      activity_types: Array.from(acc.activity_types).sort().join('|'),
      has_warmup: acc.has_warmup,
      duration_min: '',
      total_sets: acc.total_sets,
      total_reps: acc.total_reps > 0 ? acc.total_reps : '',
      total_volume_kg:
        acc.total_volume_kg > 0 ? Math.round(acc.total_volume_kg * 10) / 10 : '',
      total_distance_m: acc.total_distance_m > 0 ? Math.round(acc.total_distance_m) : '',
      avg_hr: avgHr ?? '',
      max_hr: acc.max_hr > 0 ? acc.max_hr : '',
      hr_zone1_sec: acc.hr_zone1_sec > 0 ? acc.hr_zone1_sec : '',
      hr_zone2_sec: acc.hr_zone2_sec > 0 ? acc.hr_zone2_sec : '',
      hr_zone3_sec: acc.hr_zone3_sec > 0 ? acc.hr_zone3_sec : '',
      hr_zone4_sec: acc.hr_zone4_sec > 0 ? acc.hr_zone4_sec : '',
      hr_zone5_sec: acc.hr_zone5_sec > 0 ? acc.hr_zone5_sec : '',
      calories: acc.calories > 0 ? Math.round(acc.calories) : '',
      session_rpe: avgRpe ?? '',
      session_normalised_load:
        acc.session_normalised_load > 0
          ? Math.round(acc.session_normalised_load * 10) / 10
          : '',
      session_load: '',
    });
  });

  return rows.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.athlete_id.localeCompare(b.athlete_id);
  });
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const isResistanceSet = (s: Record<string, unknown>): boolean =>
  normalizeActivityType(String(s.activityType ?? '')) === ActivityType.RESISTANCE;

/** Splits raw (camelCase) sets into Power BI fact rows and accumulates dim data. */
const processRawSets = (
  sets: Record<string, unknown>[],
  athleteId: string,
  athleteName: string,
  gymSets: FactGymSetRow[],
  activityRows: FactActivityRow[],
  allRawSets: Record<string, unknown>[]
): void => {
  sets.forEach((s) => {
    allRawSets.push(s);
    if (isResistanceSet(s)) {
      gymSets.push(buildGymSetRow(athleteId, athleteName, s));
    } else {
      activityRows.push(buildActivityRow(athleteId, athleteName, s));
    }
  });
};

/** Gets the logged-in user's Firebase UID or throws. */
const getCoachUid = (): string => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> => {
  if (items.length === 0) return;

  let index = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const runners = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });

  await Promise.all(runners);
};

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

/**
 * Builds all Power BI CSV files and returns them as in-memory strings.
 * Use this when you want to upload to OneDrive rather than download a ZIP.
 *
 * - scope 'self'    → only the current user's data
 * - scope 'athlete' → one specific athlete (requires coach role + relationship)
 * - scope 'team'    → all athletes the coach manages + coach's own data
 */
export const buildPowerBiFiles = async (
  options: PowerBiExportOptions,
  currentUser: PowerBiExportCurrentUser
): Promise<PowerBiFilesResult> => {
  const { scope, targetAthleteId, fromDate } = options;
  const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : undefined;
  const exportOptions = { startDate };

  const gymSets: FactGymSetRow[] = [];
  const activityRows: FactActivityRow[] = [];
  const wellnessRows: FactWellnessRow[] = [];
  const allRawSets: Record<string, unknown>[] = [];
  const dimAthletes: DimAthleteRow[] = [];

  const coachId = getCoachUid();
  const selfName =
    [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Me';

  // ---- Collect sets per scope ----

  if (scope === 'self') {
    const data = await exportData(currentUser.id, exportOptions);
    processRawSets(data.sets, currentUser.id, selfName, gymSets, activityRows, allRawSets);

    const wellnessStart = fromDate ?? '1970-01-01';
    const wellnessEnd = toIsoDate(new Date());
    const selfWellness = await getWellnessByDateRange(currentUser.id, wellnessStart, wellnessEnd);
    selfWellness.forEach((w) => {
      wellnessRows.push({
        athlete_id: currentUser.id,
        logged_date: w.date,
        sleep_quality: w.sleepQuality ?? '',
        fatigue: w.fatigue ?? '',
        muscle_soreness: w.muscleSoreness ?? '',
        stress: w.stress ?? '',
        mood: w.mood ?? '',
        notes: w.notes ?? '',
      });
    });

    dimAthletes.push({
      athlete_id: currentUser.id,
      athlete_name: selfName,
      role: 'self',
      team: 'Personal',
      position: '',
      date_of_birth: '',
      active: true,
    });
  } else {
    const teams = await getCoachTeams();
    const membersPerTeam = await Promise.all(teams.map((t) => getTeamMembers(t.id)));
    const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

    const resolveAthleteInfo = (
      athleteId: string
    ): { athleteName: string; teamName: string } => {
      for (let i = 0; i < teams.length; i++) {
        const member = membersPerTeam[i].find((m) => m.id === athleteId);
        if (member) {
          return {
            athleteName:
              [member.firstName, member.lastName].filter(Boolean).join(' ') ||
              member.email ||
              athleteId,
            teamName: teamNameById.get(teams[i].id) || teams[i].id,
          };
        }
      }
      return { athleteName: athleteId, teamName: 'Unknown Team' };
    };

    if (scope === 'athlete') {
      if (!targetAthleteId) throw new Error('targetAthleteId is required for athlete scope');
      const hasAccess = await verifyCoachAthleteRelationship(targetAthleteId);
      if (!hasAccess) throw new Error('No access to this athlete');
      await syncCoachAthleteAccess(coachId, targetAthleteId);
      const data = await exportData(targetAthleteId, exportOptions);
      const { athleteName, teamName } = resolveAthleteInfo(targetAthleteId);
      processRawSets(data.sets, targetAthleteId, athleteName, gymSets, activityRows, allRawSets);
      dimAthletes.push({
        athlete_id: targetAthleteId,
        athlete_name: athleteName,
        role: 'athlete',
        team: teamName,
        position: '',
        date_of_birth: '',
        active: true,
      });
    } else {
      const athletesById = new Map<string, {
        id: string;
        athleteName: string;
        teamName: string;
        active: boolean;
      }>();

      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const members = membersPerTeam[i];
        for (const member of members) {
          if (athletesById.has(member.id)) continue;
          athletesById.set(member.id, {
            id: member.id,
            athleteName:
              [member.firstName, member.lastName].filter(Boolean).join(' ') ||
              member.email ||
              member.id,
            teamName: teamNameById.get(team.id) || team.id,
            active: member.status === 'active',
          });
        }
      }

      const athletes = Array.from(athletesById.values());
      await runWithConcurrency(athletes, 4, async (athlete) => {
        try {
          const hasAccess = await verifyCoachAthleteRelationship(athlete.id);
          if (!hasAccess) return;
          await syncCoachAthleteAccess(coachId, athlete.id);
          const data = await exportData(athlete.id, exportOptions);
          processRawSets(data.sets, athlete.id, athlete.athleteName, gymSets, activityRows, allRawSets);
          dimAthletes.push({
            athlete_id: athlete.id,
            athlete_name: athlete.athleteName,
            role: 'athlete',
            team: athlete.teamName,
            position: '',
            date_of_birth: '',
            active: athlete.active,
          });
        } catch (err) {
          console.warn(`[powerBiExport] Skipping athlete ${athlete.id}:`, err);
        }
      });

      const selfData = await exportData(currentUser.id, exportOptions);
      if (selfData.sets.length > 0) {
        processRawSets(selfData.sets, currentUser.id, selfName, gymSets, activityRows, allRawSets);
      }
      dimAthletes.unshift({
        athlete_id: currentUser.id,
        athlete_name: selfName,
        role: 'self',
        team: 'Personal',
        position: '',
        date_of_birth: '',
        active: true,
      });
    }
  }

  // ---- Build dimension and session tables ----
  const dimExercise = buildDimExercise(allRawSets);
  const sessionRows = buildFactSessions(gymSets, activityRows);

  const meta: ExportMeta = {
    exported_at: new Date().toISOString(),
    exported_by: coachId,
    scope,
    from_date: fromDate ?? null,
    athlete_count: dimAthletes.length,
    row_count: gymSets.length + activityRows.length + sessionRows.length + wellnessRows.length,
  };

  // ---- Column headers ----
  const gymSetHeaders: (keyof FactGymSetRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_type', 'exercise_log_id',
    'exercise_id', 'exercise_name', 'logged_date', 'exercise_order', 'set_number',
    'reps', 'weight', 'rpe', 'rest_sec', 'is_warmup', 'tonnage',
    'exercise_factor_category', 'exercise_factor', 'normalised_load', 'set_volume', 'notes',
  ];

  const activityHeaders: (keyof FactActivityRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_type', 'exercise_log_id',
    'exercise_name', 'activity_type', 'logged_date', 'exercise_order', 'set_number',
    'reps', 'duration_sec', 'distance_meters', 'avg_hr', 'max_hr',
    'hr_zone1', 'hr_zone2', 'hr_zone3', 'hr_zone4', 'hr_zone5',
    'calories', 'rpe', 'is_warmup', 'hold_time', 'intensity', 'height', 'notes',
  ];

  const sessionHeaders: (keyof FactSessionRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_type', 'date', 'week_key',
    'activity_types', 'has_warmup', 'duration_min', 'total_sets', 'total_reps',
    'total_volume_kg', 'total_distance_m', 'avg_hr', 'max_hr',
    'hr_zone1_sec', 'hr_zone2_sec', 'hr_zone3_sec', 'hr_zone4_sec', 'hr_zone5_sec',
    'calories', 'session_rpe', 'session_normalised_load', 'session_load',
  ];

  const wellnessHeaders: (keyof FactWellnessRow)[] = [
    'athlete_id', 'logged_date', 'sleep_quality', 'fatigue', 'muscle_soreness',
    'stress', 'mood', 'notes',
  ];

  const dimExerciseHeaders: (keyof DimExerciseRow)[] = [
    'exercise_id', 'exercise_name', 'exercise_type', 'activity_type',
  ];

  const dimAthleteHeaders: (keyof DimAthleteRow)[] = [
    'athlete_id', 'athlete_name', 'role', 'team', 'position', 'date_of_birth', 'active',
  ];

  const files: PowerBiFile[] = [
    { name: 'fact_gym_sets.csv',   content: rowsToCSVForPowerBi(gymSets, gymSetHeaders) },
    { name: 'fact_activity.csv',   content: rowsToCSVForPowerBi(activityRows, activityHeaders) },
    { name: 'fact_sessions.csv',   content: rowsToCSVForPowerBi(sessionRows, sessionHeaders) },
    { name: 'fact_wellness.csv',   content: rowsToCSVForPowerBi(wellnessRows, wellnessHeaders) },
    { name: 'dim_exercise.csv',    content: rowsToCSVForPowerBi(dimExercise, dimExerciseHeaders) },
    { name: 'dim_athlete.csv',     content: rowsToCSVForPowerBi(dimAthletes, dimAthleteHeaders) },
    { name: 'export_meta.json',    content: JSON.stringify(meta, null, 2) },
  ];

  return {
    files,
    gymSetCount: gymSets.length,
    activityCount: activityRows.length,
    athleteCount: dimAthletes.length,
    sessionCount: sessionRows.length,
  };
};

/**
 * Generates and downloads a ZIP file containing Power BI-compatible CSVs.
 * Wrapper around buildPowerBiFiles that packages the output as a ZIP download.
 */
export const downloadPowerBiZip = async (
  options: PowerBiExportOptions,
  currentUser: PowerBiExportCurrentUser
): Promise<PowerBiExportResult> => {
  const result = await buildPowerBiFiles(options, currentUser);

  const dateStamp = toIsoDate(new Date());
  const zip = new JSZip();
  const folder = zip.folder(`training_export_${dateStamp}`)!;

  for (const file of result.files) {
    folder.file(file.name, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `training_export_${dateStamp}.zip`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return {
    gymSetCount: result.gymSetCount,
    activityCount: result.activityCount,
    athleteCount: result.athleteCount,
  };
};
