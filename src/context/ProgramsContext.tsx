import React, { createContext, useContext, useState, useEffect } from 'react';
import { Program } from '@/types/program';
import * as programService from '@/services/programService';
import { auth } from '@/services/firebase/config';

interface ProgramsContextValue {
  programs: Program[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (program: Program) => Promise<void>;
  update: (id: string, updated: Program) => Promise<void>;
  updateSession: (programId: string, sessionId: string, exercises: Array<{ id: string; name: string; sets: number; reps: number; weight?: number; }>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const ProgramsContext = createContext<ProgramsContextValue | undefined>(undefined);

export const ProgramsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user) {
      return () => unsubscribe();
        refresh();
      } else {
        setPrograms([]);
        setIsLoading(false);
      }
    });
  }, []);

  const refresh = async () => {
    if (!isAuthenticated) {
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const progs = await programService.getPrograms();
      console.log('[ProgramsContext] Refreshed programs:', progs);
      setPrograms(progs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage !== 'User must be logged in') {
        console.error('[ProgramsContext] Error refreshing programs:', err);
        setError(errorMessage);
      }
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const create = async (program: Program) => {
    try {
      setError(null);
      await programService.createProgram(program);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
      console.error('[ProgramsContext] Error creating program:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const update = async (id: string, updated: Program) => {
    try {
      setError(null);
      await programService.replaceProgram(id, updated);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update program';
      console.error('[ProgramsContext] Error updating program:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const updateSession = async (programId: string, sessionId: string, exercises: Array<{ id: string; name: string; sets: number; reps: number; weight?: number; }>) => {
    try {
      setError(null);
      await programService.updateSession(programId, sessionId, exercises);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      console.error('[ProgramsContext] Error updating session:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      setError(null);
      await programService.deleteProgram(id);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete program';
      console.error('[ProgramsContext] Error deleting program:', err);
      setError(errorMessage);
      throw err;
    }
  };

  const value = {
    programs,
    isLoading,
    error,
    refresh,
    create,
    update,
    updateSession,
    remove,
  };

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
};

// Custom hook for using programs context
export const usePrograms = () => {
  const context = useContext(ProgramsContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramsProvider');
  }
  return context;
};

export const useProgramsContext = () => {
  const context = useContext(ProgramsContext);
  if (!context) {
    throw new Error('useProgramsContext must be used within a ProgramsProvider');
  }
  return context;
};
