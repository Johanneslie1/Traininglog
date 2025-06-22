import { ExerciseLog } from '@/types/exercise';

export const importExerciseLogs = async (file: File): Promise<ExerciseLog[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const logs = JSON.parse(content);
        
        // Validate and transform the imported data
        const validatedLogs = logs.map((log: any) => ({
          id: log.id || `imported-${Date.now()}`,
          exerciseName: log.exerciseName,
          sets: log.sets,
          timestamp: new Date(log.timestamp),
          deviceId: log.deviceId || localStorage.getItem('device_id') || ''
        }));
        
        resolve(validatedLogs);
      } catch (error) {
        reject(new Error('Failed to parse import file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
