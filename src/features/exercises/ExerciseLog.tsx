import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LogOptions from './LogOptions';
import { Calendar } from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { exportExerciseData } from '@/utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog, deleteExerciseLog } from '@/utils/localStorageUtils';
import { importExerciseLogs } from '@/utils/importUtils';
import ExerciseCard from '@/components/ExerciseCard';
import SideMenu from '@/components/SideMenu';
import { ExerciseSet, ExerciseLog as ExerciseLogType } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// Convert ExerciseData to ExerciseLog format for export
const convertToExerciseLog = (exercise: ExerciseData): ExerciseLogType => ({
  id: exercise.id || uuidv4(), // Ensure ID is always present for export
  exerciseName: exercise.exerciseName,
  sets: exercise.sets,
  timestamp: exercise.timestamp,
  deviceId: exercise.deviceId
});

export const ExerciseLog: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Date utility functions
  const normalizeDate = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  const areDatesEqual = useCallback((date1: Date, date2: Date): boolean => {
    const normalized1 = normalizeDate(date1);
    const normalized2 = normalizeDate(date2);
    return normalized1.getTime() === normalized2.getTime();
  }, [normalizeDate]);


  const getDateRange = useCallback((date: Date): { startOfDay: Date; endOfDay: Date } => {
    const startOfDay = normalizeDate(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }, [normalizeDate]);
  
  type UIState = {
    showLogOptions: boolean;
    showCalendar: boolean;
    showSetLogger: boolean;
    showImportModal: boolean;
    showWorkoutSummary: boolean;
    showMenu: boolean;
  };

  // State management
  const [uiState, setUiState] = useState<UIState>({
    showLogOptions: false,
    showCalendar: false,
    showSetLogger: false,
    showImportModal: false,
    showWorkoutSummary: false,
    showMenu: false,
  });

  const updateUiState = useCallback((key: keyof UIState, value: boolean) => {
    setUiState((prev: UIState) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCalendar = useCallback((show?: boolean) => {
    updateUiState('showCalendar', show ?? !uiState.showCalendar);
  }, [uiState.showCalendar, updateUiState]);

  // Exercise data loading
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDate(new Date()));
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);

  // Convert local storage exercise to ExerciseData format
  const convertToExerciseData = useCallback((exercise: Omit<ExerciseLogType, 'id'> & { id?: string }, userId: string): ExerciseData => ({
    id: exercise.id ?? uuidv4(),
    exerciseName: exercise.exerciseName,
    sets: exercise.sets,
    timestamp: new Date(exercise.timestamp),
    userId: userId,
    deviceId: exercise.deviceId || localStorage.getItem('device_id') || ''
  }), []);

  // Handle exercise data loading
  const loadExercises = useCallback(async (date: Date) => {
    // Guard against null user
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      setExercises([]);
      return;
    }

    // Normalize the target date and set loading state
    const loadedDate = normalizeDate(date);
    let currentLoadedDate = loadedDate; // Keep track of which date we're loading
    setLoading(true);
    setExercises([]); // Clear previous exercises while loading

    try {
      // First, get exercises from local storage
      const localExercises = getExerciseLogsByDate(loadedDate);
      const allExercises = localExercises.map(exercise => 
        convertToExerciseData(exercise, userId)
      );
      
      // Only continue with Firebase if we haven't changed dates
      if (areDatesEqual(currentLoadedDate, loadedDate)) {
        // Check Firebase for additional exercises
        const { startOfDay, endOfDay } = getDateRange(loadedDate);
        const q = query(
          collection(db, 'exerciseLogs'),
          where('userId', '==', userId),
          where('timestamp', '>=', startOfDay),
          where('timestamp', '<=', endOfDay)
        );

        const snapshot = await getDocs(q);
        const firebaseExercises = snapshot.docs.map(doc => {
          const data = doc.data();
          return convertToExerciseData({
            id: doc.id,
            exerciseName: data.exerciseName,
            sets: data.sets,
            timestamp: data.timestamp.toDate(),
            deviceId: data.deviceId
          }, userId);
        });

        // Only update if we're still loading the same date
        if (areDatesEqual(currentLoadedDate, loadedDate)) {
          // Merge Firebase exercises with local ones, avoiding duplicates by ID
          const exerciseMap = new Map<string, ExerciseData>();
          
          // Add local exercises first
          allExercises.forEach(exercise => {
            if (exercise.id) {
              exerciseMap.set(exercise.id, exercise);
            }
          });
          
          // Add Firebase exercises, overwriting local ones if they exist
          firebaseExercises.forEach(exercise => {
            if (exercise.id) {
              exerciseMap.set(exercise.id, exercise);
            }
          });

          setExercises(Array.from(exerciseMap.values()));
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // If there was an error with Firebase, still show local exercises
      if (areDatesEqual(currentLoadedDate, loadedDate)) {
        setExercises([]);
      }
    } finally {
      if (areDatesEqual(currentLoadedDate, loadedDate)) {
        setLoading(false);
      }
    }
  }, [user, areDatesEqual, normalizeDate, getDateRange, convertToExerciseData]);
  // Always ensure selectedDate is valid
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);
  
  // Calendar handlers
  const handleDateSelect = useCallback(async (date: Date) => {
    const normalized = normalizeDate(date);
    if (!normalized) return;
    
    setSelectedDate(normalized);
    await loadExercises(normalized);
    toggleCalendar(false);
  }, [normalizeDate, loadExercises, toggleCalendar]);

  // Automatic initialization and data loading when user changes
  useEffect(() => {
    if (user?.id) {
      loadExercises(selectedDate);
    }
  }, [user?.id, loadExercises, selectedDate]);

  // Handle exercise select from calendar
  const handleExerciseSelect = useCallback((selectedExercises: ExerciseData[]) => {
    setExercises(selectedExercises);
    toggleCalendar(false);
  }, [toggleCalendar]);

  const handleCloseSetLogger = useCallback(() => {
    setSelectedExercise(null);
    updateUiState('showSetLogger', false);
  }, [updateUiState]);

  const handleSaveSets = useCallback((sets: ExerciseSet[], exerciseId: string) => {
    if (!selectedExercise || !user?.id) return;
    
    const updatedExercise: ExerciseData = {
      ...selectedExercise,
      sets,
      timestamp: selectedDate
    };

    saveExerciseLog(updatedExercise);
    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.id === exerciseId ? updatedExercise : ex
      )
    );
    handleCloseSetLogger();
  }, [selectedExercise, user, selectedDate, handleCloseSetLogger]);  const handleDeleteExercise = async (exercise: ExerciseData) => {
    if (!user?.id || !exercise.id) return;
    
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await deleteExerciseLog({
          id: exercise.id,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          timestamp: exercise.timestamp,
          deviceId: exercise.deviceId || ''
        });
        await loadExercises(selectedDate);
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert('Failed to delete exercise. Please try again.');
      }
    }
  };

  const handleEditExercise = (exercise: ExerciseData) => {
    setSelectedExercise(exercise);
    updateUiState('showSetLogger', true);
  };

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('no-NO', { 
      day: 'numeric',
      month: 'long'
    }).toLowerCase();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const logs = await importExerciseLogs(file);
      if (logs && logs.length > 0) {
        // Convert imported logs to ExerciseData format
        setExercises(prevExercises => [
          ...prevExercises,
          ...logs.map(log => convertToExerciseData(log, user.id))
        ]);
      }
      updateUiState('showImportModal', false);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  // Load exercises when date or user changes
  useEffect(() => {
    if (user?.id && selectedDate) {
      const timeoutId = setTimeout(() => {
        loadExercises(selectedDate);
      }, 50); // Small delay to ensure any local storage updates have completed
      return () => clearTimeout(timeoutId);
    } else {
      setExercises([]);
      setLoading(false);
    }
  }, [selectedDate, user, loadExercises]);

  // Clear selected exercise when changing dates
  useEffect(() => {
    if (selectedExercise && !areDatesEqual(selectedExercise.timestamp, selectedDate)) {
      handleCloseSetLogger();
    }
  }, [selectedDate, selectedExercise, areDatesEqual, handleCloseSetLogger]);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setUiState(prev => ({ ...prev, showMenu: true }))}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-medium">{formatDate(selectedDate)}</h1>
        </div>
        
        <div className="flex items-center">          <button 
            onClick={() => toggleCalendar()} 
            className={`p-2 rounded-lg transition-colors ${uiState.showCalendar ? 'bg-white/10' : 'hover:bg-white/10'}`}
            aria-label="Open calendar"
            aria-expanded={uiState.showCalendar}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24 pt-20">
        <div className="relative flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Exercise Log - {selectedDate.toLocaleDateString()}
            </h2>
            <button
              onClick={() => toggleCalendar()}
              className="px-4 py-2 text-white rounded-lg transition-colors"
              aria-label="Toggle calendar"
              aria-expanded={uiState.showCalendar}
            >
              {uiState.showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>
          </div>          <div className="flex-grow">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg">No exercises logged for this date</p>
                <button
                  onClick={() => updateUiState('showLogOptions', true)}
                  className="mt-4 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors"
                >
                  Add Exercise
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={() => handleEditExercise(exercise)}
                    onDelete={() => handleDeleteExercise(exercise)}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Calendar */}
      {uiState.showCalendar && (
        <div className="fixed inset-0 bg-black/90 z-50">          <Calendar 
            onClose={() => toggleCalendar(false)}
            onSelectExercises={handleExerciseSelect}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        </div>
      )}

      {/* Add Exercise Button */}
      <button
        onClick={() => setUiState(prev => ({ ...prev, showLogOptions: true }))}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-40"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Side Menu */}
      <SideMenu
        isOpen={uiState.showMenu}
        onClose={() => updateUiState('showMenu', false)}
        onImport={() => updateUiState('showImportModal', true)}
        onExport={() => exportExerciseData(exercises.map(convertToExerciseLog))}
        onShowWorkoutSummary={() => updateUiState('showWorkoutSummary', true)}
        onNavigateToday={() => setSelectedDate(new Date())}
        onNavigateHistory={() => toggleCalendar(true)}
        onNavigatePrograms={() => {/* TODO: Implement programs navigation */}}
        onNavigateProfile={() => {/* TODO: Implement profile navigation */}}
      />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <LogOptions 
            onClose={() => updateUiState('showLogOptions', false)} 
            onExerciseAdded={() => loadExercises(selectedDate)}
            selectedDate={selectedDate}
          />
        </div>
      )}

      {/* Set Logger Modal */}
      {uiState.showSetLogger && selectedExercise && selectedExercise.id && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <ExerciseSetLogger
            exercise={{
              id: selectedExercise.id,
              name: selectedExercise.exerciseName,
              sets: selectedExercise.sets.map(set => ({
                reps: set.reps,
                weight: set.weight || 0,
                difficulty: set.difficulty
              }))
            }}
            onSave={handleSaveSets}
            onCancel={() => updateUiState('showSetLogger', false)}
            isEditing={true}
          />
        </div>
      )}

      {/* Import Modal */}
      {uiState.showImportModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white font-medium">Import Exercise Data</h2>
              <button
                onClick={() => updateUiState('showImportModal', false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 mb-4">
              Select a JSON backup file to import your exercise data.
            </p>
            <div className="mb-6">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-white p-3 rounded-xl bg-[#2a2a2a] border border-white/10 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => updateUiState('showImportModal', false)}
                className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Summary Modal */}
      {uiState.showWorkoutSummary && exercises.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <WorkoutSummary
            exercises={exercises.map(ex => ({
              id: ex.id || 'temp-id',
              exerciseName: ex.exerciseName,
              sets: ex.sets,
              timestamp: ex.timestamp
            }))}
            onClose={() => updateUiState('showWorkoutSummary', false)}
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseLog;
