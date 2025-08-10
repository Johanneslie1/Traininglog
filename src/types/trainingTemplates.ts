import { ExerciseType } from '@/config/exerciseTypes';

// Base template interface
export interface TrainingTemplate {
  id: string;
  name: string;
  type: ExerciseType;
  fields: TemplateField[];
  createdBy?: string; // userId for custom templates
  isDefault: boolean;
  description?: string;
}

// Field types for different inputs
export interface TemplateField {
  fieldId: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // for select fields
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  validation?: FieldValidation;
}

export type FieldType = 
  | 'number'
  | 'string' 
  | 'select'
  | 'boolean'
  | 'duration' // time in seconds
  | 'distance' // in meters
  | 'height' // in cm
  | 'rpe' // Rate of Perceived Exertion (1-10)
  | 'heartRate'
  | 'intensity'
  | 'weight'
  | 'reps'
  | 'sets';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

// Dynamic set data based on training type
export interface DynamicSetData {
  [fieldId: string]: any;
}

// Universal exercise set interface
export interface UniversalExerciseSet extends DynamicSetData {
  // Core fields
  setNumber?: number;
  rpe?: number;
  notes?: string;
  restTime?: number; // in seconds

  // Strength-specific
  weight?: number;
  reps?: number;
  difficulty?: string;

  // Sports/Endurance: duration, distance (optional), calories (optional), intensity, notes
  duration?: number; // in seconds
  distance?: number; // in meters
  intensity?: number; // 1-10 scale

  // Plyometrics-specific
  height?: number; // jump height in cm
  explosivePower?: number; // 1-10 scale
  reactivePower?: number; // 1-10 scale

  // Flexibility-specific
  stretchType?: 'static' | 'dynamic' | 'pnf' | 'yoga';
  bodyPart?: string;
  holdTime?: number; // for static stretches

  // Other activities: duration, calories, heartRate, intensity, notes
  calories?: number;
  heartRate?: number;
}

// Template-specific log data
export interface TemplatedLogData {
  templateId: string;
  exerciseName?: string;
  activityName?: string;
  userId: string;
  sets: UniversalExerciseSet[];
  exerciseType: ExerciseType;
  categories?: string[];
  notes?: string;
  timestamp?: Date;
}
