import { db } from './firebase/config';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { getUserWorkouts } from './firebase/workouts';
import { ExerciseLog } from '@/types/exercise';
import { DifficultyCategory } from '@/types/difficulty';

interface ExportOptions {
  includeSessions?: boolean;
  includeExerciseLogs?: boolean;
  includeSets?: boolean;
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
    includeSets = true
  } = options;

  const results = {
    sessions: [] as any[],
    exerciseLogs: [] as any[],
    sets: [] as any[]
  };

  try {
    // Export sessions
    if (includeSessions) {
      const sessions = await getUserWorkouts(userId);
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
      const exerciseLogsQuery = query(
        collection(db, 'users', userId, 'exercises'),
        orderBy('timestamp', 'desc')
      );

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
            averageHR: set.averageHR || set.averageHeartRate || 0,
            maxHR: set.maxHR || set.maxHeartRate || 0,
            heartRate: set.heartRate || 0,
            calories: set.calories || 0,
            height: set.height || 0,
            explosivePower: set.explosivePower || 0,
            reactivePower: set.reactivePower || 0,
            time: set.time || 0,
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
