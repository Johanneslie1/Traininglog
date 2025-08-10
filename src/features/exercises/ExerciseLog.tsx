import React, { useState, useEffect, useCallback } from 'react';
import { SupersetProvider, useSupersets } from '../../context/SupersetContext';
import { useNavigate } from 'react-router-dom';
import { ExerciseLog as ExerciseLogType } from '../../types/exercise';
import { ExerciseSet } from '../../types/sets';
import { ExerciseData } from '../../services/exerciseDataService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import ProgramModal from '../../features/programs/ProgramModal';
import { v4 as uuidv4 } from 'uuid';
import LogOptions from './LogOptions';
import { Calendar } from './Calendar';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { db } from '../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { exportExerciseData } from '../../utils/exportUtils';
import { getExerciseLogsByDate, saveExerciseLog } from '../../utils/localStorageUtils';
import { addExerciseLog } from '../../services/firebase/exerciseLogs';
import { importExerciseLogs } from '../../utils/importUtils';
import SideMenu from '../../components/SideMenu';
import ExportModal from '../../components/ExportModal';
import DraggableExerciseDisplay from '../../components/DraggableExerciseDisplay';
import FloatingSupersetControls from '../../components/FloatingSupersetControls';
import { getAllExercisesByDate, UnifiedExerciseData, deleteExercise } from '../../utils/unifiedExerciseUtils';
import { ActivityType } from '../../types/activityTypes';

interface ExerciseLogProps {}

const ExerciseLogContent: React.FC<ExerciseLogProps> = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { removeExerciseFromSuperset, loadSupersetsForDate, saveSupersetsForDate } = useSupersets();
  
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
    showExportModal: boolean;
    showWorkoutSummary: boolean;
    showMenu: boolean;
    showProgramModal: boolean;
  };

  // State management
  const [uiState, setUiState] = useState<UIState>({
    showLogOptions: false,
    showCalendar: false,
    showSetLogger: false,
    showImportModal: false,
    showExportModal: false,
    showWorkoutSummary: false,
    showMenu: false,
    showProgramModal: false,
  });

  const updateUiState = useCallback((key: keyof UIState, value: boolean) => {
    setUiState((prev: UIState) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCalendar = useCallback((show?: boolean) => {
    updateUiState('showCalendar', show ?? !uiState.showCalendar);
  }, [uiState.showCalendar, updateUiState]);

  // Exercise data loading
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDate(new Date()));
  const [exercises, setExercises] = useState<UnifiedExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [editingExercise, setEditingExercise] = useState<UnifiedExerciseData | null>(null); // Add editing state

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

    // Normalize the target date
    const loadedDate = normalizeDate(date);
    
    // Set loading state
    setLoading(true);

    // Load supersets for this date
    const dateString = loadedDate.toISOString().split('T')[0];
    loadSupersetsForDate(dateString);

    try {
      // Use the unified function to get all exercise types
      const allExercises = await getAllExercisesByDate(loadedDate, userId);

      // Also try to get any Firebase resistance exercises to merge
      const { startOfDay, endOfDay } = getDateRange(loadedDate);
      const q = query(
        collection(db, 'users', userId, 'exercises'),
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

      // Filter out any duplicates from the unified list
      const uniqueFirebaseExercises = firebaseExercises.filter(fEx => 
        !allExercises.some(ex => ex.id === fEx.id)
      );

      // Combine all exercises
      const combinedExercises = [...allExercises, ...uniqueFirebaseExercises];

      // Sort by timestamp to maintain consistent order
      combinedExercises.sort((a, b) => {
        if (a.timestamp instanceof Date && b.timestamp instanceof Date) {
          return a.timestamp.getTime() - b.timestamp.getTime();
        }
        return 0;
      });

      setExercises(combinedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // On error, try to get unified data anyway
      try {
        const allExercises = await getAllExercisesByDate(loadedDate, userId);
        setExercises(allExercises);
      } catch (fallbackError) {
        console.error('Error in fallback:', fallbackError);
        // Final fallback to just local resistance exercises
        const localExercises = getExerciseLogsByDate(loadedDate)
          .map(exercise => convertToExerciseData(exercise, userId));
        setExercises(localExercises);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, areDatesEqual, normalizeDate, getDateRange, convertToExerciseData, loadSupersetsForDate]);
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
    
    // Set loading state immediately to prevent flickering
    setLoading(true);
    setSelectedDate(normalized);
    
    // Load exercises for the new date
    await loadExercises(normalized);
    toggleCalendar(false);
  }, [normalizeDate, loadExercises, toggleCalendar]);

  // Automatic initialization and data loading when user changes
  useEffect(() => {
    if (user?.id) {
      loadExercises(selectedDate);
    }
  }, [user?.id, loadExercises, selectedDate]);

  // Handle exercise select from calendar - now unused but kept for compatibility
  const handleExerciseSelect = useCallback((_selectedExercises: ExerciseData[]) => {
    // No longer set exercises here to avoid race condition
    // The loadExercises function will handle data loading
    toggleCalendar(false);
  }, [toggleCalendar]);

  const handleCloseSetLogger = useCallback(() => {
    setSelectedExercise(null);
    updateUiState('showSetLogger', false);
  }, [updateUiState]);

  const handleSaveSets = useCallback(async (sets: ExerciseSet[], exerciseId: string) => {
    if (!selectedExercise || !user?.id) {
      console.error('Cannot save sets: missing exercise or user');
      return;
    }
    
    try {
      console.log('💾 Saving sets for exercise:', { 
        exerciseId, 
        exerciseName: selectedExercise.exerciseName,
        setCount: sets.length,
      });

      const updatedExercise: ExerciseData = {
        ...selectedExercise,
        id: exerciseId || uuidv4(), // Ensure ID is always present
        sets,
        timestamp: selectedDate
      };

      // Save to Firestore
      const firestoreId = await addExerciseLog(
        {
          exerciseName: updatedExercise.exerciseName,
          userId: user.id,
          sets: sets
        },
        selectedDate,
        updatedExercise.id // Pass existing ID if we have one
      );

      console.log('✅ Exercise saved to Firestore successfully');

      // Save to local storage with the correct ID from Firestore
      await saveExerciseLog({
        ...updatedExercise,
        id: firestoreId,
        userId: user.id
      });

      console.log('✅ Exercise saved to local storage');
      handleCloseSetLogger();
      await loadExercises(selectedDate);
    } catch (error) {
      console.error('❌ Error saving exercise sets:', error);
      alert('Failed to save exercise sets. Please try again.');
    }
  }, [selectedExercise, user, selectedDate, handleCloseSetLogger, loadExercises]);

  const handleDeleteExercise = async (exercise: UnifiedExerciseData) => {
    if (!user?.id) {
      console.error('Cannot delete exercise: missing user ID', { userId: user?.id });
      alert('Cannot delete exercise: user not authenticated');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    // Optimistically update UI
    setExercises(prev => prev.filter(ex => ex.id !== exercise.id));

    try {
      console.log('🗑️ Attempting to delete exercise:', { 
        exerciseId: exercise.id, 
        userId: user.id,
        exerciseName: exercise.exerciseName,
        timestamp: exercise.timestamp,
        activityType: exercise.activityType
      });

      // Use the unified delete function
      const deleteResult = await deleteExercise(exercise, user.id);
      
      if (deleteResult) {
        console.log('✅ Exercise deleted successfully');
        
        // Remove exercise from any superset it might be in
        if (exercise.id) {
          removeExerciseFromSuperset(exercise.id);
        }
        
        // Reload exercises to ensure UI is in sync
        await loadExercises(selectedDate);
      } else {
        throw new Error('Delete operation returned false');
      }

    } catch (error) {
      console.error('❌ Error deleting exercise:', error);
      
      // Revert UI change on error
      setExercises(prev => [...prev, exercise]);
      
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete exercise: ${errorMessage}`);

      // Reload exercises to ensure UI is in sync
      await loadExercises(selectedDate);
    }
  };
  
  // Handle export with date range
  const handleExport = useCallback(async (startDate?: Date, endDate?: Date, format: 'csv' | 'json' | 'both' = 'both') => {
    try {
      // Pass undefined to let the export function get all exercises from Firestore and filter by date range
      // This ensures we export from all dates, not just the currently selected date on the dashboard
      // Fixes issue where only exercises from the selected date were exported instead of the full range
      await exportExerciseData(undefined, startDate, endDate, format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, []);
  
  // No longer need event listener since we use the floating controls component

  const handleEditExercise = (exercise: ExerciseData) => {
    // Check activity type to determine which editor to open
    const unifiedExercise = exercise as UnifiedExerciseData;
    
    if (unifiedExercise.activityType && unifiedExercise.activityType !== ActivityType.RESISTANCE) {
      // For non-resistance activities, set editing mode and open LogOptions
      setEditingExercise(unifiedExercise);
      updateUiState('showLogOptions', true);
    } else {
      // For resistance exercises, use the existing set logger
      setSelectedExercise(exercise);
      updateUiState('showSetLogger', true);
    }
  };

  // Handle exercise reordering with persistence
  const handleReorderExercises = useCallback((reorderedExercises: ExerciseData[]) => {
    // Update the UI immediately
    setExercises(reorderedExercises);
    
    // Save the new order to localStorage by updating timestamps
    // This creates a subtle time difference between exercises to maintain order
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Create a base timestamp for the selected date
    const baseTime = new Date(selectedDate);
    baseTime.setHours(12, 0, 0, 0); // Noon on the selected date
    
    // Save each exercise with an incremented timestamp to preserve order
    reorderedExercises.forEach((exercise, index) => {
      if (!exercise.id || !user?.id) return;
      
      // Create a new timestamp with a small increment to maintain order
      const newTimestamp = new Date(baseTime);
      newTimestamp.setMilliseconds(index * 100); // 100ms increments
      
      const updatedExercise = {
        ...exercise,
        timestamp: newTimestamp,
        userId: user.id,
        id: exercise.id // Ensure ID is present and not undefined
      };
      
      // Update in local storage
      saveExerciseLog(updatedExercise as any); // Use type assertion to fix build issue
      
      // Update in Firestore if needed (can be done in a batch later)
      // For now, we're using local storage as the primary persistence mechanism for ordering
    });
    
    // Save superset order if any exercises are in supersets
    saveSupersetsForDate(dateString);
    
    console.log('✅ Exercise order saved');
  }, [selectedDate, user, saveSupersetsForDate]);

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
  }, [selectedDate, user?.id]);

  // Clear selected exercise when changing dates
  useEffect(() => {
    if (selectedExercise && !areDatesEqual(selectedExercise.timestamp, selectedDate)) {
      handleCloseSetLogger();
    }
  }, [selectedDate, selectedExercise, areDatesEqual, handleCloseSetLogger]);

  // Debug auth state
  useEffect(() => {
    console.log('Auth state:', {
      isAuthenticated: !!user,
      userId: user?.id,
      hasRequiredFields: user ? {
        hasId: !!user.id,
        hasEmail: !!user.email,
        hasFirstName: !!user.firstName,
        hasLastName: !!user.lastName,
        hasRole: !!user.role
      } : null
    });
  }, [user]);

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
          </div>
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
                {/* Exercise display with drag and drop */}
                <DraggableExerciseDisplay
                  exercises={exercises}
                  onEditExercise={handleEditExercise}
                  onDeleteExercise={handleDeleteExercise}
                  onReorderExercises={handleReorderExercises}
                />
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

      {/* Add Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => updateUiState('showLogOptions', true)}
          className="w-16 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
          aria-label="Add Exercise"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {/* Program Modal */}
      {uiState.showProgramModal && (
        <ProgramModal
          isOpen={uiState.showProgramModal}
          onClose={() => setUiState(prev => ({ ...prev, showProgramModal: false }))}
          onSave={() => setUiState(prev => ({ ...prev, showProgramModal: false }))} // Wire this to your actual add logic
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={uiState.showExportModal}
        onClose={() => updateUiState('showExportModal', false)}
        onExport={handleExport}
      />

      {/* Side Menu */}
      {/* Floating Superset Controls */}
      <FloatingSupersetControls />

      <SideMenu
        isOpen={uiState.showMenu}
        onClose={() => updateUiState('showMenu', false)}
        onImport={() => updateUiState('showImportModal', true)}
        onExport={() => updateUiState('showExportModal', true)}
        onShowWorkoutSummary={() => updateUiState('showWorkoutSummary', true)}
        onNavigateToday={() => setSelectedDate(new Date())}
        onNavigatePrograms={() => { navigate('/programs'); }}
        onNavigateExercises={() => { navigate('/exercises'); }}
        onNavigateDashboard={() => { navigate('/dashboard'); }}
      />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <div className="fixed inset-0 bg-black/90 z-50">
          <LogOptions 
            onClose={() => {
              updateUiState('showLogOptions', false);
              setEditingExercise(null); // Clear editing state when closing
            }}
            onExerciseAdded={() => {
              loadExercises(selectedDate);
              setEditingExercise(null); // Clear editing state after saving
            }}
            selectedDate={selectedDate}
            editingExercise={editingExercise} // Pass editing exercise
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
            previousSet={selectedExercise.sets.length > 0 ? selectedExercise.sets[selectedExercise.sets.length - 1] : undefined}
            showPreviousSets={true}
            useExerciseId={true}
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

const ExerciseLog: React.FC<ExerciseLogProps> = () => {
  return (
    <ErrorBoundary fallback={<div className="text-white p-4">Error loading exercises. Please try again.</div>}>
      <SupersetProvider>
        <ExerciseLogContent />
      </SupersetProvider>
    </ErrorBoundary>
  );
};

export default ExerciseLog;
