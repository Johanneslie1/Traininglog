import { DifficultyCategory } from './difficulty';

export interface ExerciseSet {
  // Core strength fields (weight + reps)
  weight: number;
  reps: number;
  
  // Duration & distance (endurance, flexibility)
  duration?: number; // seconds or minutes
  distance?: number; // km or meters
  
  // Intensity & effort
  rpe?: number; // 1-10 Rating of Perceived Exertion
  difficulty?: DifficultyCategory;
  intensity?: number; // 1-10 for flexibility/cardio
  
  // Endurance & HR metrics
  averageHeartRate?: number;
  maxHeartRate?: number;
  heartRate?: number;
  calories?: number;
  pace?: string; // e.g., "5:30/km"
  elevation?: number;
  hrZone1?: number;
  hrZone2?: number;
  hrZone3?: number;
  hrZone4?: number;
  hrZone5?: number;
  
  // Flexibility & mobility
  holdTime?: number; // seconds for static stretches
  flexibility?: number; // 1-10 rating
  stretchType?: string;
  bodyPart?: string;
  
  // Speed & agility
  height?: number; // jump height in cm
  drillMetric?: string; // custom metric per drill
  
  // Team sports
  performance?: string; // performance notes
  score?: number;
  opponent?: string;
  
  // General metadata
  comment?: string;
  notes?: string;
  rir?: number; // Reps in Reserve
  restTime?: number; // seconds
  
  // Timestamps (optional, can be on parent log)
  timestamp?: Date;
}

