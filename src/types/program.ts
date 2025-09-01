import { ActivityType } from './activityTypes';

export interface Program {
  id: string;
  name: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
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
  id: string;
  name: string;
  notes?: string;
  order?: number;
  activityType?: ActivityType; // New field for exercise type classification
  // Removed: sets, reps, weight, setsData - these should only be logged during actual workouts
};
