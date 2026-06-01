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
  logged_date: string;       // YYYY-MM-DD
  exercise_order: number;    // 1-based order of exercise within the day
  set_number: number;
  reps: number | '';
  weight: number | '';
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
  exercise_name: string;
  activity_type: string;
  source_program_id?: string;
  source_program_name?: string;
  source_program_session_id?: string;
  source_program_session_name?: string;
  source_program_exercise_id?: string;
  logged_date: string;       // YYYY-MM-DD
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
  exercise_id: string;    // slug derived from exercise name
  exercise_name: string;
  exercise_type: string;  // collectionType / exerciseType
  activity_type: string;
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
  /** 'main' | 'warmup' */
  session_type: string;
  date: string;            // YYYY-MM-DD
  week_key: string;        // ISO week: YYYY-Www
  /** Pipe-separated distinct activity types in the session, e.g. "resistance|endurance" */
  activity_types: string;
  has_warmup: boolean;
  /** Minutes from activity duration or sports-load RPE report; empty for gym-only sessions without reliable duration. */
  duration_min: number | '';
  /** Resistance set rows only. Non-gym activities are tracked separately because they are not always true sets. */
  resistance_set_count: number;
  /** Non-resistance rows from fact_activity.csv. These may be activities, intervals, drills, or stretches. */
  activity_entry_count: number;
  /** Rows from fact_sports_load.csv merged into this session summary. */
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
  /** Simple average of RPE values recorded on contributing set/activity rows. Not a reported session RPE. */
  avg_set_rpe: number | '';
  /** Sum of resistance-set normalized load values. */
  resistance_normalised_load?: number | '';
  /** Explicit sRPE/session-load value reported in sports-load records. */
  reported_session_load: number | '';
  /** Estimated load = duration_min × avg_set_rpe when both are available. */
  estimated_session_load: number | '';
}

// ---------------------------------------------------------------------------
// fact_wellness.csv
// ---------------------------------------------------------------------------

export interface FactWellnessRow {
  athlete_id: string;
  athlete_name: string;
  logged_date: string;      // YYYY-MM-DD
  sleep_quality: number | '';
  fatigue: number | '';
  muscle_soreness: number | '';
  stress: number | '';
  mood: number | '';
  readiness: number | '';
  notes: string;
}

// ---------------------------------------------------------------------------
// fact_sports_load.csv / fact_football_load.csv
// ---------------------------------------------------------------------------

/**
 * Sports-load export row.
 *
 * `fact_sports_load.csv` is the canonical file. The historical
 * `fact_football_load.csv` file is still emitted with the same schema/content
 * for existing Power BI reports that reference it.
 */
export interface FactSportsLoadRow {
  athlete_id: string;
  athlete_name: string;
  session_id: string;       // SportsLoadSession.id or legacy-{YYYY-MM-DD}
  session_name: string;
  logged_date: string;      // YYYY-MM-DD
  sport_type: string;
  sport_name: string;
  rpe: number | '';
  duration_min: number | '';
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
  'logged_date',
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

export interface ExportMeta {
  exported_at: string;        // ISO 8601
  exported_by: string;        // userId of the exporting user
  scope: PowerBiExportScope;
  from_date: string | null;   // YYYY-MM-DD or null
  to_date: string | null;     // YYYY-MM-DD or null
  athlete_count: number;
  row_count: number;          // logical fact rows; compatibility aliases are counted once
}
