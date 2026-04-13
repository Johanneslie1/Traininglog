import React, { useCallback, useState, useEffect } from 'react';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { StrengthExercisePicker } from '@/components/StrengthExercisePicker';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { getMergedExercisesByActivityType } from '@/services/exerciseDatabaseService';

export type ExerciseWithSets = Exercise & { sets: ExerciseSet[] };

interface SessionExerciseLogOptionsProps {
  onClose: () => void;
  onSave: (exercise: ExerciseWithSets) => void;
}

const normalizeMuscle = (muscle: string): MuscleGroup => {
  const muscleMap: Record<string, MuscleGroup> = {
    'chest': 'chest',
    'pectorals': 'chest',
    'back': 'back',
    'lats': 'lats',
    'traps': 'traps',
    'shoulders': 'shoulders',
    'deltoids': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'forearms': 'forearms',
    'legs': 'quadriceps',
    'quadriceps': 'quadriceps',
    'hip flexors': 'hip_flexors',
    'hip_flexors': 'hip_flexors',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'glutes': 'glutes',
    'core': 'core',
    'abs': 'core',
  };
  return muscleMap[muscle.toLowerCase()] || 'full_body';
};

const SessionExerciseLogOptions: React.FC<SessionExerciseLogOptionsProps> = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Load merged exercises (built-in + global + user custom)
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true);
        const mergedExercises = await getMergedExercisesByActivityType(ActivityType.RESISTANCE, user?.id);
        setExercises(
          mergedExercises.map((exercise) => ({
            ...exercise,
            primaryMuscles: (exercise.primaryMuscles || []).map(normalizeMuscle),
            secondaryMuscles: exercise.secondaryMuscles || []
          }))
        );
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast.error('Failed to load exercises');
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [user?.id]);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    try {
      const exerciseWithSets: ExerciseWithSets = {
        ...exercise,
        id: exercise.id || crypto.randomUUID(),
        sets: [] // Empty sets - will be logged during workout
      };
      onSave(exerciseWithSets);
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to add exercise');
    }
  }, [onSave]);

  const handleExerciseCreated = async (exerciseId: string) => {
    setIsLoading(true);
    try {
      let exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
      if (!exerciseDoc.exists()) {
        exerciseDoc = await getDoc(doc(db, 'globalExercises', exerciseId));
      }

      if (exerciseDoc.exists()) {
        const data = exerciseDoc.data();
        const newExercise: Exercise = {
          ...data,
          id: exerciseId,
          primaryMuscles: data.primaryMuscles.map(normalizeMuscle),
          type: data.type,
          category: data.category,
          defaultUnit: data.defaultUnit,
        } as Exercise;

        setExercises(prev => [...prev, newExercise]);
        handleSelectExercise(newExercise);
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error fetching created exercise:', error);
      toast.error('Failed to load created exercise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StrengthExercisePicker
        exercises={exercises}
        onSelect={handleSelectExercise}
        onClose={onClose}
        isLoading={isLoading}
        onCreateExercise={() => setShowCreateDialog(true)}
      />

      {showCreateDialog && (
        <CreateUniversalExerciseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleExerciseCreated}
          activityType={ActivityType.RESISTANCE}
        />
      )}
    </>
  );
};

export default SessionExerciseLogOptions;
