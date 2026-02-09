import React, { useCallback, useState, useEffect } from 'react';
import { Exercise, MuscleGroup } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { allExercises } from '@/data/exercises';
import { importedExercises } from '@/data/importedExercises';
import { StrengthExercisePicker } from '@/components/StrengthExercisePicker';
import { CreateUniversalExerciseDialog } from '@/components/exercises/CreateUniversalExerciseDialog';
import { ActivityType } from '@/types/activityTypes';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

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

  // Load custom and default exercises
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true);

        // Load custom exercises from Firebase
        let userCustomExercises: Exercise[] = [];
        if (user) {
          const exercisesRef = collection(db, 'exercises');
          const q = query(exercisesRef, where('userId', '==', user.id));
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            userCustomExercises.push({
              ...data,
              id: doc.id,
              primaryMuscles: data.primaryMuscles.map(normalizeMuscle),
              type: data.type,
              category: data.category,
              defaultUnit: data.defaultUnit,
            } as Exercise);
          });
        }

        // Combine default + imported + custom exercises
        const normalizedExercises: Exercise[] = [
          ...allExercises.map(ex => ({
            ...ex,
            id: `default-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
            primaryMuscles: (ex.primaryMuscles || []).map(normalizeMuscle),
            secondaryMuscles: [],
            customExercise: false
          })),
          ...importedExercises.map(ex => ({
            ...ex,
            id: ex.id || `imported-${ex.name.replace(/\s+/g, '-').toLowerCase()}`,
            primaryMuscles: Array.isArray(ex.primaryMuscles)
              ? ex.primaryMuscles.map(normalizeMuscle)
              : [normalizeMuscle(String(ex.primaryMuscles))],
            secondaryMuscles: [],
            defaultUnit: (ex.type === 'cardio' ? 'time' : 'kg') as Exercise['defaultUnit'],
            customExercise: false
          }))
        ];

        setExercises([...normalizedExercises, ...userCustomExercises]);
      } catch (error) {
        console.error('Error loading exercises:', error);
        toast.error('Failed to load exercises');
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [user]);

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
      const exerciseDoc = await getDoc(doc(db, 'exercises', exerciseId));
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
