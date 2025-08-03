import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '@/services/firebase/config';
import { Program } from '@/types/program';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as programService from '@/services/programService';

interface ProgramsContextType {
  programs: Program[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  addProgram: (program: Omit<Program, 'id' | 'userId'>) => Promise<void>;
  updateProgram: (id: string, updated: Partial<Program>) => Promise<void>;
  updateSessionInProgram: (programId: string, sessionId: string, exercises: any[]) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
}

// Export type alias for compatibility
export type ProgramsContextValue = ProgramsContextType;

const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

export const ProgramsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [fetchingRef, setFetchingRef] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[ProgramsContext] Auth state changed:', user?.uid || 'no user');
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchPrograms = useCallback(async (force = false) => {
    if (!user) {
      console.log('[ProgramsContext] No user, clearing programs');
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches unless forced
    if (fetchingRef && !force) {
      console.log('[ProgramsContext] Already loading, skipping duplicate fetch');
      return;
    }

    setFetchingRef(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log('[ProgramsContext] Fetching programs for user:', user.uid);
      // Load programs with their sessions
      const loadedPrograms = await programService.getPrograms();
      console.log('[ProgramsContext] Fetched programs:', {
        count: loadedPrograms.length,
        programs: loadedPrograms.map(p => ({
          id: p.id,
          name: p.name,
          sessionCount: p.sessions?.length || 0
        }))
      });
      setPrograms(loadedPrograms);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch programs';
      console.error('[ProgramsContext] Error fetching programs:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setFetchingRef(false);
    }
  }, [user, fetchingRef]);

  useEffect(() => {
    if (user) {
      console.log('[ProgramsContext] User authenticated, fetching programs');
      fetchPrograms(true); // Force fetch on user change
    } else {
      console.log('[ProgramsContext] No user, clearing programs');
      setPrograms([]);
      setIsLoading(false);
      setFetchingRef(false);
    }
  }, [user]); // Remove fetchPrograms from dependencies to prevent infinite loops

  // Add new program
  const addProgram = async (program: Omit<Program, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[ProgramsContext] Creating program:', {
        name: program.name,
        sessionCount: program.sessions?.length || 0,
        userId: user.uid
      });
      
      await programService.createProgram({ ...program, userId: user.uid });
      console.log('[ProgramsContext] Program created successfully');
      await fetchPrograms(true); // Force refresh after creating
    } catch (err) {
      let errorMessage = 'Failed to create program';
      
      if (err instanceof Error) {
        if (err.message.includes('Missing or insufficient permissions')) {
          errorMessage = 'Permission denied. Please check your authentication and try again.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      console.error('[ProgramsContext] Error creating program:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgram = async (id: string, updated: Partial<Program>) => {
    await programService.replaceProgram(id, updated as Program);
    fetchPrograms(true);
  };

  const updateSessionInProgram = async (programId: string, sessionId: string, exercises: any[]) => {
    await programService.updateSession(programId, sessionId, exercises);
    fetchPrograms(true);
  };

  const deleteProgram = async (id: string) => {
    await programService.deleteProgram(id);
    fetchPrograms(true);
  };

  return (
    <ProgramsContext.Provider value={{ programs, isLoading, error, refresh: () => fetchPrograms(true), addProgram, updateProgram, updateSessionInProgram, deleteProgram }}>
      {children}
    </ProgramsContext.Provider>
  );
};

export const usePrograms = () => {
  const context = useContext(ProgramsContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramsProvider');
  }
  return context;
};
