/**
 * Types for Power BI multi-athlete export system.
 * All column names are snake_case for Power BI compatibility.
 */

// ---------------------------------------------------------------------------
// Export scope
// ---------------------------------------------------------------------------

export type PowerBiExportScope = 'self' | 'athlete' | 'team';

export interface PowerBiExportOptions {
  /** Which dataset to export */
  scope: PowerBiExportScope;
  /** athleteId to export when scope === 'athlete' */
  targetAthleteId?: string;
  /** Only include rows where logged_date >= fromDate (ISO YYYY-MM-DD) */
  fromDate?: string;
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
  exercise_log_id: string;
  exercise_id: string;
  exercise_name: string;
  logged_date: string;       // YYYY-MM-DD
  exercise_order: number;    // 1-based order of exercise within the day
  set_number: number;
  reps: number | '';
  weight: number | '';
  rpe: number | '';
  rest_sec: number | '';
  is_warmup: boolean;
  tonnage: number | '';      // reps * weight, empty if either is missing
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
  exercise_log_id: string;
  exercise_name: string;
  activity_type: string;
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
  /** 'main' | 'warmup' */
  session_type: string;
  date: string;            // YYYY-MM-DD
  week_key: string;        // ISO week: YYYY-Www
  /** Pipe-separated distinct activity types in the session, e.g. "resistance|endurance" */
  activity_types: string;
  has_warmup: boolean;
  /** Minutes from session startedAt to endedAt (empty until Phase 2 end-time tracking) */
  duration_min: number | '';
  total_sets: number;
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
  /** Average RPE across all sets. Proxy for session RPE (1–10). */
  session_rpe: number | '';
  /** sRPE load = session_rpe × duration_min. Empty until duration is available. */
  session_load: number | '';
}

// ---------------------------------------------------------------------------
// fact_wellness.csv
// ---------------------------------------------------------------------------

export interface FactWellnessRow {
  athlete_id: string;
  logged_date: string;      // YYYY-MM-DD
  sleep_quality: number | '';
  fatigue: number | '';
  muscle_soreness: number | '';
  stress: number | '';
  mood: number | '';
  notes: string;
}

// ---------------------------------------------------------------------------
// export_meta.json
// ---------------------------------------------------------------------------

export interface ExportMeta {
  exported_at: string;        // ISO 8601
  exported_by: string;        // userId of the exporting user
  scope: PowerBiExportScope;
  from_date: string | null;   // YYYY-MM-DD or null
  athlete_count: number;
  row_count: number;          // total rows across all fact files
}
