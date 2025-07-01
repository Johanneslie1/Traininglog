import { DifficultyCategory } from '@/types/exercise';

export interface ExerciseData {
  id?: string;
  exerciseName: string;
  timestamp: Date;
  sets: Array<{
    reps: number;
    weight: number;
    difficulty?: DifficultyCategory;
  }>;
  deviceId?: string;
}

export class ExerciseDataService {
  private static STORAGE_KEY = 'exercise_logs';

  // Removed ensureAuth, not needed for local storage

  private static getDateRange(date: Date): { startOfDay: Date, endOfDay: Date } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
  }

  static async saveExercise(exercise: ExerciseData): Promise<void> {
    try {
      // Save to localStorage only
      const existingData = this.getLocalExercises();
      const updatedData = [...existingData.filter(e => e.id !== exercise.id), exercise];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving exercise:', error);
    }
  }

  static async getExercisesByDate(date: Date): Promise<ExerciseData[]> {
    try {
      const allExercises = this.getLocalExercises();
      return this.filterExercisesByDate(allExercises, date);
    } catch (error) {
      console.error('Error getting exercises by date:', error);
      return [];
    }
  }
  // filterExercisesByDateAndUser removed (no longer needed)

  // Removed syncWithFirebase, not needed for local storage

  static getLocalExercises(): ExerciseData[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];

    try {
      const exercises: ExerciseData[] = JSON.parse(data);
      return exercises.map(exercise => ({
        ...exercise,
        timestamp: new Date(exercise.timestamp)
      }));
    } catch (error) {
      console.error('Error parsing exercises from localStorage:', error);
      return [];
    }
  }

  static filterExercisesByDate(exercises: ExerciseData[], targetDate: Date): ExerciseData[] {
    const dateRange = this.getDateRange(targetDate);
    return exercises.filter(exercise => {
      const exerciseDate = new Date(exercise.timestamp);
      return exerciseDate >= dateRange.startOfDay && exerciseDate <= dateRange.endOfDay;
    });
  }

  static async getExercisesByDateRange(startDate: Date, endDate: Date): Promise<ExerciseData[]> {
    try {
      const allExercises = this.getLocalExercises();
      
      // Normalize dates to start and end of day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return allExercises.filter(exercise => {
        const exerciseDate = new Date(exercise.timestamp);
        return exerciseDate >= start && exerciseDate <= end;
      });
    } catch (error) {
      console.error('Error getting exercises by date range:', error);
      return [];
    }
  }
}
