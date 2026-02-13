import React, { useState, useEffect, useCallback } from 'react';
import { SupersetProvider, useSupersets } from '../../context/SupersetContext';
import { useDate } from '../../context/DateContext';
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
import { ExerciseSetLogger } from './ExerciseSetLogger';
import WorkoutSummary from './WorkoutSummary';
import { db } from '../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getExerciseLogsByDate, saveExerciseLog } from '../../utils/localStorageUtils';
import { addExerciseLog } from '../../services/firebase/exerciseLogs';
import SideMenu from '../../components/SideMenu';
import Settings from '../../components/Settings';
import DraggableExerciseDisplay from '../../components/DraggableExerciseDisplay';
import FloatingSupersetControls from '../../components/FloatingSupersetControls';
import { getAllExercisesByDate, UnifiedExerciseData, deleteExercise } from '../../utils/unifiedExerciseUtils';
import { FloatingActionButton, EmptyState, ExerciseListSkeleton } from '../../components/ui';

interface ExerciseLogProps {}

const ExerciseLogContent: React.FC<ExerciseLogProps> = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { removeExerciseFromSuperset, loadSupersetsForDate, saveSupersetsForDate } = useSupersets();
  const { selectedDate, setSelectedDate, normalizeDate } = useDate();
  
  // Date utility functions
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
    showSetLogger: boolean;
    showWorkoutSummary: boolean;
    showMenu: boolean;
    showProgramModal: boolean;
  };

  // State management
  const [uiState, setUiState] = useState<UIState>({
    showLogOptions: false,
    showSetLogger: false,
    showWorkoutSummary: false,
    showMenu: false,
    showProgramModal: false,
  });

  const updateUiState = useCallback((key: keyof UIState, value: boolean) => {
    setUiState((prev: UIState) => ({ ...prev, [key]: value }));
  }, []);

  // Exercise data loading
  const [exercises, setExercises] = useState<UnifiedExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [editingExercise, setEditingExercise] = useState<UnifiedExerciseData | null>(null);

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
  
  // Automatic initialization and data loading when user changes
  useEffect(() => {
    if (user?.id) {
      loadExercises(selectedDate);
    }
  }, [user?.id, loadExercises, selectedDate]);

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
  
  // No longer need event listener since we use the floating controls component

  const handleEditExercise = (exercise: ExerciseData) => {
    // Always use LogOptions for editing to provide consistent experience
    const unifiedExercise = exercise as UnifiedExerciseData;
    setEditingExercise(unifiedExercise);
    updateUiState('showLogOptions', true);
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
    <div className="relative min-h-screen bg-bg-primary">
      {/* Main Content */}
      <main className="px-4 pb-24 pt-4">
        <div className="relative flex flex-col h-full">
          <div className="flex-grow">
            {loading ? (
              <ExerciseListSkeleton count={3} />
            ) : exercises.length === 0 ? (
              <EmptyState
                illustration="workout"
                title="Ready to Track Your Workout?"
                description="Start logging to see your progress, track PRs, and build consistency"
                primaryAction={{
                  label: 'Log First Exercise',
                  onClick: () => updateUiState('showLogOptions', true)
                }}
              />
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

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => updateUiState('showLogOptions', true)}
        label="Add Exercise"
        position="bottom-right"
      />
      {/* Program Modal */}
      {uiState.showProgramModal && (
        <ProgramModal
          isOpen={uiState.showProgramModal}
          onClose={() => setUiState(prev => ({ ...prev, showProgramModal: false }))}
          onSave={() => setUiState(prev => ({ ...prev, showProgramModal: false }))} // Wire this to your actual add logic
        />
      )}

      {/* Side Menu */}
      {/* Floating Superset Controls */}
      <FloatingSupersetControls />

      <SideMenu
        isOpen={uiState.showMenu}
        onClose={() => updateUiState('showMenu', false)}
        onNavigateToday={() => setSelectedDate(new Date())}
        onNavigatePrograms={() => { navigate('/programs'); }}
        onOpenSettings={() => {
          updateUiState('showMenu', false);
          setShowSettings(true);
        }}
      />

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <div className="fixed inset-0 bg-bg-primary/90 z-50">
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
        <div className="fixed inset-0 bg-bg-primary/90 z-50">
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

      {/* Workout Summary Modal */}
      {uiState.showWorkoutSummary && exercises.length > 0 && (
        <div className="fixed inset-0 bg-bg-primary/90 z-50">
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
    <ErrorBoundary fallback={<div className="text-text-primary p-4">Error loading exercises. Please try again.</div>}>
      <SupersetProvider>
        <ExerciseLogContent />
      </SupersetProvider>
    </ErrorBoundary>
  );
};

export default ExerciseLog;


