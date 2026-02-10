/**
 * Workout Template System Types
 * 
 * Templates define set/rep structures that can be quickly applied to any exercise.
 * They are exercise-agnostic and define patterns like "5×5 Strength" or "Pyramid".
 */

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  sets: TemplateSet[];
  isDefault: boolean; // True for predefined templates, false for custom
  userId?: string; // User ID for custom templates
  createdAt?: Date;
  category?: TemplateCategory;
}

export interface TemplateSet {
  setNumber: number;
  reps?: number | string; // Can be a number or "AMRAP" (As Many Reps As Possible)
  weightPercent?: number; // Percentage of 1RM or previous max (e.g., 85 = 85%)
  rest?: number; // Rest time in seconds
  rpe?: number; // Target RPE (Rate of Perceived Exertion)
  rir?: number; // Target RIR (Reps in Reserve)
  duration?: number; // For timed sets (in seconds)
  notes?: string; // Additional instructions for this set
}

export type TemplateCategory = 
  | 'strength' 
  | 'hypertrophy' 
  | 'endurance' 
  | 'power'
  | 'custom';

export interface TemplateApplication {
  templateId: string;
  appliedAt: Date;
  exerciseName: string;
  baseWeight?: number; // Base weight used for percentage calculations
}

// Predefined template configurations
export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  sets: TemplateSet[];
  category: TemplateCategory;
  icon?: string;
}
