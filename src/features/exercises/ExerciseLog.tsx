import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SupersetProvider, useSupersets } from '../../context/SupersetContext';
import { useDate } from '../../context/DateContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExercisePrescriptionAssistantData } from '../../types/exercise';
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
import { toLocalDateString } from '@/utils/dateUtils';
import {
  compareByExerciseOrder,
  orderedTimestampForIndex,
} from '@/utils/exerciseOrderTimestamps';
import { db } from '../../services/firebase/config';
import { auth } from '../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  addExerciseLog,
  backfillExerciseLogSupersetMetadata,
  repairExerciseLogActivityTypes
} from '@/services/firebase/exerciseLogs';
import DraggableExerciseDisplay from '../../components/DraggableExerciseDisplay';
import FloatingSupersetControls from '../../components/FloatingSupersetControls';
import { getAllExercisesByDate, UnifiedExerciseData, deleteExercise } from '../../utils/unifiedExerciseUtils';
import { ConfirmDialog, FloatingActionButton, EmptyState, ExerciseListSkeleton } from '../../components/ui';
import {
  declinePlannedSession,
  getSharedSessionAssignment,
  getSharedSessionsForAthlete,
  updateSharedSessionStatus,
} from '@/services/sessionService';
import { createNewSessionForDate, getSessionsForDate, SessionInfo, deleteSession, renameSession } from '@/services/firebase/sessionTrackingService';
import { SharedSessionAssignment } from '@/types/program';
import toast from 'react-hot-toast';
import { buildSupersetLabels } from '@/utils/supersetUtils';
import { SupersetGroup } from '@/types/session';
import { useExerciseLogCalendar } from '@/context/ExerciseLogCalendarContext';
import { isExerciseLogMainView } from '@/features/exercises/exerciseLogViewState';
import { getSessionTypeLabel, SessionType } from '@/types/sessionType';
import { ensureSrpeSessionContextsForDate, getSportsLoadSessionsByDate } from '@/services/srpeService';
import { SportsLoadSession } from '@/types/srpe';
import { RehabSessionNotice } from '@/types/rehabProgress';
import { RehabLogBanner } from '@/features/programs/rehab/ShoulderRehabPanels';
import AssignedSessionCards from '@/features/exercises/AssignedSessionCards';
import { importedSessionUiState, openAssignmentsForDate } from '@/features/exercises/assignedSessionPlan';
import { startAssignedSession } from '@/features/exercises/startAssignedSession';

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
  sessionId?: string;
  sessionDateKey?: string;
  sessionWeekKey?: string;
  sessionNumberInDay?: number;
  sessionNumberInWeek?: number;
}

interface SaveMetadata {
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
}

const ExerciseLogContent: React.FC<ExerciseLogProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { state, removeExerciseFromSuperset, loadSupersetsForDate, saveSupersetsForDate, updateExerciseOrder } = useSupersets();
  const { selectedDate, normalizeDate } = useDate();
  const { setIsExerciseLogMainView, refreshExerciseLogCalendar } = useExerciseLogCalendar();
  
  // Date utility functions
  const areDatesEqual = useCallback((date1: Date, date2: Date): boolean => {
    const normalized1 = normalizeDate(date1);
    const normalized2 = normalizeDate(date2);
    return normalized1.getTime() === normalized2.getTime();
  }, [normalizeDate]);

  type UIState = {
    showLogOptions: boolean;
    showSetLogger: boolean;
    showWorkoutSummary: boolean;
    showProgramModal: boolean;
  };

  // State management
  const [uiState, setUiState] = useState<UIState>({
    showLogOptions: false,
    showSetLogger: false,
    showWorkoutSummary: false,
    showProgramModal: false,
  });

  const updateUiState = useCallback((key: keyof UIState, value: boolean) => {
    setUiState((prev: UIState) => ({ ...prev, [key]: value }));
  }, []);

  const isMainExerciseLogView = isExerciseLogMainView({
    showLogOptions: uiState.showLogOptions,
    showSetLogger: uiState.showSetLogger,
    showWorkoutSummary: uiState.showWorkoutSummary,
  });

  useEffect(() => {
    setIsExerciseLogMainView(isMainExerciseLogView);

    return () => {
      setIsExerciseLogMainView(true);
    };
  }, [isMainExerciseLogView, setIsExerciseLogMainView]);

  // Exercise data loading
  const [exercises, setExercises] = useState<UnifiedExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<SessionInfo[]>([]);
  const [srpeSessionsBySessionId, setSrpeSessionsBySessionId] = useState<Record<string, SportsLoadSession>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  /** Explicit session context for LogOptions add-flow so sRPE chips never pollute gym logging. */
  const [loggingTarget, setLoggingTarget] = useState<{
    sessionId: string | null;
    sessionType: SessionType;
  } | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [creatingSessionType, setCreatingSessionType] = useState<SessionType | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [namePrompt, setNamePrompt] = useState<{
    sessionId: string;
    defaultName: string;
    value: string;
  } | null>(null);
  const [pendingDeleteExercise, setPendingDeleteExercise] = useState<UnifiedExerciseData | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<{
    sessionId: string;
    label: string;
  } | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedDateKeyRef = useRef<string | null>(null);
  const dateLoadGenerationRef = useRef(0);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [editingExercise, setEditingExercise] = useState<UnifiedExerciseData | null>(null);
  const sharedImportInFlightRef = useRef<string | null>(null);
  const processedSharedImportRequestsRef = useRef<Set<string>>(new Set());
  const [assignedSessions, setAssignedSessions] = useState<SharedSessionAssignment[]>([]);
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(null);
  const [decliningAssignmentId, setDecliningAssignmentId] = useState<string | null>(null);
  const [pendingDeclineAssignment, setPendingDeclineAssignment] = useState<SharedSessionAssignment | null>(null);

  const currentSessionType = useMemo<SessionType>(() => {
    if (selectedSessionId && availableSessions.length > 0) {
      const selectedSession = availableSessions.find((session) => session.sessionId === selectedSessionId);
      if (selectedSession) {
        return selectedSession.sessionType;
      }
    }
    return 'main';
  }, [availableSessions, selectedSessionId]);

  const preferredMainSessionId = useMemo(() => {
    const newestFirst = [...availableSessions].reverse();
    const preferredMain =
      newestFirst.find((session) => session.sessionType === 'main' && session.status === 'active') ||
      newestFirst.find((session) => session.sessionType === 'main') ||
      null;
    return preferredMain?.sessionId ?? null;
  }, [availableSessions]);

  const logOptionsSessionId = editingExercise
    ? (editingExercise.sessionId ?? selectedSessionId)
    : loggingTarget
      ? loggingTarget.sessionId
      : (currentSessionType === 'srpe' ? preferredMainSessionId : selectedSessionId);

  const logOptionsSessionType: SessionType = editingExercise
    ? (editingExercise.sessionType === 'warmup' || editingExercise.sessionType === 'srpe'
        ? 'main'
        : (editingExercise.sessionType || 'main'))
    : loggingTarget
      ? loggingTarget.sessionType
      : (currentSessionType === 'srpe' ? 'main' : currentSessionType);

  const getDateKey = useCallback((date: Date): string => {
    return toLocalDateString(normalizeDate(date));
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

  // Handle exercise data loading
  const loadExercises = useCallback(async (
    date: Date,
    options?: { showSkeleton?: boolean; runRepairs?: boolean; generation?: number }
  ) => {
    const showSkeleton = options?.showSkeleton !== false;
    const runRepairs = options?.runRepairs !== false;
    const generation = options?.generation ?? dateLoadGenerationRef.current;
    const isCurrentLoad = () => generation === dateLoadGenerationRef.current;

    // Guard against null user
    const userId = auth.currentUser?.uid || user?.id;
    if (!userId) {
      if (!isCurrentLoad()) return;
      setLoading(false);
      setExercises([]);
      return;
    }

    // Normalize the target date
    const loadedDate = normalizeDate(date);
    
    // Soft refresh keeps the current list visible (no skeleton flash after add/save).
    if (showSkeleton && isCurrentLoad()) {
      setLoading(true);
    }

    // Load supersets for this date
    const dateString = toLocalDateString(loadedDate);
    loadSupersetsForDate(dateString);

    try {
      const combinedExercises = await getAllExercisesByDate(loadedDate, userId);
      if (!isCurrentLoad()) return;

      combinedExercises.sort(compareByExerciseOrder);

      if (runRepairs && isCurrentLoad()) {
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
      }

      if (!isCurrentLoad()) return;
      setExercises(combinedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      if (isCurrentLoad()) {
        setExercises([]);
      }
    } finally {
      if (isCurrentLoad()) {
        setLoading(false);
      }
    }
  }, [
    user?.id,
    areDatesEqual,
    normalizeDate,
    loadSupersetsForDate,
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
      const shouldPromptForFirstSessionName =
        !selectedSessionId &&
        currentSessionType === 'main' &&
        availableSessions.filter((session) => session.sessionType === 'main').length === 0;

      // Save to Firestore
      const selectedExerciseWithMeta = selectedExercise as ExerciseData & SharedSessionExerciseMeta;
      await addExerciseLog(
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
          isWarmup: false,
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
          }),
          ...((selectedSessionId || selectedExerciseWithMeta.sessionId) && {
            sessionId: selectedSessionId || selectedExerciseWithMeta.sessionId
          }),
          sessionType: selectedExerciseWithMeta.sessionType === 'warmup'
            ? 'main'
            : selectedExerciseWithMeta.sessionType || currentSessionType,
          ...(selectedExerciseWithMeta.sessionDateKey && {
            sessionDateKey: selectedExerciseWithMeta.sessionDateKey
          }),
          ...(selectedExerciseWithMeta.sessionWeekKey && {
            sessionWeekKey: selectedExerciseWithMeta.sessionWeekKey
          }),
          ...(typeof selectedExerciseWithMeta.sessionNumberInDay === 'number' && {
            sessionNumberInDay: selectedExerciseWithMeta.sessionNumberInDay
          }),
          ...(typeof selectedExerciseWithMeta.sessionNumberInWeek === 'number' && {
            sessionNumberInWeek: selectedExerciseWithMeta.sessionNumberInWeek
          })
        },
        selectedDate,
        updatedExercise.id // Pass existing ID if we have one
      );

      console.log('✅ Exercise saved to Firestore successfully');

      if (selectedExerciseWithMeta.sharedSessionAssignmentId) {
        const latestAssignment = await getSharedSessionAssignment(selectedExerciseWithMeta.sharedSessionAssignmentId);

        if (latestAssignment) {
          const dateKey = selectedExerciseWithMeta.sharedSessionDateKey || getDateKey(selectedDate);
          await syncSharedAssignmentCompletion(latestAssignment, user.id, dateKey);
        }
      }

      handleCloseSetLogger();
      await loadExercises(selectedDate);
      const sessionsAfterSave = await getSessionsForDate(user.id, selectedDate);
      const visibleSessionsAfterSave = sessionsAfterSave.filter((session) => session.sessionType !== 'warmup');
      setAvailableSessions(visibleSessionsAfterSave);
      refreshExerciseLogCalendar();
      if (shouldPromptForFirstSessionName) {
        const firstMainSession =
          visibleSessionsAfterSave.find((session) => session.sessionType === 'main' && session.sessionNumberInDay === 1) ||
          visibleSessionsAfterSave.find((session) => session.sessionType === 'main');
        if (firstMainSession) {
          setSelectedSessionId(firstMainSession.sessionId);
          const fallbackName = `${getSessionTypeLabel(firstMainSession.sessionType)} ${firstMainSession.sessionNumberInDay}`;
          setNamePrompt({
            sessionId: firstMainSession.sessionId,
            defaultName: fallbackName,
            value: firstMainSession.name || fallbackName,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving exercise sets:', error);
      toast.error('Failed to save exercise sets. Please try again.');
    }
  }, [selectedExercise, user, selectedDate, exercises, state.supersets, handleCloseSetLogger, loadExercises, hasMeaningfulSetData, syncSharedAssignmentCompletion, getDateKey, currentSessionType, selectedSessionId, availableSessions, refreshExerciseLogCalendar]);

  const handleDeleteExercise = (exercise: UnifiedExerciseData) => {
    if (!user?.id) {
      console.error('Cannot delete exercise: missing user ID', { userId: user?.id });
      toast.error('Cannot delete exercise: user not authenticated');
      return;
    }

    setPendingDeleteExercise(exercise);
  };

  const confirmDeleteExercise = async () => {
    if (!user?.id || !pendingDeleteExercise) {
      return;
    }

    const exercise = pendingDeleteExercise;
    setDeletingExerciseId(exercise.id || exercise.exerciseName);

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
        setPendingDeleteExercise(null);
        
        // Remove exercise from any superset it might be in
        if (exercise.id) {
          removeExerciseFromSuperset(exercise.id);
        }
        
        // Reload exercises to ensure UI is in sync
        await loadExercises(selectedDate);
        refreshExerciseLogCalendar();
      } else {
        throw new Error('Delete operation returned false');
      }

    } catch (error) {
      console.error('❌ Error deleting exercise:', error);
      
      // Revert UI change on error
      setExercises(prev => [...prev, exercise]);
      
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete exercise: ${errorMessage}`);

      // Reload exercises to ensure UI is in sync
      await loadExercises(selectedDate);
    } finally {
      setDeletingExerciseId(null);
    }
  };
  
  // No longer need event listener since we use the floating controls component

  const handleEditExercise = (exercise: ExerciseData) => {
    // Always use LogOptions for editing to provide consistent experience
    const unifiedExercise = exercise as UnifiedExerciseData;
    setLoggingTarget(null);
    setEditingExercise(unifiedExercise);
    updateUiState('showLogOptions', true);
  };

  const openLogOptions = useCallback((options?: { sessionId: string | null }) => {
    setEditingExercise(null);

    const hasExplicitMainTarget = Boolean(options && 'sessionId' in options);
    const useMainContext =
      hasExplicitMainTarget ||
      currentSessionType === 'srpe' ||
      currentSessionType === 'warmup';

    const mainSessionId = hasExplicitMainTarget
      ? options!.sessionId
      : preferredMainSessionId;

    if (useMainContext) {
      setSelectedSessionId(mainSessionId);
      setLoggingTarget({ sessionId: mainSessionId, sessionType: 'main' });
    } else {
      setLoggingTarget({
        sessionId: selectedSessionId,
        sessionType: currentSessionType,
      });
    }

    updateUiState('showLogOptions', true);
  }, [currentSessionType, preferredMainSessionId, selectedSessionId, updateUiState]);

  // Handle exercise reordering with persistence
  const handleReorderExercises = useCallback(async (reorderedExercises: ExerciseData[]) => {
    // Update the UI immediately
    setExercises(reorderedExercises);
    
    const dateString = toLocalDateString(selectedDate);

    if (user?.id) {
      await Promise.all(
        reorderedExercises
          .filter((exercise) => Boolean(exercise.id))
          .map(async (exercise, index) => {
            const exerciseWithSource = exercise as UnifiedExerciseData;
            const newTimestamp = orderedTimestampForIndex(selectedDate, index);

            await addExerciseLog(
              {
                exerciseName: exercise.exerciseName,
                userId: user.id,
                sets: exercise.sets || [],
                activityType: exercise.activityType,
                supersetId: exercise.supersetId,
                supersetLabel: exercise.supersetLabel,
                supersetName: exercise.supersetName,
                isWarmup: false,
                sharedSessionAssignmentId: exercise.sharedSessionAssignmentId,
                sharedSessionId: exercise.sharedSessionId,
                sharedSessionExerciseId: exercise.sharedSessionExerciseId,
                sharedSessionDateKey: exercise.sharedSessionDateKey,
                sharedSessionExerciseCompleted: exercise.sharedSessionExerciseCompleted,
                sourceProgramId: exerciseWithSource.sourceProgramId,
                sourceProgramName: exerciseWithSource.sourceProgramName,
                sourceProgramSessionId: exerciseWithSource.sourceProgramSessionId,
                sourceProgramSessionName: exerciseWithSource.sourceProgramSessionName,
                sourceProgramExerciseId: exerciseWithSource.sourceProgramExerciseId,
                sessionId: exercise.sessionId,
                sessionType: exercise.sessionType,
                sessionDateKey: exercise.sessionDateKey,
                sessionWeekKey: exercise.sessionWeekKey,
                sessionNumberInDay: exercise.sessionNumberInDay,
                sessionNumberInWeek: exercise.sessionNumberInWeek,
                prescription: exercise.prescription,
                instructionMode: exercise.instructionMode,
                instructions: exercise.instructions,
                prescriptionAssistant: exercise.prescriptionAssistant,
              },
              newTimestamp,
              exercise.id
            );
          })
      );
    }
    
    // Save superset order if any exercises are in supersets
    saveSupersetsForDate(dateString);
    
    console.log('✅ Exercise order saved');
  }, [selectedDate, user, saveSupersetsForDate]);

  // Always keep the list scoped to the selected session when one is selected.
  const sessionFilteredExercises = selectedSessionId
    ? exercises.filter((ex) => ex.sessionId === selectedSessionId)
    : exercises;
  const selectedSessionInfo = selectedSessionId
    ? availableSessions.find((session) => session.sessionId === selectedSessionId)
    : undefined;
  const selectedSrpeSession = selectedSessionId
    ? srpeSessionsBySessionId[selectedSessionId]
    : undefined;

  const loadSessionsForDate = useCallback(async (date: Date, generation?: number) => {
    const loadGeneration = generation ?? dateLoadGenerationRef.current;
    const isCurrentLoad = () => loadGeneration === dateLoadGenerationRef.current;
    if (!user?.id || !isCurrentLoad()) return;
    setSessionsLoading(true);
    try {
      await ensureSrpeSessionContextsForDate(user.id, getDateKey(date));
      if (!isCurrentLoad()) return;
      const [sessions, srpeSessions] = await Promise.all([
        getSessionsForDate(user.id, date),
        getSportsLoadSessionsByDate(user.id, getDateKey(date)),
      ]);
      if (!isCurrentLoad()) return;
      const visibleSessions = sessions.filter((session) => session.sessionType !== 'warmup');
      const srpeSessionMap = srpeSessions.reduce<Record<string, SportsLoadSession>>((acc, session) => {
        if (session.sessionId) {
          acc[session.sessionId] = session;
        }
        return acc;
      }, {});
      setAvailableSessions(visibleSessions);
      setSrpeSessionsBySessionId(srpeSessionMap);
      if (visibleSessions.length > 0) {
        const newestFirst = [...visibleSessions].reverse();
        const preferredMainSession =
          newestFirst.find((s) => s.sessionType === 'main' && s.status === 'active') ||
          newestFirst.find((s) => s.sessionType === 'main') ||
          newestFirst.find((s) => s.status === 'active') ||
          visibleSessions[0];

        setSelectedSessionId(preferredMainSession.sessionId);
      } else {
        setSelectedSessionId(null);
      }
      lastLoadedDateKeyRef.current = `${user.id}:${getDateKey(date)}`;
    } catch (error) {
      console.warn('Could not load sessions for date:', error);
    } finally {
      if (isCurrentLoad()) {
        setSessionsLoading(false);
      }
    }
  }, [user?.id, getDateKey]);

  const handleDeleteSession = useCallback(async (sessionId: string, sessionNumber: number, sessionType: SessionType, sessionName?: string) => {
    if (!user?.id) return;
    const label = sessionName || `${getSessionTypeLabel(sessionType)} ${sessionNumber}`;
    setPendingDeleteSession({ sessionId, label });
  }, [user?.id]);

  const confirmDeleteSession = useCallback(async () => {
    if (!user?.id || !pendingDeleteSession) return;

    const { sessionId, label } = pendingDeleteSession;
    setDeletingSessionId(sessionId);
    try {
      await deleteSession(user.id, sessionId);
      toast.success(`${label} deleted`);
      setPendingDeleteSession(null);
      const sessions = await getSessionsForDate(user.id, selectedDate);
      const visibleSessions = sessions.filter((session) => session.sessionType !== 'warmup');
      setAvailableSessions(visibleSessions);
      if (selectedSessionId === sessionId) {
        const nextSession = visibleSessions.find((s) => s.sessionId !== sessionId) ?? visibleSessions[0] ?? null;
        setSelectedSessionId(nextSession?.sessionId ?? null);
      }
      await loadExercises(selectedDate);
      refreshExerciseLogCalendar();
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Could not delete session. Please try again.');
    } finally {
      setDeletingSessionId(null);
    }
  }, [user?.id, pendingDeleteSession, selectedDate, selectedSessionId, loadExercises, refreshExerciseLogCalendar]);

  const handleRenameCommit = useCallback(async () => {
    if (!user?.id || !renamingSessionId) { setRenamingSessionId(null); return; }
    try {
      await renameSession(user.id, renamingSessionId, renameValue);
      setAvailableSessions((prev) =>
        prev.map((s) => s.sessionId === renamingSessionId ? { ...s, name: renameValue.trim() || undefined } : s)
      );
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Could not rename session. Please try again.');
    }
    setRenamingSessionId(null);
  }, [user?.id, renamingSessionId, renameValue]);

  const handleNamePromptSave = useCallback(async () => {
    if (!user?.id || !namePrompt) return;
    const trimmed = namePrompt.value.trim();
    try {
      if (trimmed && trimmed !== namePrompt.defaultName) {
        await renameSession(user.id, namePrompt.sessionId, trimmed);
        setAvailableSessions((prev) =>
          prev.map((session) =>
            session.sessionId === namePrompt.sessionId ? { ...session, name: trimmed } : session
          )
        );
      }
    } catch (error) {
      console.error('Failed to name session:', error);
      toast.error('Could not name session. You can rename it later.');
    } finally {
      setNamePrompt(null);
    }
  }, [user?.id, namePrompt]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const beginRenameSession = useCallback((sessionId: string, currentName: string) => {
    cancelLongPress();
    setRenamingSessionId(sessionId);
    setRenameValue(currentName);
  }, [cancelLongPress]);

  const startLongPress = useCallback((sessionId: string, currentName: string) => {
    longPressTimerRef.current = setTimeout(() => {
      beginRenameSession(sessionId, currentName);
    }, 500);
  }, [beginRenameSession]);

  const handleCreateNewSession = useCallback(async (sessionType: SessionType = 'main') => {
    if (!user?.id || creatingSessionType !== null || sessionsLoading) {
      return;
    }

    if (sessionType === 'warmup') {
      toast.error('Warm-up sessions are temporarily unavailable.');
      return;
    }

    try {
      setCreatingSessionType(sessionType);

      const dateKey = `${user.id}:${getDateKey(selectedDate)}`;
      if (lastLoadedDateKeyRef.current !== dateKey) {
        await loadSessionsForDate(selectedDate);
      }

      const existingSessionsOfType = availableSessions
        .filter((session) => session.sessionType === sessionType)
        .sort((a, b) => a.sessionNumberInDay - b.sessionNumberInDay);

      // First gym session of the day: open exercise picker as main (do not create empty main via API).
      if (sessionType === 'main' && existingSessionsOfType.length === 0) {
        openLogOptions({ sessionId: null });
        return;
      }

      if (existingSessionsOfType.length > 0) {
        const previousSession = existingSessionsOfType[existingSessionsOfType.length - 1];
        const previousHasLogs = exercises.some((exercise) => exercise.sessionId === previousSession.sessionId);

        if (!previousHasLogs) {
          throw new Error(`Add at least one exercise to ${getSessionTypeLabel(sessionType)} ${previousSession.sessionNumberInDay} before creating another.`);
        }
      }

      const sessionContext = await createNewSessionForDate(user.id, selectedDate, sessionType);
      toast.success(`Started ${getSessionTypeLabel(sessionType)} ${sessionContext.sessionNumberInDay}`);
      await Promise.all([loadExercises(selectedDate), loadSessionsForDate(selectedDate)]);
      refreshExerciseLogCalendar();
      setSelectedSessionId(sessionContext.sessionId);
      const fallbackName = `${getSessionTypeLabel(sessionContext.sessionType)} ${sessionContext.sessionNumberInDay}`;
      setNamePrompt({
        sessionId: sessionContext.sessionId,
        defaultName: fallbackName,
        value: sessionContext.name || fallbackName,
      });
      openLogOptions({ sessionId: sessionContext.sessionId });
    } catch (error) {
      console.error('Failed to create new session:', error);
      const message = error instanceof Error ? error.message : 'Could not start a new session. Please try again.';
      toast.error(message);
    } finally {
      setCreatingSessionType(null);
    }
  }, [user?.id, selectedDate, loadExercises, loadSessionsForDate, openLogOptions, creatingSessionType, sessionsLoading, getDateKey, availableSessions, exercises, refreshExerciseLogCalendar]);

  // Load exercises and sessions when date or user changes
  useEffect(() => {
    if (user?.id && selectedDate) {
      const nextDateKey = `${user.id}:${getDateKey(selectedDate)}`;
      if (lastLoadedDateKeyRef.current === nextDateKey) {
        return;
      }

      const generation = dateLoadGenerationRef.current + 1;
      dateLoadGenerationRef.current = generation;
      lastLoadedDateKeyRef.current = null;
      setSelectedSessionId(null);
      setExercises([]);
      setAvailableSessions([]);
      setSrpeSessionsBySessionId({});
      setLoading(true);
      setSessionsLoading(true);
      const timeoutId = setTimeout(() => {
        void loadExercises(selectedDate, { generation });
        void loadSessionsForDate(selectedDate, generation);
      }, 50); // Small delay to ensure any local storage updates have completed
      return () => clearTimeout(timeoutId);
    } else {
      setExercises([]);
      setAvailableSessions([]);
      setSelectedSessionId(null);
      setLoading(false);
      setSessionsLoading(false);
      setCreatingSessionType(null);
      lastLoadedDateKeyRef.current = null;
    }
  }, [selectedDate, user?.id, loadExercises, loadSessionsForDate, getDateKey]);

  // Clear selected exercise when changing dates
  useEffect(() => {
    if (selectedExercise && !areDatesEqual(selectedExercise.timestamp, selectedDate)) {
      handleCloseSetLogger();
    }
  }, [selectedDate, selectedExercise, areDatesEqual, handleCloseSetLogger]);

  useEffect(() => {
    if (!user?.id) {
      setAssignedSessions([]);
      return;
    }
    let cancelled = false;
    getSharedSessionsForAthlete()
      .then((sessions) => {
        if (!cancelled) setAssignedSessions(sessions);
      })
      .catch(() => {
        if (!cancelled) setAssignedSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedDate]);

  const runAssignedSessionImport = useCallback(async (assignment: SharedSessionAssignment) => {
    if (!user?.id) return;
    const dateKey = getDateKey(selectedDate);
    const result = await startAssignedSession({
      assignment,
      userId: user.id,
      date: selectedDate,
      dateKey,
    });
    if (result.alreadyStarted) {
      toast.success('This session is already in your log');
      await loadExercises(selectedDate);
      return;
    }
    if (result.imported.length > 0) {
      const persisted = getPersistedSupersetStateForDate(dateKey);
      const ui = importedSessionUiState({
        previous: exercises,
        imported: result.imported,
        sessionSupersets: result.sessionSupersets,
        sourceExerciseOrder: result.sourceExerciseOrder,
        importKey: assignment.id,
        persisted,
      });
      setExercises(ui.exercises);
      if (ui.supersets && ui.exerciseOrder) {
        localStorage.setItem(`superset_data_${dateKey}`, JSON.stringify(ui.supersets));
        localStorage.setItem(`exercise_order_${dateKey}`, JSON.stringify(ui.exerciseOrder));
        loadSupersetsForDate(dateKey);
        updateExerciseOrder(ui.exerciseOrder);
      }
    }
    await syncSharedAssignmentCompletion(assignment, user.id, dateKey);
    await loadExercises(selectedDate);
    refreshExerciseLogCalendar();
    toast.success('Assigned session added to your log');
  }, [
    exercises,
    getDateKey,
    getPersistedSupersetStateForDate,
    loadExercises,
    loadSupersetsForDate,
    refreshExerciseLogCalendar,
    selectedDate,
    syncSharedAssignmentCompletion,
    updateExerciseOrder,
    user?.id,
  ]);

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
        await runAssignedSessionImport(sharedSessionAssignment);
      } catch (error) {
        console.error('Error adding assigned session to log:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Could not add assigned session to log: ${errorMessage}`);
      } finally {
        sharedImportInFlightRef.current = null;
      }
    };

    addAssignedSessionToLog();
  }, [location.state, location.pathname, location.key, navigate, user?.id, runAssignedSessionImport]);

  const rehabSessionNotice = (location.state as { rehabSessionNotice?: RehabSessionNotice } | null)?.rehabSessionNotice;
  const selectedDateKey = getDateKey(selectedDate);
  const openAssignedSessions = useMemo(
    () => openAssignmentsForDate(assignedSessions, selectedDateKey, exercises),
    [assignedSessions, exercises, selectedDateKey]
  );
  const handleStartAssignedSession = (assignment: SharedSessionAssignment) => {
    if (startingAssignmentId || decliningAssignmentId || pendingDeclineAssignment) return;
    setStartingAssignmentId(assignment.id);
    void runAssignedSessionImport(assignment)
      .catch((error) => {
        console.error('Error adding assigned session to log:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Could not add assigned session to log: ${errorMessage}`);
      })
      .finally(() => setStartingAssignmentId(null));
  };

  const handleConfirmDeclineAssignedSession = async () => {
    if (!pendingDeclineAssignment || decliningAssignmentId) return;
    const assignment = pendingDeclineAssignment;
    const dateKey = selectedDateKey;
    setDecliningAssignmentId(assignment.id);
    try {
      await declinePlannedSession(assignment.id, dateKey);
      setAssignedSessions((current) => current.map((item) => {
        if (item.id !== assignment.id) return item;
        return {
          ...item,
          plannedDates: (item.plannedDates ?? []).filter((plannedDate) => plannedDate !== dateKey),
        };
      }));
      setPendingDeclineAssignment(null);
      toast.success('Session declined for this day');
    } catch (error) {
      console.error('Error declining assigned session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Could not decline session: ${errorMessage}`);
    } finally {
      setDecliningAssignmentId(null);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-bg-primary">
      {/* Main Content */}
      <main className="px-4 pt-4 pb-app-content">
        <div className="relative flex flex-col h-full">
          <div className="flex-grow">
            {rehabSessionNotice ? <RehabLogBanner notice={rehabSessionNotice} /> : null}
            <AssignedSessionCards
              assignments={openAssignedSessions}
              startingAssignmentId={startingAssignmentId}
              decliningAssignmentId={decliningAssignmentId}
              onStart={handleStartAssignedSession}
              onDecline={setPendingDeclineAssignment}
            />
            <section className="mb-3" aria-label="Sessions">
              <div className="flex flex-wrap items-center gap-2">
                {availableSessions.length > 0 ? (
                  availableSessions.map((session) => {
                    const label = session.name || `${getSessionTypeLabel(session.sessionType)} ${session.sessionNumberInDay}`;
                    const isSelected = selectedSessionId === session.sessionId;
                    const isRenaming = renamingSessionId === session.sessionId;
                    return (
                      <div
                        key={session.sessionId}
                        className={`flex items-center overflow-hidden rounded-full text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-accent-primary text-text-on-accent'
                            : 'border border-border bg-bg-secondary text-text-primary'
                        }`}
                      >
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            aria-label={`Rename ${label}`}
                            title="Press Enter to save, Escape to cancel"
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => { void handleRenameCommit(); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { void handleRenameCommit(); }
                              if (e.key === 'Escape') { setRenamingSessionId(null); }
                            }}
                            className="min-h-9 min-w-[120px] max-w-[180px] bg-bg-primary px-3 py-1.5 text-text-primary outline-none ring-2 ring-accent-primary"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSessionId(session.sessionId)}
                            onDoubleClick={() => beginRenameSession(session.sessionId, label)}
                            onPointerDown={() => startLongPress(session.sessionId, label)}
                            onPointerUp={cancelLongPress}
                            onPointerLeave={cancelLongPress}
                            title="Double-click or hold to rename"
                            className="px-3 py-1.5 text-left"
                          >
                            {label}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { void handleDeleteSession(session.sessionId, session.sessionNumberInDay, session.sessionType, session.name); }}
                          className={`px-2 py-1.5 ${
                            isSelected ? 'opacity-80 hover:bg-white/15' : 'border-l border-border hover:bg-bg-tertiary'
                          }`}
                          aria-label={`Delete ${label}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : sessionsLoading ? (
                  <span className="text-sm text-text-secondary">Loading sessions...</span>
                ) : (
                  <span className="text-sm text-text-secondary">No sessions yet</span>
                )}
                <button
                  type="button"
                  onClick={() => { void handleCreateNewSession('main'); }}
                  disabled={sessionsLoading || creatingSessionType !== null}
                  className="inline-flex min-h-9 items-center justify-center rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-accent-primary hover:text-accent-primary disabled:opacity-50"
                  aria-label="Add session"
                >
                  + Session
                </button>
              </div>
            </section>

            {loading ? (
              <ExerciseListSkeleton count={3} />
            ) : selectedSessionInfo?.sessionType === 'srpe' ? (
              <div className="rounded-2xl border border-border bg-bg-secondary p-5 text-sm text-text-secondary">
                <p className="text-base font-semibold text-text-primary">
                  {selectedSessionInfo.name || `sRPE ${selectedSessionInfo.sessionNumberInDay}`}
                </p>
                {selectedSrpeSession ? (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-bg-primary p-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">RPE</p>
                        <p className="mt-1 text-xl font-bold text-text-primary">{selectedSrpeSession.rpe}</p>
                      </div>
                      <div className="rounded-xl bg-bg-primary p-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">Duration</p>
                        <p className="mt-1 text-xl font-bold text-text-primary">{selectedSrpeSession.durationMinutes} min</p>
                      </div>
                      <div className="rounded-xl bg-bg-primary p-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">Load</p>
                        <p className="mt-1 text-xl font-bold text-text-primary">{selectedSrpeSession.sessionLoad}</p>
                      </div>
                      <div className="rounded-xl bg-bg-primary p-3">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">Sport</p>
                        <p className="mt-1 text-xl font-bold text-text-primary">{selectedSrpeSession.sportName || 'Sport'}</p>
                      </div>
                    </div>

                    {(selectedSrpeSession.distanceMeters ||
                      selectedSrpeSession.calories ||
                      selectedSrpeSession.averageHeartRate ||
                      selectedSrpeSession.maxHeartRate) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {selectedSrpeSession.distanceMeters && (
                          <span className="rounded-full bg-bg-primary px-3 py-1.5 text-text-secondary">
                            Distance {selectedSrpeSession.distanceMeters} m
                          </span>
                        )}
                        {selectedSrpeSession.calories && (
                          <span className="rounded-full bg-bg-primary px-3 py-1.5 text-text-secondary">
                            {selectedSrpeSession.calories} kcal
                          </span>
                        )}
                        {selectedSrpeSession.averageHeartRate && (
                          <span className="rounded-full bg-bg-primary px-3 py-1.5 text-text-secondary">
                            Avg HR {selectedSrpeSession.averageHeartRate}
                          </span>
                        )}
                        {selectedSrpeSession.maxHeartRate && (
                          <span className="rounded-full bg-bg-primary px-3 py-1.5 text-text-secondary">
                            Max HR {selectedSrpeSession.maxHeartRate}
                          </span>
                        )}
                      </div>
                    )}

                    {selectedSrpeSession.notes && (
                      <p className="mt-3 rounded-xl bg-bg-primary p-3 text-sm text-text-secondary">
                        {selectedSrpeSession.notes}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-text-secondary">Sports Load session stats are loading.</p>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/sports')}
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-text-on-accent transition-colors hover:bg-accent-hover"
                >
                  Open Sports Load
                </button>
              </div>
            ) : exercises.length === 0 ? (
              <EmptyState
                illustration="workout"
                title="Ready to Track Your Workout?"
                description="Start logging to see your progress, track PRs, and build consistency"
                primaryAction={{
                  label: 'Log First Exercise',
                  onClick: () => openLogOptions()
                }}
              />
            ) : selectedSessionId && sessionFilteredExercises.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-bg-secondary p-5 text-sm text-text-secondary">
                No exercises logged in this session yet.
              </div>
            ) : (
              <div className="space-y-4">
                <section className="space-y-2">
                  <DraggableExerciseDisplay
                    exercises={sessionFilteredExercises}
                    onEditExercise={handleEditExercise}
                    onDeleteExercise={handleDeleteExercise}
                    onReorderExercises={handleReorderExercises}
                    listId="session-items"
                  />
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => openLogOptions()}
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

      {/* Floating Superset Controls */}
      <FloatingSupersetControls />

      {/* Log Options Modal */}
      {uiState.showLogOptions && (
        <LogOptions 
          onClose={() => {
            updateUiState('showLogOptions', false);
            setEditingExercise(null);
            setLoggingTarget(null);
          }}
          onExerciseAdded={(details) => {
            void (async () => {
              const softReloadOptions = { showSkeleton: false, runRepairs: false } as const;
              const targetSessionId = details?.selectedSessionId;
              const sessionAlreadyKnown = Boolean(
                targetSessionId &&
                availableSessions.some((session) => session.sessionId === targetSessionId)
              );
              const shouldReloadSessions = details?.sessionsChanged === true || !sessionAlreadyKnown;

              const refreshTasks: Promise<unknown>[] = [
                loadExercises(selectedDate, softReloadOptions),
              ];
              if (shouldReloadSessions) {
                refreshTasks.push(loadSessionsForDate(selectedDate));
              }

              await Promise.all(refreshTasks);
              refreshExerciseLogCalendar();
              if (targetSessionId) {
                setSelectedSessionId(targetSessionId);
              }
            })();
            setEditingExercise(null);
            setLoggingTarget(null);
          }}
          selectedDate={selectedDate}
          editingExercise={editingExercise}
          selectedSessionId={logOptionsSessionId}
          selectedSessionType={logOptionsSessionType}
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

      {namePrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-secondary p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-text-primary">Name session</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Optional, but useful when you have more than one session in a day.
            </p>
            <label htmlFor="sessionNamePrompt" className="mt-4 block text-sm font-medium text-text-primary">
              Session name
            </label>
            <input
              id="sessionNamePrompt"
              autoFocus
              value={namePrompt.value}
              onChange={(event) => setNamePrompt((current) =>
                current ? { ...current, value: event.target.value } : current
              )}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleNamePromptSave();
                if (event.key === 'Escape') setNamePrompt(null);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNamePrompt(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => { void handleNamePromptSave(); }}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90"
              >
                Save name
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeclineAssignment !== null}
        title="Decline this session?"
        description={`"${pendingDeclineAssignment?.sessionData.name ?? 'This session'}" will be removed from this day's plan. Your coach can assign it again later.`}
        confirmLabel="Decline"
        cancelLabel="Keep session"
        isConfirming={decliningAssignmentId !== null}
        onCancel={() => {
          if (!decliningAssignmentId) {
            setPendingDeclineAssignment(null);
          }
        }}
        onConfirm={() => {
          void handleConfirmDeclineAssignedSession();
        }}
      />

      <ConfirmDialog
        isOpen={pendingDeleteExercise !== null}
        title="Delete exercise?"
        description={`This will remove "${pendingDeleteExercise?.exerciseName ?? 'this exercise'}" from the selected day.`}
        confirmLabel="Delete exercise"
        isConfirming={deletingExerciseId !== null}
        onCancel={() => {
          if (!deletingExerciseId) {
            setPendingDeleteExercise(null);
          }
        }}
        onConfirm={() => {
          void confirmDeleteExercise();
        }}
      />

      <ConfirmDialog
        isOpen={pendingDeleteSession !== null}
        title="Delete session?"
        description={`This will delete "${pendingDeleteSession?.label ?? 'this session'}" and all exercises inside it. This action cannot be undone.`}
        confirmLabel="Delete session"
        isConfirming={deletingSessionId !== null}
        onCancel={() => {
          if (!deletingSessionId) {
            setPendingDeleteSession(null);
          }
        }}
        onConfirm={() => {
          void confirmDeleteSession();
        }}
      />
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


