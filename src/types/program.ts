import { ExerciseSet } from './exercise';

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
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  setsData?: ExerciseSet[];  // Full set data from ExerciseSetLogger
};
