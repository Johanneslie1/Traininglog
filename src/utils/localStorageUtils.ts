import { auth, db } from '@/services/firebase/config';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { ExerciseLog } from '@/types/exercise';

// Constants
const LOGS_STORAGE_KEY = 'exercise_logs';

// Helper to get date range
const getDateRange = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
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
  const exerciseLogs = getExerciseLogs();
  const { startOfDay, endOfDay } = getDateRange(date);

  return exerciseLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startOfDay && logDate <= endOfDay;
  });
};

// Save exercise log to local storage
export const saveExerciseLog = (exerciseLog: ExerciseLog): ExerciseLog => {
  const logs = getExerciseLogs();
  
  // Ensure the log has a unique ID
  const newLog = {
    ...exerciseLog,
    id: exerciseLog.id || uuidv4(),
    deviceId: exerciseLog.deviceId || getDeviceId(),
    timestamp: exerciseLog.timestamp || new Date(),
    userId: auth.currentUser?.uid || 'anonymous'  // Fallback to anonymous if not authenticated
  };

  // Convert Date to string for storage
  const storableLog = {
    ...newLog,
    timestamp: newLog.timestamp instanceof Date 
      ? newLog.timestamp.toISOString() 
      : new Date(newLog.timestamp).toISOString()
  };

  // If the log has an ID, update the existing log instead of adding a new one
  const existingLogIndex = logs.findIndex(l => l.id === exerciseLog.id);
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

// Delete an exercise log
export const deleteExerciseLog = async (log: ExerciseLog): Promise<boolean> => {
  try {
    // First try to delete from Firestore if we have an ID
    if (log.id && auth.currentUser) {
      const docRef = doc(db, 'exerciseLogs', log.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await deleteDoc(docRef);
      }
    }
    
    // Then delete from local storage
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

// Delete exercise log from local storage
export const deleteLocalExerciseLog = (exerciseId: string) => {
  let exerciseLogs = getExerciseLogs();
  const updatedLogs = exerciseLogs.filter(log => log.id !== exerciseId);
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
};

// Clear all exercise logs from local storage
export const clearExerciseLogs = () => {
  localStorage.removeItem(LOGS_STORAGE_KEY);
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
