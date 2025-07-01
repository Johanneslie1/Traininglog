import { v4 as uuidv4 } from 'uuid';
import { ExerciseLog as ExerciseLogType } from '@/types/exercise';

// Constants
const LOGS_STORAGE_KEY = 'exercise_logs';

// Types
export type ExerciseLog = Omit<ExerciseLogType, 'id'> & {
  id?: string;
  deviceId?: string;
  userId?: string;
  timestamp?: Date | string;
};

// Helper to normalize date to start of day
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Helper to get date range
const getDateRange = (date: Date) => {
  const startOfDay = normalizeDate(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// Helper to compare dates (ignoring time)
const isSameDay = (date1: Date, date2: Date): boolean => {
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
};

// Get or create a persistent device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Get all exercise logs from local storage
export const getExerciseLogs = (): ExerciseLog[] => {
  const logsString = localStorage.getItem(LOGS_STORAGE_KEY);
  if (!logsString) return [];

  try {
    const logs = JSON.parse(logsString);
    return Array.isArray(logs) ? logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp)
    })) : [];
  } catch (error) {
    console.error('Error parsing exercise logs:', error);
    return [];
  }
};

// Get exercise logs for a specific date
export const getExerciseLogsByDate = (date: Date): ExerciseLog[] => {
  const logs = getExerciseLogs();
  console.log('All logs:', logs);
  console.log('Looking for date:', date);
  
  const filtered = logs.filter(log => {
    const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp || '');
    const isSame = isSameDay(logDate, date);
    console.log('Comparing:', {
      logDate,
      targetDate: date,
      isSameDay: isSame
    });
    return isSame;
  });
  
  console.log('Filtered logs:', filtered);
  return filtered;
};

// Save exercise log to local storage
export const saveExerciseLog = (log: ExerciseLog): ExerciseLog => {
  const logs = getExerciseLogs();
  
  // Create a new log with an ID if it doesn't have one
  const newLog = {
    ...log,
    id: log.id || uuidv4(),
    deviceId: log.deviceId || getDeviceId(),
    timestamp: log.timestamp || new Date(),
    userId: log.userId || 'anonymous'  // Fallback to anonymous if not provided
  };

  // Convert Date to string for storage
  const storableLog = {
    ...newLog,
    timestamp: newLog.timestamp instanceof Date 
      ? newLog.timestamp.toISOString() 
      : new Date(newLog.timestamp).toISOString()
  };

  // If the log has an ID, update the existing log instead of adding a new one
  const existingLogIndex = logs.findIndex(l => l.id === log.id);
  let storableLogs;
  
  if (existingLogIndex !== -1) {
    // Update existing log
    storableLogs = [
      ...logs.slice(0, existingLogIndex),
      storableLog,
      ...logs.slice(existingLogIndex + 1)
    ];
  } else {
    // Add new log
    storableLogs = [...logs, storableLog];
  }
  
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(storableLogs));
  return newLog;
};

// Delete an exercise log (local storage only)
export const deleteExerciseLog = async (log: ExerciseLog): Promise<boolean> => {
  try {
    const logs = getExerciseLogs();
    const filteredLogs = logs.filter(l => l.id !== log.id);
    if (filteredLogs.length === logs.length) {
      return false; // Log wasn't found
    }
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(filteredLogs));
    return true;
  } catch (error) {
    console.error('Error deleting exercise log:', error);
    return false;
  }
};

// Import exercise logs from JSON
export const importExerciseLogs = (jsonData: string): boolean => {
  try {
    const importedLogs = JSON.parse(jsonData);
    
    if (!Array.isArray(importedLogs)) {
      throw new Error('Imported data is not an array');
    }
    
    // Convert string timestamps to Date objects
    const processedLogs = importedLogs.map((log: any) => ({
      ...log,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      deviceId: log.deviceId || getDeviceId(),
      id: log.id || uuidv4()
    }));
    
    // Store the imported logs
    const storableLogs = processedLogs.map((log: ExerciseLog) => ({
      ...log,
      timestamp: log.timestamp instanceof Date 
        ? log.timestamp.toISOString() 
        : new Date(log.timestamp).toISOString()
    }));
    
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(storableLogs));
    return true;
  } catch (error) {
    console.error('Error importing logs:', error);
    return false;
  }
};
