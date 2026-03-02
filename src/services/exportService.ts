import { getUserWorkouts } from './firebase/workouts';
import { DifficultyCategory } from '@/types/difficulty';
import { ActivityType } from '@/types/activityTypes';
import { mapExerciseTypeToActivityType, normalizeActivityType } from '@/types/activityLog';
import { getAggregatedExportLogs } from '@/services/logAggregationService';
import { SupersetGroup } from '@/types/session';
import { buildSupersetLabels, SupersetLabelMetadata } from '@/utils/supersetUtils';
import { normalizeDistanceMeters, normalizeDurationSeconds } from '@/utils/activityFieldContract';

export interface ExportOptions {
  includeSessions?: boolean;
  includeExerciseLogs?: boolean;
  includeSets?: boolean;
  startDate?: Date;
  endDate?: Date;
  separateByActivityType?: boolean;
}

// Helper function to safely convert date to ISO string
const safeDateToISOString = (date: Date | any): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString();
};

const DEFAULT_EXPORT_START_DATE = new Date('1970-01-01T00:00:00.000Z');

const getDateKeyFromTimestamp = (timestamp: Date | undefined): string => {
  if (!timestamp) return '';
  return timestamp.toISOString().split('T')[0];
};

const toSafeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getSupersetNumberFromLabel = (label: string | undefined): string | null => {
  if (!label) return null;
  const match = label.trim().toLowerCase().match(/^(\d+)[a-z]+$/);
  return match ? match[1] : null;
};

const readLegacySupersetDataForDate = (dateKey: string): { supersets: SupersetGroup[]; exerciseOrder: string[] } => {
  try {
    const supersetsRaw = localStorage.getItem(`superset_data_${dateKey}`);
    const exerciseOrderRaw = localStorage.getItem(`exercise_order_${dateKey}`);

    const supersets = supersetsRaw ? (JSON.parse(supersetsRaw) as SupersetGroup[]) : [];
    const exerciseOrder = exerciseOrderRaw ? (JSON.parse(exerciseOrderRaw) as string[]) : [];

    return {
      supersets: Array.isArray(supersets) ? supersets : [],
      exerciseOrder: Array.isArray(exerciseOrder) ? exerciseOrder : [],
    };
  } catch (error) {
    console.warn('Failed to parse legacy superset data for export fallback:', error);
    return { supersets: [], exerciseOrder: [] };
  }
};

const getDateRange = (startDate?: Date, endDate?: Date) => {
  const start = new Date(startDate || DEFAULT_EXPORT_START_DATE);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate || new Date());
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const inferActivityTypeFromSetShape = (sets: Array<Record<string, any>>): ActivityType | undefined => {
  if (!Array.isArray(sets) || sets.length === 0) {
    return undefined;
  }

  const hasMetric = (predicate: (set: Record<string, any>) => boolean): boolean =>
    sets.some((set) => predicate(set || {}));

  if (hasMetric((set) => set.drillMetric !== undefined || set.restTime !== undefined || set.height !== undefined)) {
    return ActivityType.SPEED_AGILITY;
  }

  if (hasMetric((set) => set.stretchType !== undefined || set.holdTime !== undefined || set.flexibility !== undefined || set.bodyPart !== undefined)) {
    return ActivityType.STRETCHING;
  }

  if (hasMetric((set) => set.score !== undefined || set.opponent !== undefined || set.teamBased === true)) {
    return ActivityType.SPORT;
  }

  if (hasMetric((set) => set.pace !== undefined || set.elevation !== undefined || set.hrZone1 !== undefined || set.hrZone2 !== undefined || set.hrZone3 !== undefined || set.hrZone4 !== undefined || set.hrZone5 !== undefined)) {
    return ActivityType.ENDURANCE;
  }

  if (hasMetric((set) => set.duration !== undefined || set.time !== undefined || set.distance !== undefined || set.calories !== undefined || set.heartRate !== undefined || set.averageHeartRate !== undefined || set.maxHeartRate !== undefined)) {
    return ActivityType.OTHER;
  }

  return undefined;
};

const resolveExportActivityType = (log: Record<string, any>, defaultType: ActivityType = ActivityType.OTHER): ActivityType => {
  if (log.activityType) {
    return normalizeActivityType(log.activityType);
  }

  if (log.exerciseType) {
    return normalizeActivityType(mapExerciseTypeToActivityType(String(log.exerciseType)));
  }

  const inferredFromSets = inferActivityTypeFromSetShape(Array.isArray(log.sets) ? log.sets : []);
  return inferredFromSets || defaultType;
};

const removeUndefinedFields = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }

  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned as T;
  }

  return obj;
};

const readNumericSetValue = (set: Record<string, unknown>, key: string): number => {
  const value = set[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

export const serializeSetForExport = (
  userId: string,
  log: {
    id: string;
    exerciseName: string;
    collectionType: string;
    activityType: ActivityType;
    timestamp: Date;
    supersetId?: string;
    supersetLabel?: string;
    supersetName?: string;
  },
  set: Record<string, any>,
  index: number
) => {
  const normalizedDurationSec = normalizeDurationSeconds(set.duration, log.activityType);
  const normalizedDistanceMeters = normalizeDistanceMeters(set.distance, log.activityType);

  return removeUndefinedFields({
    userId,
    sessionId: '',
    exerciseLogId: log.id,
    exerciseName: log.exerciseName,
    exerciseType: log.collectionType,
    activityType: log.activityType,
    supersetId: log.supersetId || '',
    supersetLabel: log.supersetLabel || '',
    supersetName: log.supersetName || '',
    loggedDate: log.timestamp ? log.timestamp.toISOString().split('T')[0] : '',
    loggedTimestamp: safeDateToISOString(log.timestamp),
    setNumber: index + 1,
    reps: set.reps ?? 0,
    weight: set.weight ?? 0,
    duration: set.duration ?? 0,
    distance: set.distance ?? 0,
    durationSec: normalizedDurationSec,
    distanceMeters: normalizedDistanceMeters,
    rpe: set.rpe ?? 0,
    rir: set.rir ?? 0,
    restTime: set.restTime ?? 0,
    restTimeSec: set.restTime ?? 0,
    isWarmup: set.difficulty === DifficultyCategory.WARMUP,
    difficulty: set.difficulty || '',
    setVolume: (set.reps || 0) * (set.weight || 0),
    comment: set.comment || '',
    notes: set.notes || '',
    hrZone1: set.hrZone1 ?? 0,
    hrZone2: set.hrZone2 ?? 0,
    hrZone3: set.hrZone3 ?? 0,
    hrZone4: set.hrZone4 ?? 0,
    hrZone5: set.hrZone5 ?? 0,
    averageHeartRate: set.averageHeartRate ?? 0,
    maxHeartRate: set.maxHeartRate ?? 0,
    heartRate: set.heartRate ?? 0,
    averageHR: set.averageHeartRate ?? 0,
    maxHR: set.maxHeartRate ?? 0,
    calories: set.calories ?? 0,
    height: set.height ?? 0,
    drillMetric: set.drillMetric || '',
    performance: set.performance || '',
    score: set.score ?? 0,
    opponent: set.opponent || '',
    stretchType: set.stretchType || '',
    intensity: set.intensity ?? 0,
    bodyPart: set.bodyPart || '',
    holdTime: set.holdTime ?? 0,
    flexibility: set.flexibility ?? 0,
    pace: set.pace || '',
    elevation: set.elevation ?? 0,
    timestamp: safeDateToISOString(set.timestamp)
  });
};

export const exportData = async (userId: string, options: ExportOptions = {}) => {
  const {
    includeSessions = true,
    includeExerciseLogs = true,
    includeSets = true,
    startDate,
    endDate
  } = options;

  const results = {
    sessions: [] as any[],
    exerciseLogs: [] as any[],
    sets: [] as any[]
  };

  try {
    // Export sessions
    if (includeSessions) {
      let sessions = await getUserWorkouts(userId);
      
      // Filter by date range if provided
      if (startDate || endDate) {
        sessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          if (startDate && sessionDate < startDate) return false;
          if (endDate && sessionDate > endDate) return false;
          return true;
        });
      }
      
      results.sessions = sessions.map(session => ({
        userId: session.userId,
        sessionId: session.id,
        sessionDate: session.date,
        startTime: '', // Not available in current data
        endTime: '', // Not available in current data
        notes: session.notes || '',
        totalVolume: session.totalVolume || 0,
        sessionRPE: session.sessionRPE || 0,
        exerciseCount: session.exercises?.length || 0,
        setCount: session.exercises?.reduce((total, ex) => total + (ex.sets?.length || 0), 0) || 0,
        durationMinutes: 0, // TODO: calculate from timestamps
        createdAt: '', // Not available in current data
        updatedAt: '' // Not available in current data
      }));
    }

    // Export exercise logs
    if (includeExerciseLogs || includeSets) {
      const { start, end } = getDateRange(startDate, endDate);
      const aggregatedLogs = await getAggregatedExportLogs(userId, start, end);

      const unifiedLogs = aggregatedLogs
        .map((log) => ({
          ...log,
          activityType: resolveExportActivityType(log as Record<string, any>, ActivityType.OTHER),
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const inferredSupersetMetadataByLogId = new Map<string, {
        supersetId: string;
        supersetLabel: string;
        supersetName: string;
      }>();

      const inferredGroupByDateAndKey = new Map<string, {
        supersetId: string;
        supersetName: string;
      }>();

      unifiedLogs.forEach((log) => {
        const dateKey = getDateKeyFromTimestamp(log.timestamp);
        if (!dateKey) return;

        const providedId = String(log.supersetId || '').trim();
        const providedLabel = String(log.supersetLabel || '').trim();
        const providedName = String(log.supersetName || '').trim();
        const labelSupersetNumber = getSupersetNumberFromLabel(providedLabel);

        const groupKey = providedId
          ? `id:${providedId}`
          : labelSupersetNumber
            ? `label:${labelSupersetNumber}`
            : providedName
              ? `name:${toSafeKey(providedName)}`
              : '';

        if (!groupKey) return;

        const mapKey = `${dateKey}|${groupKey}`;
        const existing = inferredGroupByDateAndKey.get(mapKey);
        if (!existing) {
          const fallbackIdSeed = labelSupersetNumber
            ? `label-${labelSupersetNumber}`
            : providedName
              ? `name-${toSafeKey(providedName)}`
              : `id-${toSafeKey(providedId)}`;

          inferredGroupByDateAndKey.set(mapKey, {
            supersetId: providedId || `legacy-superset-${dateKey}-${fallbackIdSeed}`,
            supersetName: providedName || (labelSupersetNumber ? `Superset ${labelSupersetNumber}` : 'Superset')
          });
        }
      });

      unifiedLogs.forEach((log) => {
        const dateKey = getDateKeyFromTimestamp(log.timestamp);
        if (!dateKey) return;

        const providedId = String(log.supersetId || '').trim();
        const providedLabel = String(log.supersetLabel || '').trim();
        const providedName = String(log.supersetName || '').trim();
        const labelSupersetNumber = getSupersetNumberFromLabel(providedLabel);

        const groupKey = providedId
          ? `id:${providedId}`
          : labelSupersetNumber
            ? `label:${labelSupersetNumber}`
            : providedName
              ? `name:${toSafeKey(providedName)}`
              : '';

        if (!groupKey) return;

        const groupMeta = inferredGroupByDateAndKey.get(`${dateKey}|${groupKey}`);
        if (!groupMeta) return;

        inferredSupersetMetadataByLogId.set(log.id, {
          supersetId: groupMeta.supersetId,
          supersetLabel: providedLabel,
          supersetName: providedName || groupMeta.supersetName
        });
      });

      const legacyLabelCacheByDate = new Map<string, Record<string, SupersetLabelMetadata>>();

      const resolveSupersetMetadata = (log: {
        id: string;
        timestamp: Date;
        supersetId?: string;
        supersetLabel?: string;
        supersetName?: string;
      }) => {
        const inferredMeta = inferredSupersetMetadataByLogId.get(log.id);
        if (inferredMeta) {
          return inferredMeta;
        }

        if (log.supersetLabel || log.supersetId || log.supersetName) {
          const labelSupersetNumber = getSupersetNumberFromLabel(log.supersetLabel);
          const derivedSupersetId = log.supersetId || (labelSupersetNumber
            ? `legacy-superset-${getDateKeyFromTimestamp(log.timestamp)}-label-${labelSupersetNumber}`
            : '');

          return {
            supersetId: derivedSupersetId,
            supersetLabel: log.supersetLabel || '',
            supersetName: log.supersetName || (labelSupersetNumber ? `Superset ${labelSupersetNumber}` : ''),
          };
        }

        const dateKey = getDateKeyFromTimestamp(log.timestamp);
        if (!dateKey) {
          return { supersetId: '', supersetLabel: '', supersetName: '' };
        }

        if (!legacyLabelCacheByDate.has(dateKey)) {
          const { supersets, exerciseOrder } = readLegacySupersetDataForDate(dateKey);
          legacyLabelCacheByDate.set(dateKey, buildSupersetLabels(supersets, exerciseOrder));
        }

        const labelsByExerciseId = legacyLabelCacheByDate.get(dateKey) || {};
        const fallback = labelsByExerciseId[log.id];

        return {
          supersetId: fallback?.supersetId || '',
          supersetLabel: fallback?.label || '',
          supersetName: fallback?.supersetName || '',
        };
      };

      if (includeExerciseLogs) {
        results.exerciseLogs = unifiedLogs.map(log => {
          const supersetMeta = resolveSupersetMetadata(log);
          const totalReps = log.sets.reduce((sum, set) => sum + readNumericSetValue(set, 'reps'), 0);
          const maxWeight = log.sets.length > 0
            ? Math.max(...log.sets.map(set => readNumericSetValue(set, 'weight')))
            : 0;
          const totalVolume = log.sets.reduce(
            (sum, set) => sum + (readNumericSetValue(set, 'reps') * readNumericSetValue(set, 'weight')),
            0
          );
          const averageRPE = log.sets.length > 0
            ? log.sets.reduce((sum, set) => sum + readNumericSetValue(set, 'rpe'), 0) / log.sets.length
            : 0;

          return {
            userId,
            sessionId: '', // TODO: link to session if available
            exerciseLogId: log.id,
            exerciseId: '', // TODO: get exercise ID
            exerciseName: log.exerciseName,
            supersetId: supersetMeta.supersetId,
            supersetLabel: supersetMeta.supersetLabel,
            supersetName: supersetMeta.supersetName,
            category: log.collectionType,
            type: log.activityType,
            setCount: log.sets.length,
            totalReps,
            maxWeight,
            totalVolume,
            averageRPE,
            notes: log.sets.map(set => set.comment || set.notes || '').filter(n => n).join('; '),
            createdAt: safeDateToISOString(log.timestamp)
          };
        });
      }

      if (includeSets) {
        results.sets = unifiedLogs.flatMap(log =>
          log.sets.map((set, index) => {
            const supersetMeta = resolveSupersetMetadata(log);
            return serializeSetForExport(
              userId,
              {
                ...log,
                supersetId: supersetMeta.supersetId,
                supersetLabel: supersetMeta.supersetLabel,
                supersetName: supersetMeta.supersetName,
              },
              set,
              index
            );
          })
        );
      }
    }

    return results;
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to export data: ${errorMessage}`);
  }
};

export interface ExportPreview {
  sessionCount: number;
  exerciseCount: number;
  setCount: number;
}

/**
 * Get a preview of how much data will be exported for the given date range
 */
export const getExportPreview = async (userId: string, startDate?: Date, endDate?: Date): Promise<ExportPreview> => {
  const [sessionsResult, logsResult] = await Promise.allSettled([
    exportData(userId, {
      includeSessions: true,
      includeExerciseLogs: false,
      includeSets: false,
      startDate,
      endDate,
    }),
    exportData(userId, {
      includeSessions: false,
      includeExerciseLogs: true,
      includeSets: true,
      startDate,
      endDate,
    }),
  ]);

  if (sessionsResult.status === 'rejected') {
    console.error('Error getting session preview count:', sessionsResult.reason);
  }

  if (logsResult.status === 'rejected') {
    console.error('Error getting exercise/set preview counts:', logsResult.reason);
    const reason = logsResult.reason instanceof Error
      ? logsResult.reason.message
      : String(logsResult.reason || 'Unknown error');
    throw new Error(`Failed to load export preview logs: ${reason}`);
  }

  return {
    sessionCount: sessionsResult.status === 'fulfilled' ? sessionsResult.value.sessions.length : 0,
    exerciseCount: logsResult.status === 'fulfilled' ? logsResult.value.exerciseLogs.length : 0,
    setCount: logsResult.status === 'fulfilled' ? logsResult.value.sets.length : 0,
  };
};

const arrayToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [headers.join(',')];
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
};

export const downloadCSV = (data: any[], headers: string[], filename: string) => {
  const csv = arrayToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download separate CSV files for each activity type with only relevant columns
 */
export const downloadActivityCSVs = async (userId: string, options: ExportOptions = {}) => {
  try {
    const data = await exportData(userId, options);
    
    if (!data.sets || data.sets.length === 0) {
      throw new Error('No sets found to export');
    }

    // Group sets by activity type
    const setsByActivityType: { [key: string]: any[] } = {
      resistance: [],
      endurance: [],
      speedAgility: [],
      stretching: [],
      sport: [],
      other: []
    };

    data.sets.forEach(set => {
      const activityType = set.activityType || 'other';
      const key = activityType === 'speed_agility' ? 'speedAgility' : activityType;
      if (setsByActivityType[key]) {
        setsByActivityType[key].push(set);
      } else {
        setsByActivityType.other.push(set);
      }
    });

    let exportedFiles = 0;

    // Export Resistance Training Sets
    if (setsByActivityType.resistance.length > 0) {
      const resistanceSets = setsByActivityType.resistance;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'setNumber', 'weight', 'reps', 'rpe', 'rir', 'setVolume', 'isWarmup', 'restTimeSec', 'comment'];
      
      // Calculate summary
      const totalVolume = resistanceSets.reduce((sum, set) => sum + (set.setVolume || 0), 0);
      const totalSets = resistanceSets.length;
      const avgRPE = resistanceSets.filter(s => s.rpe > 0).length > 0
        ? resistanceSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / resistanceSets.filter(s => s.rpe > 0).length
        : 0;
      const maxWeight = Math.max(...resistanceSets.map(s => s.weight || 0));

      // Add summary row
      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Sets: ${totalSets}`,
        setNumber: '',
        weight: `Max: ${maxWeight}`,
        reps: '',
        rpe: avgRPE > 0 ? `Avg: ${avgRPE.toFixed(1)}` : '',
        rir: '',
        setVolume: `Total: ${totalVolume}`,
        isWarmup: '',
        restTimeSec: '',
        comment: ''
      };

      downloadCSV([...resistanceSets, summaryRow], headers, 'resistance_sets.csv');
      exportedFiles++;
    }

    // Export Endurance Sets
    if (setsByActivityType.endurance.length > 0) {
      const enduranceSets = setsByActivityType.endurance;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'setNumber', 'reps', 'duration', 'distance', 'durationSec', 'distanceMeters', 'rpe', 'pace', 'averageHeartRate', 'maxHeartRate', 'averageHR', 'maxHR', 'hrZone1', 'hrZone2', 'hrZone3', 'hrZone4', 'hrZone5', 'calories', 'elevation', 'comment', 'notes'];
      
      // Calculate summary
      const totalDuration = enduranceSets.reduce((sum, set) => sum + (set.durationSec || 0), 0);
      const totalDistance = enduranceSets.reduce((sum, set) => sum + (set.distanceMeters || 0), 0);
      const totalCalories = enduranceSets.reduce((sum, set) => sum + (set.calories || 0), 0);
      const avgHR = enduranceSets.filter(s => s.averageHR > 0).length > 0
        ? enduranceSets.reduce((sum, set) => sum + (set.averageHR || 0), 0) / enduranceSets.filter(s => s.averageHR > 0).length
        : 0;

      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Sessions: ${enduranceSets.length}`,
        setNumber: '',
        reps: '',
        duration: '',
        distance: '',
        durationSec: `Total: ${totalDuration}`,
        distanceMeters: `Total: ${totalDistance}`,
        rpe: '',
        pace: '',
        averageHeartRate: avgHR > 0 ? `Avg: ${avgHR.toFixed(0)}` : '',
        maxHeartRate: '',
        averageHR: avgHR > 0 ? `Avg: ${avgHR.toFixed(0)}` : '',
        maxHR: '',
        hrZone1: '',
        hrZone2: '',
        hrZone3: '',
        hrZone4: '',
        hrZone5: '',
        calories: `Total: ${totalCalories}`,
        elevation: '',
        comment: '',
        notes: ''
      };

      downloadCSV([...enduranceSets, summaryRow], headers, 'endurance_sets.csv');
      exportedFiles++;
    }

    // Export Speed & Agility Sets
    if (setsByActivityType.speedAgility.length > 0) {
      const speedAgilitySets = setsByActivityType.speedAgility;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'setNumber', 'reps', 'durationSec', 'distanceMeters', 'height', 'rpe', 'restTimeSec', 'drillMetric', 'performance', 'intensity', 'comment', 'notes'];
      
      // Calculate summary
      const totalReps = speedAgilitySets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const totalDuration = speedAgilitySets.reduce((sum, set) => sum + (set.durationSec || 0), 0);
      const avgHeight = speedAgilitySets.filter(s => s.height > 0).length > 0
        ? speedAgilitySets.reduce((sum, set) => sum + (set.height || 0), 0) / speedAgilitySets.filter(s => s.height > 0).length
        : 0;

      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Drills: ${speedAgilitySets.length}`,
        setNumber: '',
        reps: `Total: ${totalReps}`,
        durationSec: `Total: ${totalDuration}`,
        distanceMeters: '',
        height: avgHeight > 0 ? `Avg: ${avgHeight.toFixed(1)}` : '',
        rpe: '',
        restTimeSec: '',
        drillMetric: '',
        performance: '',
        intensity: '',
        comment: '',
        notes: ''
      };

      downloadCSV([...speedAgilitySets, summaryRow], headers, 'speed_agility_sets.csv');
      exportedFiles++;
    }

    // Export Stretching Sets
    if (setsByActivityType.stretching.length > 0) {
      const stretchingSets = setsByActivityType.stretching;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'setNumber', 'reps', 'durationSec', 'holdTime', 'rpe', 'intensity', 'bodyPart', 'stretchType', 'flexibility', 'comment', 'notes'];
      
      // Calculate summary
      const totalHoldTime = stretchingSets.reduce((sum, set) => sum + (set.holdTime || 0), 0);
      const avgIntensity = stretchingSets.filter(s => s.intensity > 0).length > 0
        ? stretchingSets.reduce((sum, set) => sum + (set.intensity || 0), 0) / stretchingSets.filter(s => s.intensity > 0).length
        : 0;
      const avgFlexibility = stretchingSets.filter(s => s.flexibility > 0).length > 0
        ? stretchingSets.reduce((sum, set) => sum + (set.flexibility || 0), 0) / stretchingSets.filter(s => s.flexibility > 0).length
        : 0;

      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Stretches: ${stretchingSets.length}`,
        setNumber: '',
        reps: '',
        durationSec: '',
        holdTime: `Total: ${totalHoldTime}`,
        rpe: '',
        intensity: avgIntensity > 0 ? `Avg: ${avgIntensity.toFixed(1)}` : '',
        bodyPart: '',
        stretchType: '',
        flexibility: avgFlexibility > 0 ? `Avg: ${avgFlexibility.toFixed(1)}` : '',
        comment: '',
        notes: ''
      };

      downloadCSV([...stretchingSets, summaryRow], headers, 'stretching_sets.csv');
      exportedFiles++;
    }

    // Export Sport Sets
    if (setsByActivityType.sport.length > 0) {
      const sportSets = setsByActivityType.sport;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'setNumber', 'reps', 'durationSec', 'distanceMeters', 'rpe', 'intensity', 'heartRate', 'calories', 'score', 'opponent', 'performance', 'comment', 'notes'];
      
      // Calculate summary
      const totalDuration = sportSets.reduce((sum, set) => sum + (set.durationSec || 0), 0);
      const totalCalories = sportSets.reduce((sum, set) => sum + (set.calories || 0), 0);
      const avgIntensity = sportSets.filter(s => s.intensity > 0).length > 0
        ? sportSets.reduce((sum, set) => sum + (set.intensity || 0), 0) / sportSets.filter(s => s.intensity > 0).length
        : 0;

      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Activities: ${sportSets.length}`,
        setNumber: '',
        reps: '',
        durationSec: `Total: ${totalDuration}`,
        distanceMeters: '',
        rpe: '',
        intensity: avgIntensity > 0 ? `Avg: ${avgIntensity.toFixed(1)}` : '',
        heartRate: '',
        calories: `Total: ${totalCalories}`,
        score: '',
        opponent: '',
        performance: '',
        comment: '',
        notes: ''
      };

      downloadCSV([...sportSets, summaryRow], headers, 'sport_sets.csv');
      exportedFiles++;
    }

    // Export Other Sets (fallback)
    if (setsByActivityType.other.length > 0) {
      const otherSets = setsByActivityType.other;
      const headers = ['loggedDate', 'exerciseName', 'supersetId', 'supersetLabel', 'supersetName', 'activityType', 'setNumber', 'reps', 'weight', 'duration', 'distance', 'durationSec', 'distanceMeters', 'height', 'rpe', 'intensity', 'pace', 'elevation', 'comment', 'notes'];
      
      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Sets: ${otherSets.length}`,
        activityType: '',
        setNumber: '',
        reps: '',
        weight: '',
        duration: '',
        distance: '',
        durationSec: '',
        distanceMeters: '',
        height: '',
        rpe: '',
        intensity: '',
        pace: '',
        elevation: '',
        comment: '',
        notes: ''
      };

      downloadCSV([...otherSets, summaryRow], headers, 'other_sets.csv');
      exportedFiles++;
    }

    return exportedFiles;
  } catch (error) {
    console.error('Activity-specific export error:', error);
    throw error;
  }
};

