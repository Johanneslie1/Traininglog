import React, { useState } from 'react';
import { Exercise } from '@/types/exercise';
import { ProgramExercise } from '@/types/program';
import ExerciseSearch from '../exercises/ExerciseSearch';

interface ExerciseLoggerFormProps {
  initialExercises?: ProgramExercise[];
  onSave: (exercises: ProgramExercise[]) => void;
  onCancel: () => void;
}

const ExerciseLoggerForm: React.FC<ExerciseLoggerFormProps> = ({ initialExercises = [], onSave, onCancel }) => {
  const [exercises, setExercises] = useState<ProgramExercise[]>(initialExercises);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  const handleAddExercise = (exerciseTemplate: Omit<Exercise, 'id'>) => {
    setExercises(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: exerciseTemplate.name,
        sets: 3,
        reps: 10,
        weight: exerciseTemplate.type === 'bodyweight' ? undefined : 0,
        notes: exerciseTemplate.description
      }
    ]);
    setShowExerciseSearch(false);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(exercises);
  };

  return (
    <>
      {showExerciseSearch ? (
        <ExerciseSearch 
          onClose={() => setShowExerciseSearch(false)}
          onSelectExercise={handleAddExercise}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Exercises</h3>
            {exercises.length === 0 && <div className="text-gray-500">No exercises added yet.</div>}
            <ul>
              {exercises.map(ex => (
                <li key={ex.id} className="flex items-center gap-2 text-gray-200 text-sm mb-1">
                  <div>
                    <div>{ex.name}</div>
                    <div className="text-sm text-gray-400">Sets and reps will be logged during workout</div>
                  </div>
                  <button type="button" onClick={() => removeExercise(ex.id)} className="ml-2 text-red-400">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <button 
              type="button" 
              onClick={() => setShowExerciseSearch(true)} 
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Exercise
            </button>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-700 text-white rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Save
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default ExerciseLoggerForm;
