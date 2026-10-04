import React, { useState, useEffect } from 'react';
import { ActivityType } from '@/types/activityTypes';
import { Exercise } from '@/types/exercise';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import ExerciseSearch from '@/features/exercises/ExerciseSearch';
import { ExerciseHistoryPicker } from '@/features/programs/ExerciseHistoryPicker';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { addExerciseLog } from '@/services/firebase/exerciseLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ExerciseSet } from '@/types/sets';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { SessionType } from '@/types/sessionType';

interface ResistanceTrainingPickerProps {
  onClose: () => void;
  onBack: () => void;
  onActivityLogged: () => void;
  selectedDate?: Date;
  editingExercise?: UnifiedExerciseData | null;
  isWarmupMode?: boolean;
  selectedSessionId?: string | null;
  selectedSessionType?: SessionType;
}

type ViewState = 'search' | 'logging' | 'recentExercises';

const ResistanceTrainingPicker: React.FC<ResistanceTrainingPickerProps> = ({
  onClose: _onClose,
  onBack,
  onActivityLogged,
  selectedDate = new Date(),
  editingExercise = null,
  isWarmupMode = false,
  selectedSessionId,
  selectedSessionType = 'main'
}) => {
  const [view, setView] = useState<ViewState>('search');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (editingExercise) {
      const exerciseForLogger: Exercise = {
        id: editingExercise.id || `edit-${Date.now()}`,
        name: editingExercise.exerciseName,
        description: editingExercise.exerciseName,
        activityType: ActivityType.RESISTANCE,
        type: 'strength',
        category: 'general',
        equipment: [],
        difficulty: 'intermediate',
        primaryMuscles: [],
        secondaryMuscles: [],
        targetAreas: [],
        metrics: {
          trackWeight: true,
          trackReps: true,
          trackRPE: true
        },
        defaultUnit: 'kg',
        prescription: editingExercise.prescription,
        instructionMode: editingExercise.instructionMode,
        instructions: editingExercise.instructions
          ? [editingExercise.instructions]
          : []
      };
      setSelectedExercise(exerciseForLogger);
      setView('logging');
    }
  }, [editingExercise]);

  const handleProgramSelected = async (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      for (const { exercise, sets } of exercises) {
        await addExerciseLog(
          {
            exerciseName: exercise.name,
            userId: user.id,
            sets: sets,
            activityType: ActivityType.RESISTANCE,
            isWarmup: isWarmupMode,
            sessionId: selectedSessionId || undefined,
            sessionType: selectedSessionType
          },
          selectedDate || new Date()
        );
      }

      onActivityLogged();
      toast.success(`Added ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('ResistanceTrainingPicker: Error saving program exercises', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save selected exercises');
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    const resistanceExercise: Exercise = {
      ...exercise,
      activityType: ActivityType.RESISTANCE,
      type: exercise.type || 'strength',
      metrics: {
        trackWeight: true,
        trackReps: true,
        trackRPE: true,
        ...exercise.metrics
      },
      defaultUnit: exercise.defaultUnit || 'kg'
    };
    setSelectedExercise(resistanceExercise);
    setView('logging');
  };

  if (view === 'recentExercises') {
    return (
      <ExerciseHistoryPicker
        onClose={() => setView('search')}
        onSelectExercises={handleProgramSelected}
      />
    );
  }

  if (view === 'logging' && selectedExercise) {
    return (
      <UniversalSetLogger
        exercise={selectedExercise}
        onCancel={() => setView('search')}
        onSave={async (sets: ExerciseSet[]) => {
          try {
            logger.debug('ResistanceTrainingPicker: Starting to save exercise sets', {
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
              activityType: ActivityType.RESISTANCE,
              isWarmup: isWarmupMode,
              sessionId: editingExercise?.sessionId || selectedSessionId || undefined,
              sessionType: editingExercise?.sessionType || selectedSessionType,
              prescription: selectedExercise.prescription,
              instructionMode: selectedExercise.instructionMode,
              instructions: Array.isArray(selectedExercise.instructions)
                ? selectedExercise.instructions[0]
                : undefined
            };

            logger.debug('ResistanceTrainingPicker: Calling addExerciseLog', exerciseLogData);

            const docId = await addExerciseLog(
              exerciseLogData,
              selectedDate || new Date(),
              editingExercise?.id
            );

            logger.debug('ResistanceTrainingPicker: Exercise saved successfully', { docId });

            onActivityLogged();
            setView('search');
            toast.success(editingExercise ? 'Exercise updated' : 'Exercise saved');
          } catch (error) {
            logger.error('ResistanceTrainingPicker: Error saving exercise', error);
            const message = error instanceof Error ? error.message : 'Failed to save exercise';
            toast.error(message);
            throw error instanceof Error ? error : new Error(message);
          }
        }}
        initialSets={editingExercise?.sets || []}
        isEditing={!!editingExercise}
        prescription={selectedExercise.prescription}
        instructionMode={selectedExercise.instructionMode}
      />
    );
  }

  return (
    <ExerciseSearch
      onClose={onBack}
      onOpenRecent={() => setView('recentExercises')}
      onSelectExercise={handleSelectExercise}
    />
  );
};

export default ResistanceTrainingPicker;
