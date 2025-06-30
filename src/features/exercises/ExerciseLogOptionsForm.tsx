import React, { useState, useCallback } from 'react';
import ExerciseSearch from './ExerciseSearch';
import { ExerciseSetLogger } from './ExerciseSetLogger';
import { ExerciseSet, Exercise } from '@/types/exercise';

export interface ExerciseLogOptionsFormProps {
  onClose: () => void;
  onSave: (exercises: ExerciseWithSets[]) => void;
  initialExercises?: ExerciseWithSets[];
}

export type ExerciseTemplate = Omit<Exercise, 'id'>;

export type ExerciseWithSets = Exercise & { sets: ExerciseSet[] };

type View = 'main' | 'search' | 'setLogger';

const ExerciseLogOptionsForm: React.FC<ExerciseLogOptionsFormProps> = ({ onClose, onSave, initialExercises = [] }) => {
  const [view, setView] = useState<View>('main');
  const [exercises, setExercises] = useState<ExerciseWithSets[]>(initialExercises);
  const [currentExercise, setCurrentExercise] = useState<ExerciseWithSets | null>(null);

  const handleAddExercise = useCallback((exercise: Exercise | ExerciseTemplate) => {
    // If exercise has no id, generate one
    const id = (exercise as Exercise).id || `temp-${Date.now()}`;
    setCurrentExercise({ ...(exercise as Exercise), id, sets: [] });
    setView('setLogger');
  }, []);

  const handleSaveSets = useCallback((sets: ExerciseSet[]) => {
    if (!currentExercise) return;
    setExercises(prev => [...prev, { ...currentExercise, sets }]);
    setCurrentExercise(null);
    setView('main');
  }, [currentExercise]);

  const handleRemoveExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(exercises);
  };

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('main')}
        onSelectExercise={handleAddExercise}
      />
    );
  }

  if (view === 'setLogger' && currentExercise) {
    return (
      <ExerciseSetLogger
        exercise={currentExercise}
        onSave={handleSaveSets}
        onCancel={() => setView('main')}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-2">Exercises</h3>
      {exercises.length === 0 && <div className="text-gray-500">No exercises added yet.</div>}
      <ul>
        {exercises.map((ex, idx) => (
          <li key={ex.id || idx} className="flex items-center gap-2 text-gray-200 text-sm mb-1">
            {ex.name} - {ex.sets.length} sets
            <button type="button" onClick={() => handleRemoveExercise(ex.id)} className="ml-2 text-red-400">Remove</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setView('search')} className="px-3 py-1 bg-blue-700 text-white rounded">Add Exercise</button>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
      </div>
    </form>
  );
};

export default ExerciseLogOptionsForm;
