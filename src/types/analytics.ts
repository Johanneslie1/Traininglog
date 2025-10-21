import { MuscleGroup } from './exercise';
import { ActivityType } from './activityTypes';

/**
 * Volume tracking data point
 * Represents volume metrics for a specific exercise on a specific date
 */
export interface VolumeDataPoint {
  date: string; // ISO date string for chart compatibility (YYYY-MM-DD)
  volume: number; // Total volume (weight × reps)
  totalSets: number; // Number of sets performed
  averageWeight: number; // Average weight across all sets
  averageReps: number; // Average reps across all sets
  exerciseName: string; // Name of the exercise
  exerciseCount?: number; // Number of different exercises (when grouping by day)
}

/**
 * Personal Record Types
 */
export enum PRType {
  ONE_REP_MAX = '1RM',
  THREE_REP_MAX = '3RM',
  FIVE_REP_MAX = '5RM',
  TEN_REP_MAX = '10RM',
  MAX_VOLUME = 'Max Volume',
  MAX_REPS = 'Max Reps',
  MAX_WEIGHT = 'Max Weight'
}

/**
 * Personal Record
 * Represents a personal best for a specific exercise and record type
 */
export interface PersonalRecord {
  id: string; // Unique identifier for this record
  userId: string; // User who set the record
  exerciseName: string; // Name of the exercise
  exerciseId?: string; // ID of the exercise log entry
  recordType: PRType; // Type of personal record
  value: number; // The record value (weight, volume, or reps depending on type)
  
  // Detailed metrics
  weight?: number; // Weight used (for RM records)
  reps?: number; // Reps performed (for RM records)
  volume?: number; // Total volume (for volume records)
  
  // Metadata
  date: Date; // When the record was set
  previousRecord?: PersonalRecord; // Previous best (if available)
  improvement?: number; // Percentage improvement over previous record
  isNew?: boolean; // True if set within last 7 days
}

/**
 * Muscle volume distribution data
 * Represents training volume distribution across muscle groups
 */
export interface MuscleVolumeData {
  muscleGroup: MuscleGroup; // The muscle group
  totalVolume: number; // Total volume for this muscle group
  totalSets: number; // Total number of sets
  exerciseCount: number; // Number of different exercises
  percentage: number; // Percentage of total training volume
  color: string; // Color for chart visualization
}

/**
 * Training intensity levels for heatmap visualization
 */
export enum IntensityLevel {
  REST = 0, // No training
  LIGHT = 1, // Light training session
  MODERATE = 2, // Moderate intensity
  HIGH = 3, // High intensity
  VERY_HIGH = 4 // Very high intensity
}

/**
 * Training frequency data for a specific date
 * Used for heatmap visualization and streak tracking
 */
export interface TrainingFrequencyData {
  date: string; // ISO date string (YYYY-MM-DD)
  workoutCount: number; // Number of exercises logged
  totalVolume: number; // Total training volume
  totalSets: number; // Total number of sets
  totalDuration?: number; // Total duration in minutes (if tracked)
  intensity: IntensityLevel; // Calculated intensity level
  exercises: string[]; // List of exercises performed
}

/**
 * Timeframe presets for quick date range selection
 */
export type TimeframePreset = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

/**
 * Analytics filters
 * Used to filter and customize analytics data
 */
export interface AnalyticsFilters {
  startDate: Date; // Start of date range
  endDate: Date; // End of date range
  timeframe: TimeframePreset; // Selected timeframe preset
  exercises?: string[]; // Filter by specific exercises
  muscleGroups?: MuscleGroup[]; // Filter by muscle groups
  activityTypes?: ActivityType[]; // Filter by activity types
}

/**
 * Chart dataset for multi-line charts
 */
export interface ChartDataset {
  name: string; // Dataset name (e.g., exercise name)
  data: VolumeDataPoint[]; // Data points
  color: string; // Line color for chart
}

/**
 * Heatmap cell data
 * Represents a single cell in the training frequency heatmap
 */
export interface HeatmapCell {
  date: string; // ISO date string
  value: number; // Intensity value (0-4)
  intensity: IntensityLevel; // Intensity level enum
  details: TrainingFrequencyData; // Full training data for this date
}

/**
 * Training streak information
 */
export interface TrainingStreak {
  currentStreak: number; // Current consecutive training days
  longestStreak: number; // Longest streak in the period
  streakStartDate?: Date; // When current streak started
  streakEndDate?: Date; // When current streak ended (if broken)
}

/**
 * Analytics summary stats
 */
export interface AnalyticsSummary {
  totalVolume: number; // Total volume in period
  totalWorkouts: number; // Total workout sessions
  totalSets: number; // Total sets performed
  totalExercises: number; // Total unique exercises
  averageVolumePerWorkout: number; // Average volume per session
  averageWorkoutsPerWeek: number; // Training frequency per week
  newPRCount: number; // Number of new PRs in period
  muscleGroupBalance: number; // Balance score (0-100)
  consistencyScore: number; // Training consistency (0-100)
  currentStreak: number; // Current training streak
}

/**
 * Exercise comparison data
 * Used for comparing multiple exercises
 */
export interface ExerciseComparison {
  exerciseName: string;
  totalVolume: number;
  totalSets: number;
  averageWeight: number;
  maxWeight: number;
  totalReps: number;
  sessionsCount: number;
  volumeChange: number; // Percentage change from previous period
  trend: 'up' | 'down' | 'stable'; // Volume trend
}

/**
 * Period comparison data
 * Used for comparing current period with previous period
 */
export interface PeriodComparison {
  current: {
    volume: number;
    workouts: number;
    exercises: number;
  };
  previous: {
    volume: number;
    workouts: number;
    exercises: number;
  };
  changes: {
    volumeChange: number; // Percentage
    workoutsChange: number; // Percentage
    exercisesChange: number; // Percentage
  };
}

/**
 * Muscle group balance analysis
 */
export interface MuscleGroupBalance {
  balanced: MuscleGroup[]; // Well-trained muscle groups
  undertrained: MuscleGroup[]; // Need more attention
  overtrained: MuscleGroup[]; // Potentially overtrained
  recommendations: string[]; // Training recommendations
}

/**
 * PR notification data
 */
export interface PRNotification {
  id: string;
  record: PersonalRecord;
  message: string;
  timestamp: Date;
  seen: boolean;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  animationDuration: number;
  colors: string[];
}

/**
 * Export data format
 */
export interface AnalyticsExportData {
  userId: string;
  exportDate: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: AnalyticsSummary;
  volumeData: VolumeDataPoint[];
  personalRecords: PersonalRecord[];
  muscleDistribution: MuscleVolumeData[];
  trainingFrequency: TrainingFrequencyData[];
}
