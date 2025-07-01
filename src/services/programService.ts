
import type { Program } from '@/types/program';

const PROGRAMS_STORAGE_KEY = 'programs';

export const getPrograms = async (): Promise<Program[]> => {
  const programsString = localStorage.getItem(PROGRAMS_STORAGE_KEY);
  if (!programsString) return [];
  try {
    const programs = JSON.parse(programsString);
    return Array.isArray(programs) ? programs : [];
  } catch {
    return [];
  }
};

export const createProgram = async (program: Program): Promise<void> => {
  const programs = await getPrograms();
  const updated = [...programs, program];
  localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(updated));
};

export const replaceProgram = async (id: string, updated: Program): Promise<void> => {
  const programs = await getPrograms();
  const newPrograms = programs.map(p => p.id === id ? updated : p);
  localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(newPrograms));
};

export const deleteProgram = async (id: string): Promise<void> => {
  const programs = await getPrograms();
  const newPrograms = programs.filter(p => p.id !== id);
  localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(newPrograms));
};
// Removed copyPreviousDay utility (feature removed)
