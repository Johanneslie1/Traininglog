import { DifficultyCategory } from './difficulty';

export interface ExerciseSet {
  weight: number;
  reps: number;
  difficulty: DifficultyCategory;
  rpe?: number; // Changed from string to number for calculations
  comment?: string;
  
  // Extended fields for different training types (all optional for backward compatibility)
  rir?: number; // Reps in Reserve
  restTime?: number; // Rest time in seconds
  notes?: string; // Additional notes
  
  // Endurance-specific fields
  duration?: number; // Duration in minutes or seconds depending on context
  distance?: number; // Distance in km or meters
  hrZone1?: number; // Heart rate zone 1 time
  hrZone2?: number; // Heart rate zone 2 time
  hrZone3?: number; // Heart rate zone 3 time
  hrZone4?: number; // Heart rate zone 4 time
  hrZone5?: number; // Heart rate zone 5 time
  averageHR?: number; // Average heart rate
  averageHeartRate?: number; // Alternative naming for average heart rate
  maxHR?: number; // Maximum heart rate
  maxHeartRate?: number; // Alternative naming for maximum heart rate
  calories?: number; // Calories burned
    // Plyometrics-specific fields
  height?: number; // Jump height in cm
  explosivePower?: number; // Explosive power rating 1-10
  reactivePower?: number; // Reactive power rating 1-10
  time?: number; // Time for drills in seconds
  
  // Team Sports-specific fields (performance-focused only)
  performance?: string; // Performance rating or notes
  
  // Flexibility-specific fields
  stretchType?: string; // Type of stretch
  intensity?: number; // Intensity 1-10
  bodyPart?: string;
  holdTime?: number; // Hold time for static stretches
  flexibility?: number; // Flexibility rating 1-10
    // Other fields
  pace?: string; // Pace for endurance activities (e.g., "5:30/km")
  elevation?: number; // Elevation gain
}
