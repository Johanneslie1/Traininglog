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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchPrograms = useCallback(async () => {
    if (!user) {
      setPrograms([]);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (isLoading) {
      console.log('[ProgramsContext] Already loading, skipping duplicate fetch');
      return;
    }

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
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      console.log('[ProgramsContext] User changed, refreshing programs');
      fetchPrograms();
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
      await fetchPrograms(); // Refresh the programs list
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
    fetchPrograms();
  };

  const updateSessionInProgram = async (programId: string, sessionId: string, exercises: any[]) => {
    await programService.updateSession(programId, sessionId, exercises);
    fetchPrograms();
  };

  const deleteProgram = async (id: string) => {
    await programService.deleteProgram(id);
    fetchPrograms();
  };

  return (
    <ProgramsContext.Provider value={{ programs, isLoading, error, refresh: fetchPrograms, addProgram, updateProgram, updateSessionInProgram, deleteProgram }}>
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
