import React, { useCallback } from 'react';
import { Exercise } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import ExerciseSearch from '../exercises/ExerciseSearch';

export type ExerciseWithSets = Exercise & { sets: ExerciseSet[] };

interface SessionExerciseLogOptionsProps {
  onClose: () => void;
  onSave: (exercise: ExerciseWithSets) => void;
}

const SessionExerciseLogOptions: React.FC<SessionExerciseLogOptionsProps> = ({ onClose, onSave }) => {
  const handleSelectExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    try {
      const exerciseWithSets: ExerciseWithSets = {
        ...exercise,
        id: crypto.randomUUID(),
        sets: [] // Empty sets - will be logged during workout
      };
      onSave(exerciseWithSets);
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  }, [onSave]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <h1 className="text-white text-xl font-medium">Add Exercise</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Exercise Search */}
      <main className="flex-1 overflow-hidden">
        <ExerciseSearch onClose={onClose} onSelectExercise={handleSelectExercise} />
      </main>
    </div>
  );
};

export default SessionExerciseLogOptions;
