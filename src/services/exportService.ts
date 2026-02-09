import { db } from './firebase/config';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { getUserWorkouts } from './firebase/workouts';
import { ExerciseLog } from '@/types/exercise';
import { DifficultyCategory } from '@/types/difficulty';

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
      // Build query with optional date range filtering
      const exercisesRef = collection(db, 'users', userId, 'exercises');
      let exerciseLogsQuery;
      
      if (startDate && endDate) {
        exerciseLogsQuery = query(
          exercisesRef,
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
      } else if (startDate) {
        exerciseLogsQuery = query(
          exercisesRef,
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc')
        );
      } else if (endDate) {
        exerciseLogsQuery = query(
          exercisesRef,
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
      } else {
        exerciseLogsQuery = query(
          exercisesRef,
          orderBy('timestamp', 'desc')
        );
      }

      const exerciseLogsSnapshot = await getDocs(exerciseLogsQuery);
      const exerciseLogs: ExerciseLog[] = [];

      exerciseLogsSnapshot.forEach(doc => {
        const data = doc.data();
        const log: ExerciseLog = {
          id: doc.id,
          exerciseName: data.exerciseName,
          sets: data.sets || [],
          timestamp: data.timestamp?.toDate?.() || (data.timestamp && !isNaN(new Date(data.timestamp).getTime()) ? new Date(data.timestamp) : new Date()),
          deviceId: data.deviceId,
          userId: data.userId,
          exerciseType: data.exerciseType,
          activityType: data.activityType
        };
        exerciseLogs.push(log);
      });

      if (includeExerciseLogs) {
        results.exerciseLogs = exerciseLogs.map(log => {
          const totalReps = log.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
          const maxWeight = Math.max(...log.sets.map(set => set.weight || 0));
          const totalVolume = log.sets.reduce((sum, set) => sum + ((set.reps || 0) * (set.weight || 0)), 0);
          const averageRPE = log.sets.length > 0
            ? log.sets.reduce((sum, set) => sum + (set.rpe || 0), 0) / log.sets.length
            : 0;

          return {
            userId,
            sessionId: '', // TODO: link to session if available
            exerciseLogId: log.id,
            exerciseId: '', // TODO: get exercise ID
            exerciseName: log.exerciseName,
            category: log.exerciseType || '',
            type: log.activityType || '',
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
        results.sets = exerciseLogs.flatMap(log =>
          log.sets.map((set, index) => ({
            userId,
            sessionId: '', // TODO: link to session
            exerciseLogId: log.id,
            exerciseName: log.exerciseName,
            exerciseType: log.exerciseType || '',
            activityType: log.activityType || '',
            loggedDate: log.timestamp ? log.timestamp.toISOString().split('T')[0] : '',
            loggedTimestamp: safeDateToISOString(log.timestamp),
            setNumber: index + 1,
            reps: set.reps || 0,
            weight: set.weight || 0,
            durationSec: set.duration || 0,
            distanceMeters: set.distance || 0,
            rpe: set.rpe || 0,
            rir: set.rir || 0,
            restTimeSec: set.restTime || 0,
            isWarmup: set.difficulty === DifficultyCategory.WARMUP,
            setVolume: (set.reps || 0) * (set.weight || 0),
            comment: set.comment || '',
            notes: set.notes || '',
            hrZone1: set.hrZone1 || 0,
            hrZone2: set.hrZone2 || 0,
            hrZone3: set.hrZone3 || 0,
            hrZone4: set.hrZone4 || 0,
            hrZone5: set.hrZone5 || 0,
            averageHR: set.averageHeartRate || set.averageHeartRate || 0,
            maxHR: set.maxHeartRate || set.maxHeartRate || 0,
            heartRate: set.heartRate || 0,
            calories: set.calories || 0,
            height: set.height || 0,
            performance: set.performance || '',
            stretchType: set.stretchType || '',
            intensity: set.intensity || 0,
            bodyPart: set.bodyPart || '',
            holdTime: set.holdTime || 0,
            flexibility: set.flexibility || 0,
            pace: set.pace || '',
            elevation: set.elevation || 0
          }))
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
  try {
    const data = await exportData(userId, {
      includeSessions: true,
      includeExerciseLogs: true,
      includeSets: true,
      startDate,
      endDate
    });

    return {
      sessionCount: data.sessions.length,
      exerciseCount: data.exerciseLogs.length,
      setCount: data.sets.length
    };
  } catch (error) {
    console.error('Error getting export preview:', error);
    return { sessionCount: 0, exerciseCount: 0, setCount: 0 };
  }
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
      const headers = ['loggedDate', 'exerciseName', 'setNumber', 'weight', 'reps', 'rpe', 'rir', 'setVolume', 'isWarmup', 'restTimeSec', 'comment'];
      
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
      const headers = ['loggedDate', 'exerciseName', 'setNumber', 'durationSec', 'distanceMeters', 'pace', 'averageHR', 'maxHR', 'hrZone1', 'hrZone2', 'hrZone3', 'hrZone4', 'hrZone5', 'calories', 'elevation', 'comment'];
      
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
        durationSec: `Total: ${totalDuration}`,
        distanceMeters: `Total: ${totalDistance}`,
        pace: '',
        averageHR: avgHR > 0 ? `Avg: ${avgHR.toFixed(0)}` : '',
        maxHR: '',
        hrZone1: '',
        hrZone2: '',
        hrZone3: '',
        hrZone4: '',
        hrZone5: '',
        calories: `Total: ${totalCalories}`,
        elevation: '',
        comment: ''
      };

      downloadCSV([...enduranceSets, summaryRow], headers, 'endurance_sets.csv');
      exportedFiles++;
    }

    // Export Speed & Agility Sets
    if (setsByActivityType.speedAgility.length > 0) {
      const speedAgilitySets = setsByActivityType.speedAgility;
      const headers = ['loggedDate', 'exerciseName', 'setNumber', 'reps', 'durationSec', 'height', 'performance', 'intensity', 'comment'];
      
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
        height: avgHeight > 0 ? `Avg: ${avgHeight.toFixed(1)}` : '',
        performance: '',
        intensity: '',
        comment: ''
      };

      downloadCSV([...speedAgilitySets, summaryRow], headers, 'speed_agility_sets.csv');
      exportedFiles++;
    }

    // Export Stretching Sets
    if (setsByActivityType.stretching.length > 0) {
      const stretchingSets = setsByActivityType.stretching;
      const headers = ['loggedDate', 'exerciseName', 'setNumber', 'holdTime', 'intensity', 'bodyPart', 'stretchType', 'flexibility', 'comment'];
      
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
        holdTime: `Total: ${totalHoldTime}`,
        intensity: avgIntensity > 0 ? `Avg: ${avgIntensity.toFixed(1)}` : '',
        bodyPart: '',
        stretchType: '',
        flexibility: avgFlexibility > 0 ? `Avg: ${avgFlexibility.toFixed(1)}` : '',
        comment: ''
      };

      downloadCSV([...stretchingSets, summaryRow], headers, 'stretching_sets.csv');
      exportedFiles++;
    }

    // Export Sport Sets
    if (setsByActivityType.sport.length > 0) {
      const sportSets = setsByActivityType.sport;
      const headers = ['loggedDate', 'exerciseName', 'setNumber', 'durationSec', 'intensity', 'heartRate', 'calories', 'performance', 'comment'];
      
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
        durationSec: `Total: ${totalDuration}`,
        intensity: avgIntensity > 0 ? `Avg: ${avgIntensity.toFixed(1)}` : '',
        heartRate: '',
        calories: `Total: ${totalCalories}`,
        performance: '',
        comment: ''
      };

      downloadCSV([...sportSets, summaryRow], headers, 'sport_sets.csv');
      exportedFiles++;
    }

    // Export Other Sets (fallback)
    if (setsByActivityType.other.length > 0) {
      const otherSets = setsByActivityType.other;
      const headers = ['loggedDate', 'exerciseName', 'activityType', 'setNumber', 'reps', 'weight', 'durationSec', 'comment'];
      
      const summaryRow = {
        loggedDate: 'SUMMARY',
        exerciseName: `Total Sets: ${otherSets.length}`,
        activityType: '',
        setNumber: '',
        reps: '',
        weight: '',
        durationSec: '',
        comment: ''
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

