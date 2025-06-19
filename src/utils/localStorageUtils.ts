import { v4 as uuidv4 } from 'uuid';
import { Program } from '@/types/exercise';

// Type definition for difficulty categories
export type DifficultyCategory = 'WARMUP' | 'EASY' | 'NORMAL' | 'HARD' | 'FAILURE' | 'DROP';

// Type definition for exercise logs
export interface ExerciseLog {
  id?: string;
  exerciseName: string;
  sets: Array<{
    reps: number;
    weight: number;
    difficulty?: DifficultyCategory;
    rpe?: number; // Keep for backward compatibility
  }>;
  timestamp: Date;
  deviceId: string;
}

// Get or create a persistent device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

// Save exercise log to local storage
export const saveExerciseLog = (log: ExerciseLog): ExerciseLog => {
  const logs = getExerciseLogs();
  
  // Create a new log with an ID if it doesn't have one
  const newLog = {
    ...log,
    id: log.id || uuidv4(),
    deviceId: log.deviceId || getDeviceId(),
    timestamp: log.timestamp || new Date()
  };
  
  // Convert Date to string for storage
  const storableLog = {
    ...newLog,
    timestamp: newLog.timestamp.toISOString()
  };
    // Convert all logs to storable format before storing
  const storableLogs = [...logs, storableLog];
  localStorage.setItem('exercise_logs', JSON.stringify(storableLogs));
  
  return newLog;
};

// Get all exercise logs
export const getExerciseLogs = (): ExerciseLog[] => {
  const logsStr = localStorage.getItem('exercise_logs');
  if (!logsStr) return [];
  
  try {
    const logs = JSON.parse(logsStr);
    
    // Convert string timestamps back to Date objects
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));
  } catch (error) {
    console.error('Error parsing logs from localStorage:', error);
    return [];
  }
};

// Get exercise logs for a specific date
export const getExerciseLogsByDate = (date: Date): ExerciseLog[] => {
  const logs = getExerciseLogs();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startOfDay && logDate <= endOfDay;
  });
};

// Export all exercise logs as JSON
export const exportExerciseLogs = (): string => {
  const logs = getExerciseLogs();
  return JSON.stringify(logs, null, 2);
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
      timestamp: log.timestamp.toISOString()
    }));
    
    localStorage.setItem('exercise_logs', JSON.stringify(storableLogs));
    return true;
  } catch (error) {
    console.error('Error importing logs:', error);
    return false;
  }
};

// Program management functions

// Get all programs
export const getPrograms = (): Program[] => {
  const programsStr = localStorage.getItem('workout_programs');
  if (!programsStr) return [];
  
  try {
    const programs = JSON.parse(programsStr);
    
    // Convert string timestamps back to Date objects
    return programs.map((program: any) => ({
      ...program,
      createdAt: new Date(program.createdAt),
      lastModified: new Date(program.lastModified)
    }));
  } catch (error) {
    console.error('Error parsing programs from localStorage:', error);
    return [];
  }
};

// Save a program to local storage
export const saveProgram = (program: Program): Program => {
  const programs = getPrograms();
  
  // Check if this is an update or a new program
  const existingIndex = programs.findIndex(p => p.id === program.id);
  
  const newProgram = {
    ...program,
    id: program.id || uuidv4(),
    deviceId: program.deviceId || getDeviceId(),
    createdAt: program.createdAt || new Date(),
    lastModified: new Date() // Always update the lastModified date
  };
  
  // Convert Date to string for storage
  const storableProgram = {
    ...newProgram,
    createdAt: newProgram.createdAt.toISOString(),
    lastModified: newProgram.lastModified.toISOString()
  };
    // Create storable programs array with string dates
  const storablePrograms = programs.map(p => {
    if (p.id === program.id) {
      return storableProgram;
    }
    return {
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      lastModified: p.lastModified instanceof Date ? p.lastModified.toISOString() : p.lastModified
    };
  });
  
  // If it wasn't an update, add the new program
  if (existingIndex < 0) {
    storablePrograms.push(storableProgram);
  }
  
  localStorage.setItem('workout_programs', JSON.stringify(storablePrograms));
  
  return newProgram;
};

// Delete a program
export const deleteProgram = (programId: string): boolean => {
  const programs = getPrograms();
  const filteredPrograms = programs.filter(p => p.id !== programId);
  
  if (filteredPrograms.length === programs.length) {
    return false; // Program wasn't found
  }
  
  localStorage.setItem('workout_programs', JSON.stringify(filteredPrograms));
  return true;
};

// Get a program by ID
export const getProgramById = (programId: string): Program | null => {
  const programs = getPrograms();
  const program = programs.find(p => p.id === programId);
  return program || null;
};

// Export all programs as JSON
export const exportPrograms = (): string => {
  const programs = getPrograms();
  return JSON.stringify(programs, null, 2);
};

// Import programs from JSON
export const importPrograms = (jsonData: string): boolean => {
  try {
    const importedPrograms = JSON.parse(jsonData);
    
    if (!Array.isArray(importedPrograms)) {
      throw new Error('Imported data is not an array');
    }
    
    // Convert string timestamps to Date objects and ensure deviceId and id
    const processedPrograms = importedPrograms.map((program: any) => ({
      ...program,
      createdAt: program.createdAt ? new Date(program.createdAt) : new Date(),
      lastModified: program.lastModified ? new Date(program.lastModified) : new Date(),
      deviceId: program.deviceId || getDeviceId(),
      id: program.id || uuidv4()
    }));
    
    // Store the imported programs
    const storablePrograms = processedPrograms.map((program: Program) => ({
      ...program,
      createdAt: program.createdAt.toISOString(),
      lastModified: program.lastModified.toISOString()
    }));
    
    localStorage.setItem('workout_programs', JSON.stringify(storablePrograms));
    return true;
  } catch (error) {
    console.error('Error importing programs:', error);
    return false;
  }
};
