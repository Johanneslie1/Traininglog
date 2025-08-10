import { getExerciseLogs, importExerciseLogs } from './localStorageUtils';
import { ExerciseLog } from '@/types/exercise';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { auth } from '@/services/firebase/config';
import { ActivityLog } from '@/types/activityTypes';

// Get all exercise logs from Firestore for the current user
const getAllExerciseLogsFromFirestore = async (): Promise<ExerciseLog[]> => {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user, falling back to localStorage');
    return getExerciseLogs();
  }

  try {
    console.log('🔍 Fetching all exercises from Firestore for export...');
    const exercisesRef = collection(db, 'users', user.uid, 'exercises');
    const q = query(exercisesRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const exercises: ExerciseLog[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle different timestamp formats
      let timestamp: Date;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        // Firestore Timestamp
        timestamp = data.timestamp.toDate();
      } else if (data.timestamp instanceof Date) {
        // Already a Date object
        timestamp = data.timestamp;
      } else if (typeof data.timestamp === 'string') {
        // String timestamp
        timestamp = new Date(data.timestamp);
      } else {
        // Fallback to current date
        console.warn('Invalid timestamp format, using current date:', data.timestamp);
        timestamp = new Date();
      }
      
      exercises.push({
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: timestamp,
        deviceId: data.deviceId || '',
        userId: data.userId
      });
    });

    console.log(`✅ Retrieved ${exercises.length} resistance exercises from Firestore for export`);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercises from Firestore, falling back to localStorage:', error);
    return getExerciseLogs();
  }
};

// Get all activity logs from localStorage 
const getAllActivityLogsFromStorage = (): ActivityLog[] => {
  try {
    const logs: ActivityLog[] = JSON.parse(localStorage.getItem('activity-logs') || '[]');
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching activity logs from localStorage:', error);
    return [];
  }
};

// Get all exercises including both resistance and activities
const getAllExercisesForExport = async (): Promise<ExerciseLog[]> => {
  const user = auth.currentUser;
  if (!user) {
    console.warn('No authenticated user, using localStorage data');
    return getExerciseLogs();
  }

  try {
    // Get resistance exercises from Firestore
    const resistanceExercises = await getAllExerciseLogsFromFirestore();
    
    // Get activity logs from localStorage
    const activityLogs = getAllActivityLogsFromStorage();
    
    // Convert activity logs to ExerciseLog format for export
    const convertedActivityLogs: ExerciseLog[] = activityLogs.map(log => {
      // Convert activity sessions to exercise sets format
      let sets: any[] = [];
      
      if (log.activityType === 'sport') {
        const sportLog = log as any;
        sets = sportLog.sessions?.map((session: any, index: number) => ({
          setNumber: index + 1,
          activityType: 'sport',
          duration: session.duration,
          distance: session.distance,
          calories: session.calories,
          intensity: session.intensity,
          score: session.score,
          opponent: session.opponent,
          performance: session.performance,
          skills: session.skills,
          notes: session.notes
        })) || [];
      } else if (log.activityType === 'endurance') {
        const enduranceLog = log as any;
        sets = enduranceLog.sessions?.map((session: any, index: number) => ({
          setNumber: index + 1,
          activityType: 'endurance',
          duration: session.duration,
          distance: session.distance,
          pace: session.pace,
          averageHeartRate: session.averageHeartRate || session.averageHR,
          maxHeartRate: session.maxHeartRate || session.maxHR,
          calories: session.calories,
          elevation: session.elevation,
          rpe: session.rpe,
          hrZone1: session.hrZone1,
          hrZone2: session.hrZone2,
          hrZone3: session.hrZone3,
          notes: session.notes
        })) || [];
      } else if (log.activityType === 'stretching') {
        const stretchingLog = log as any;
        // Handle both 'stretches' and 'sessions' for backward compatibility
        const dataArray = stretchingLog.stretches || stretchingLog.sessions || [];
        sets = dataArray.map((stretch: any, index: number) => ({
          setNumber: index + 1,
          activityType: 'stretching',
          duration: stretch.duration,
          holdTime: stretch.holdTime,
          intensity: stretch.intensity,
          flexibility: stretch.flexibility,
          bodyPart: stretch.bodyPart,
          stretchType: stretch.stretchType,
          notes: stretch.notes
        })) || [];
      } else if (log.activityType === 'other') {
        const otherLog = log as any;
        const dataArray = otherLog.customData || otherLog.sessions || [];
        sets = dataArray.map((session: any, index: number) => ({
          setNumber: index + 1,
          activityType: 'other',
          duration: session.duration,
          calories: session.calories,
          heartRate: session.heartRate,
          intensity: session.intensity,
          notes: session.notes,
          // Include any custom values
          ...(session.customValues && session.customValues),
          // Include any additional fields
          ...Object.keys(session).reduce((acc, key) => {
            if (!['sessionNumber', 'duration', 'calories', 'heartRate', 'intensity', 'notes', 'customValues'].includes(key)) {
              acc[key] = session[key];
            }
            return acc;
          }, {} as any)
        })) || [];
      }
      
      return {
        id: log.id,
        exerciseName: log.activityName,
        sets: sets,
        timestamp: log.timestamp,
        deviceId: 'activity-logger',
        userId: log.userId,
        activityType: log.activityType
      } as ExerciseLog & { activityType?: string };
    });

    const allExercises = [...resistanceExercises, ...convertedActivityLogs];
    console.log(`📊 Total exercises for export: ${allExercises.length} (${resistanceExercises.length} resistance + ${convertedActivityLogs.length} activities)`);
    
    return allExercises;
  } catch (error) {
    console.error('Error getting all exercises for export:', error);
    return getExerciseLogs();
  }
};

// RPE translation mapping
const RPE_MAPPING: Record<string, number> = {
  'warmUp': 3,
  'easy': 5,
  'moderate': 7,
  'hard': 8,
  'failure': 9,
  'dropSet': 10,
  'WARMUP': 3,
  'EASY': 5,
  'NORMAL': 7,
  'HARD': 9,
  'DROP': 8
};

// Get RPE score from difficulty text
const translateDifficultyToRPE = (difficulty?: string): number => {
  if (!difficulty) return 7; // Default to moderate
  return RPE_MAPPING[difficulty] || 7;
};

// Get human-readable difficulty text
const getDifficultyText = (difficulty?: string): string => {
  if (!difficulty) return 'Moderate';
  
  const textMapping: Record<string, string> = {
    'warmUp': 'Warm Up',
    'easy': 'Easy',
    'moderate': 'Moderate',
    'hard': 'Hard',
    'failure': 'Failure',
    'dropSet': 'Drop Set',
    'WARMUP': 'Warm Up',
    'EASY': 'Easy',
    'NORMAL': 'Moderate',
    'HARD': 'Hard',
    'DROP': 'Drop Set'
  };
  
  return textMapping[difficulty] || 'Moderate';
};

// Filter exercises by date range
const filterExercisesByDateRange = (exercises: ExerciseLog[], startDate?: Date, endDate?: Date): ExerciseLog[] => {
  if (!startDate || !endDate) {
    console.log('🔍 No date filter applied, returning all exercises');
    return exercises;
  }
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  console.log(`🔍 Filtering exercises by date range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`);
  
  const filtered = exercises.filter(exercise => {
    const exerciseDate = new Date(exercise.timestamp);
    const isInRange = exerciseDate >= start && exerciseDate <= end;
    return isInRange;
  });
  
  console.log(`📊 Filtered ${filtered.length} exercises from ${exercises.length} total`);
  return filtered;
};

export const exerciseDataToCsv = (exercises: ExerciseLog[], startDate?: Date, endDate?: Date): string => {
  const filteredExercises = filterExercisesByDateRange(exercises, startDate, endDate);
  
  if (filteredExercises.length === 0) return '';

  // Check if we have different activity types to determine appropriate headers
  const hasResistance = filteredExercises.some(ex => (ex as any).activityType === 'resistance' || !(ex as any).activityType);
  const hasSport = filteredExercises.some(ex => (ex as any).activityType === 'sport');
  const hasEndurance = filteredExercises.some(ex => (ex as any).activityType === 'endurance');
  const hasStretching = filteredExercises.some(ex => (ex as any).activityType === 'stretching');
  const hasOther = filteredExercises.some(ex => (ex as any).activityType === 'other');

  // Create dynamic headers based on activity types present
  let headers = ['Date', 'Exercise', 'Activity Type', 'Set'];
  
  // Add activity-specific columns
  if (hasResistance) {
    headers.push('Weight (kg)', 'Reps');
  }
  if (hasSport) {
    headers.push('Duration (min)', 'Distance (m)', 'Calories', 'Score', 'Opponent', 'Performance');
  }
  if (hasEndurance) {
    headers.push('Duration (min)', 'Distance (m)', 'Pace', 'Avg HR', 'Max HR', 'Calories', 'Elevation', 'RPE', 'Zone 1', 'Zone 2', 'Zone 3');
  }
  if (hasStretching) {
    headers.push('Duration (min)', 'Hold Time (s)', 'Body Part', 'Stretch Type', 'Flexibility');
  }
  if (hasOther) {
    headers.push('Duration (min)', 'Calories', 'Heart Rate');
  }
  
  // Common columns for all activities
  headers.push('Intensity', 'Difficulty', 'RPE Score', 'Notes');
  
  const rows = [headers.join(',')];

  console.log(`📝 Processing ${filteredExercises.length} exercises for CSV export with activity types:`, {
    hasResistance, hasSport, hasEndurance, hasStretching, hasOther
  });
  
  filteredExercises.forEach((exercise) => {
    const exerciseDate = new Date(exercise.timestamp);
    const activityType = (exercise as any).activityType || 'resistance';
    
    exercise.sets.forEach((set, setIndex) => {
      const difficultyText = getDifficultyText(set.difficulty);
      const rpeScore = translateDifficultyToRPE(set.difficulty);
      
      // Start with common fields
      let row = [
        `"${exerciseDate.toLocaleDateString()}"`,
        `"${exercise.exerciseName}"`,
        activityType,
        setIndex + 1
      ];
      
      // Add activity-specific fields
      if (hasResistance) {
        if (activityType === 'resistance') {
          row.push(String(set.weight || 0), String(set.reps || 0));
        } else {
          row.push('', ''); // Empty for non-resistance activities
        }
      }
      
      if (hasSport) {
        if (activityType === 'sport') {
          row.push(
            String(set.duration || ''),
            String((set as any).distance || ''),
            String((set as any).calories || ''),
            String((set as any).score || ''),
            `"${(set as any).opponent || ''}"`,
            String((set as any).performance || '')
          );
        } else {
          row.push('', '', '', '', '', ''); // Empty for non-sport activities
        }
      }
      
      if (hasEndurance) {
        if (activityType === 'endurance') {
          row.push(
            String(set.duration || ''),
            String((set as any).distance || ''),
            String((set as any).pace || ''),
            String((set as any).averageHeartRate || ''),
            String((set as any).maxHeartRate || ''),
            String((set as any).calories || ''),
            String((set as any).elevation || ''),
            String((set as any).rpe || ''),
            String((set as any).hrZone1 || ''),
            String((set as any).hrZone2 || ''),
            String((set as any).hrZone3 || '')
          );
        } else {
          row.push('', '', '', '', '', '', '', '', '', '', ''); // Empty for non-endurance activities
        }
      }
      
      if (hasStretching) {
        if (activityType === 'stretching') {
          row.push(
            String(set.duration || ''),
            String((set as any).holdTime || ''),
            `"${(set as any).bodyPart || ''}"`,
            `"${(set as any).stretchType || ''}"`,
            String((set as any).flexibility || '')
          );
        } else {
          row.push('', '', '', '', ''); // Empty for non-stretching activities
        }
      }
      
      if (hasOther) {
        if (activityType === 'other') {
          row.push(
            String(set.duration || ''),
            String((set as any).calories || ''),
            String((set as any).heartRate || '')
          );
        } else {
          row.push('', '', ''); // Empty for non-other activities
        }
      }
      
      // Add common ending fields
      row.push(
        String(set.intensity || ''),
        `"${difficultyText}"`,
        String(rpeScore),
        `"${(set as any).notes || ''}"`
      );
      
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
};

export const downloadCsv = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportExerciseData = async (exercises?: ExerciseLog[], startDate?: Date, endDate?: Date, format: 'csv' | 'json' | 'both' = 'both') => {
  // If exercises are provided, use them; otherwise get all logs including activities
  let data: ExerciseLog[];
  if (exercises) {
    data = exercises;
  } else {
    console.log('🔍 Getting all exercises (including activities) for export...');
    data = await getAllExercisesForExport();
    console.log(`📊 Retrieved ${data.length} total exercises for potential export`);
  }
  
  // Filter by date range if provided
  const filteredData = filterExercisesByDateRange(data, startDate, endDate);
  console.log(`📅 After date filtering: ${filteredData.length} exercises in range`);
  
  if (filteredData.length === 0) {
    const message = startDate && endDate 
      ? `No exercises found in the selected date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})!`
      : 'No exercises to export!';
    alert(message);
    return;
  }
  
  // Generate filename with date range
  const dateRangeString = startDate && endDate 
    ? `_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`
    : `_${new Date().toISOString().split('T')[0]}`;
  
  // Export as CSV if requested
  if (format === 'csv' || format === 'both') {
    const csvContent = exerciseDataToCsv(
      filteredData.map(exercise => ({
        ...exercise,
        id: exercise.id ?? '', // Ensure id is always a string
      })),
      startDate,
      endDate
    );
    
    if (csvContent) {
      downloadCsv(csvContent, `exercise-log${dateRangeString}.csv`);
    }
  }
  
  // Export as JSON if requested
  if (format === 'json' || format === 'both') {
    // Also export as JSON for backup/import with enhanced metadata
    const enhancedData = filteredData.map(exercise => ({
      ...exercise,
      timestamp: exercise.timestamp instanceof Date ? 
        exercise.timestamp.toISOString() : 
        exercise.timestamp,
      sets: exercise.sets.map(set => ({
        ...set,
        difficultyText: getDifficultyText(set.difficulty),
        rpeScore: translateDifficultyToRPE(set.difficulty)
      }))
    }));
    
    // Create export metadata
    const exportMetadata = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dateRange: startDate && endDate ? {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        } : 'All dates',
        totalExercises: enhancedData.length,
        totalSets: enhancedData.reduce((total, exercise) => total + exercise.sets.length, 0),
        format: 'json'
      },
      rpeReference: {
        'Warm Up': 3,
        'Easy': 5,
        'Moderate': 7,
        'Hard': 8,
        'Failure': 9,
        'Drop Set': 10
      },
      exercises: enhancedData
    };
    
    const jsonBlob = new Blob([JSON.stringify(exportMetadata, null, 2)], {
      type: 'application/json'
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(jsonBlob);
    link.setAttribute('download', `exercise-log-backup${dateRangeString}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Import exercise data from a JSON file
export const importExerciseData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Invalid file content');
        }
        
        const result = importExerciseLogs(event.target.result);
        resolve(result);
      } catch (error) {
        console.error('Error importing data:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};
