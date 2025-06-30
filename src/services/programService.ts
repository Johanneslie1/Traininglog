// Program CRUD and utility functions
import type { Program, ProgramWeek, ProgramDay } from '@/types/program';

// In-memory store for now (replace with Firebase or persistent storage as needed)
let programs: Program[] = [];

export const getPrograms = async (): Promise<Program[]> => {
  return programs;
};

export const getProgramById = async (id: string): Promise<Program | undefined> => {
  return programs.find(p => p.id === id);
};

export const createProgram = async (program: Program): Promise<void> => {
  programs.push(program);
};

export const updateProgram = async (id: string, updated: Partial<Program>): Promise<void> => {
  programs = programs.map(p => (p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p));
};

export const deleteProgram = async (id: string): Promise<void> => {
  programs = programs.filter(p => p.id !== id);
};

// Utility: Copy previous day (deep clone sessions/exercises)
export function copyPreviousDay(week: ProgramWeek, dayIndex: number): ProgramDay | null {
  if (dayIndex <= 0 || dayIndex >= week.days.length) return null;
  const prevDay = week.days[dayIndex - 1];
  // Deep clone sessions and exercises
  const newSessions = prevDay.sessions.map(session => ({
    ...session,
    id: crypto.randomUUID(),
    exercises: session.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
  }));
  return {
    ...week.days[dayIndex],
    sessions: newSessions
  };
}
