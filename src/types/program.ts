import { ActivityType } from './activityTypes';

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
  // Note: sets, reps, weight, setsData are only stored during actual workout logging, not in programs
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
