import React, { useState } from 'react';
import type { Exercise } from '@/types/exercise';
import type { ExerciseSet } from '@/types/sets';
import { SetEditorDialog } from '@/components/SetEditorDialog';
import { DifficultyCategory } from '@/types/difficulty';

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

  const handleSaveAndClose = () => {
    if (sets.length === 0) {
      onCancel();
      return;
    }
    
    if (useExerciseId) {
      (onSave as (sets: ExerciseSet[], exerciseId: string) => void)(sets, exercise.id);
    } else {
      (onSave as (sets: ExerciseSet[]) => void)(sets);
    }
  };

  const renderSetSummary = (set: ExerciseSet, index: number) => (
    <div 
      key={index}
      className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg mb-2 cursor-pointer hover:bg-[#3a3a3a]"
      onClick={() => setEditingSetIndex(index)}
    >
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">Set {index + 1}</span>
        <span className="text-white font-medium">{set.weight}kg × {set.reps}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 rounded text-sm ${
          set.difficulty === DifficultyCategory.WARMUP ? 'bg-gray-600' :
          set.difficulty === DifficultyCategory.EASY ? 'bg-green-600' :
          set.difficulty === DifficultyCategory.NORMAL ? 'bg-blue-600' :
          set.difficulty === DifficultyCategory.HARD ? 'bg-red-600' :
          set.difficulty === DifficultyCategory.DROP ? 'bg-purple-600' :
          'bg-gray-600'
        }`}>
          {set.difficulty}
        </span>
      </div>
    </div>
  );




  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
          <span className="text-gray-400">{sets.length} sets</span>
        </div>

        <div className="space-y-4">
          {sets.map((set, index) => renderSetSummary(set, index))}
        </div>

        <button
          className="w-full mt-4 py-4 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          onClick={() => setIsAddingSet(true)}
        >
          <span className="text-xl mr-2">+</span>
          Add Set
        </button>
      </div>

      <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-lg bg-[#2a2a2a] text-white font-medium hover:bg-[#3a3a3a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            className="flex-1 py-3 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {(isAddingSet || editingSetIndex !== null) && (
        <SetEditorDialog
          onSave={(set) => handleSetSave(set, editingSetIndex ?? undefined)}
          onClose={() => {
            setIsAddingSet(false);
            setEditingSetIndex(null);
          }}
          initialSet={editingSetIndex !== null ? sets[editingSetIndex] : undefined}
          exerciseName={exercise.name}
          setNumber={(editingSetIndex !== null ? editingSetIndex : sets.length) + 1}
          totalSets={sets.length + (isAddingSet ? 1 : 0)}
          onDelete={editingSetIndex !== null ? () => handleSetDelete(editingSetIndex) : undefined}
        />
      )}
    </div>
  );
};
