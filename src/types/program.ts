import { Exercise } from './exercise';

export interface Program {
  id: string;
  name: string;
  description?: string;
  exercises: ProgramExercise[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  order: number;
}

export interface CreateProgramInput {
  name: string;
  description?: string;
  exercises?: Omit<ProgramExercise, 'exercise'>[];
}

export interface UpdateProgramInput {
  id: string;
  name?: string;
  description?: string;
  exercises?: Omit<ProgramExercise, 'exercise'>[];
}
