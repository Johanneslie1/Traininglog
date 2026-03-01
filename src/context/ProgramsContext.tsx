import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { auth } from '@/services/firebase/config';
import { Program } from '@/types/program';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as programService from '@/services/programService';
import { logger } from '@/utils/logger';

interface ProgramsContextType {
  programs: Program[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  addProgram: (program: Omit<Program, 'id' | 'userId'>) => Promise<void>;
  updateProgram: (id: string, updated: Partial<Program>) => Promise<void>;
  updateSessionInProgram: (programId: string, sessionId: string, sessionData: Partial<Program['sessions'][number]> & { exercises: any[] }) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  duplicateProgram: (id: string) => Promise<Program>;
  duplicateSession: (programId: string, sessionId: string) => Promise<void>;
}

// Export type alias for compatibility
export type ProgramsContextValue = ProgramsContextType;

const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

export const ProgramsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      logger.debug('[ProgramsContext] Auth state changed:', user?.uid || 'no user');
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchPrograms = useCallback(async (force = false) => {
    if (!user) {
      logger.debug('[ProgramsContext] No user, clearing programs');
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches unless forced
    if (isFetchingRef.current && !force) {
      logger.verbose('[ProgramsContext] Already loading, skipping duplicate fetch');
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('[ProgramsContext] Fetching programs for user:', user.uid);
      // Load programs with their sessions
      const loadedPrograms = await programService.getPrograms();
      logger.debug('[ProgramsContext] Fetched programs:', loadedPrograms.length);
      setPrograms(loadedPrograms);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch programs';
      console.error('[ProgramsContext] Error fetching programs:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPrograms(true); // Force fetch on user change
    } else {
      setPrograms([]);
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]); // Remove fetchPrograms from dependencies to prevent infinite loops

  // Add new program
  const addProgram = async (program: Omit<Program, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      await programService.createProgram({ ...program, userId: user.uid });
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

  const updateSessionInProgram = async (
    programId: string,
    sessionId: string,
    sessionData: Partial<Program['sessions'][number]> & { exercises: any[] }
  ) => {
    await programService.updateSession(programId, sessionId, sessionData);
    fetchPrograms(true);
  };

  const deleteProgram = async (id: string) => {
    await programService.deleteProgram(id);
    fetchPrograms(true);
  };

  const duplicateProgram = async (id: string): Promise<Program> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('[ProgramsContext] Duplicating program:', id);
      const duplicatedProgram = await programService.duplicateProgram(id);
      logger.debug('[ProgramsContext] Program duplicated successfully:', duplicatedProgram.id);
      await fetchPrograms(true); // Refresh to show the new program
      return duplicatedProgram;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate program';
      console.error('[ProgramsContext] Error duplicating program:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateSession = async (programId: string, sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('[ProgramsContext] Duplicating session:', { programId, sessionId });
      await programService.duplicateSession(programId, sessionId);
      logger.debug('[ProgramsContext] Session duplicated successfully');
      await fetchPrograms(true); // Refresh to show the new session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate session';
      console.error('[ProgramsContext] Error duplicating session:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProgramsContext.Provider value={{ programs, isLoading, error, refresh: () => fetchPrograms(true), addProgram, updateProgram, updateSessionInProgram, deleteProgram, duplicateProgram, duplicateSession }}>
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
