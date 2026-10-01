/**
 * Types for Power BI multi-athlete export system.
 * All column names are snake_case for Power BI compatibility.
 */

// ---------------------------------------------------------------------------
// Export scope
// ---------------------------------------------------------------------------

export type PowerBiExportScope = 'self' | 'athlete' | 'athletes' | 'team' | 'allCoachAthletes';

export interface PowerBiExportOptions {
  /** Which dataset to export */
  scope: PowerBiExportScope;
  /** athleteId to export when scope === 'athlete' */
  targetAthleteId?: string;
  /** athleteIds to export when scope === 'athletes' */
  targetAthleteIds?: string[];
  /** teamId to export when scope === 'team' */
  targetTeamId?: string;
  /** Only include rows where logged_date >= fromDate (ISO YYYY-MM-DD) */
  fromDate?: string;
  /** Only include rows where logged_date <= toDate (ISO YYYY-MM-DD) */
  toDate?: string;
}

export type PowerBiExportGrain = 'player-day' | 'player-session' | 'player-set' | 'dimension' | 'export';

// ---------------------------------------------------------------------------
// dim_athlete.csv
// ---------------------------------------------------------------------------

export interface DimAthleteRow {
  athlete_id: string;       // Firebase UID (unchanged)
  athlete_name: string;     // first + last name
  role: 'self' | 'athlete'; // 'self' = coach's own account
  team: string;             // e.g. "Ytrebygda U19" or "Personal"
  position: string;         // optional sport position (empty if unknown)
  date_of_birth: string;    // YYYY-MM-DD or empty
  active: boolean;
}

// ---------------------------------------------------------------------------
// fact_gym_sets.csv  (activityType === 'resistance')
// ---------------------------------------------------------------------------

export interface FactGymSetRow {
  athlete_id: string;
  athlete_name: string;
  session_id: string;
  session_type: string;
  session_name: string;
  exercise_log_id: string;
  exercise_id: string;
  exercise_name: string;
  source_program_id?: string;
  source_program_name?: string;
  source_program_session_id?: string;
  source_program_session_name?: string;
  source_program_exercise_id?: string;
  /** Calendar day of the set. Same value as logged_date. */
  date: string;
  logged_date: string;       // YYYY-MM-DD
  /** Exercise-log timestamp when available. */
  logged_at: string;
  exercise_order: number;    // 1-based order of exercise within the day
  set_number: number;
  reps: number | '';
  weight: number | '';
  /** Set-level RPE. Not session RPE. */
  rpe: number | '';
  rest_sec: number | '';
  is_warmup: boolean;
  tonnage: number | '';      // reps * weight, empty if either is missing
  exercise_factor_category?: string;
  exercise_factor?: number;
  /** Normalized load = reps × weight × rpe × exercise factor. */
  normalised_load?: number | '';
  set_volume: number | '';
  notes: string;
}

// ---------------------------------------------------------------------------
// fact_activity.csv  (non-resistance exercises / activities)
// ---------------------------------------------------------------------------

export interface FactActivityRow {
  athlete_id: string;
  athlete_name: string;
  session_id: string;
  session_type: string;
  session_name: string;
  exercise_log_id: string;
  exercise_id: string;
  exercise_name: string;
  activity_type: string;
  source_program_id?: string;
  source_program_name?: string;
  source_program_session_id?: string;
  source_program_session_name?: string;
  source_program_exercise_id?: string;
  date: string;
  logged_date: string;       // YYYY-MM-DD
  logged_at: string;
  exercise_order: number;    // 1-based order of exercise within the day
  set_number: number;
  reps: number | '';
  duration_sec: number | '';
  distance_meters: number | '';
  avg_hr: number | '';
  max_hr: number | '';
  hr_zone1: number | '';
  hr_zone2: number | '';
  hr_zone3: number | '';
  hr_zone4: number | '';
  hr_zone5: number | '';
  calories: number | '';
  /** Set/entry RPE. Not session RPE. */
  rpe: number | '';
  is_warmup: boolean;
  hold_time: number | '';
  intensity: number | '';
  height: number | '';
  notes: string;
}

// ---------------------------------------------------------------------------
// dim_exercise.csv
// ---------------------------------------------------------------------------

export interface DimExerciseRow {
  exercise_id: string;    // slug derived from exercise name + activity type
  exercise_name: string;
  exercise_type: string;  // collectionType / exerciseType
  activity_type: string;
  catalog_id: string;
  is_custom: boolean;
  in_catalog: boolean;
  category: string;
  difficulty: string;
  primary_muscles: string;
  secondary_muscles: string;
  equipment: string;
  laterality: string;
  exercise_factor_category: string;
  primary_movement_pattern: string;
  secondary_movement_pattern: string;
}

// ---------------------------------------------------------------------------
// fact_sessions.csv  (one row per session — session-level load summary)
// ---------------------------------------------------------------------------

export interface FactSessionRow {
  athlete_id: string;
  athlete_name: string;
  session_id: string;
  session_name: string;
  source_program_id?: string;
  source_program_name?: string;
  source_program_session_id?: string;
  source_program_session_name?: string;
  /** 'main' | 'warmup' | 'sport' */
  session_type: string;
  date: string;            // YYYY-MM-DD
  logged_date: string;     // alias of date
  logged_at: string;
  week_key: string;        // ISO week: YYYY-Www
  /** Pipe-separated distinct activity types in the session, e.g. "resistance|endurance" */
  activity_types: string;
  has_warmup: boolean;
  /** Minutes from activity duration, sports-load duration, or session clock. Empty when unknown. */
  duration_min: number | '';
  /** Resistance set rows only. Non-gym activities are tracked separately because they are not always true sets. */
  resistance_set_count: number;
  /** Non-resistance rows from fact_activity.csv. These may be activities, intervals, drills, or stretches. */
  activity_entry_count: number;
  /** Rows from fact_football_load.csv merged into this session list for joins. */
  sports_load_entry_count: number;
  /** Total contributing fact rows; useful for QA, not a training "sets" metric. */
  total_entry_count: number;
  total_reps: number | '';
  total_volume_kg: number | '';   // sum of (reps × weight) across all resistance sets
  total_distance_m: number | '';  // sum of distance across all activity sets
  avg_hr: number | '';
  max_hr: number | '';
  hr_zone1_sec: number | '';      // seconds in zone 1 (summed across all sets)
  hr_zone2_sec: number | '';
  hr_zone3_sec: number | '';
  hr_zone4_sec: number | '';
  hr_zone5_sec: number | '';
  calories: number | '';
  /** Simple average of gym/activity set RPEs. Not session RPE and not Foster load. */
  avg_set_rpe: number | '';
  /** Sum of resistance-set normalized load values. */
  resistance_normalised_load?: number | '';
  /**
   * Kept empty. Foster session load lives only in fact_football_load.csv.
   * Column retained so existing Power BI models do not break.
   */
  reported_session_load: number | '';
  /**
   * Kept empty. Do not estimate Foster load from set RPE.
   * Column retained so existing Power BI models do not break.
   */
  estimated_session_load: number | '';
}

// ---------------------------------------------------------------------------
// fact_wellness.csv
// ---------------------------------------------------------------------------

export interface FactWellnessRow {
  athlete_id: string;
  athlete_name: string;
  date: string;
  logged_date: string;      // YYYY-MM-DD
  logged_at: string;
  sleep_quality: number | '';
  fatigue: number | '';
  muscle_soreness: number | '';
  stress: number | '';
  mood: number | '';
  readiness: number | '';
  notes: string;
}

// ---------------------------------------------------------------------------
// fact_football_load.csv
// ---------------------------------------------------------------------------

/**
 * Sports-load / football-load export row.
 *
 * The ZIP emits `fact_football_load.csv` only, so existing Power BI reports
 * that reference that filename keep working. Rows can be any sport logged
 * on the Sports Load page; football is the default when none is chosen.
 */
export interface FactSportsLoadRow {
  athlete_id: string;
  athlete_name: string;
  session_id: string;       // SportsLoadSession.id or legacy-{YYYY-MM-DD}
  session_name: string;
  date: string;
  logged_date: string;      // YYYY-MM-DD
  logged_at: string;
  sport_type: string;
  sport_name: string;
  rpe: number | '';
  duration_min: number | '';
  /** Foster load = rpe × duration_min. Canonical sports-load metric. */
  session_load: number | '';
  distance_meters: number | '';
  calories: number | '';
  avg_hr: number | '';
  max_hr: number | '';
  notes: string;
}

export type FactFootballLoadRow = FactSportsLoadRow;

export const FACT_SPORTS_LOAD_HEADERS = [
  'athlete_id',
  'athlete_name',
  'session_id',
  'session_name',
  'date',
  'logged_date',
  'logged_at',
  'sport_type',
  'sport_name',
  'rpe',
  'duration_min',
  'session_load',
  'distance_meters',
  'calories',
  'avg_hr',
  'max_hr',
  'notes',
] as const satisfies readonly (keyof FactSportsLoadRow)[];

export const FACT_FOOTBALL_LOAD_HEADERS = FACT_SPORTS_LOAD_HEADERS;

type MissingFactSportsLoadHeader = Exclude<
  keyof FactSportsLoadRow,
  typeof FACT_SPORTS_LOAD_HEADERS[number]
>;

export type FactSportsLoadHeaderCoverage =
  MissingFactSportsLoadHeader extends never ? true : never;
export type FactFootballLoadHeaderCoverage = FactSportsLoadHeaderCoverage;

export const FACT_SPORTS_LOAD_HEADER_COVERAGE: FactSportsLoadHeaderCoverage = true;
export const FACT_FOOTBALL_LOAD_HEADER_COVERAGE: FactFootballLoadHeaderCoverage = true;

// ---------------------------------------------------------------------------
// export_meta.json
// ---------------------------------------------------------------------------

export interface ExportMetaFile {
  name: string;
  grain: PowerBiExportGrain;
  row_count: number;
}

export interface ExportMetaColumn {
  name: string;
  files: string[];
  grain: PowerBiExportGrain | 'mixed';
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  unit?: string;
  formula?: string;
  range?: string;
  alias_of?: string;
}

export interface ExportMeta {
  exported_at: string;        // ISO 8601
  exported_by: string;        // userId of the exporting user
  scope: PowerBiExportScope;
  from_date: string | null;   // YYYY-MM-DD or null
  to_date: string | null;     // YYYY-MM-DD or null
  athlete_count: number;
  row_count: number;          // logical fact rows
  files: ExportMetaFile[];
  columns: ExportMetaColumn[];
  notes: string[];
}

export const POWER_BI_EXPORT_NOTES: string[] = [
  'Foster session load lives only in fact_football_load.csv: session_load = rpe × duration_min.',
  'fact_football_load.csv is named for Power BI compatibility; rows are any sport logged on Sports Load. football is the default sport.',
  'fact_sessions.csv may list the same session_id so diaries join. Do not sum fact_sessions load columns with fact_football_load.session_load.',
  'Gym set rpe on fact_gym_sets.csv is set-level RPE, not session RPE.',
  'avg_set_rpe on fact_sessions.csv is a mean of gym/activity set RPEs, not Foster session RPE.',
  'distance_meters, calories, avg_hr, and max_hr on fact_football_load.csv are optional manual fields, not GPS.',
  'date and logged_date are the same calendar day. logged_at is a timestamp when one exists.',
];

export const POWER_BI_EXPORT_COLUMNS: ExportMetaColumn[] = [
  { name: 'athlete_id', files: ['dim_athlete.csv', 'fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_wellness.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'string' },
  { name: 'athlete_name', files: ['dim_athlete.csv', 'fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_wellness.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'string' },
  { name: 'session_id', files: ['fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'string' },
  { name: 'date', files: ['fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_wellness.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'date', unit: 'YYYY-MM-DD', formula: 'calendar day of the observation' },
  { name: 'logged_date', files: ['fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_wellness.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'date', unit: 'YYYY-MM-DD', alias_of: 'date' },
  { name: 'logged_at', files: ['fact_gym_sets.csv', 'fact_activity.csv', 'fact_sessions.csv', 'fact_wellness.csv', 'fact_football_load.csv'], grain: 'mixed', type: 'datetime', unit: 'local YYYY-MM-DDTHH:mm:ss' },
  { name: 'rpe', files: ['fact_gym_sets.csv', 'fact_activity.csv'], grain: 'player-set', type: 'number', range: 'typically 1-10', formula: 'set-level RPE; not session RPE' },
  { name: 'rpe', files: ['fact_football_load.csv'], grain: 'player-session', type: 'number', unit: 'CR-10', range: '1-10', formula: 'session RPE logged on Sports Load' },
  { name: 'duration_min', files: ['fact_football_load.csv'], grain: 'player-session', type: 'number', unit: 'minutes', formula: 'Sports Load duration' },
  { name: 'duration_min', files: ['fact_sessions.csv'], grain: 'player-session', type: 'number', unit: 'minutes', formula: 'sports-load minutes, else activity duration, else session clock' },
  { name: 'session_load', files: ['fact_football_load.csv'], grain: 'player-session', type: 'number', unit: 'AU', formula: 'rpe × duration_min (Foster)', range: 'positive when both inputs exist' },
  { name: 'sport_type', files: ['fact_football_load.csv'], grain: 'player-session', type: 'string', formula: 'Sports Load sport key; default football' },
  { name: 'sport_name', files: ['fact_football_load.csv'], grain: 'player-session', type: 'string' },
  { name: 'distance_meters', files: ['fact_football_load.csv', 'fact_activity.csv'], grain: 'mixed', type: 'number', unit: 'm', formula: 'optional manual entry on Sports Load / activity logs' },
  { name: 'calories', files: ['fact_football_load.csv', 'fact_activity.csv', 'fact_sessions.csv'], grain: 'mixed', type: 'number', unit: 'kcal', formula: 'optional manual entry' },
  { name: 'avg_hr', files: ['fact_football_load.csv', 'fact_activity.csv', 'fact_sessions.csv'], grain: 'mixed', type: 'number', unit: 'bpm', formula: 'optional manual entry' },
  { name: 'max_hr', files: ['fact_football_load.csv', 'fact_activity.csv', 'fact_sessions.csv'], grain: 'mixed', type: 'number', unit: 'bpm', formula: 'optional manual entry' },
  { name: 'avg_set_rpe', files: ['fact_sessions.csv'], grain: 'player-session', type: 'number', formula: 'mean of gym/activity set RPEs; not session RPE' },
  { name: 'reported_session_load', files: ['fact_sessions.csv'], grain: 'player-session', type: 'number', formula: 'always empty; use fact_football_load.session_load' },
  { name: 'estimated_session_load', files: ['fact_sessions.csv'], grain: 'player-session', type: 'number', formula: 'always empty; do not estimate Foster from set RPE' },
  { name: 'sleep_quality', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
  { name: 'fatigue', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
  { name: 'muscle_soreness', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
  { name: 'stress', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
  { name: 'mood', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
  { name: 'readiness', files: ['fact_wellness.csv'], grain: 'player-day', type: 'number' },
];
