import React, { useState, useEffect, useCallback } from 'react';
import ProgramModal from '@/features/programs/ProgramModal';
import { v4 as uuidv4 } from 'uuid';
import LogOptions from './LogOptions';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { exportExerciseData } from '@/utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog, deleteExerciseLog } from '@/utils/localStorageUtils';
import { importExerciseLogs } from '@/utils/importUtils';
import ExerciseCard from '@/components/ExerciseCard';
import SideMenu from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { ExerciseSet, ExerciseLog as ExerciseLogType } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';

// Convert ExerciseData to ExerciseLog format for export
const convertToExerciseLog = (exercise: ExerciseData): ExerciseLogType => ({
  id: exercise.id || uuidv4(),
  exerciseName: exercise.exerciseName,
  sets: exercise.sets,
  timestamp: exercise.timestamp,
  deviceId: exercise.deviceId
});

export const ExerciseLog: React.FC = () => {
  const navigate = useNavigate();

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

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  type UIState = {
    showLogOptions: boolean;
    showSetLogger: boolean;
    showImportModal: boolean;
    showWorkoutSummary: boolean;
    showMenu: boolean;
    showFabMenu: boolean;
    showProgramModal: boolean;
    showCopyDialog: boolean;
  };

  const [uiState, setUiState] = useState<UIState>({
    showLogOptions: false,
    showSetLogger: false,
    showImportModal: false,
    showWorkoutSummary: false,
    showMenu: false,
    showFabMenu: false,
    showProgramModal: false,
    showCopyDialog: false
  });

  const updateUiState = useCallback((key: keyof UIState, value: boolean) => {
    setUiState((prev: UIState) => ({ ...prev, [key]: value }));
  }, []);

  // Exercise data loading
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDate(new Date()));
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);

  // Convert local storage exercise to ExerciseData format
  const convertToExerciseData = useCallback((exercise: Omit<ExerciseLogType, 'id'> & { id?: string }): ExerciseData => ({
    id: exercise.id ?? uuidv4(),
    exerciseName: exercise.exerciseName,
    sets: exercise.sets,
    timestamp: new Date(exercise.timestamp),
    deviceId: exercise.deviceId || localStorage.getItem('device_id') || ''
  }), []);

  // Handle exercise data loading
  const loadExercises = useCallback(async (date: Date) => {
    let currentLoadedDate = date;
    setLoading(true);
    setExercises([]);

    try {
      const localExercises = getExerciseLogsByDate(date)
        .map(exercise => convertToExerciseData(exercise));

      if (areDatesEqual(currentLoadedDate, date)) {
        const allExercises = [...localExercises];
        allExercises.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setExercises(allExercises);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      if (areDatesEqual(currentLoadedDate, date)) {
        const localExercises = getExerciseLogsByDate(date)
          .map(exercise => convertToExerciseData(exercise));
        setExercises(localExercises);
      }
    } finally {
      if (areDatesEqual(currentLoadedDate, date)) {
        setLoading(false);
      }
    }
  }, [areDatesEqual, convertToExerciseData]);

  // Handle copy from previous session
  const handleExercisesFromPrevious = useCallback((selectedExercises: ExerciseData[]) => {
    const copiedExercises = selectedExercises.map(exercise => ({
      ...exercise,
      id: uuidv4(),
      timestamp: selectedDate
    }));

    copiedExercises.forEach(exercise => {
      saveExerciseLog(exercise);
    });

    setExercises(prevExercises => [...prevExercises, ...copiedExercises]);
    updateUiState('showCopyDialog', false);
  }, [selectedDate]);

  const handleEditExercise = useCallback((exercise: ExerciseData) => {
    setSelectedExercise(exercise);
    updateUiState('showSetLogger', true);
  }, [updateUiState]);

  const handleCloseSetLogger = useCallback(() => {
    setSelectedExercise(null);
    updateUiState('showSetLogger', false);
  }, [updateUiState]);

  const handleSaveSets = useCallback((sets: ExerciseSet[], exerciseId: string) => {
    if (!selectedExercise) return;
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
  }, [selectedExercise, selectedDate, handleCloseSetLogger]);

  const handleDeleteExercise = async (exercise: ExerciseData) => {
    if (!exercise.id) return;
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        // Convert the exercise to the format expected by deleteExerciseLog
        const exerciseToDelete = {
          ...exercise,
          timestamp: exercise.timestamp.toISOString()
        };
        deleteExerciseLog(exerciseToDelete);
        setExercises(prevExercises => prevExercises.filter(ex => ex.id !== exercise.id));
      } catch (error) {
        console.error('Error deleting exercise:', error);
      }
    }
  };

  // Handle importing exercise data
  const handleImportData = async () => {
    try {
      const logs = await importExerciseLogs();
      if (logs && logs.length > 0) {
        setExercises(prevExercises => [
          ...prevExercises,
          ...logs.map(log => convertToExerciseData(log))
        ]);
      }
      updateUiState('showImportModal', false);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  // Load exercises when date changes
  useEffect(() => {
    if (selectedDate) {
      const timeoutId = setTimeout(() => {
        loadExercises(selectedDate);
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setExercises([]);
      setLoading(false);
    }
  }, [selectedDate, loadExercises]);

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
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24 pt-20">
        <div className="relative flex flex-col h-full">
          <div className="flex-grow">
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

      {/* Floating Action Button */}
      {exercises.length > 0 && (
        <button
          className="fixed bottom-6 right-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg transition-colors"
          onClick={() => updateUiState('showLogOptions', true)}
          aria-label="Add Exercise"
        >
          +
        </button>
      )}

      {/* Program Modal */}
      {uiState.showProgramModal && (
        <ProgramModal 
          isOpen={true}
          onClose={() => setUiState(prev => ({ ...prev, showProgramModal: false }))}
          onSave={() => setUiState(prev => ({ ...prev, showProgramModal: false }))}
        />
      )}

      {/* Side Menu */}
      <SideMenu
        isOpen={uiState.showMenu}
        onClose={() => updateUiState('showMenu', false)}
        onImport={() => updateUiState('showImportModal', true)}
        onExport={() => exportExerciseData(exercises.map(convertToExerciseLog))}
        onShowWorkoutSummary={() => updateUiState('showWorkoutSummary', true)}
        onNavigateToday={() => setSelectedDate(normalizeDate(new Date()))}
        onNavigateHistory={() => setSelectedDate(normalizeDate(new Date()))}
        onNavigateProfile={() => {/* TODO: Implement profile navigation */}}
        onNavigatePrograms={() => { navigate('/programs'); }}
      />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <LogOptions 
          onClose={() => updateUiState('showLogOptions', false)}
          onExerciseAdded={() => {
            loadExercises(selectedDate);
            updateUiState('showLogOptions', false);
          }}
          onCopyFromPrevious={() => updateUiState('showCopyDialog', true)}
        />
      )}

      {/* Copy from Previous Session Dialog */}
      {uiState.showCopyDialog && (
        <CopyFromPreviousSessionDialog
          isOpen={true}
          onClose={() => updateUiState('showCopyDialog', false)}
          currentDate={selectedDate}
          onExercisesSelected={handleExercisesFromPrevious}
        />
      )}

      {/* Exercise Set Logger */}
      {uiState.showSetLogger && selectedExercise && (
        <ExerciseSetLogger
          exercise={selectedExercise}
          onCancel={handleCloseSetLogger}
          onSave={handleSaveSets}
        />
      )}

      {/* Workout Summary */}
      {uiState.showWorkoutSummary && (
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
