import { useState } from 'react'
import toast from 'react-hot-toast';
import { TrainingTypeSelector } from '@/components/TrainingTypeSelector';
import { TrainingType } from '@/types/exercise';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CopyFromPreviousSessionDialog from './CopyFromPreviousSessionDialog';
import ProgramExercisePicker from '@/features/programs/ProgramExercisePicker';
import { ProgramExerciseSelection } from '@/features/programs/ProgramExercisePicker';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import SpeedAgilityActivityPicker from '@/components/activities/SpeedAgilityActivityPicker';
import StretchingActivityPicker from '@/components/activities/StretchingActivityPicker';
import EnduranceActivityPicker from '@/components/activities/EnduranceActivityPicker';
import OtherActivityPicker from '@/components/activities/OtherActivityPicker';
import ResistanceTrainingPicker from '@/components/activities/ResistanceTrainingPicker';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { useEffect } from 'react';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';
import { ExerciseData } from '@/services/exerciseDataService';
import { auth } from '@/services/firebase/config';
import { saveExerciseLog } from '@/utils/localStorageUtils';
import { generateLocalExercisePrescriptionAssistant } from '@/services/exercisePrescriptionAssistantService';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import { useSupersets } from '@/context/SupersetContext';
import { SupersetGroup } from '@/types/session';
import AppOverlay from '@/components/ui/AppOverlay';
import { logger } from '@/utils/logger';
import { SessionType } from '@/types/sessionType';
import {
  ensureSessionContextForLog,
  getSessionsForDate,
  SessionContext,
} from '@/services/firebase/sessionTrackingService';

const PROGRAM_IMPORT_WRITE_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}
interface LogOptionsProps {
  onClose: () => void;
  onExerciseAdded?: (details?: {
    selectedSessionId?: string;
    sessionsChanged?: boolean;
  }) => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null; // Add editing exercise prop
  selectedSessionId?: string | null;
  selectedSessionType?: SessionType;
}

type ViewState = 'main' | 'setEditor' | 'programPicker' | 'copyPrevious' | 'stretching' | 'endurance' | 'other' | 'speedAgility' | 'resistance' | 'editExercise' | 'selectType';

const activityTypes = [
  {
    id: 'resistance',
    name: 'Resistance Training',
    description: 'Weight lifting, strength training',
    icon: '🏋️‍♂️',
    accentTextColor: 'text-activity-resistance',
    iconBgColor: 'bg-activity-resistance-bg'
  },
  {
    id: 'stretching',
    name: 'Stretching & Flexibility',
    description: 'Static stretches, yoga, mobility',
    icon: '🧘‍♀️',
    accentTextColor: 'text-activity-stretching',
    iconBgColor: 'bg-activity-stretching-bg'
  },
  {
    id: 'endurance',
    name: 'Endurance Training',
    description: 'Cardio, running, cycling',
    icon: '🏃‍♂️',
    accentTextColor: 'text-activity-endurance',
    iconBgColor: 'bg-activity-endurance-bg'
  },
  {
    id: 'speedAgility',
    name: 'Speed, Agility & Plyometrics',
    description: 'Sprints, jumps, plyometrics, change of direction',
    icon: '⚡',
    accentTextColor: 'text-activity-speed',
    iconBgColor: 'bg-activity-speed-bg'
  },
  {
    id: 'other',
    name: 'Other Activities',
    description: 'Custom activities and tracking',
    icon: '🎯',
    accentTextColor: 'text-activity-other',
    iconBgColor: 'bg-activity-other-bg'
  }
];

export const LogOptions = ({
  onClose,
  onExerciseAdded,
  selectedDate,
  editingExercise,
  selectedSessionId,
  selectedSessionType = 'main'
}: LogOptionsProps): JSX.Element => {
  const [view, setView] = useState<ViewState>('main');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { state: supersetState, addSuperset } = useSupersets();

  const effectiveSessionType: SessionType =
    editingExercise?.sessionType === 'warmup' || editingExercise?.sessionType === 'srpe'
      ? 'main'
      : selectedSessionType === 'warmup' || selectedSessionType === 'srpe'
        ? 'main'
        : editingExercise?.sessionType || selectedSessionType;
  const isWarmupMode = false;

  // If we're editing an exercise, go directly to edit view
  useEffect(() => {
    if (editingExercise) {
      setView('editExercise');
      return;
    }
  }, [editingExercise]);

  const resolveEffectiveActivityType = (exerciseLike: {
    activityType?: unknown;
    type?: unknown;
    trainingType?: unknown;
    exerciseType?: unknown;
    drillType?: unknown;
    stretchType?: unknown;
    sportType?: unknown;
    enduranceType?: unknown;
    teamBased?: unknown;
    defaultUnit?: unknown;
    metrics?: Record<string, unknown>;
    sets?: Array<Record<string, unknown>>;
  }): ActivityType => {
    return resolveActivityTypeFromExerciseLike(exerciseLike, {
      fallback: ActivityType.RESISTANCE,
      preferHintOverExplicit: true,
    });
  };

  const handleTrainingTypeSelected = (type: TrainingType) => {
    switch(type) {
      case TrainingType.STRENGTH:
        setView('resistance');
        break;
      case TrainingType.ENDURANCE:
        setView('endurance');
        break;
      case TrainingType.FLEXIBILITY:
        setView('stretching');
        break;
      case TrainingType.SPEED_AGILITY:
        setView('speedAgility');
        break;
      case TrainingType.TEAM_SPORTS:
        toast('Use Sports Load from the sidemenu to log sport duration and RPE.', { icon: 'ℹ️' });
        setView('main');
        break;
      case TrainingType.OTHER:
        setView('other');
        break;
      default:
        setView('main');
    }
  };

  const handleActivityTypeSelected = (activityTypeId: string) => {
    if (activityTypeId === 'resistance') {
      setView('resistance');
    } else if (activityTypeId === 'stretching') {
      setView('stretching');
    } else if (activityTypeId === 'endurance') {
      setView('endurance');
    } else if (activityTypeId === 'other') {
      setView('other');
    } else if (activityTypeId === 'speedAgility') {
      setView('speedAgility');
    }
  };

  const handleProgramSelected = async (exercises: ProgramExerciseSelection[]) => {
    const userId = user?.id || auth.currentUser?.uid;

    if (!userId) {
      toast.error('You need to be logged in to add exercises');
      return;
    }

    if (exercises.length === 0) {
      toast('No exercises selected', { icon: 'ℹ️' });
      return;
    }

    try {
      const createRuntimeSupersetId = (): string => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        return `superset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      };

      const importDate = selectedDate || new Date();
      const importDateKey = importDate.toISOString().slice(0, 10);
      const sourceGroupKeyForSelection = (selection: ProgramExerciseSelection, index: number): string =>
        selection.sourceSessionId
          ? `program-session:${selection.sourceProgramId || 'program'}:${selection.sourceSessionId}`
          : `unscoped:${index}`;

      const groupedSelections = new Map<string, ProgramExerciseSelection[]>();
      exercises.forEach((selection, index) => {
        const key = sourceGroupKeyForSelection(selection, index);
        groupedSelections.set(key, [...(groupedSelections.get(key) || []), selection]);
      });

      const existingSessions = await getSessionsForDate(userId, importDate);
      const sessionCountByType = new Map<SessionType, number>([
        ['main', existingSessions.filter((session) => session.sessionType === 'main').length],
      ]);
      const sessionContextByGroup = new Map<string, SessionContext>();
      let sessionToSelectAfterImport: string | undefined;
      let createdSessionCount = 0;
      let sessionsChanged = false;

      for (const [groupKey, selections] of groupedSelections.entries()) {
        const firstSelection = selections[0];
        const sessionType: SessionType = effectiveSessionType;
        const sourceSessionName = firstSelection.sourceSessionName?.trim();
        const sourceProgramName = firstSelection.sourceProgramName?.trim();
        const sessionName = sourceSessionName || sourceProgramName || undefined;
        const hasProgramSessionSource = Boolean(firstSelection.sourceSessionId || firstSelection.sourceProgramId);
        const forceNewSession = hasProgramSessionSource && (sessionCountByType.get(sessionType) || 0) > 0;

        const sessionContext = hasProgramSessionSource
          ? await ensureSessionContextForLog(userId, importDate, {
              requestedSessionType: sessionType,
              forceNewSession,
              sessionName,
            })
          : await ensureSessionContextForLog(userId, importDate, {
              requestedSessionId: selectedSessionId || undefined,
              requestedSessionType: sessionType,
            });

        sessionContextByGroup.set(groupKey, sessionContext);
        sessionCountByType.set(sessionType, (sessionCountByType.get(sessionType) || 0) + 1);
        createdSessionCount += 1;
        if (forceNewSession || !existingSessions.some((s) => s.sessionId === sessionContext.sessionId)) {
          sessionsChanged = true;
        }
        // Prefer the first imported group so Select All from the first session stays visible.
        if (!sessionToSelectAfterImport) {
          sessionToSelectAfterImport = sessionContext.sessionId;
        }
      }

      const hasPrefilledSets = exercises.some(ex => ex.sets && ex.sets.length > 0);
      const runtimeSupersetIdBySourceKey = new Map<string, string>();
      const importedSupersetGroupsById = new Map<string, { name?: string; exerciseIds: string[] }>();

      type PreparedImport = {
        selection: ProgramExerciseSelection;
        selectionIndex: number;
        sets: ExerciseSet[];
        resolvedActivityType: ActivityType;
        sessionContext: SessionContext | undefined;
        runtimeSupersetId?: string;
        runtimeSupersetLabel?: string;
        runtimeSupersetName?: string;
        prescriptionAssistant: ExercisePrescriptionAssistantData;
      };

      const preparedImports: PreparedImport[] = exercises.map((selection, selectionIndex) => {
        const { exercise } = selection;
        const sets: ExerciseSet[] = [];
        const resolvedActivityType = resolveActivityTypeFromExerciseLike(exercise, {
          fallback: ActivityType.RESISTANCE,
        });
        const sessionContext = sessionContextByGroup.get(
          sourceGroupKeyForSelection(selection, selectionIndex)
        );

        const sourceSupersetToken =
          selection.sourceProgramSupersetId ||
          selection.sourceProgramSupersetLabel ||
          exercise.supersetId ||
          exercise.supersetLabel;

        let runtimeSupersetId: string | undefined;
        if (sourceSupersetToken) {
          const sourceGroupKey = `${selection.sourceSessionId || 'session'}::${sourceSupersetToken}`;
          runtimeSupersetId = runtimeSupersetIdBySourceKey.get(sourceGroupKey);
          if (!runtimeSupersetId) {
            runtimeSupersetId = createRuntimeSupersetId();
            runtimeSupersetIdBySourceKey.set(sourceGroupKey, runtimeSupersetId);
          }
        }

        const runtimeSupersetLabel = selection.sourceProgramSupersetLabel || exercise.supersetLabel;
        const runtimeSupersetName = selection.sourceProgramSupersetName || exercise.supersetName;

        const prescriptionAssistant = generateLocalExercisePrescriptionAssistant({
          exercise: {
            id: exercise.id,
            name: exercise.name,
            activityType: resolvedActivityType,
            prescription: exercise.prescription,
          },
          sessionContext: {
            date: importDateKey,
            warmupDone: false,
          },
        });

        return {
          selection,
          selectionIndex,
          sets,
          resolvedActivityType,
          sessionContext,
          runtimeSupersetId,
          runtimeSupersetLabel,
          runtimeSupersetName,
          prescriptionAssistant,
        };
      });

      const createdIds = await mapWithConcurrency(
        preparedImports,
        PROGRAM_IMPORT_WRITE_CONCURRENCY,
        async (prepared) => {
          const {
            selection,
            sets,
            resolvedActivityType,
            sessionContext,
            runtimeSupersetId,
            runtimeSupersetLabel,
            runtimeSupersetName,
            prescriptionAssistant,
          } = prepared;
          const { exercise } = selection;

          const createdId = await addExerciseLog(
            {
              exerciseName: exercise.name,
              userId,
              sets,
              activityType: resolvedActivityType,
              isWarmup: false,
              sessionId: sessionContext?.sessionId || selectedSessionId || undefined,
              sessionType: sessionContext?.sessionType || effectiveSessionType,
              sessionDateKey: sessionContext?.sessionDateKey,
              sessionWeekKey: sessionContext?.sessionWeekKey,
              sessionNumberInDay: sessionContext?.sessionNumberInDay,
              sessionNumberInWeek: sessionContext?.sessionNumberInWeek,
              prescription: exercise.prescription,
              instructionMode: exercise.instructionMode,
              sourceProgramId: selection.sourceProgramId,
              sourceProgramName: selection.sourceProgramName,
              sourceProgramSessionId: selection.sourceSessionId,
              sourceProgramSessionName: selection.sourceSessionName,
              sourceProgramExerciseId: selection.sourceProgramExerciseId,
              supersetId: runtimeSupersetId,
              supersetLabel: runtimeSupersetLabel,
              supersetName: runtimeSupersetName,
              instructions: typeof exercise.instructions === 'string'
                ? exercise.instructions
                : Array.isArray(exercise.instructions)
                  ? exercise.instructions[0]
                  : undefined,
              prescriptionAssistant,
            },
            importDate
          );

          saveExerciseLog({
            id: createdId,
            exerciseName: exercise.name,
            userId,
            sets,
            timestamp: importDate,
            activityType: resolvedActivityType,
            isWarmup: false,
            sessionId: sessionContext?.sessionId || selectedSessionId || undefined,
            sessionType: sessionContext?.sessionType || effectiveSessionType,
            sessionDateKey: sessionContext?.sessionDateKey,
            sessionWeekKey: sessionContext?.sessionWeekKey,
            sessionNumberInDay: sessionContext?.sessionNumberInDay,
            sessionNumberInWeek: sessionContext?.sessionNumberInWeek,
            supersetId: runtimeSupersetId,
            supersetLabel: runtimeSupersetLabel,
            supersetName: runtimeSupersetName,
            sourceProgramId: selection.sourceProgramId,
            sourceProgramName: selection.sourceProgramName,
            sourceProgramSessionId: selection.sourceSessionId,
            sourceProgramSessionName: selection.sourceSessionName,
            sourceProgramExerciseId: selection.sourceProgramExerciseId,
            prescription: exercise.prescription,
            instructionMode: exercise.instructionMode,
            instructions: typeof exercise.instructions === 'string'
              ? exercise.instructions
              : Array.isArray(exercise.instructions)
                ? exercise.instructions[0]
                : undefined,
            prescriptionAssistant,
          });

          return createdId;
        }
      );

      preparedImports.forEach((prepared, index) => {
        const createdId = createdIds[index];
        if (!prepared.runtimeSupersetId || !createdId) return;
        const group = importedSupersetGroupsById.get(prepared.runtimeSupersetId) || {
          name: prepared.runtimeSupersetName,
          exerciseIds: [],
        };
        group.name = group.name || prepared.runtimeSupersetName;
        group.exerciseIds.push(createdId);
        importedSupersetGroupsById.set(prepared.runtimeSupersetId, group);
      });

      const savedCount = createdIds.length;

      const nextOrderStart = supersetState.supersets.length;
      Array.from(importedSupersetGroupsById.entries())
        .filter(([, group]) => group.exerciseIds.length >= 2)
        .forEach(([id, group], index) => {
          const nextSuperset: SupersetGroup = {
            id,
            name: group.name,
            exerciseIds: group.exerciseIds,
            order: nextOrderStart + index,
          };
          addSuperset(nextSuperset);
        });

      onExerciseAdded?.({
        selectedSessionId: sessionToSelectAfterImport,
        sessionsChanged,
      });
      onClose();

      if (createdSessionCount > 1) {
        toast.success(
          `Added ${savedCount} exercise${savedCount !== 1 ? 's' : ''} across ${createdSessionCount} sessions`
        );
      } else if (hasPrefilledSets) {
        toast.success(`Added ${savedCount} exercise${savedCount !== 1 ? 's' : ''} with program values`);
      } else {
        toast.success(`Added ${savedCount} exercise${savedCount !== 1 ? 's' : ''} from program`);
      }
    } catch (error) {
      logger.error('LogOptions: Error saving program exercises', error);
      toast.error('Failed to add exercises. Please try again.');
    }
  };

  const handleCopiedExercises = async (exercises: ExerciseData[]) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      logger.debug('LogOptions: Processing copied exercises', { count: exercises.length });
      
      for (const exercise of exercises) {
        if (!exercise.exerciseName) {
          logger.warn('LogOptions: Skipping exercise without name', exercise);
          continue;
        }

        const resolvedActivityType = resolveEffectiveActivityType({
          ...exercise,
          sets: (exercise.sets || []) as unknown as Array<Record<string, unknown>>,
        });

        const exerciseLogData = {
          exerciseName: exercise.exerciseName,
          userId: user.id,
          sets: exercise.sets || [],
          activityType: resolvedActivityType,
          isWarmup: false,
          sessionId: selectedSessionId || undefined,
          sessionType: effectiveSessionType,
        };

        logger.debug('LogOptions: Saving copied exercise', exerciseLogData);
        await addExerciseLog(
          exerciseLogData,
          selectedDate || new Date()
        );
      }

      setView('main');
      onExerciseAdded?.();
      toast.success(`Copied ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`);
      logger.debug('LogOptions: Successfully saved all copied exercises');
    } catch (error) {
      logger.error('LogOptions: Error saving copied exercises', error);
      const message = error instanceof Error ? error.message : 'Failed to save copied exercises';
      toast.error(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  // Conditional rendering for different views

  // Handle selectType view
  if (view === 'selectType') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Select Training Type</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TrainingTypeSelector onSelect={handleTrainingTypeSelected} />
        </div>
      </div>
    );
  }

  if (view === 'resistance') {
    return (
      <ResistanceTrainingPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
        isWarmupMode={isWarmupMode}
        selectedSessionId={selectedSessionId}
        selectedSessionType={effectiveSessionType}
      />
    );
  }

  if (view === 'stretching') {
    return (
      <StretchingActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => { onExerciseAdded?.(); setView('main'); }}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
        isWarmupMode={isWarmupMode}
        selectedSessionId={selectedSessionId}
        selectedSessionType={effectiveSessionType}
      />
    );
  }

  if (view === 'endurance') {
    return (
      <EnduranceActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise} // Pass editing exercise
        isWarmupMode={isWarmupMode}
        selectedSessionId={selectedSessionId}
        selectedSessionType={effectiveSessionType}
      />
    );
  }

  if (view === 'other') {
    return (
      <OtherActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        isWarmupMode={isWarmupMode}
        selectedSessionId={selectedSessionId}
        selectedSessionType={effectiveSessionType}
      />
    );
  }

  if (view === 'speedAgility') {
    return (
      <SpeedAgilityActivityPicker
        onClose={onClose}
        onBack={() => setView('main')}
        onActivityLogged={() => {
          onExerciseAdded?.();
          setView('main');
        }}
        selectedDate={selectedDate}
        editingExercise={editingExercise}
        isWarmupMode={isWarmupMode}
        selectedSessionId={selectedSessionId}
        selectedSessionType={effectiveSessionType}
      />
    );
  }

  if (view === 'programPicker') {
    return (
      <ProgramExercisePicker
        onClose={() => setView('main')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'copyPrevious') {
    return (
      <CopyFromPreviousSessionDialog
        isOpen={true}
        onClose={() => setView('main')}
        onExercisesSelected={handleCopiedExercises}
        currentDate={selectedDate || new Date()}
        userId={user?.id || ''}
      />
    );
  }

  if (view === 'setEditor' && selectedExercise) {
    return (
      <UniversalSetLogger
        exercise={selectedExercise}
        onCancel={() => {
          setSelectedExercise(null);
          setView('main');
        }}
        onSave={async (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => {
          try {
            logger.debug('LogOptions: Starting to save exercise sets', {
              exercise: selectedExercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            const exerciseLogData = {
              exerciseName: selectedExercise.name,
              userId: user.id,
              sets: sets,
              activityType: selectedExercise.activityType,
              isWarmup: false,
              sessionId: selectedSessionId || undefined,
              sessionType: effectiveSessionType,
              prescription: selectedExercise.prescription,
              instructionMode: selectedExercise.instructionMode,
              instructions: typeof selectedExercise.instructions === 'string'
                ? selectedExercise.instructions
                : Array.isArray(selectedExercise.instructions)
                  ? selectedExercise.instructions[0]
                  : undefined,
              prescriptionAssistant: metadata?.prescriptionAssistant || selectedExercise.prescriptionAssistant,
            };

            logger.debug('LogOptions: Calling addExerciseLog', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date()
            );

            logger.debug('LogOptions: Exercise saved successfully', { docId });

            onExerciseAdded?.();
            setSelectedExercise(null);
            setView('main');
          } catch (error) {
            logger.error('LogOptions: Error saving exercise', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save exercise');
          }
        }}
        initialSets={editingExercise?.sets}
        isEditing={!!editingExercise}
      />
    );
  }

  if (view === 'editExercise' && editingExercise) {
    const effectiveActivityType = resolveEffectiveActivityType({
      ...editingExercise,
      sets: (editingExercise.sets || []) as unknown as Array<Record<string, unknown>>,
    });

    const instructionsValue = editingExercise.instructions as unknown;
    const normalizedInstructions = typeof instructionsValue === 'string'
      ? instructionsValue
      : Array.isArray(instructionsValue)
        ? instructionsValue.find(
            (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
          ) || ''
        : '';

    // Convert UnifiedExerciseData to Exercise format for UniversalSetLogger
    const exerciseForLogger: Exercise = {
      id: editingExercise.id || `edit-${Date.now()}`,
      name: editingExercise.exerciseName,
      description: editingExercise.exerciseName,
      activityType: effectiveActivityType,
      type: effectiveActivityType === ActivityType.RESISTANCE ? 'strength' :
        effectiveActivityType === ActivityType.ENDURANCE ? 'endurance' :
        effectiveActivityType === ActivityType.STRETCHING ? 'flexibility' :
        effectiveActivityType === ActivityType.SPORT ? 'teamSports' :
        effectiveActivityType === ActivityType.SPEED_AGILITY ? 'speed_agility' : 'other',
      category: 'general',
      equipment: [],
      instructions: normalizedInstructions ? [normalizedInstructions] : [],
      difficulty: 'intermediate',
      primaryMuscles: [],
      secondaryMuscles: [],
      targetAreas: [],
      metrics: {
        trackWeight: effectiveActivityType === ActivityType.RESISTANCE,
        trackReps: true,
        trackTime: effectiveActivityType !== ActivityType.RESISTANCE,
        trackDistance: effectiveActivityType === ActivityType.ENDURANCE,
        trackRPE: true
      },
      defaultUnit: effectiveActivityType === ActivityType.RESISTANCE ? 'kg' : 'time',
      prescription: editingExercise.prescription,
      instructionMode: editingExercise.instructionMode,
      prescriptionAssistant: editingExercise.prescriptionAssistant
    };

    return (
      <UniversalSetLogger
        exercise={exerciseForLogger}
        onCancel={() => {
          setView('main');
        }}
        onSave={async (sets: ExerciseSet[], metadata?: { prescriptionAssistant?: ExercisePrescriptionAssistantData }) => {
          try {
            logger.debug('LogOptions: Updating exercise', {
              exercise: editingExercise,
              sets,
              user: user?.id,
              selectedDate
            });

            if (!user?.id) throw new Error('User not authenticated');

            // Update the existing exercise with new sets
            const exerciseLogData = {
              exerciseName: editingExercise.exerciseName,
              userId: user.id,
              sets: sets,
              activityType: resolveEffectiveActivityType({
                ...editingExercise,
                sets: (sets || []) as unknown as Array<Record<string, unknown>>,
              }),
              isWarmup: false,
              sessionId: editingExercise.sessionId || selectedSessionId || undefined,
              sessionType: editingExercise.sessionType === 'warmup' ? effectiveSessionType : editingExercise.sessionType || effectiveSessionType,
              prescription: editingExercise.prescription,
              instructionMode: editingExercise.instructionMode,
              instructions: normalizedInstructions || undefined,
              prescriptionAssistant: metadata?.prescriptionAssistant || editingExercise.prescriptionAssistant
            };

            logger.debug('LogOptions: Calling addExerciseLog with existing ID', editingExercise.id);

            const docId = await addExerciseLog(
              exerciseLogData,
              editingExercise.timestamp || new Date(),
              editingExercise.id // Pass existing ID to update
            );

            logger.debug('LogOptions: Exercise updated successfully', { docId });

            onExerciseAdded?.();
            setView('main');
          } catch (error) {
            logger.error('LogOptions: Error updating exercise', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update exercise');
          }
        }}
        initialSets={editingExercise.sets}
        isEditing={true}
      />
    );
  }

  return (
    <AppOverlay
      isOpen={true}
      onClose={onClose}
      className="z-50 flex flex-col !bg-bg-primary !backdrop-blur-none"
      ariaLabel={editingExercise ? 'Edit exercise' : 'Add exercise'}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {editingExercise ? 'Edit Exercise' : 'Add'}
        </h2>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-text-tertiary transition-colors hover:bg-hover-overlay hover:text-text-primary"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-bg-primary">
        <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <section className="grid grid-cols-3 gap-2" aria-label="Quick actions">
            <button
              type="button"
              onClick={() => setView('programPicker')}
              className="rounded-lg bg-bg-secondary px-2 py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:bg-hover-overlay focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              Program
            </button>
            <button
              type="button"
              onClick={() => setView('copyPrevious')}
              className="rounded-lg bg-bg-secondary px-2 py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:bg-hover-overlay focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="rounded-lg bg-bg-secondary px-2 py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:bg-hover-overlay focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              New
            </button>
          </section>

          <section className="space-y-1.5" aria-label="Activity types">
            {activityTypes.map((activityType) => (
              <button
                key={activityType.id}
                type="button"
                onClick={() => handleActivityTypeSelected(activityType.id)}
                className="flex w-full items-center justify-between rounded-lg bg-bg-secondary px-3 py-2.5 text-left transition-colors hover:bg-hover-overlay focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <span className="text-sm font-medium text-text-primary">{activityType.name}</span>
                <svg className="h-4 w-4 shrink-0 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </section>
        </div>
      </main>

      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(_exerciseId) => {
            setShowCreateDialog(false);
          }}
          searchQuery=""
        />
      )}
    </AppOverlay>
  );
};

export default LogOptions;







