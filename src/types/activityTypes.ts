// Exercise Activity Types - Core enum for the entire system
export enum ActivityType {
  RESISTANCE = 'resistance',
  SPORT = 'sport', 
  STRETCHING = 'stretching',
  ENDURANCE = 'endurance',
  SPEED_AGILITY = 'speedAgility',
  OTHER = 'other'
}

// Base interface for all activity categories
export interface BaseActivity {
  id: string;
  name: string;
  description?: string;
  activityType: ActivityType;
  category: string;
  createdBy?: string;
  isDefault: boolean;
  userId?: string;
}

// Resistance Exercise (existing strength training)
export interface ResistanceExercise extends BaseActivity {
  activityType: ActivityType.RESISTANCE;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string[];
  tips?: string[];
  defaultUnit: 'kg' | 'lb';
  metrics: {
    trackWeight: boolean;
    trackReps: boolean;
    trackRPE: boolean;
    trackTime?: boolean;
    trackDistance?: boolean;
  };
}

// Sport Activity
export interface SportActivity extends BaseActivity {
  activityType: ActivityType.SPORT;
  sportType: string; // football, basketball, tennis, etc.
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  teamBased: boolean;
  equipment: string[];
  primarySkills: string[];  metrics: {
    trackDuration: boolean;
    trackIntensity: boolean;
    trackPerformance: boolean;
    trackScore?: boolean;
    trackOpponent?: boolean;
  };
}

// Stretching Exercise
export interface StretchingExercise extends BaseActivity {
  activityType: ActivityType.STRETCHING;
  stretchType: 'static' | 'dynamic' | 'pnf' | 'yoga' | 'pilates';
  targetMuscles: string[];
  bodyRegion: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  metrics: {
    trackDuration: boolean;
    trackHoldTime: boolean;
    trackIntensity: boolean;
    trackFlexibility: boolean;
  };
}

// Endurance Exercise
export interface EnduranceExercise extends BaseActivity {
  activityType: ActivityType.ENDURANCE;
  enduranceType: 'running' | 'cycling' | 'swimming' | 'rowing' | 'hiking' | 'walking' | 'other';
  environment: 'indoor' | 'outdoor' | 'both';
  intensity: 'low' | 'moderate' | 'high' | 'variable';
  equipment: string[];
  metrics: {
    trackDistance: boolean;
    trackDuration: boolean;
    trackPace: boolean;
    trackHeartRate: boolean;
    trackCalories: boolean;
    trackElevation?: boolean;
  };
}

// Other Activity (catch-all category)
export interface OtherActivity extends BaseActivity {
  activityType: ActivityType.OTHER;
  customCategory: string;
  customFields: ActivityCustomField[];
  instructions?: string[];
  metrics: {
    [key: string]: boolean;
  };
}

// Custom field definition for Other activities
export interface ActivityCustomField {
  fieldId: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'duration' | 'date';
  required: boolean;
  options?: string[]; // for select fields
  unit?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Speed & Agility Activity
export interface SpeedAgilityActivity extends BaseActivity {
  activityType: ActivityType.SPEED_AGILITY;
  drillType: 'sprint' | 'agility' | 'reaction' | 'acceleration' | 'change_of_direction' | 'ladder' | 'cone';
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setup: string[];
  instructions: string[];
  metrics: {
    trackTime: boolean;
    trackDistance: boolean;
    trackReps: boolean;
    trackHeight?: boolean;
    trackRPE: boolean;
  };
}

// Union type for all activity types
export type ActivityExercise = 
  | ResistanceExercise 
  | SportActivity 
  | StretchingExercise 
  | EnduranceExercise 
  | SpeedAgilityActivity
  | OtherActivity;

// Activity logging data structures
export interface BaseActivityLog {
  id: string;
  activityId: string;
  activityType: ActivityType;
  activityName: string;
  userId: string;
  timestamp: Date;
  notes?: string;
  deviceId?: string;
}

// Resistance exercise logging (existing)
export interface ResistanceLog extends BaseActivityLog {
  activityType: ActivityType.RESISTANCE;
  sets: ResistanceSet[];
}

export interface ResistanceSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  restTime?: number;
  notes?: string;
}

// Sport activity logging
export interface SportLog extends BaseActivityLog {
  activityType: ActivityType.SPORT;
  sessions: SportSession[];
}

export interface SportSession {
  sessionNumber: number;
  duration: number; // minutes
  intensity: number; // 1-10 scale
  performance: number; // 1-10 scale
  notes?: string;
}

// Stretching exercise logging
export interface StretchingLog extends BaseActivityLog {
  activityType: ActivityType.STRETCHING;
  stretches: StretchingSet[];
}

export interface StretchingSet {
  setNumber: number;
  duration: number; // seconds
  holdTime?: number; // seconds for static stretches
  intensity: number; // 1-10 scale
  flexibility: number; // 1-10 scale (before/after improvement)
  notes?: string;
}

// Endurance exercise logging
export interface EnduranceLog extends BaseActivityLog {
  activityType: ActivityType.ENDURANCE;
  sessions: EnduranceSession[];
}

export interface EnduranceSession {
  sessionNumber: number;
  distance?: number; // meters
  duration: number; // minutes
  pace?: number; // seconds per unit distance
  averageHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  elevation?: number; // meters
  rpe?: number; // Rate of Perceived Exertion (1-10)
  hrZone1?: number; // Zone 1 time in minutes
  hrZone2?: number; // Zone 2 time in minutes
  hrZone3?: number; // Zone 3 time in minutes
  notes?: string;
}

// Speed & Agility exercise logging
export interface SpeedAgilityLog extends BaseActivityLog {
  activityType: ActivityType.SPEED_AGILITY;
  sessions: SpeedAgilitySession[];
}

export interface SpeedAgilitySession {
  sessionNumber: number;
  reps: number;
  time?: number; // seconds for timed drills
  distance?: number; // meters for distance drills
  height?: number; // cm for jumping drills
  restTime?: number; // seconds between reps
  rpe: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
}

// Other activity logging
export interface OtherLog extends BaseActivityLog {
  activityType: ActivityType.OTHER;
  customData: OtherActivityData[];
}

export interface OtherActivityData {
  sessionNumber: number;
  customValues: { [fieldId: string]: any };
  notes?: string;
}

// Union type for all activity logs
export type ActivityLog = 
  | ResistanceLog 
  | SportLog 
  | StretchingLog 
  | EnduranceLog 
  | SpeedAgilityLog
  | OtherLog;

// Export filters for each activity type
export interface ActivityFilter {
  activityType?: ActivityType[];
  category?: string[];
  searchText?: string;
  equipment?: string[];
  difficulty?: string[];
  skillLevel?: string[];
}

// Activity statistics
export interface ActivityStats {
  totalSessions: number;
  totalDuration?: number;
  lastPerformed: Date;
  averagePerformance?: number;
  bestSession?: any;
  improvementTrend?: 'improving' | 'stable' | 'declining';
}
