import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Program, CreateProgramInput, UpdateProgramInput } from '../types/program';
import { createProgram, updateProgram, deleteProgram, getUserPrograms } from '../services/firebase/programs';
import { RootState } from '../store/store';

interface ProgramsContextType {
  programs: Program[];
  loading: boolean;
  error: string | null;
  createProgram: (input: CreateProgramInput) => Promise<Program>;
  updateProgram: (input: UpdateProgramInput) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  refreshPrograms: () => Promise<void>;
}

const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

export const ProgramsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('ProgramsProvider mounting');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    console.log('ProgramsProvider mounted, user:', user);
    return () => {
      console.log('ProgramsProvider unmounting');
    };
  }, []);

  const fetchPrograms = async () => {
    console.log('Fetching programs for user:', user);
    if (!user) {
      setPrograms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedPrograms = await getUserPrograms(user.id);
      console.log('Fetched programs:', fetchedPrograms);
      setPrograms(fetchedPrograms);
    } catch (err) {
      console.error('Error in fetchPrograms:', err);
      setError('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('User changed, fetching programs');
    fetchPrograms();
  }, [user]);

  const handleCreateProgram = async (input: CreateProgramInput) => {
    if (!user) throw new Error('User not authenticated');
    try {
      setError(null);
      const newProgram = await createProgram(input, user.id);
      setPrograms(prev => [...prev, newProgram]);
      return newProgram;
    } catch (err) {
      setError('Failed to create program');
      console.error('Error creating program:', err);
      throw err;
    }
  };

  const handleUpdateProgram = async (input: UpdateProgramInput) => {
    try {
      setError(null);
      await updateProgram(input);
      await fetchPrograms(); // Refresh to get updated data
    } catch (err) {
      setError('Failed to update program');
      console.error('Error updating program:', err);
      throw err;
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    try {
      setError(null);
      await deleteProgram(programId);
      setPrograms(prev => prev.filter(p => p.id !== programId));
    } catch (err) {
      setError('Failed to delete program');
      console.error('Error deleting program:', err);
      throw err;
    }
  };

  const value = {
    programs,
    loading,
    error,
    createProgram: handleCreateProgram,
    updateProgram: handleUpdateProgram,
    deleteProgram: handleDeleteProgram,
    refreshPrograms: fetchPrograms,
  };

  return (
    <ProgramsContext.Provider value={value}>
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
