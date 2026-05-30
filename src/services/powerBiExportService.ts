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
 *   fact_wellness.csv   – wellness check-ins
 *   export_meta.json    – export metadata
 */

import JSZip from 'jszip';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { exportData, getWellnessExportRows } from '@/services/exportService';
import { verifyCoachAthleteRelationship } from '@/services/coachService';
import { getCoachTeams, getTeamMembers, syncCoachAthleteAccess } from '@/services/teamService';
import { db } from '@/services/firebase/config';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import type {
  DimAthleteRow,
  DimExerciseRow,
  ExportMeta,
  FactActivityRow,
  FactGymSetRow,
  FactSessionRow,
  FactSportsLoadRow,
  FactWellnessRow,
  PowerBiExportOptions,
} from '@/types/powerBiExport';
import { FACT_FOOTBALL_LOAD_HEADERS, FACT_SPORTS_LOAD_HEADERS } from '@/types/powerBiExport';
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
  sessionCount: number;
  wellnessCount: number;
  sportsLoadCount: number;
  footballLoadCount: number;
}

export interface PowerBiFile {
  name: string;
  content: string;
}

export interface PowerBiFilesResult extends PowerBiExportResult {
  files: PowerBiFile[];
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

const toIdToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';

const DISPLAY_NAME_FIXES = new Map<string, string>([
  ['uprigth row', 'Upright Row'],
]);

const SPORT_EXPORT_NAMES = new Set([
  'basketball',
  'basketball training',
  'soccer',
  'football',
  'football (soccer)',
]);

const OTHER_EXPORT_NAMES = new Set([
  'meditation',
  'meditation session',
]);

const normalizeExerciseDisplayName = (name: string): string => {
  const trimmed = name.trim();
  return DISPLAY_NAME_FIXES.get(trimmed.toLowerCase()) ?? trimmed;
};

const toExerciseId = (name: string, activityType: string): string => {
  const base = toSlug(name);
  const type = toSlug(activityType || 'unknown');
  // Keying by name + exported activity type avoids collapsing historical rows
  // where the same label was stored under different activity families.
  return type ? `${base}__${type}` : base;
};

const isSpeedAgilityName = (name: string): boolean =>
  /\b(box jump|jump|jumps|skip|skips|sprint|agility|ladder|hurdle|plyo|plyometric|shuffle)\b/i
    .test(name);

const resolvePowerBiActivityType = (s: Record<string, unknown>): ActivityType => {
  const exerciseName = normalizeExerciseDisplayName(String(s.exerciseName ?? ''));
  const nameKey = exerciseName.toLowerCase();

  if (SPORT_EXPORT_NAMES.has(nameKey)) return ActivityType.SPORT;
  if (OTHER_EXPORT_NAMES.has(nameKey)) return ActivityType.OTHER;
  if (isSpeedAgilityName(exerciseName)) return ActivityType.SPEED_AGILITY;

  const sourceActivityType = String(s.activityType ?? '').trim();
  if (sourceActivityType) return normalizeActivityType(sourceActivityType);

  const sourceExerciseType = String(s.exerciseType ?? s.collectionType ?? '').trim();
  if (sourceExerciseType) return normalizeActivityType(sourceExerciseType);

  return ActivityType.OTHER;
};

const getRowDate = (s: Record<string, unknown>): string =>
  toIsoDate(s.loggedDate ?? s.exerciseDate ?? s.sessionDateKey);

const getStableSessionId = (
  athleteId: string,
  loggedDate: string,
  sessionType: string,
  s: Record<string, unknown>
): string => {
  const realSessionId = String(s.sessionId ?? '').trim();
  if (realSessionId) return realSessionId;

  const dateToken = toIdToken(loggedDate || 'unknown_date');
  const sessionTypeToken = toIdToken(sessionType || 'main');
  const sessionNumber =
    typeof s.sessionNumberInDay === 'number' && s.sessionNumberInDay > 0
      ? `-${s.sessionNumberInDay}`
      : '';

  return `default-${toIdToken(athleteId)}-${dateToken}-${sessionTypeToken}${sessionNumber}`;
};

const getSessionDisplayName = (
  sessionType: string,
  sessionNumberInDay: unknown,
  fallback = ''
): string => {
  if (fallback.trim()) return fallback.trim();
  const number =
    typeof sessionNumberInDay === 'number' && sessionNumberInDay > 0
      ? sessionNumberInDay
      : 1;
  return normalizeSessionType(sessionType) === 'warmup'
    ? `Warm-up ${number}`
    : `Session ${number}`;
};

const loadSessionNamesById = async (
  athleteId: string,
  startDate: string,
  endDate: string
): Promise<Map<string, string>> => {
  const names = new Map<string, string>();

  try {
    const sessionsRef = collection(db, 'users', athleteId, 'sessions');
    const sessionsQuery = query(
      sessionsRef,
      where('sessionDateKey', '>=', startDate),
      where('sessionDateKey', '<=', endDate)
    );
    const snapshot = await getDocs(sessionsQuery);

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const sessionType = normalizeSessionType(data.sessionType);
      const sessionName = getSessionDisplayName(
        sessionType,
        data.sessionNumberInDay,
        typeof data.name === 'string' ? data.name : ''
      );
      names.set(docSnap.id, sessionName);
    });
  } catch (error) {
    console.warn(`[powerBiExport] Could not load session names for ${athleteId}:`, error);
  }

  return names;
};

// ---------------------------------------------------------------------------
// Row builders  (camelCase set → snake_case Power BI row)
// ---------------------------------------------------------------------------

const buildGymSetRow = (
  athleteId: string,
  athleteName: string,
  s: Record<string, unknown>,
  sessionNamesById: Map<string, string>
): FactGymSetRow => {
  const reps = typeof s.reps === 'number' && s.reps > 0 ? s.reps : null;
  const weight = typeof s.weight === 'number' && s.weight > 0 ? s.weight : null;
  const rawRpe = typeof s.rpe === 'number' && isFinite(s.rpe) ? s.rpe : null;
  const exerciseName = normalizeExerciseDisplayName(String(s.exerciseName ?? ''));
  const loggedDate = getRowDate(s);
  const sessionType = normalizeSessionType(s.sessionType);
  const sessionId = getStableSessionId(athleteId, loggedDate, sessionType, s);
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
    reps !== null && weight !== null && rawRpe !== null && rawRpe > 0
      ? Math.round(reps * weight * rawRpe * factor * 10) / 10
      : '';

  return {
    athlete_id: athleteId,
    athlete_name: athleteName,
    session_id: sessionId,
    session_type: sessionType,
    session_name: sessionNamesById.get(sessionId) || getSessionDisplayName(sessionType, s.sessionNumberInDay),
    exercise_log_id: String(s.exerciseLogId ?? ''),
    exercise_id: toExerciseId(exerciseName, ActivityType.RESISTANCE),
    exercise_name: exerciseName,
    logged_date: loggedDate,
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
  s: Record<string, unknown>,
  sessionNamesById: Map<string, string>
): FactActivityRow => {
  const activityType = resolvePowerBiActivityType(s);
  const exerciseName = normalizeExerciseDisplayName(String(s.exerciseName ?? ''));
  const loggedDate = getRowDate(s);
  const sessionType = normalizeSessionType(s.sessionType);
  const sessionId = getStableSessionId(athleteId, loggedDate, sessionType, s);

  return {
    athlete_id: athleteId,
    athlete_name: athleteName,
    session_id: sessionId,
    session_type: sessionType,
    session_name: sessionNamesById.get(sessionId) || getSessionDisplayName(sessionType, s.sessionNumberInDay),
    exercise_log_id: String(s.exerciseLogId ?? ''),
    exercise_name: exerciseName,
    activity_type: activityType,
    logged_date: loggedDate,
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
  };
};

// ---------------------------------------------------------------------------
// Dim builders
// ---------------------------------------------------------------------------

const buildDimExercise = (allRawSets: Record<string, unknown>[]): DimExerciseRow[] => {
  const seen = new Map<string, DimExerciseRow>();
  allRawSets.forEach((s) => {
    const name = normalizeExerciseDisplayName(String(s.exerciseName ?? ''));
    if (!name) return;
    const activityType = resolvePowerBiActivityType(s);
    const id = toExerciseId(name, activityType);
    if (!seen.has(id)) {
      seen.set(id, {
        exercise_id: id,
        exercise_name: name,
        exercise_type: String(s.exerciseType ?? s.collectionType ?? ''),
        activity_type: activityType,
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
  session_name: string;
  session_type: string;
  date: string;
  activity_types: Set<string>;
  has_warmup: boolean;
  resistance_set_count: number;
  activity_entry_count: number;
  sports_load_entry_count: number;
  total_reps: number;
  total_volume_kg: number;
  total_distance_m: number;
  activity_duration_sec: number;
  sports_duration_sec: number;
  avg_hr_values: number[];
  max_hr: number;
  hr_zone1_sec: number;
  hr_zone2_sec: number;
  hr_zone3_sec: number;
  hr_zone4_sec: number;
  hr_zone5_sec: number;
  calories: number;
  rpe_values: number[];
  resistance_normalised_load: number;
  reported_session_load: number;
  has_sports_load: boolean;
}

const buildFactSessions = (
  gymSets: FactGymSetRow[],
  activityRows: FactActivityRow[],
  sportsLoadRows: FactSportsLoadRow[]
): FactSessionRow[] => {
  const map = new Map<string, SessionAccumulator>();

  const getOrCreate = (
    athleteId: string,
    athleteName: string,
    sessionId: string,
    sessionName: string,
    sessionType: string,
    date: string
  ): SessionAccumulator => {
    const key = `${athleteId}::${sessionId}`;
    if (!map.has(key)) {
      map.set(key, {
        athlete_id: athleteId,
        athlete_name: athleteName,
        session_id: sessionId,
        session_name: sessionName,
        session_type: sessionType,
        date,
        activity_types: new Set(),
        has_warmup: false,
        resistance_set_count: 0,
        activity_entry_count: 0,
        sports_load_entry_count: 0,
        total_reps: 0,
        total_volume_kg: 0,
        total_distance_m: 0,
        activity_duration_sec: 0,
        sports_duration_sec: 0,
        avg_hr_values: [],
        max_hr: 0,
        hr_zone1_sec: 0,
        hr_zone2_sec: 0,
        hr_zone3_sec: 0,
        hr_zone4_sec: 0,
        hr_zone5_sec: 0,
        calories: 0,
        rpe_values: [],
        resistance_normalised_load: 0,
        reported_session_load: 0,
        has_sports_load: false,
      });
    }
    return map.get(key)!;
  };

  gymSets.forEach((s) => {
    if (!s.session_id) return;
    const acc = getOrCreate(
      s.athlete_id, s.athlete_name, s.session_id, s.session_name, s.session_type, s.logged_date
    );
    acc.activity_types.add('resistance');
    if (s.is_warmup) acc.has_warmup = true;
    acc.resistance_set_count++;
    if (typeof s.reps === 'number') acc.total_reps += s.reps;
    if (typeof s.tonnage === 'number') acc.total_volume_kg += s.tonnage;
    if (typeof s.normalised_load === 'number') acc.resistance_normalised_load += s.normalised_load;
    if (typeof s.rpe === 'number') acc.rpe_values.push(s.rpe);
  });

  activityRows.forEach((s) => {
    if (!s.session_id) return;
    const acc = getOrCreate(
      s.athlete_id, s.athlete_name, s.session_id, s.session_name, s.session_type, s.logged_date
    );
    acc.activity_types.add(s.activity_type || 'other');
    if (s.is_warmup) acc.has_warmup = true;
    acc.activity_entry_count++;
    if (typeof s.reps === 'number') acc.total_reps += s.reps;
    if (typeof s.distance_meters === 'number' && s.distance_meters > 0)
      acc.total_distance_m += s.distance_meters;
    if (typeof s.duration_sec === 'number' && s.duration_sec > 0)
      acc.activity_duration_sec += s.duration_sec;
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

  sportsLoadRows.forEach((s) => {
    const acc = getOrCreate(
      s.athlete_id,
      s.athlete_name,
      s.session_id,
      s.session_name,
      'sport',
      s.logged_date
    );

    acc.activity_types.add('sport');
    acc.sports_load_entry_count++;
    acc.has_sports_load = true;
    if (typeof s.duration_min === 'number' && s.duration_min > 0) {
      acc.sports_duration_sec += s.duration_min * 60;
    }
    if (typeof s.distance_meters === 'number' && s.distance_meters > 0 && acc.total_distance_m === 0) {
      acc.total_distance_m += s.distance_meters;
    }
    if (typeof s.avg_hr === 'number' && s.avg_hr > 0) acc.avg_hr_values.push(s.avg_hr);
    if (typeof s.max_hr === 'number' && s.max_hr > acc.max_hr) acc.max_hr = s.max_hr;
    if (typeof s.calories === 'number' && s.calories > 0 && acc.calories === 0) acc.calories += s.calories;
    if (typeof s.rpe === 'number') acc.rpe_values.push(s.rpe);
    if (typeof s.session_load === 'number' && s.session_load > 0) {
      acc.reported_session_load += s.session_load;
    }
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
    const durationSec = acc.sports_duration_sec > 0
      ? acc.sports_duration_sec
      : acc.activity_duration_sec;
    const durationMin = durationSec > 0
      ? Math.round((durationSec / 60) * 10) / 10
      : undefined;
    const computedSessionLoad = durationMin !== undefined && avgRpe !== undefined
      ? Math.round(durationMin * avgRpe * 10) / 10
      : undefined;

    rows.push({
      athlete_id: acc.athlete_id,
      athlete_name: acc.athlete_name,
      session_id: acc.session_id,
      session_name: acc.session_name,
      session_type: acc.session_type,
      date: acc.date,
      week_key: dateStringToWeekKey(acc.date),
      activity_types: Array.from(acc.activity_types).sort().join('|'),
      has_warmup: acc.has_warmup,
      duration_min: durationMin ?? '',
      resistance_set_count: acc.resistance_set_count,
      activity_entry_count: acc.activity_entry_count,
      sports_load_entry_count: acc.sports_load_entry_count,
      total_entry_count:
        acc.resistance_set_count + acc.activity_entry_count + acc.sports_load_entry_count,
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
      avg_set_rpe: avgRpe ?? '',
      resistance_normalised_load:
        acc.resistance_normalised_load > 0
          ? Math.round(acc.resistance_normalised_load * 10) / 10
          : '',
      reported_session_load:
        acc.reported_session_load > 0
          ? Math.round(acc.reported_session_load * 10) / 10
          : '',
      estimated_session_load: computedSessionLoad ?? '',
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
  resolvePowerBiActivityType(s) === ActivityType.RESISTANCE;

/** Splits raw (camelCase) sets into Power BI fact rows and accumulates dim data. */
const processRawSets = (
  sets: Record<string, unknown>[],
  athleteId: string,
  athleteName: string,
  sessionNamesById: Map<string, string>,
  gymSets: FactGymSetRow[],
  activityRows: FactActivityRow[],
  allRawSets: Record<string, unknown>[]
): void => {
  sets.forEach((s) => {
    allRawSets.push(s);
    if (isResistanceSet(s)) {
      gymSets.push(buildGymSetRow(athleteId, athleteName, s, sessionNamesById));
    } else {
      activityRows.push(buildActivityRow(athleteId, athleteName, s, sessionNamesById));
    }
  });
};

const addWellnessRowsForAthlete = async (
  athleteId: string,
  athleteName: string,
  startDate: string,
  endDate: string,
  wellnessRows: FactWellnessRow[]
): Promise<void> => {
  const rows = await getWellnessExportRows(
    {
      athleteId,
      athleteName,
    },
    startDate,
    endDate
  );

  rows.forEach((row) => {
    wellnessRows.push({
      athlete_id: row.athleteId,
      athlete_name: row.athleteName || athleteName,
      logged_date: row.loggedDate,
      sleep_quality: row.sleepQuality,
      fatigue: row.fatigue,
      muscle_soreness: row.muscleSoreness,
      stress: row.stress,
      mood: row.mood,
      readiness: row.readiness,
      notes: row.notes,
    });
  });
};

const addFootballLoadRowsForAthlete = async (
  athleteId: string,
  athleteName: string,
  startDate: string,
  endDate: string,
  sportsLoadRows: FactSportsLoadRow[]
): Promise<void> => {
  const { getSportsLoadSessionsByDateRange, getSrpeByDateRange } = await import('@/services/srpeService');
  const sessions = await getSportsLoadSessionsByDateRange(athleteId, startDate, endDate);
  const sessionDates = new Set(sessions.map((session) => session.date));

  sessions
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .forEach((session) => {
      sportsLoadRows.push({
        athlete_id: session.userId || athleteId,
        athlete_name: athleteName,
        session_id: session.id,
        session_name: session.sessionName || session.sportName || 'Football',
        logged_date: session.date,
        sport_type: session.sportType || 'football',
        sport_name: session.sportName || 'Football',
        rpe: session.rpe ?? '',
        duration_min: session.durationMinutes ?? '',
        session_load: session.sessionLoad ?? '',
        distance_meters: session.distanceMeters ?? '',
        calories: session.calories ?? '',
        avg_hr: session.averageHeartRate ?? '',
        max_hr: session.maxHeartRate ?? '',
        notes: session.notes ?? '',
      });
    });

  const legacyRows = await getSrpeByDateRange(athleteId, startDate, endDate);
  legacyRows
    .filter((row) => !sessionDates.has(row.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .forEach((row) => {
      sportsLoadRows.push({
        athlete_id: row.userId || athleteId,
        athlete_name: athleteName,
        session_id: `legacy-${row.date}`,
        session_name: row.sessionName || row.sportName || 'Football',
        logged_date: row.date,
        sport_type: row.sportType || 'football',
        sport_name: row.sportName || 'Football',
        rpe: row.rpe ?? '',
        duration_min: row.durationMinutes ?? '',
        session_load: row.sessionLoad ?? '',
        distance_meters: row.distanceMeters ?? '',
        calories: row.calories ?? '',
        avg_hr: row.averageHeartRate ?? '',
        max_hr: row.maxHeartRate ?? '',
        notes: row.notes ?? '',
      });
    });
};

/** Gets the logged-in user's Firebase UID or throws. */
const getCoachUid = (): string => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('User must be logged in');
  return uid;
};

interface ExportAthleteTarget {
  id: string;
  athleteName: string;
  teamName: string;
  role: 'self' | 'athlete';
  active: boolean;
}

interface CoachTargetContext {
  teams: Awaited<ReturnType<typeof getCoachTeams>>;
  membersPerTeam: Awaited<ReturnType<typeof getTeamMembers>>[];
  targetsByAthleteId: Map<string, ExportAthleteTarget>;
  targetsByTeamId: Map<string, ExportAthleteTarget[]>;
}

const getMemberName = (
  member: Awaited<ReturnType<typeof getTeamMembers>>[number],
  fallbackId: string
): string =>
  [member.firstName, member.lastName].filter(Boolean).join(' ') ||
  member.email ||
  fallbackId;

const loadCoachTargetContext = async (): Promise<CoachTargetContext> => {
  const teams = await getCoachTeams();
  const membersPerTeam = await Promise.all(teams.map((t) => getTeamMembers(t.id)));
  const targetsByAthleteId = new Map<string, ExportAthleteTarget>();
  const targetsByTeamId = new Map<string, ExportAthleteTarget[]>();

  teams.forEach((team, index) => {
    const teamTargets: ExportAthleteTarget[] = [];
    const members = membersPerTeam[index] || [];

    members.forEach((member) => {
      const target: ExportAthleteTarget = {
        id: member.id,
        athleteName: getMemberName(member, member.id),
        teamName: team.name || team.id,
        role: 'athlete',
        active: member.status === 'active',
      };

      teamTargets.push(target);
      if (!targetsByAthleteId.has(member.id)) {
        targetsByAthleteId.set(member.id, target);
      }
    });

    targetsByTeamId.set(team.id, teamTargets);
  });

  return { teams, membersPerTeam, targetsByAthleteId, targetsByTeamId };
};

const verifyCoachTargetAccess = async (
  coachId: string,
  target: ExportAthleteTarget,
  throwOnDenied: boolean
): Promise<boolean> => {
  try {
    const hasAccess = await verifyCoachAthleteRelationship(target.id);
    if (!hasAccess) {
      if (throwOnDenied) throw new Error(`No access to athlete ${target.athleteName}`);
      return false;
    }

    await syncCoachAthleteAccess(coachId, target.id);
    return true;
  } catch (err) {
    if (throwOnDenied) throw err;
    console.warn(`[powerBiExport] Skipping athlete ${target.id}:`, err);
    return false;
  }
};

const resolveExportTargets = async (
  options: PowerBiExportOptions,
  currentUser: PowerBiExportCurrentUser,
  coachId: string
): Promise<ExportAthleteTarget[]> => {
  const selfName =
    [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Me';

  if (options.scope === 'self') {
    return [{
      id: currentUser.id,
      athleteName: selfName,
      teamName: 'Personal',
      role: 'self',
      active: true,
    }];
  }

  if (currentUser.role !== 'coach') {
    throw new Error('Coach export scopes require a coach account');
  }

  const context = await loadCoachTargetContext();
  const resolveTarget = (athleteId: string): ExportAthleteTarget => (
    context.targetsByAthleteId.get(athleteId) || {
      id: athleteId,
      athleteName: athleteId,
      teamName: 'Unknown Team',
      role: 'athlete',
      active: true,
    }
  );

  if (options.scope === 'athlete') {
    if (!options.targetAthleteId) {
      throw new Error('targetAthleteId is required for athlete scope');
    }

    const target = resolveTarget(options.targetAthleteId);
    await verifyCoachTargetAccess(coachId, target, true);
    return [target];
  }

  if (options.scope === 'athletes') {
    const athleteIds = Array.from(new Set((options.targetAthleteIds || []).filter(Boolean)));
    if (athleteIds.length === 0) {
      throw new Error('Select at least one athlete to export');
    }

    const targets = athleteIds.map(resolveTarget);
    const verified: ExportAthleteTarget[] = [];
    for (const target of targets) {
      if (await verifyCoachTargetAccess(coachId, target, true)) {
        verified.push(target);
      }
    }
    return verified;
  }

  if (options.scope === 'team') {
    if (!options.targetTeamId) {
      throw new Error('targetTeamId is required for team scope');
    }

    const targets = context.targetsByTeamId.get(options.targetTeamId) || [];
    if (targets.length === 0) {
      throw new Error('No athletes found for this team');
    }

    const verified: ExportAthleteTarget[] = [];
    await runWithConcurrency(targets, 4, async (target) => {
      if (await verifyCoachTargetAccess(coachId, target, false)) {
        verified.push(target);
      }
    });
    return verified;
  }

  const allTargets = Array.from(context.targetsByAthleteId.values());
  if (allTargets.length === 0) {
    throw new Error('No athletes found for this coach');
  }

  const verified: ExportAthleteTarget[] = [];
  await runWithConcurrency(allTargets, 4, async (target) => {
    if (await verifyCoachTargetAccess(coachId, target, false)) {
      verified.push(target);
    }
  });
  return verified;
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
 * - scope 'self'             → only the current user's data
 * - scope 'athlete'          → one specific athlete
 * - scope 'athletes'         → multiple selected athletes
 * - scope 'team'             → one selected team
 * - scope 'allCoachAthletes' → all athletes the coach can access
 */
export const buildPowerBiFiles = async (
  options: PowerBiExportOptions,
  currentUser: PowerBiExportCurrentUser
): Promise<PowerBiFilesResult> => {
  const { scope, fromDate, toDate } = options;
  const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : undefined;
  const endDate = toDate ? new Date(`${toDate}T23:59:59.999`) : undefined;
  const exportOptions = { startDate, endDate };
  const wellnessStart = fromDate ?? '1970-01-01';
  const wellnessEnd = toDate ?? toIsoDate(new Date());

  const gymSets: FactGymSetRow[] = [];
  const activityRows: FactActivityRow[] = [];
  const wellnessRows: FactWellnessRow[] = [];
  const sportsLoadRows: FactSportsLoadRow[] = [];
  const allRawSets: Record<string, unknown>[] = [];
  const dimAthletes: DimAthleteRow[] = [];

  const coachId = getCoachUid();

  // ---- Collect sets per scope ----

  const targets = await resolveExportTargets(options, currentUser, coachId);
  if (targets.length === 0) {
    throw new Error('No athletes available to export for the selected scope');
  }

  await runWithConcurrency(targets, 4, async (target) => {
    const data = await exportData(target.id, exportOptions);
    const sessionNamesById = await loadSessionNamesById(target.id, wellnessStart, wellnessEnd);
    processRawSets(data.sets, target.id, target.athleteName, sessionNamesById, gymSets, activityRows, allRawSets);
    await addWellnessRowsForAthlete(target.id, target.athleteName, wellnessStart, wellnessEnd, wellnessRows);
    await addFootballLoadRowsForAthlete(target.id, target.athleteName, wellnessStart, wellnessEnd, sportsLoadRows);

    dimAthletes.push({
      athlete_id: target.id,
      athlete_name: target.athleteName,
      role: target.role,
      team: target.teamName,
      position: '',
      date_of_birth: '',
      active: target.active,
    });
  });

  // ---- Build dimension and session tables ----
  const dimExercise = buildDimExercise(allRawSets);
  const sessionRows = buildFactSessions(gymSets, activityRows, sportsLoadRows);

  const meta: ExportMeta = {
    exported_at: new Date().toISOString(),
    exported_by: coachId,
    scope,
    from_date: fromDate ?? null,
    to_date: toDate ?? null,
    athlete_count: dimAthletes.length,
    row_count: gymSets.length + activityRows.length + sessionRows.length + wellnessRows.length + sportsLoadRows.length,
  };

  // ---- Column headers ----
  const gymSetHeaders: (keyof FactGymSetRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_type', 'session_name', 'exercise_log_id',
    'exercise_id', 'exercise_name', 'logged_date', 'exercise_order', 'set_number',
    'reps', 'weight', 'rpe', 'rest_sec', 'is_warmup', 'tonnage',
    'exercise_factor_category', 'exercise_factor', 'normalised_load', 'set_volume', 'notes',
  ];

  const activityHeaders: (keyof FactActivityRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_type', 'session_name', 'exercise_log_id',
    'exercise_name', 'activity_type', 'logged_date', 'exercise_order', 'set_number',
    'reps', 'duration_sec', 'distance_meters', 'avg_hr', 'max_hr',
    'hr_zone1', 'hr_zone2', 'hr_zone3', 'hr_zone4', 'hr_zone5',
    'calories', 'rpe', 'is_warmup', 'hold_time', 'intensity', 'height', 'notes',
  ];

  const sessionHeaders: (keyof FactSessionRow)[] = [
    'athlete_id', 'athlete_name', 'session_id', 'session_name', 'session_type', 'date', 'week_key',
    'activity_types', 'has_warmup', 'duration_min', 'resistance_set_count',
    'activity_entry_count', 'sports_load_entry_count', 'total_entry_count', 'total_reps',
    'total_volume_kg', 'total_distance_m', 'avg_hr', 'max_hr',
    'hr_zone1_sec', 'hr_zone2_sec', 'hr_zone3_sec', 'hr_zone4_sec', 'hr_zone5_sec',
    'calories', 'avg_set_rpe', 'resistance_normalised_load', 'reported_session_load',
    'estimated_session_load',
  ];

  const wellnessHeaders: (keyof FactWellnessRow)[] = [
    'athlete_id', 'athlete_name', 'logged_date', 'sleep_quality', 'fatigue', 'muscle_soreness',
    'stress', 'mood', 'readiness', 'notes',
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
    { name: 'fact_sports_load.csv', content: rowsToCSVForPowerBi(sportsLoadRows, [...FACT_SPORTS_LOAD_HEADERS]) },
    { name: 'fact_football_load.csv', content: rowsToCSVForPowerBi(sportsLoadRows, [...FACT_FOOTBALL_LOAD_HEADERS]) },
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
    wellnessCount: wellnessRows.length,
    sportsLoadCount: sportsLoadRows.length,
    footballLoadCount: sportsLoadRows.length,
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
    sessionCount: result.sessionCount,
    wellnessCount: result.wellnessCount,
    sportsLoadCount: result.sportsLoadCount,
    footballLoadCount: result.footballLoadCount,
  };
};
