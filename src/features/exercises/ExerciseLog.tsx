import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SupersetProvider, useSupersets } from '../../context/SupersetContext';
import { useDate } from '../../context/DateContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExerciseLog as ExerciseLogType, ExercisePrescriptionAssistantData } from '../../types/exercise';
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
import {
  addExerciseLog,
  backfillExerciseLogSupersetMetadata,
  repairExerciseLogActivityTypes
} from '@/services/firebase/exerciseLogs';
import SideMenu from '../../components/SideMenu';
import DraggableExerciseDisplay from '../../components/DraggableExerciseDisplay';
import FloatingSupersetControls from '../../components/FloatingSupersetControls';
import { getAllExercisesByDate, UnifiedExerciseData, deleteExercise } from '../../utils/unifiedExerciseUtils';
import { FloatingActionButton, EmptyState, ExerciseListSkeleton } from '../../components/ui';
import { getSharedSessionAssignment, updateSharedSessionStatus } from '@/services/sessionService';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { SharedSessionAssignment } from '@/types/program';
import { generateExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import toast from 'react-hot-toast';
import { buildSupersetLabels } from '@/utils/supersetUtils';
import { SupersetGroup } from '@/types/session';

interface ExerciseLogProps {}

interface SharedSessionExerciseMeta {
  sharedSessionAssignmentId?: string;
  sharedSessionId?: string;
  sharedSessionExerciseId?: string;
  sharedSessionDateKey?: string;
  sharedSessionExerciseCompleted?: boolean;
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
}

interface SaveMetadata {
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
}

const ExerciseLogContent: React.FC<ExerciseLogProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state, removeExerciseFromSuperset, loadSupersetsForDate, saveSupersetsForDate, updateExerciseOrder } = useSupersets();
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
  const [logOptionsWarmupMode, setLogOptionsWarmupMode] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [editingExercise, setEditingExercise] = useState<UnifiedExerciseData | null>(null);
  const sharedImportInFlightRef = useRef<string | null>(null);
  const processedSharedImportRequestsRef = useRef<Set<string>>(new Set());

  const getDateKey = useCallback((date: Date): string => {
    return normalizeDate(date).toISOString().split('T')[0];
  }, [normalizeDate]);

  const getPersistedSupersetStateForDate = useCallback((dateKey: string): { supersets: SupersetGroup[]; exerciseOrder: string[] } => {
    try {
      const supersetsRaw = localStorage.getItem(`superset_data_${dateKey}`);
      const exerciseOrderRaw = localStorage.getItem(`exercise_order_${dateKey}`);

      const supersetsParsed = supersetsRaw ? JSON.parse(supersetsRaw) : [];
      const orderParsed = exerciseOrderRaw ? JSON.parse(exerciseOrderRaw) : [];

      return {
        supersets: Array.isArray(supersetsParsed) ? supersetsParsed : [],
        exerciseOrder: Array.isArray(orderParsed) ? orderParsed : [],
      };
    } catch (error) {
      console.warn('⚠️ Could not parse persisted superset state for date:', dateKey, error);
      return { supersets: [], exerciseOrder: [] };
    }
  }, []);

  const toSafeDate = useCallback((value: unknown): Date => {
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in (value as Record<string, unknown>) &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate();
    }

    const parsed = value ? new Date(value as string | number | Date) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, []);

  const hasMeaningfulSetData = useCallback((set: ExerciseSet): boolean => {
    return Object.entries(set).some(([key, value]) => {
      if (key === 'difficulty' || key === 'notes' || key === 'setNumber') {
        return false;
      }

      if (typeof value === 'number') {
        return value > 0;
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
  }, []);

  const getImportedSharedSessionExerciseDocs = useCallback(async (
    assignmentId: string,
    dateKey: string,
    userId: string
  ) => {
    const sharedImportQuery = query(
      collection(db, 'users', userId, 'exercises'),
      where('sharedSessionAssignmentId', '==', assignmentId)
    );
    const sharedImportSnap = await getDocs(sharedImportQuery);

    return sharedImportSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((docData: any) => docData.sharedSessionDateKey === dateKey);
  }, []);

  const syncSharedAssignmentCompletion = useCallback(async (
    assignment: SharedSessionAssignment,
    userId: string,
    dateKey: string
  ) => {
    const importedDocs = await getImportedSharedSessionExerciseDocs(assignment.id, dateKey, userId);
    if (importedDocs.length === 0) {
      return;
    }

    const expectedExerciseCount = assignment.sessionData.exercises.length;
    const completedExercises = importedDocs.filter((docData: any) => {
      if (docData.sharedSessionExerciseCompleted === true) {
        return true;
      }

      const sets = Array.isArray(docData.sets) ? docData.sets as ExerciseSet[] : [];
      return sets.some(hasMeaningfulSetData);
    });

    if (completedExercises.length >= expectedExerciseCount && assignment.status !== 'completed') {
      await updateSharedSessionStatus(assignment.id, 'completed');
      toast.success('Assigned session marked as completed');
      return;
    }

    if (assignment.status === 'not-started') {
      await updateSharedSessionStatus(assignment.id, 'in-progress');
    }
  }, [getImportedSharedSessionExerciseDocs, hasMeaningfulSetData]);

  // Convert local storage exercise to ExerciseData format
  const convertToExerciseData = useCallback((exercise: Omit<ExerciseLogType, 'id'> & { id?: string }, userId: string): ExerciseData => ({
    id: exercise.id ?? uuidv4(),
    exerciseName: exercise.exerciseName,
    sets: exercise.sets,
    timestamp: new Date(exercise.timestamp),
    userId: userId,
    deviceId: exercise.deviceId || localStorage.getItem('device_id') || '',
    supersetId: exercise.supersetId,
    supersetLabel: exercise.supersetLabel,
    supersetName: exercise.supersetName,
    activityType: exercise.activityType as ActivityType | undefined,
    isWarmup: exercise.isWarmup,
    sharedSessionAssignmentId: exercise.sharedSessionAssignmentId,
    sharedSessionId: exercise.sharedSessionId,
    sharedSessionExerciseId: exercise.sharedSessionExerciseId,
    sharedSessionDateKey: exercise.sharedSessionDateKey,
    sharedSessionExerciseCompleted: exercise.sharedSessionExerciseCompleted,
    prescription: exercise.prescription,
    instructionMode: exercise.instructionMode,
    instructions: exercise.instructions,
    prescriptionAssistant: exercise.prescriptionAssistant
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
          timestamp: toSafeDate(data.timestamp),
          deviceId: data.deviceId,
          supersetId: data.supersetId,
          supersetLabel: data.supersetLabel,
          supersetName: data.supersetName,
          activityType: data.activityType,
          isWarmup: data.isWarmup,
          sharedSessionAssignmentId: data.sharedSessionAssignmentId,
          sharedSessionId: data.sharedSessionId,
          sharedSessionExerciseId: data.sharedSessionExerciseId,
          sharedSessionDateKey: data.sharedSessionDateKey,
          sharedSessionExerciseCompleted: data.sharedSessionExerciseCompleted,
          prescription: data.prescription,
          instructionMode: data.instructionMode,
          instructions: data.instructions,
          prescriptionAssistant: data.prescriptionAssistant
        }, userId);
      });

      const localExercises = getExerciseLogsByDate(loadedDate)
        .map(exercise => convertToExerciseData(exercise, userId));

      // Filter out any duplicates from the unified list
      const uniqueFirebaseExercises = firebaseExercises.filter(fEx => 
        !allExercises.some(ex => ex.id === fEx.id)
      );

      const uniqueLocalExercises = localExercises.filter(localEx =>
        !allExercises.some(ex => ex.id === localEx.id) &&
        !firebaseExercises.some(ex => ex.id === localEx.id)
      );

      // Combine all exercises
      const combinedExercises = [...allExercises, ...uniqueFirebaseExercises, ...uniqueLocalExercises];

      // Sort by timestamp to maintain consistent order
      combinedExercises.sort((a, b) => {
        if (a.timestamp instanceof Date && b.timestamp instanceof Date) {
          return a.timestamp.getTime() - b.timestamp.getTime();
        }
        return 0;
      });

      try {
        const repairedCount = await repairExerciseLogActivityTypes(
          userId,
          combinedExercises
            .filter((exercise) => Boolean(exercise.id))
            .map((exercise) => ({
              id: exercise.id,
              exerciseName: exercise.exerciseName,
              sets: exercise.sets,
              activityType: exercise.activityType,
            }))
        );

        if (repairedCount > 0) {
          console.log(`🔧 Repaired activityType on ${repairedCount} exercise log(s)`);
        }
      } catch (repairError) {
        console.warn('⚠️ ActivityType repair pass failed (continuing without blocking UI):', repairError);
      }

      try {
        const { supersets: persistedSupersets, exerciseOrder: persistedExerciseOrder } =
          getPersistedSupersetStateForDate(dateString);

        if (persistedSupersets.length > 0) {
          const repairedSupersetCount = await backfillExerciseLogSupersetMetadata(
            userId,
            combinedExercises.map((exercise) => ({
              id: exercise.id,
              supersetId: exercise.supersetId,
              supersetLabel: exercise.supersetLabel,
              supersetName: exercise.supersetName,
            })),
            persistedSupersets,
            persistedExerciseOrder
          );

          if (repairedSupersetCount > 0) {
            console.log(`🔧 Backfilled superset metadata on ${repairedSupersetCount} exercise log(s)`);
          }
        }
      } catch (supersetRepairError) {
        console.warn('⚠️ Superset metadata backfill failed (continuing without blocking UI):', supersetRepairError);
      }

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
  }, [
    user?.id,
    areDatesEqual,
    normalizeDate,
    getDateRange,
    convertToExerciseData,
    loadSupersetsForDate,
    toSafeDate,
    getPersistedSupersetStateForDate,
  ]);
  
  const handleCloseSetLogger = useCallback(() => {
    setSelectedExercise(null);
    updateUiState('showSetLogger', false);
  }, [updateUiState]);

  const handleSaveSets = useCallback(async (sets: ExerciseSet[], exerciseId: string, metadata?: SaveMetadata) => {
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

      const exerciseOrder = exercises
        .map((exercise) => exercise.id)
        .filter((id): id is string => Boolean(id));

      if (updatedExercise.id && !exerciseOrder.includes(updatedExercise.id)) {
        exerciseOrder.push(updatedExercise.id);
      }

      const labelsByExerciseId = buildSupersetLabels(state.supersets, exerciseOrder);
      const supersetMetadata = updatedExercise.id ? labelsByExerciseId[updatedExercise.id] : undefined;

      // Save to Firestore
      const selectedExerciseWithMeta = selectedExercise as ExerciseData & SharedSessionExerciseMeta;
      const firestoreId = await addExerciseLog(
        {
          exerciseName: updatedExercise.exerciseName,
          userId: user.id,
          sets: sets,
          activityType: selectedExerciseWithMeta.activityType,
          supersetId: supersetMetadata?.supersetId || selectedExerciseWithMeta.supersetId,
          supersetLabel: supersetMetadata?.label || selectedExerciseWithMeta.supersetLabel,
          supersetName: supersetMetadata?.supersetName || selectedExerciseWithMeta.supersetName,
          prescription: selectedExerciseWithMeta.prescription,
          instructionMode: selectedExerciseWithMeta.instructionMode,
          instructions: selectedExerciseWithMeta.instructions,
          prescriptionAssistant: metadata?.prescriptionAssistant || selectedExerciseWithMeta.prescriptionAssistant,
          isWarmup: selectedExerciseWithMeta.isWarmup,
          ...(selectedExerciseWithMeta.sharedSessionAssignmentId && {
            sharedSessionAssignmentId: selectedExerciseWithMeta.sharedSessionAssignmentId
          }),
          ...(selectedExerciseWithMeta.sharedSessionId && {
            sharedSessionId: selectedExerciseWithMeta.sharedSessionId
          }),
          ...(selectedExerciseWithMeta.sharedSessionExerciseId && {
            sharedSessionExerciseId: selectedExerciseWithMeta.sharedSessionExerciseId
          }),
          ...(selectedExerciseWithMeta.sharedSessionDateKey && {
            sharedSessionDateKey: selectedExerciseWithMeta.sharedSessionDateKey
          }),
          ...(selectedExerciseWithMeta.sharedSessionAssignmentId && {
            sharedSessionExerciseCompleted: sets.some(hasMeaningfulSetData)
          })
        },
        selectedDate,
        updatedExercise.id // Pass existing ID if we have one
      );

      console.log('✅ Exercise saved to Firestore successfully');

      // Save to local storage with the correct ID from Firestore
      await saveExerciseLog({
        ...updatedExercise,
        supersetId: supersetMetadata?.supersetId || selectedExerciseWithMeta.supersetId,
        supersetLabel: supersetMetadata?.label || selectedExerciseWithMeta.supersetLabel,
        supersetName: supersetMetadata?.supersetName || selectedExerciseWithMeta.supersetName,
        prescriptionAssistant: metadata?.prescriptionAssistant || selectedExerciseWithMeta.prescriptionAssistant,
        id: firestoreId,
        userId: user.id
      });

      console.log('✅ Exercise saved to local storage');

      if (selectedExerciseWithMeta.sharedSessionAssignmentId) {
        const latestAssignment = await getSharedSessionAssignment(selectedExerciseWithMeta.sharedSessionAssignmentId);

        if (latestAssignment) {
          const dateKey = selectedExerciseWithMeta.sharedSessionDateKey || getDateKey(selectedDate);
          await syncSharedAssignmentCompletion(latestAssignment, user.id, dateKey);
        }
      }

      handleCloseSetLogger();
      await loadExercises(selectedDate);
    } catch (error) {
      console.error('❌ Error saving exercise sets:', error);
      alert('Failed to save exercise sets. Please try again.');
    }
  }, [selectedExercise, user, selectedDate, exercises, state.supersets, handleCloseSetLogger, loadExercises, hasMeaningfulSetData, syncSharedAssignmentCompletion, getDateKey]);

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

  const openLogOptions = useCallback(() => {
    setLogOptionsWarmupMode(false);
    setEditingExercise(null);
    updateUiState('showLogOptions', true);
  }, [updateUiState]);

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

  const warmupExercises = exercises.filter((exercise) => exercise.isWarmup === true);
  const mainSessionExercises = exercises.filter((exercise) => exercise.isWarmup !== true);
  const displayMainSessionExercises =
    mainSessionExercises.length > 0 || warmupExercises.length > 0
      ? mainSessionExercises
      : exercises;

  const handleWarmupReorder = useCallback((reorderedWarmups: UnifiedExerciseData[]) => {
    const nonWarmupExercises = exercises.filter((exercise) => exercise.isWarmup !== true);
    handleReorderExercises([...reorderedWarmups, ...nonWarmupExercises]);
  }, [exercises, handleReorderExercises]);

  const handleMainSessionReorder = useCallback((reorderedMainExercises: UnifiedExerciseData[]) => {
    const currentWarmups = exercises.filter((exercise) => exercise.isWarmup === true);
    handleReorderExercises([...currentWarmups, ...reorderedMainExercises]);
  }, [exercises, handleReorderExercises]);

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

  useEffect(() => {
    const routeState = location.state as {
      sharedSessionAssignment?: SharedSessionAssignment;
      sharedSessionImportRequestId?: string;
    } | null;
    const sharedSessionAssignment = routeState?.sharedSessionAssignment;

    if (!sharedSessionAssignment || !user?.id) {
      return;
    }

    const importRequestId = routeState?.sharedSessionImportRequestId || `${location.key}-${sharedSessionAssignment.id}`;

    if (processedSharedImportRequestsRef.current.has(importRequestId)) {
      return;
    }

    if (sharedImportInFlightRef.current === importRequestId) {
      return;
    }

    processedSharedImportRequestsRef.current.add(importRequestId);
    sharedImportInFlightRef.current = importRequestId;
    navigate(location.pathname, { replace: true, state: null });

    const addAssignedSessionToLog = async () => {
      try {
        const dateKey = getDateKey(selectedDate);
        const sourceExercises = sharedSessionAssignment.sessionData.exercises || [];
        const sourceExerciseOrder = sharedSessionAssignment.sessionData.exerciseOrder?.length
          ? sharedSessionAssignment.sessionData.exerciseOrder
          : sourceExercises.map((exercise) => exercise.id);
        const sessionSupersets = Array.isArray(sharedSessionAssignment.sessionData.supersets)
          ? sharedSessionAssignment.sessionData.supersets
          : [];
        const sourceLabelsByExerciseId = buildSupersetLabels(sessionSupersets, sourceExerciseOrder);
        const sourceSupersetByExerciseId = new Map<string, {
          supersetId?: string;
          supersetLabel?: string;
          supersetName?: string;
        }>();

        sessionSupersets.forEach((superset) => {
          superset.exerciseIds.forEach((exerciseId) => {
            const labelInfo = sourceLabelsByExerciseId[exerciseId];
            sourceSupersetByExerciseId.set(exerciseId, {
              supersetId: superset.id,
              supersetLabel: labelInfo?.label,
              supersetName: superset.name
            });
          });
        });

        const importedExercisesForUi: UnifiedExerciseData[] = [];
        const sourceToCreatedExerciseId = new Map<string, string>();

        for (const [index, exercise] of sourceExercises.entries()) {
          const activityType = normalizeActivityType(exercise.activityType);
          const isWarmup = sharedSessionAssignment.sessionData.isWarmupSession === true;
          const sets: ExerciseSet[] = [];
          const sourceSupersetMeta = sourceSupersetByExerciseId.get(exercise.id);
          const supersetId = exercise.supersetId ?? sourceSupersetMeta?.supersetId;
          const supersetLabel = exercise.supersetLabel ?? sourceSupersetMeta?.supersetLabel;
          const supersetName = exercise.supersetName ?? sourceSupersetMeta?.supersetName;
          const prescriptionAssistant = await generateExercisePrescriptionAssistant({
            exercise: {
              id: exercise.id,
              name: exercise.name,
              activityType,
              prescription: exercise.prescription
            },
            userId: user.id,
            sessionContext: {
              date: dateKey,
              warmupDone: true
            }
          });

          const createdExerciseId = await addExerciseLog(
            {
              exerciseName: exercise.name,
              userId: user.id,
              sets,
              activityType: activityType,
              prescription: exercise.prescription,
              instructionMode: exercise.instructionMode,
              instructions: typeof exercise.instructions === 'string'
                ? exercise.instructions
                : Array.isArray(exercise.instructions)
                  ? exercise.instructions[0]
                  : undefined,
              prescriptionAssistant,
              isWarmup,
              sharedSessionAssignmentId: sharedSessionAssignment.id,
              sharedSessionId: sharedSessionAssignment.sharedSessionId,
              sharedSessionExerciseId: exercise.id,
              sharedSessionDateKey: dateKey,
              sharedSessionExerciseCompleted: false,
              supersetId,
              supersetLabel,
              supersetName
            },
            selectedDate
          );

          sourceToCreatedExerciseId.set(exercise.id, createdExerciseId);

          const uiTimestamp = new Date(selectedDate);
          uiTimestamp.setMilliseconds(index * 100);

          importedExercisesForUi.push({
            id: createdExerciseId,
            exerciseName: exercise.name,
            timestamp: uiTimestamp,
            userId: user.id,
            sets,
            activityType,
            isWarmup,
            sharedSessionAssignmentId: sharedSessionAssignment.id,
            sharedSessionId: sharedSessionAssignment.sharedSessionId,
            sharedSessionExerciseId: exercise.id,
            sharedSessionDateKey: dateKey,
            sharedSessionExerciseCompleted: false,
            supersetId,
            supersetLabel,
            supersetName,
            prescription: exercise.prescription,
            instructionMode: exercise.instructionMode,
            instructions: typeof exercise.instructions === 'string'
              ? exercise.instructions
              : Array.isArray(exercise.instructions)
                ? exercise.instructions[0]
                : undefined,
            prescriptionAssistant
          });
        }

        if (importedExercisesForUi.length > 0) {
          setExercises((prevExercises) => {
            const mergedById = new Map<string, UnifiedExerciseData>();

            prevExercises.forEach((existingExercise) => {
              if (existingExercise.id) {
                mergedById.set(existingExercise.id, existingExercise);
              }
            });

            importedExercisesForUi.forEach((importedExercise) => {
              if (importedExercise.id) {
                mergedById.set(importedExercise.id, importedExercise);
              }
            });

            return Array.from(mergedById.values()).sort((a, b) => {
              const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
              const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
              return timeA - timeB;
            });
          });

          const mappedSessionSupersets: SupersetGroup[] = sessionSupersets.reduce<SupersetGroup[]>((acc, superset, index) => {
              const mappedExerciseIds = superset.exerciseIds
                .map((sourceExerciseId) => sourceToCreatedExerciseId.get(sourceExerciseId))
                .filter((exerciseId): exerciseId is string => Boolean(exerciseId));

              if (mappedExerciseIds.length < 2) {
                return acc;
              }

              acc.push({
                id: `${superset.id}-${importRequestId}`,
                name: superset.name,
                order: superset.order ?? index,
                exerciseIds: mappedExerciseIds
              });

              return acc;
            }, []);

          const mappedPerExerciseSupersets: SupersetGroup[] = [];
          if (mappedSessionSupersets.length === 0) {
            const groupedBySupersetId = new Map<string, { name?: string; exerciseIds: string[] }>();

            importedExercisesForUi.forEach((exercise) => {
              if (!exercise.id || !exercise.supersetId) {
                return;
              }

              const key = exercise.supersetId;
              const existing = groupedBySupersetId.get(key);

              if (existing) {
                existing.exerciseIds.push(exercise.id);
              } else {
                groupedBySupersetId.set(key, {
                  name: exercise.supersetName,
                  exerciseIds: [exercise.id]
                });
              }
            });

            let generatedOrder = 0;

            groupedBySupersetId.forEach((value, key) => {
              if (value.exerciseIds.length < 2) {
                return;
              }

              mappedPerExerciseSupersets.push({
                id: `${key}-${importRequestId}`,
                name: value.name,
                order: generatedOrder,
                exerciseIds: value.exerciseIds
              });

              generatedOrder += 1;
            });
          }

          const supersetsToPersist = mappedSessionSupersets.length > 0
            ? mappedSessionSupersets
            : mappedPerExerciseSupersets;

          if (supersetsToPersist.length > 0) {
            const persisted = getPersistedSupersetStateForDate(dateKey);
            const importedExerciseOrder = sourceExerciseOrder
              .map((sourceExerciseId) => sourceToCreatedExerciseId.get(sourceExerciseId))
              .filter((exerciseId): exerciseId is string => Boolean(exerciseId));

            const mergedExerciseOrder = [
              ...persisted.exerciseOrder.filter((exerciseId) => !importedExerciseOrder.includes(exerciseId)),
              ...importedExerciseOrder
            ];

            const mergedSupersets = [...persisted.supersets, ...supersetsToPersist];

            localStorage.setItem(`superset_data_${dateKey}`, JSON.stringify(mergedSupersets));
            localStorage.setItem(`exercise_order_${dateKey}`, JSON.stringify(mergedExerciseOrder));
            loadSupersetsForDate(dateKey);
            updateExerciseOrder(mergedExerciseOrder);
          }
        }

        await syncSharedAssignmentCompletion(sharedSessionAssignment, user.id, dateKey);

        await loadExercises(selectedDate);
        toast.success('Assigned session added to your log');
      } catch (error) {
        console.error('Error adding assigned session to log:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Could not add assigned session to log: ${errorMessage}`);
      } finally {
        sharedImportInFlightRef.current = null;
      }
    };

    addAssignedSessionToLog();
  }, [location.state, location.pathname, location.key, navigate, loadExercises, selectedDate, user?.id, getDateKey, getPersistedSupersetStateForDate, syncSharedAssignmentCompletion, loadSupersetsForDate, updateExerciseOrder]);

  return (
    <div className="relative min-h-[100dvh] bg-bg-primary">
      {/* Main Content */}
      <main className="px-4 pt-4 pb-app-content">
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
                {warmupExercises.length > 0 && (
                  <section className="space-y-2">
                    <div className="px-1">
                      <h3 className="text-sm font-semibold text-blue-300">Warm-up</h3>
                    </div>
                    <DraggableExerciseDisplay
                      exercises={warmupExercises}
                      onEditExercise={handleEditExercise}
                      onDeleteExercise={handleDeleteExercise}
                      onReorderExercises={handleWarmupReorder}
                      listId="warmup"
                      compactMode={true}
                    />
                  </section>
                )}

                {displayMainSessionExercises.length > 0 && (
                  <section className="space-y-2">
                    {warmupExercises.length > 0 && (
                      <div className="px-1">
                        <h3 className="text-sm font-semibold text-text-primary">Main Session</h3>
                      </div>
                    )}
                    <DraggableExerciseDisplay
                      exercises={displayMainSessionExercises}
                      onEditExercise={handleEditExercise}
                      onDeleteExercise={handleDeleteExercise}
                      onReorderExercises={handleMainSessionReorder}
                      listId="main"
                    />
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={openLogOptions}
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
        onOpenProfile={() => navigate('/profile')}
      />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <LogOptions 
          onClose={() => {
            updateUiState('showLogOptions', false);
            setLogOptionsWarmupMode(false);
            setEditingExercise(null); // Clear editing state when closing
          }}
          onExerciseAdded={() => {
            loadExercises(selectedDate);
            setLogOptionsWarmupMode(false);
            setEditingExercise(null); // Clear editing state after saving
          }}
          selectedDate={selectedDate}
          editingExercise={editingExercise} // Pass editing exercise
          initialWarmupMode={logOptionsWarmupMode}
        />
      )}

      {/* Set Logger Modal */}
      {uiState.showSetLogger && selectedExercise && selectedExercise.id && (
        <div className="fixed inset-0 bg-bg-primary/90 z-50">
          <ExerciseSetLogger
            exercise={{
              id: selectedExercise.id,
              name: selectedExercise.exerciseName,
              activityType: selectedExercise.activityType,
              prescription: selectedExercise.prescription,
              instructionMode: selectedExercise.instructionMode,
              instructions: selectedExercise.instructions ? [selectedExercise.instructions] : [],
              prescriptionAssistant: selectedExercise.prescriptionAssistant,
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


