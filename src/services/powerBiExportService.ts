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
  FactWellnessRow,
  PowerBiExportOptions,
} from '@/types/powerBiExport';
import { getWellnessByDateRange } from '@/services/wellnessService';
import { toLocalDateString, toLocalTimestamp } from '@/utils/dateUtils';
import { rowsToCSVForPowerBi } from '@/utils/powerBiCsv';
import { normalizeSessionType } from '@/types/sessionType';

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
  return {
    athlete_id: athleteId,
    athlete_name: athleteName,
    session_id: String(s.sessionId ?? ''),
    session_type: normalizeSessionType(s.sessionType),
    exercise_log_id: String(s.exerciseLogId ?? ''),
    exercise_id: toSlug(String(s.exerciseName ?? '')),
    exercise_name: String(s.exerciseName ?? ''),
    logged_date: toIsoDate(s.loggedDate ?? s.exerciseDate),
    exercise_order: typeof s.exerciseNumber === 'number' ? s.exerciseNumber : 0,
    set_number: typeof s.setNumber === 'number' ? s.setNumber : 0,
    reps: reps ?? '',
    weight: weight ?? '',
    rpe: toEmpty(s.rpe),
    rest_sec: toEmpty(s.restTimeSec ?? s.restTime),
    is_warmup: asBool(s.isWarmup),
    tonnage: reps !== null && weight !== null ? reps * weight : '',
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
// CSV serialiser
// ---------------------------------------------------------------------------

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
 * Generates and downloads a ZIP file containing Power BI-compatible CSVs.
 *
 * - scope 'self'    → only the current user's data
 * - scope 'athlete' → one specific athlete (requires coach role + relationship)
 * - scope 'team'    → all athletes the coach manages + coach's own data
 *
 * @param options         Export scope and optional incremental date filter
 * @param currentUser     Current user from Redux (id, name, role)
 */
export const downloadPowerBiZip = async (
  options: PowerBiExportOptions,
  currentUser: PowerBiExportCurrentUser
): Promise<PowerBiExportResult> => {
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

    // Wellness data for own account
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
    // For athlete/team scopes, load team metadata once
    const teams = await getCoachTeams();
    const membersPerTeam = await Promise.all(teams.map((t) => getTeamMembers(t.id)));
    const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

    // Helper: find member record and team name for a given athleteId
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
      if (!targetAthleteId) {
        throw new Error('targetAthleteId is required for athlete scope');
      }

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
      // Full team export — gather every unique athlete, then export with bounded concurrency.
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

          processRawSets(
            data.sets,
            athlete.id,
            athlete.athleteName,
            gymSets,
            activityRows,
            allRawSets
          );

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

      // Include the coach's own data at the top
      const selfData = await exportData(currentUser.id, exportOptions);
      if (selfData.sets.length > 0) {
        processRawSets(
          selfData.sets,
          currentUser.id,
          selfName,
          gymSets,
          activityRows,
          allRawSets
        );
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

  // ---- Build dimension tables ----
  const dimExercise = buildDimExercise(allRawSets);
  const wellnessRowCount = wellnessRows.length;

  const meta: ExportMeta = {
    exported_at: new Date().toISOString(),
    exported_by: coachId,
    scope,
    from_date: fromDate ?? null,
    athlete_count: dimAthletes.length,
    row_count: gymSets.length + activityRows.length + wellnessRowCount,
  };

  // ---- Column headers (snake_case order for Power BI) ----
  const gymSetHeaders: (keyof FactGymSetRow)[] = [
    'athlete_id',
    'athlete_name',
    'session_id',
    'session_type',
    'exercise_log_id',
    'exercise_id',
    'exercise_name',
    'logged_date',
    'exercise_order',
    'set_number',
    'reps',
    'weight',
    'rpe',
    'rest_sec',
    'is_warmup',
    'tonnage',
    'set_volume',
    'notes',
  ];

  const activityHeaders: (keyof FactActivityRow)[] = [
    'athlete_id',
    'athlete_name',
    'session_id',
    'session_type',
    'exercise_log_id',
    'exercise_name',
    'activity_type',
    'logged_date',
    'exercise_order',
    'set_number',
    'reps',
    'duration_sec',
    'distance_meters',
    'avg_hr',
    'max_hr',
    'hr_zone1',
    'hr_zone2',
    'hr_zone3',
    'hr_zone4',
    'hr_zone5',
    'calories',
    'rpe',
    'is_warmup',
    'hold_time',
    'intensity',
    'height',
    'notes',
  ];

  const dimExerciseHeaders: (keyof DimExerciseRow)[] = [
    'exercise_id',
    'exercise_name',
    'exercise_type',
    'activity_type',
  ];

  const dimAthleteHeaders: (keyof DimAthleteRow)[] = [
    'athlete_id',
    'athlete_name',
    'role',
    'team',
    'position',
    'date_of_birth',
    'active',
  ];

  // ---- Bundle as ZIP ----
  const dateStamp = toIsoDate(new Date());
  const zip = new JSZip();
  const folder = zip.folder(`training_export_${dateStamp}`)!;

  const wellnessHeaders: (keyof FactWellnessRow)[] = [
    'athlete_id',
    'logged_date',
    'sleep_quality',
    'fatigue',
    'muscle_soreness',
    'stress',
    'mood',
    'notes',
  ];

  folder.file('fact_gym_sets.csv', rowsToCSVForPowerBi(gymSets, gymSetHeaders));
  folder.file('fact_activity.csv', rowsToCSVForPowerBi(activityRows, activityHeaders));
  folder.file('fact_wellness.csv', rowsToCSVForPowerBi(wellnessRows, wellnessHeaders));
  folder.file('dim_exercise.csv', rowsToCSVForPowerBi(dimExercise, dimExerciseHeaders));
  folder.file('dim_athlete.csv', rowsToCSVForPowerBi(dimAthletes, dimAthleteHeaders));
  folder.file('export_meta.json', JSON.stringify(meta, null, 2));

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
    gymSetCount: gymSets.length,
    activityCount: activityRows.length,
    athleteCount: dimAthletes.length,
  };
};
