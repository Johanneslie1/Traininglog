import { ActivityType } from './activityTypes';

// Prescription types for structured programming
export type NumberOrRange = number | { min: number; max: number };

export interface WeightPrescription {
  type: 'percentage' | 'absolute' | 'rpe';
  value: NumberOrRange;
}

export interface Prescription {
  // Core prescription fields
  sets?: NumberOrRange;
  reps?: NumberOrRange; // For resistance training
  
  // Weight/intensity options
  weight?: WeightPrescription;
  rpe?: number; // Target RPE (1-10)
  intensity?: number; // Target intensity (1-10) for non-resistance
  
  // Endurance fields
  duration?: NumberOrRange; // seconds or minutes
  distance?: NumberOrRange; // km or meters
  
  // Programming details
  rest?: number; // Rest between sets in seconds
  tempo?: string; // e.g., "3-0-1-0" (eccentric-pause-concentric-pause)
  
  // Additional notes specific to this prescription
  notes?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  userId: string;  // Add userId for permissions
  createdAt: string;
  updatedAt: string;
  sessions: ProgramSession[];
  isPublic?: boolean;
  tags?: string[];
}

export interface ProgramSession {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  notes?: string;
  order?: number;
  userId: string;  // Add userId for permissions
}

export interface ProgramExercise {
  id: string; // Reference to the exercise in the main exercise database
  name: string; // Cached name for display (synced from exercise database)
  exerciseRef?: string; // Firestore document reference path (e.g., 'exercises/abc123')
  notes?: string; // Session-specific notes for this exercise
  order?: number;
  activityType?: ActivityType; // Cached activity type (synced from exercise database)
  
  // Prescription system - what the coach prescribes (not actual logged data)
  instructionMode?: 'structured' | 'freeform';
  prescription?: Prescription; // Structured prescription (sets, reps, weight %, etc.)
  instructions?: string; // Freeform text instructions for complex protocols
  
  // Note: Actual performed sets, reps, weight, setsData are only stored during workout logging, not in programs
}

// Shared Program Types
export interface SharedProgram {
  id: string;
  programId: string; // Reference to original program
  originalProgram: Program; // Full program data (denormalized for faster access)
  sharedBy: string; // userId of coach who shared
  sharedByName?: string; // Display name of coach
  sharedWith: string[]; // Array of userIds or teamIds
  sharedAt: string;
  lastModified: string;
  canEdit: boolean; // Whether recipients can edit (false for shared programs)
  isActive: boolean; // Coach can deactivate without deleting
}

export interface SharedProgramAssignment {
  id: string;
  sharedProgramId: string;
  programId: string;
  userId: string; // Athlete who received the program
  assignedAt: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'copied' | 'archived';
  lastViewedAt?: string;
  coachMessage?: string; // Optional message/instructions from coach
}

// Shared Session Types (for individual session sharing)
export interface SharedSession {
  id: string;
  sessionId: string; // Original session ID (if from a program)
  sessionData: ProgramSession; // Full session data (denormalized)
  sharedBy: string; // Coach userId
  sharedByName?: string; // Coach display name
  sharedWith: string[]; // Array of athlete userIds
  sharedAt: string;
  lastModified: string;
  canEdit: boolean; // false for shared sessions
  isActive: boolean;
  sourceProgram?: {
    programId: string;
    programName: string;
  }; // Optional: track if session came from a program
}

export interface SharedSessionAssignment {
  id: string;
  sharedSessionId: string;
  sessionData: ProgramSession;
  userId: string; // Athlete who received
  sharedBy: string; // Coach userId
  assignedAt: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'copied' | 'archived';
  lastViewedAt?: string;
  coachMessage?: string;
}
