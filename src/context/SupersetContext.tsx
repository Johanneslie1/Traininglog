import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { SupersetGroup } from '../types/session';

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
  createSuperset: () => SupersetGroup | null;
  breakSuperset: (supersetId: string) => void;
  addSuperset: (superset: SupersetGroup) => void;
  removeSuperset: (supersetId: string) => void;
  getSupersetByExercise: (exerciseId: string) => SupersetGroup | null;
  isExerciseInSuperset: (exerciseId: string) => boolean;
  removeExerciseFromSuperset: (exerciseId: string) => void;
  clearAll: () => void;
  loadSupersetsForDate: (date: string) => void;
  saveSupersetsForDate: (date: string) => void;
  updateExerciseOrder: (exerciseIds: string[]) => void;
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

const STORAGE_KEY = 'superset_data';
const EXERCISE_ORDER_KEY = 'exercise_order';

// Helper functions for persistence
const getSupersetStorageKey = (date: string) => `${STORAGE_KEY}_${date}`;
const getExerciseOrderKey = (date: string) => `${EXERCISE_ORDER_KEY}_${date}`;

const loadSupersetsFromStorage = (date: string): SupersetGroup[] => {
  try {
    const stored = localStorage.getItem(getSupersetStorageKey(date));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading supersets from storage:', error);
    return [];
  }
};

const saveSupersetsToStorage = (date: string, supersets: SupersetGroup[]) => {
  try {
    localStorage.setItem(getSupersetStorageKey(date), JSON.stringify(supersets));
  } catch (error) {
    console.error('Error saving supersets to storage:', error);
  }
};

// New functions to handle exercise order persistence
const saveExerciseOrderToStorage = (date: string, exerciseIds: string[]) => {
  try {
    localStorage.setItem(getExerciseOrderKey(date), JSON.stringify(exerciseIds));
  } catch (error) {
    console.error('Error saving exercise order to storage:', error);
  }
};

const loadExerciseOrderFromStorage = (date: string): string[] => {
  try {
    const stored = localStorage.getItem(getExerciseOrderKey(date));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading exercise order from storage:', error);
    return [];
  }
};

export const SupersetProvider: React.FC<SupersetProviderProps> = ({ children }) => {
  const [state, setState] = useState<SupersetState>({
    isCreating: false,
    selectedExercises: [],
    activeSuperset: null,
    supersets: []
  });

  const [currentDate, setCurrentDate] = useState<string>('');
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([]);

  // Load supersets for a specific date
  const loadSupersetsForDate = useCallback((date: string) => {
    const storedSupersets = loadSupersetsFromStorage(date);
    const storedExerciseOrder = loadExerciseOrderFromStorage(date);
    
    setState(prev => ({
      ...prev,
      supersets: storedSupersets
    }));
    
    setExerciseOrder(storedExerciseOrder);
    setCurrentDate(date);
  }, []);

  // Save supersets for current date
  const saveSupersetsForDate = useCallback((date: string) => {
    saveSupersetsToStorage(date, state.supersets);
    saveExerciseOrderToStorage(date, exerciseOrder);
  }, [state.supersets, exerciseOrder]);

  // Auto-save when supersets change
  useEffect(() => {
    if (currentDate) {
      saveSupersetsToStorage(currentDate, state.supersets);
    }
  }, [state.supersets, currentDate]);

  // Auto-save when exercise order changes
  useEffect(() => {
    if (currentDate && exerciseOrder.length > 0) {
      saveExerciseOrderToStorage(currentDate, exerciseOrder);
    }
  }, [exerciseOrder, currentDate]);

  // Update exercise order
  const updateExerciseOrder = useCallback((exerciseIds: string[]) => {
    setExerciseOrder(exerciseIds);
    if (currentDate) {
      saveExerciseOrderToStorage(currentDate, exerciseIds);
    }
  }, [currentDate]);

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

  const createSuperset = useCallback((): SupersetGroup | null => {
    if (state.selectedExercises.length < 2) {
      return null;
    }

    const newSuperset: SupersetGroup = {
      id: crypto.randomUUID(),
      exerciseIds: state.selectedExercises,
      order: state.supersets.length
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
    setExerciseOrder([]);
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
    clearAll,
    loadSupersetsForDate,
    saveSupersetsForDate,
    updateExerciseOrder
  };

  return (
    <SupersetContext.Provider value={value}>
      {children}
    </SupersetContext.Provider>
  );
};
