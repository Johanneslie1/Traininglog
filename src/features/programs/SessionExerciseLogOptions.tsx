import React, { useState, useCallback } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
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
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    try {
      setCurrentExercise({
        ...exercise,
        id: crypto.randomUUID(),
        sets: []
      } as Exercise);
      setExerciseSets([]);
      setStep('setLogger');
      setError(null);
    } catch (err) {
      setError('Failed to add exercise. Please try again.');
      console.error('Error adding exercise:', err);
    }
  }, []);

  const handleSave = useCallback((sets: ExerciseSet[]) => {
    if (!currentExercise) return;
    try {
      setExerciseSets(sets);
      onSave({ ...currentExercise, sets });
    } catch (err) {
      setError('Failed to save exercise. Please try again.');
      console.error('Error saving exercise:', err);
    }
  }, [currentExercise, onSave]);

  // Step 1: Search for exercise
  if (step === 'search') {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl flex flex-col h-[90vh]">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-white">Add Exercise</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 m-4 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          <ExerciseSearch
            onClose={onClose}
            onSelectExercise={handleSelectExercise}
          />
        </div>
      </div>
    );
  }

  // Step 2: Set logger
  if (step === 'setLogger' && currentExercise) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">{currentExercise.name}</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep('search')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Change Exercise
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {currentExercise.description && (
              <p className="mt-2 text-gray-400">{currentExercise.description}</p>
            )}
          </div>
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 mx-4 mt-4 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <ExerciseSetLogger
              exercise={currentExercise}
              onSave={handleSave}
              onCancel={onClose}
              showPreviousSets={true}
              isEditing={false}
              previousSet={exerciseSets.length > 0 ? exerciseSets[exerciseSets.length - 1] : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SessionExerciseLogOptions;