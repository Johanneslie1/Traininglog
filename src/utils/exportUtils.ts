import { getExerciseLogs, importExerciseLogs } from './localStorageUtils';
import { ExerciseLog } from '@/types/exercise';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { auth } from '@/services/firebase/config';

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
      exercises.push({
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || '',
        userId: data.userId
      });
    });

    console.log(`✅ Retrieved ${exercises.length} exercises from Firestore for export`);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercises from Firestore, falling back to localStorage:', error);
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

  // Enhanced CSV Header with both difficulty text and RPE
  const headers = ['Date', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'Difficulty', 'RPE Score', 'Notes'];
  const rows = [headers.join(',')];

  // Add data rows with enhanced difficulty and RPE information
  console.log(`📝 Processing ${filteredExercises.length} exercises for CSV export`);
  
  filteredExercises.forEach((exercise) => {
    const exerciseDate = new Date(exercise.timestamp);
    
    exercise.sets.forEach((set, setIndex) => {
      const difficultyText = getDifficultyText(set.difficulty);
      const rpeScore = translateDifficultyToRPE(set.difficulty);
      
      const row = [
        `"${exerciseDate.toLocaleDateString()}"`,
        `"${exercise.exerciseName}"`, // Quote exercise name to handle commas
        setIndex + 1,
        set.weight || 0,
        set.reps || 0,
        `"${difficultyText}"`,
        rpeScore,
        `"${(set as any).notes || ''}"`
      ];
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
  // If exercises are provided, use them; otherwise get all logs from Firestore or localStorage
  let data: ExerciseLog[];
  if (exercises) {
    data = exercises;
  } else {
    console.log('🔍 Getting all exercises for export...');
    data = await getAllExerciseLogsFromFirestore();
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
