import React, { useState } from 'react';
import { ExerciseSet, Exercise } from '@/types/exercise';
import ExerciseSearch from '../exercises/ExerciseSearch';
import { ExerciseSetLogger } from '../exercises/ExerciseSetLogger';

export type ExerciseWithSets = Exercise & { sets: ExerciseSet[] };

interface SessionExerciseLogOptionsProps {
  onClose: () => void;
  onSave: (exercise: ExerciseWithSets) => void;
}

const SessionExerciseLogOptions: React.FC<SessionExerciseLogOptionsProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState<'search' | 'setLogger'>('search');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  // Step 1: Search for exercise
  if (step === 'search') {
    return (
      <ExerciseSearch
        onClose={onClose}
        onSelectExercise={(exercise) => { setCurrentExercise(exercise as Exercise); setStep('setLogger'); }}
      />
    );
  }

  // Step 2: Set logger
  if (step === 'setLogger' && currentExercise) {
    return (
      <ExerciseSetLogger
        exercise={{ ...currentExercise, sets: [] }}
        onSave={(sets) => onSave({ ...currentExercise, sets })}
        onCancel={() => setStep('search')}
      />
    );
  }

  return null;
};

export default SessionExerciseLogOptions;