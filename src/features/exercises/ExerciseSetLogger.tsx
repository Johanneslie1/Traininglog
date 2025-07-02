import React, { useState } from 'react';
import type { Exercise, ExerciseSet } from '@/types/exercise';
import { SetEditorDialog } from '@/components/SetEditorDialog';

interface ExerciseSetLoggerProps {
  exercise: Partial<Exercise> & { 
    id: string; 
    name: string;
    sets?: ExerciseSet[];
  };
  onSave: ((sets: ExerciseSet[], exerciseId: string) => void) | ((sets: ExerciseSet[]) => void);
  onCancel: () => void;
  isEditing?: boolean;
  previousSet?: ExerciseSet; // Optional previous set for copying
  showPreviousSets?: boolean; // Whether to show previous sets option
  useExerciseId?: boolean; // Whether to pass exerciseId to onSave
}

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  isEditing = false,
  previousSet,
  showPreviousSets = true,
  useExerciseId = false
}) => {
  const [sets, setSets] = useState<ExerciseSet[]>(() => {
    if (isEditing && exercise.sets && exercise.sets.length > 0) {
      return exercise.sets;
    }
    return [];
  });
  
  const [isAddingSet, setIsAddingSet] = useState(!isEditing);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);

  const handleSetSave = (editedSet: ExerciseSet, index?: number) => {
    if (typeof index === 'number') {
      setSets(sets.map((s, i) => i === index ? editedSet : s));
      setEditingSetIndex(null);
    } else {
      setSets([...sets, editedSet]);
    }
    setIsAddingSet(false);
  };

  const handleSetDelete = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    if (useExerciseId) {
      (onSave as (sets: ExerciseSet[], exerciseId: string) => void)(sets, exercise.id);
    } else {
      (onSave as (sets: ExerciseSet[]) => void)(sets);
    }
  };

  const renderSetButton = (set: ExerciseSet, index: number) => {
    const getSetDescription = (set: ExerciseSet) => {
      let desc = `${set.reps} reps`;
      if (set.weight) desc = `${set.weight}kg × ${desc}`;
      if (set.difficulty) desc += ` (${set.difficulty})`;
      return desc;
    };

    return (
      <div key={index} className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setEditingSetIndex(index)}
          className="flex-grow p-3 bg-[#2a2a2a] text-left rounded-lg hover:bg-[#333] transition-colors"
        >
          <div className="font-medium text-white">Set {index + 1}</div>
          <div className="text-sm text-gray-400">{getSetDescription(set)}</div>
        </button>
        <div 
          onClick={() => handleSetDelete(index)}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer"
          role="button"
          aria-label="Delete set"
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Set buttons */}
      <div className="space-y-2">
        <div className="text-gray-400 mb-2 flex justify-between items-center">
          <span>Sets ({sets.length})</span>
          {showPreviousSets && previousSet && (
            <button
              onClick={() => handleSetSave(previousSet)}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              title="Copy the weight, reps and difficulty from your last set"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>Copy Previous Set</span>
            </button>
          )}
        </div>
        {sets.map((set, index) => renderSetButton(set, index))}
      </div>

      {/* Add set button */}
      <div className="flex justify-between">
        <button
          onClick={() => setIsAddingSet(true)}
          className="px-4 py-2 text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors"
        >
          Add Set
        </button>
        {sets.length > 0 && (
          <button
            onClick={handleDone}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Done
          </button>
        )}
      </div>

      {/* Cancel button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Set editor dialog */}
      {(isAddingSet || editingSetIndex !== null) && (
        <SetEditorDialog
          onClose={() => {
            setIsAddingSet(false);
            setEditingSetIndex(null);
          }}
          onSave={(set) => handleSetSave(set, editingSetIndex !== null ? editingSetIndex : undefined)}
          initialSet={editingSetIndex !== null ? sets[editingSetIndex] : undefined}
          previousSet={previousSet && !editingSetIndex ? previousSet : undefined}
          exerciseName={exercise.name}
        />
      )}
    </div>
  );
};
