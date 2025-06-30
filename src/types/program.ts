// Program types for the new Programs feature

export type Program = {
  id: string;
  name: string;
  description?: string;
  weeks: ProgramWeek[];
  createdAt: string;
  updatedAt: string;
};

export type ProgramWeek = {
  weekNumber: number;
  days: ProgramDay[];
};

export type ProgramDay = {
  dayNumber: number;
  label?: string; // e.g. "Upper Body", "Rest", etc.
  sessions: ProgramSession[];
};

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
