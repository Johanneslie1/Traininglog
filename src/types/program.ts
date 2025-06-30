// Program types for the new Programs feature

export type Program = {
  id: string;
  name: string;
  description?: string;
  level: string; // Added for UI and data model
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  routines?: Routine[];
  sessions?: ProgramSession[]; // Flat list of sessions
};

export type Routine = {
  id: string;
  name: string;
  exercises: ProgramExercise[];
};

// Removed ProgramWeek and ProgramDay for flat structure

export type ProgramSession = {
  id: string;
  name: string;
  exercises: ProgramExercise[];
};

export type ProgramExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
};
