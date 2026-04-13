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
import { db } from '../../services/firebase/config';
import { auth } from '../../services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
import { createNewSessionForDate, getSessionsForDate, SessionInfo, deleteSession, renameSession } from '@/services/firebase/sessionTrackingService';
import { normalizeActivityType } from '@/types/activityLog';
import { SharedSessionAssignment } from '@/types/program';
import { generateExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import toast from 'react-hot-toast';
import { buildSupersetLabels } from '@/utils/supersetUtils';
import { SupersetGroup } from '@/types/session';
import { useExerciseLogCalendar } from '@/context/ExerciseLogCalendarContext';
import { isExerciseLogMainView } from '@/features/exercises/exerciseLogViewState';
import { getSessionTypeLabel, normalizeSessionType, SessionType } from '@/types/sessionType';

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
  const { selectedDate, setSelectedDate, normalizeDate } = useDate();
  const { setIsExerciseLogMainView } = useExerciseLogCalendar();
  
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [creatingSessionType, setCreatingSessionType] = useState<SessionType | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedDateKeyRef = useRef<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [editingExercise, setEditingExercise] = useState<UnifiedExerciseData | null>(null);
  const sharedImportInFlightRef = useRef<string | null>(null);
  const processedSharedImportRequestsRef = useRef<Set<string>>(new Set());

  const currentSessionType = useMemo<SessionType>(() => {
    if (selectedSessionId && availableSessions.length > 0) {
      const selectedSession = availableSessions.find((session) => session.sessionId === selectedSessionId);
      if (selectedSession) {
        return selectedSession.sessionType;
      }
    }
    return 'main';
  }, [availableSessions, selectedSessionId]);

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
  const loadExercises = useCallback(async (date: Date) => {
    // Guard against null user
    const userId = auth.currentUser?.uid || user?.id;
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
    const dateString = toLocalDateString(loadedDate);
    loadSupersetsForDate(dateString);

    try {
      const combinedExercises = await getAllExercisesByDate(loadedDate, userId);

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
      setExercises([]);
    } finally {
      setLoading(false);
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
          }),
          ...((selectedSessionId || selectedExerciseWithMeta.sessionId) && {
            sessionId: selectedSessionId || selectedExerciseWithMeta.sessionId
          }),
          sessionType: selectedExerciseWithMeta.sessionType || currentSessionType,
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
    } catch (error) {
      console.error('❌ Error saving exercise sets:', error);
      alert('Failed to save exercise sets. Please try again.');
    }
  }, [selectedExercise, user, selectedDate, exercises, state.supersets, handleCloseSetLogger, loadExercises, hasMeaningfulSetData, syncSharedAssignmentCompletion, getDateKey, currentSessionType]);

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
    setEditingExercise(null);
    updateUiState('showLogOptions', true);
  }, [updateUiState]);

  // Handle exercise reordering with persistence
  const handleReorderExercises = useCallback(async (reorderedExercises: ExerciseData[]) => {
    // Update the UI immediately
    setExercises(reorderedExercises);
    
    // Save the new order to localStorage by updating timestamps
    // This creates a subtle time difference between exercises to maintain order
    const dateString = toLocalDateString(selectedDate);
    
    // Create a base timestamp for the selected date
    const baseTime = new Date(selectedDate);
    baseTime.setHours(12, 0, 0, 0); // Noon on the selected date
    
    // Save each exercise with an incremented timestamp to preserve order in Firestore
    if (user?.id) {
      await Promise.all(
        reorderedExercises
          .filter((exercise) => Boolean(exercise.id))
          .map(async (exercise, index) => {
            const newTimestamp = new Date(baseTime);
            newTimestamp.setMilliseconds(index * 100);

            await addExerciseLog(
              {
                exerciseName: exercise.exerciseName,
                userId: user.id,
                sets: exercise.sets || [],
                activityType: exercise.activityType,
                supersetId: exercise.supersetId,
                supersetLabel: exercise.supersetLabel,
                supersetName: exercise.supersetName,
                isWarmup: exercise.isWarmup,
                sharedSessionAssignmentId: exercise.sharedSessionAssignmentId,
                sharedSessionId: exercise.sharedSessionId,
                sharedSessionExerciseId: exercise.sharedSessionExerciseId,
                sharedSessionDateKey: exercise.sharedSessionDateKey,
                sharedSessionExerciseCompleted: exercise.sharedSessionExerciseCompleted,
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

  const currentSessionMeta = useMemo(() => {
    // Prefer the explicitly selected session from the switcher
    if (selectedSessionId && availableSessions.length > 0) {
      const session = availableSessions.find((s) => s.sessionId === selectedSessionId);
      if (session) {
        return {
          label: session.name || `${getSessionTypeLabel(session.sessionType)} ${session.sessionNumberInDay}`,
          detail: `Week #${session.sessionNumberInWeek} • ${session.sessionDateKey}`,
        };
      }
    }

    if (exercises.length === 0) {
      return null;
    }

    // Legacy fallback: derive from exercise metadata when no session docs exist yet
    const withSession = exercises
      .filter((exercise): exercise is UnifiedExerciseData & SharedSessionExerciseMeta => Boolean(exercise.sessionId))
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });

    if (withSession.length === 0) {
      return {
        label: 'Session 1',
        detail: getDateKey(selectedDate),
      };
    }

    const latest = withSession[0];
    const dayNumber = latest.sessionNumberInDay || 1;
    const weekNumber = latest.sessionNumberInWeek || 1;

    return {
      label: `${getSessionTypeLabel(normalizeSessionType(latest.sessionType))} ${dayNumber}`,
      detail: `Week #${weekNumber} • ${latest.sessionDateKey || getDateKey(selectedDate)}`,
    };
  }, [exercises, availableSessions, selectedSessionId, getDateKey, selectedDate]);

  const loadSessionsForDate = useCallback(async (date: Date) => {
    if (!user?.id) return;
    setSessionsLoading(true);
    try {
      const sessions = await getSessionsForDate(user.id, date);
      setAvailableSessions(sessions);
      if (sessions.length > 0) {
        const preferredMainSession =
          sessions.find((s) => s.sessionType === 'main' && s.sessionNumberInDay === 1) ||
          sessions.find((s) => s.sessionType === 'main' && s.status === 'active') ||
          sessions.find((s) => s.sessionType === 'main') ||
          sessions.find((s) => s.status === 'active') ||
          sessions[0];

        setSelectedSessionId(preferredMainSession.sessionId);
      } else {
        setSelectedSessionId(null);
      }
      lastLoadedDateKeyRef.current = `${user.id}:${getDateKey(date)}`;
    } catch (error) {
      console.warn('Could not load sessions for date:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, [user?.id, getDateKey]);

  const handleDeleteSession = useCallback(async (sessionId: string, sessionNumber: number, sessionType: SessionType, sessionName?: string) => {
    if (!user?.id) return;
    const label = sessionName || `${getSessionTypeLabel(sessionType)} ${sessionNumber}`;
    if (!window.confirm(`Delete "${label}" and all its exercises? This cannot be undone.`)) return;

    try {
      await deleteSession(user.id, sessionId);
      toast.success(`${label} deleted`);
      const sessions = await getSessionsForDate(user.id, selectedDate);
      setAvailableSessions(sessions);
      if (selectedSessionId === sessionId) {
        const nextSession = sessions.find((s) => s.sessionId !== sessionId) ?? sessions[0] ?? null;
        setSelectedSessionId(nextSession?.sessionId ?? null);
      }
      await loadExercises(selectedDate);
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Could not delete session. Please try again.');
    }
  }, [user?.id, selectedDate, selectedSessionId, loadExercises]);

  const handleRenameCommit = useCallback(async () => {
    if (!user?.id || !renamingSessionId) { setRenamingSessionId(null); return; }
    try {
      await renameSession(user.id, renamingSessionId, renameValue);
      setAvailableSessions((prev) =>
        prev.map((s) => s.sessionId === renamingSessionId ? { ...s, name: renameValue.trim() || undefined } : s)
      );
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
    setRenamingSessionId(null);
  }, [user?.id, renamingSessionId, renameValue]);

  const startLongPress = useCallback((sessionId: string, currentName: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setRenamingSessionId(sessionId);
      setRenameValue(currentName);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleCreateNewSession = useCallback(async (sessionType: SessionType = 'main') => {
    if (!user?.id || creatingSessionType !== null || sessionsLoading) {
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

      if (sessionType === 'main' && existingSessionsOfType.length === 0) {
        throw new Error('Log your first exercise before creating another session.');
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
      setSelectedSessionId(sessionContext.sessionId);
      openLogOptions();
    } catch (error) {
      console.error('Failed to create new session:', error);
      const message = error instanceof Error ? error.message : 'Could not start a new session. Please try again.';
      toast.error(message);
    } finally {
      setCreatingSessionType(null);
    }
  }, [user?.id, selectedDate, loadExercises, loadSessionsForDate, openLogOptions, creatingSessionType, sessionsLoading, getDateKey, availableSessions, exercises]);

  // Load exercises and sessions when date or user changes
  useEffect(() => {
    if (user?.id && selectedDate) {
      const nextDateKey = `${user.id}:${getDateKey(selectedDate)}`;
      if (lastLoadedDateKeyRef.current === nextDateKey) {
        return;
      }

      setSelectedSessionId(null);
      const timeoutId = setTimeout(() => {
        loadExercises(selectedDate);
        void loadSessionsForDate(selectedDate);
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
          const sessionType: SessionType = isWarmup ? 'warmup' : 'main';
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
              sessionType,
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
            sessionType,
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
            <section className="mb-3 rounded-xl border border-border bg-bg-secondary px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">Session</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { void handleCreateNewSession('main'); }}
                    disabled={sessionsLoading || creatingSessionType !== null}
                    className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-tertiary"
                    aria-label="Add session"
                  >
                    +S
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleCreateNewSession('warmup'); }}
                    disabled={sessionsLoading || creatingSessionType !== null}
                    className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-tertiary"
                    aria-label="Add warm-up"
                  >
                    +W
                  </button>
                </div>
              </div>
              {availableSessions.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {availableSessions.map((session) => {
                    const label = session.name || `${getSessionTypeLabel(session.sessionType)} ${session.sessionNumberInDay}`;
                    const isSelected = selectedSessionId === session.sessionId;
                    const isRenaming = renamingSessionId === session.sessionId;
                    return (
                      <div
                        key={session.sessionId}
                        className={`flex items-center rounded-lg text-xs font-medium transition-colors overflow-hidden ${
                          isSelected ? 'bg-accent text-white' : 'border border-border text-text-primary'
                        }`}
                      >
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => { void handleRenameCommit(); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { void handleRenameCommit(); }
                              if (e.key === 'Escape') { setRenamingSessionId(null); }
                            }}
                            className="px-3 py-1.5 bg-transparent outline-none min-w-[80px] max-w-[140px]"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSessionId(session.sessionId)}
                            onPointerDown={() => startLongPress(session.sessionId, label)}
                            onPointerUp={cancelLongPress}
                            onPointerLeave={cancelLongPress}
                            className="px-3 py-1.5 text-left"
                          >
                            {label}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { void handleDeleteSession(session.sessionId, session.sessionNumberInDay, session.sessionType, session.name); }}
                          className={`px-2 py-1.5 border-l ${
                            isSelected ? 'border-white/30 hover:bg-white/20' : 'border-border hover:bg-bg-tertiary'
                          }`}
                          aria-label={`Delete ${label}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  No sessions yet
                </p>
              )}
            </section>

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
            setEditingExercise(null); // Clear editing state when closing
          }}
          onExerciseAdded={() => {
            loadExercises(selectedDate);
            setEditingExercise(null); // Clear editing state after saving
          }}
          selectedDate={selectedDate}
          editingExercise={editingExercise} // Pass editing exercise
          selectedSessionId={selectedSessionId}
          selectedSessionType={currentSessionType}
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


