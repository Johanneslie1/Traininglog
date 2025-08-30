import { getAllExercisesByDate } from './unifiedExerciseUtils';
import { getExerciseLogsByDate } from './localStorageUtils';
import { ActivityType } from '../types/activityTypes';

export interface DiagnosticReport {
  date: string;
  unifiedExercises: any[];
  localStorageExercises: any[];
  activityLogs: any[];
  discrepancies: string[];
  recommendations: string[];
}

export async function diagnoseExerciseLoading(date: Date, userId: string): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    date: date.toISOString(),
    unifiedExercises: [],
    localStorageExercises: [],
    activityLogs: [],
    discrepancies: [],
    recommendations: []
  };

  try {
    // 1. Get unified exercises (what the dashboard sees)
    console.log('🔍 Getting unified exercises...');
    const unifiedExercises = await getAllExercisesByDate(date, userId);
    report.unifiedExercises = unifiedExercises;

    // 2. Get raw localStorage resistance exercises
    console.log('🔍 Getting localStorage resistance exercises...');
    const localStorageExercises = getExerciseLogsByDate(date);
    report.localStorageExercises = localStorageExercises;

    // 3. Get activity logs from localStorage
    console.log('🔍 Getting activity logs...');
    const activityLogsRaw = localStorage.getItem('activity-logs');
    const activityLogs = activityLogsRaw ? JSON.parse(activityLogsRaw) : [];
    const dateString = date.toISOString().split('T')[0];
    const filteredActivityLogs = activityLogs.filter((log: any) => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate === dateString;
    });
    report.activityLogs = filteredActivityLogs;

    // 4. Analysis and discrepancies
    const expectedTotal = localStorageExercises.length + filteredActivityLogs.length;
    const actualTotal = unifiedExercises.length;

    if (expectedTotal !== actualTotal) {
      report.discrepancies.push(
        `Expected ${expectedTotal} exercises (${localStorageExercises.length} resistance + ${filteredActivityLogs.length} activities) but got ${actualTotal} unified exercises`
      );
    }

    // Check activity type distribution
    const typeCount = {
      resistance: 0,
      endurance: 0,
      sport: 0,
      stretching: 0,
      speedAgility: 0,
      other: 0,
      undefined: 0
    };

    unifiedExercises.forEach(ex => {
      switch (ex.activityType) {
        case ActivityType.RESISTANCE:
          typeCount.resistance++;
          break;
        case ActivityType.ENDURANCE:
          typeCount.endurance++;
          break;
        case ActivityType.SPORT:
          typeCount.sport++;
          break;
        case ActivityType.STRETCHING:
          typeCount.stretching++;
          break;
        case ActivityType.SPEED_AGILITY:
          typeCount.speedAgility++;
          break;
        case ActivityType.OTHER:
          typeCount.other++;
          break;
        default:
          typeCount.undefined++;
          break;
      }
    });

    // Check if activity logs are being converted properly
    filteredActivityLogs.forEach((log: any) => {
      const matchingUnified = unifiedExercises.find(ex => 
        ex.id === log.id || ex.exerciseName === log.activityName
      );
      
      if (!matchingUnified) {
        report.discrepancies.push(
          `Activity log "${log.activityName}" (${log.activityType}) not found in unified exercises`
        );
      }
    });

    // Generate recommendations
    if (typeCount.undefined > 0) {
      report.recommendations.push(
        `${typeCount.undefined} exercises have undefined activity type - check type mapping`
      );
    }

    if (filteredActivityLogs.length > 0 && (typeCount.endurance + typeCount.sport + typeCount.stretching + typeCount.speedAgility + typeCount.other) === 0) {
      report.recommendations.push(
        'Activity logs exist but no non-resistance exercises are showing - check convertActivityLogToExerciseData function'
      );
    }

    if (localStorageExercises.length !== typeCount.resistance) {
      report.recommendations.push(
        `Resistance exercise count mismatch: ${localStorageExercises.length} in localStorage vs ${typeCount.resistance} in unified - check resistance exercise loading`
      );
    }

    console.log('📊 Diagnostic Report:', report);
    return report;

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    report.discrepancies.push(`Error during diagnosis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return report;
  }
}

export function logDetailedActivityData() {
  console.log('🔍 DETAILED ACTIVITY DATA ANALYSIS');
  
  const activityLogsRaw = localStorage.getItem('activity-logs');
  const activityLogs = activityLogsRaw ? JSON.parse(activityLogsRaw) : [];
  
  console.log('📊 Total activity logs in storage:', activityLogs.length);
  
  // Group by activity type
  const byType = activityLogs.reduce((acc: any, log: any) => {
    acc[log.activityType] = acc[log.activityType] || [];
    acc[log.activityType].push(log);
    return acc;
  }, {});
  
  Object.keys(byType).forEach(type => {
    console.log(`📊 ${type}: ${byType[type].length} logs`);
    byType[type].forEach((log: any, index: number) => {
      console.log(`  ${index + 1}. ${log.activityName} - ${new Date(log.timestamp).toLocaleDateString()}`);
      console.log(`     Sessions/Sets: ${log.sessions?.length || log.stretches?.length || 'N/A'}`);
    });
  });
}
