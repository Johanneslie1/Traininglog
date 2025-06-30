import React, { createContext, useContext, useState, useEffect } from 'react';
import { Program } from '@/types/program';
import * as programService from '@/services/programService';

interface ProgramsContextValue {
  programs: Program[];
  refresh: () => Promise<void>;
  create: (program: Program) => Promise<void>;
  update: (id: string, updated: Program) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const ProgramsContext = createContext<ProgramsContextValue | undefined>(undefined);

export const ProgramsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);

  const refresh = async () => {
    try {
      const progs = await programService.getPrograms();
      console.log('[ProgramsContext] Refreshed programs:', progs);
      setPrograms(progs);
    } catch (err) {
      console.error('[ProgramsContext] Error refreshing programs:', err);
    }
  };

  const create = async (program: Program) => {
    try {
      console.log('[ProgramsContext] Creating program:', program);
      await programService.createProgram(program);
      await refresh();
    } catch (err) {
      console.error('[ProgramsContext] Error creating program:', err);
    }
  };

  // Always send the full updated program object
  const update = async (id: string, updated: Program) => {
    await programService.replaceProgram(id, updated);
    await refresh();
  };

  const remove = async (id: string) => {
    await programService.deleteProgram(id);
    await refresh();
  };

  useEffect(() => { refresh(); }, []);

  return (
    <ProgramsContext.Provider value={{ programs, refresh, create, update, remove }}>
      {children}
    </ProgramsContext.Provider>
  );
};

export const usePrograms = () => {
  const ctx = useContext(ProgramsContext);
  if (!ctx) throw new Error('usePrograms must be used within a ProgramsProvider');
  return ctx;
};
