import { getExerciseLogs, importExerciseLogs } from './localStorageUtils';
import { ExerciseLog, ExerciseSet } from '@/types/exercise';

export const exerciseDataToCsv = (exercises: ExerciseLog[]): string => {
  if (exercises.length === 0) return '';

  // CSV Header
  const headers = ['Exercise', 'Set', 'Weight (kg)', 'Reps', 'RPE', 'Timestamp'];
  const rows = [headers.join(',')];

  // Add data rows
  exercises.forEach((exercise) => {
    exercise.sets.forEach((set, setIndex) => {
      const row = [
        `"${exercise.exerciseName}"`, // Quote exercise name to handle commas
        setIndex + 1,
        set.weight,
        set.reps,
        set.rpe || '',
        new Date(exercise.timestamp).toLocaleString()
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

export const exportExerciseData = (exercises?: ExerciseLog[]) => {
  // If exercises are provided, use them; otherwise get all logs from localStorage
  const data = exercises || getExerciseLogs();
  
  // Export as CSV
  const csvContent = exerciseDataToCsv(
    data.map(exercise => ({
      ...exercise,
      id: exercise.id ?? '', // Ensure id is always a string
    }))
  );
  if (!csvContent) {
    alert('No exercises to export!');
    return;
  }
  const date = new Date().toISOString().split('T')[0];
  downloadCsv(csvContent, `exercise-log-${date}.csv`);
  
  // Also export as JSON for backup/import
  const serializedData = data.map(exercise => ({
    ...exercise,
    timestamp: exercise.timestamp instanceof Date ? 
      exercise.timestamp.toISOString() : 
      exercise.timestamp
  }));
  
  const jsonBlob = new Blob([JSON.stringify(serializedData, null, 2)], {
    type: 'application/json'
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(jsonBlob);
  link.setAttribute('download', `exercise-log-backup-${date}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
