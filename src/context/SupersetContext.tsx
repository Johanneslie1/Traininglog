import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SupersetGroup } from '@/types/session';

export interface SupersetState {
  isCreating: boolean;
  selectedExercises: string[];
  activeSuperset: SupersetGroup | null;
  supersets: SupersetGroup[];
}

interface SupersetContextType {
  state: SupersetState;
  startCreating: () => void;
  cancelCreating: () => void;
  toggleExerciseSelection: (exerciseId: string) => void;
  createSuperset: (name?: string) => SupersetGroup | null;
  breakSuperset: (supersetId: string) => void;
  addSuperset: (superset: SupersetGroup) => void;
  removeSuperset: (supersetId: string) => void;
  getSupersetByExercise: (exerciseId: string) => SupersetGroup | null;
  isExerciseInSuperset: (exerciseId: string) => boolean;
  removeExerciseFromSuperset: (exerciseId: string) => void;
  clearAll: () => void;
}

const SupersetContext = createContext<SupersetContextType | undefined>(undefined);

export const useSupersets = () => {
  const context = useContext(SupersetContext);
  if (!context) {
    throw new Error('useSupersets must be used within a SupersetProvider');
  }
  return context;
};

interface SupersetProviderProps {
  children: ReactNode;
}

export const SupersetProvider: React.FC<SupersetProviderProps> = ({ children }) => {
  const [state, setState] = useState<SupersetState>({
    isCreating: false,
    selectedExercises: [],
    activeSuperset: null,
    supersets: []
  });

  const startCreating = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreating: true,
      selectedExercises: []
    }));
  }, []);

  const cancelCreating = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreating: false,
      selectedExercises: []
    }));
  }, []);

  const toggleExerciseSelection = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      selectedExercises: prev.selectedExercises.includes(exerciseId)
        ? prev.selectedExercises.filter(id => id !== exerciseId)
        : [...prev.selectedExercises, exerciseId]
    }));
  }, []);

  const createSuperset = useCallback((name?: string): SupersetGroup | null => {
    if (state.selectedExercises.length < 2) {
      return null;
    }

    const newSuperset: SupersetGroup = {
      id: crypto.randomUUID(),
      name: name || `Superset ${state.supersets.length + 1}`,
      exerciseIds: state.selectedExercises,
      order: state.supersets.length,
      restBetweenSets: 120, // 2 minutes default
      restBetweenExercises: 30 // 30 seconds default
    };

    setState(prev => ({
      ...prev,
      supersets: [...prev.supersets, newSuperset],
      isCreating: false,
      selectedExercises: []
    }));

    return newSuperset;
  }, [state.selectedExercises, state.supersets.length]);

  const breakSuperset = useCallback((supersetId: string) => {
    setState(prev => ({
      ...prev,
      supersets: prev.supersets.filter(s => s.id !== supersetId)
    }));
  }, []);

  const addSuperset = useCallback((superset: SupersetGroup) => {
    setState(prev => ({
      ...prev,
      supersets: [...prev.supersets, superset]
    }));
  }, []);

  const removeSuperset = useCallback((supersetId: string) => {
    setState(prev => ({
      ...prev,
      supersets: prev.supersets.filter(s => s.id !== supersetId)
    }));
  }, []);

  const getSupersetByExercise = useCallback((exerciseId: string): SupersetGroup | null => {
    return state.supersets.find(s => s.exerciseIds.includes(exerciseId)) || null;
  }, [state.supersets]);

  const isExerciseInSuperset = useCallback((exerciseId: string): boolean => {
    return state.supersets.some(s => s.exerciseIds.includes(exerciseId));
  }, [state.supersets]);

  const removeExerciseFromSuperset = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      supersets: prev.supersets
        .map(superset => ({
          ...superset,
          exerciseIds: superset.exerciseIds.filter(id => id !== exerciseId)
        }))
        .filter(superset => superset.exerciseIds.length > 1) // Remove supersets with fewer than 2 exercises
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      isCreating: false,
      selectedExercises: [],
      activeSuperset: null,
      supersets: []
    });
  }, []);

  const value: SupersetContextType = {
    state,
    startCreating,
    cancelCreating,
    toggleExerciseSelection,
    createSuperset,
    breakSuperset,
    addSuperset,
    removeSuperset,
    getSupersetByExercise,
    isExerciseInSuperset,
    removeExerciseFromSuperset,
    clearAll
  };

  return (
    <SupersetContext.Provider value={value}>
      {children}
    </SupersetContext.Provider>
  );
};
