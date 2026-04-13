import { getExerciseLogs } from './localStorageUtils';

const LOGS_STORAGE_KEY = 'exerciseLogs';

export const deleteLocalExerciseLog = async (logId: string): Promise<boolean> => {
  try {
    // Get logs from local storage
    const logs = getExerciseLogs();
    const filteredLogs = logs.filter(log => log.id !== logId);
    
    if (filteredLogs.length === logs.length) {
      return false; // Log wasn't found
    }
    
    // Update local storage
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(filteredLogs));
    return true;
  } catch (error) {
    console.error('Error deleting exercise log from local storage:', error);
    return false;
  }
};
