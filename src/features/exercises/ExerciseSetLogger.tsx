import React, { useState, useEffect } from 'react';
import type { Exercise } from '@/types/exercise';
import type { ExerciseSet } from '@/types/sets';
import { SetEditorDialog } from '@/components/SetEditorDialog';
import { UniversalSetLogger } from '@/components/UniversalSetLogger';
import { DifficultyCategory } from '@/types/difficulty';
import { ActivityType } from '@/types/activityTypes';

interface ExerciseSetLoggerProps {
  exercise: Partial<Exercise> & { 
    id: string; 
    name: string;
    sets?: ExerciseSet[];
    type?: string;
    activityType?: ActivityType;
  };
  onSave: ((sets: ExerciseSet[], exerciseId: string) => void) | ((sets: ExerciseSet[]) => void);
  onCancel: () => void;
  isEditing?: boolean;
  previousSet?: ExerciseSet; // Optional previous set for copying
  showPreviousSets?: boolean; // Whether to show previous sets option
  useExerciseId?: boolean; // Whether to pass exerciseId to onSave
}

// Check if exercise is non-resistance type and should use universal logger
const shouldUseUniversalLogger = (exercise: Partial<Exercise>): boolean => {
  // Check activityType first
  if (exercise.activityType && exercise.activityType !== ActivityType.RESISTANCE) {
    return true;
  }

  // Check type field
  if (exercise.type) {
    const nonResistanceTypes = ['cardio', 'endurance', 'flexibility', 'teamSports', 'speedAgility', 'speed_agility', 'other'];
    if (nonResistanceTypes.includes(exercise.type)) {
      return true;
    }
  }

  // Check category for hints
  const category = exercise.category?.toLowerCase() || '';
  if (category.includes('cardio') || 
      category.includes('endurance') || 
      category.includes('stretch') || 
      category.includes('sport') || 
      category.includes('agility') ||
      category.includes('plyometric')) {
    return true;
  }

  return false;
};

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  isEditing = false,
  previousSet: externalPreviousSet,
  showPreviousSets = true,
  useExerciseId = false
}) => {
  // Check if we should use the universal logger for non-resistance exercises
  if (shouldUseUniversalLogger(exercise)) {
    const handleUniversalSave = (sets: ExerciseSet[]) => {
      if (useExerciseId) {
        (onSave as (sets: ExerciseSet[], exerciseId: string) => void)(sets, exercise.id);
      } else {
        (onSave as (sets: ExerciseSet[]) => void)(sets);
      }
    };

    return (
      <UniversalSetLogger
        exercise={exercise as Exercise}
        onSave={handleUniversalSave}
        onCancel={onCancel}
        initialSets={exercise.sets || []}
        isEditing={isEditing}
      />
    );
  }

  // Use traditional resistance training logger for strength exercises
  const [sets, setSets] = useState<ExerciseSet[]>(() => {
    if (isEditing && exercise.sets && exercise.sets.length > 0) {
      return exercise.sets;
    }
    return [];
  });
  
  const [isAddingSet, setIsAddingSet] = useState(!isEditing);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);

  // Get the appropriate previous set based on context
  const getPreviousSet = (currentIndex?: number): ExerciseSet | undefined => {
    // If we're editing and have a valid index, use the previous set in sequence
    if (typeof currentIndex === 'number' && currentIndex > 0) {
      return sets[currentIndex - 1];
    }
    
    // If we're adding a new set, use the last set
    if (showPreviousSets) {
      // First try the last set in the current exercise
      if (sets.length > 0) {
        return sets[sets.length - 1];
      }
      // If no sets in current exercise, use the externally provided previous set
      return externalPreviousSet;
    }
    
    return undefined;
  };

  // Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ExerciseSetLogger state:', {
        sets,
        isEditing,
        editingSetIndex,
        externalPreviousSet,
        showPreviousSets
      });
    }
  }, [sets, isEditing, editingSetIndex, externalPreviousSet, showPreviousSets]);

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
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit' : 'Log'} {exercise.name}
          </h2>
          <span className="text-gray-400">{sets.length} sets</span>
        </div>

        {sets.map((set, index) => renderSetSummary(set, index))}

        {/* Set Editor Dialog */}
        {(isAddingSet || editingSetIndex !== null) && (
          <SetEditorDialog
            onSave={(editedSet) => handleSetSave(editedSet, editingSetIndex ?? undefined)}
            onClose={() => {
              setIsAddingSet(false);
              setEditingSetIndex(null);
            }}
            initialSet={editingSetIndex !== null ? sets[editingSetIndex] : undefined}
            previousSet={getPreviousSet(editingSetIndex ?? undefined)}
            exerciseName={exercise.name}
            setNumber={(editingSetIndex !== null ? editingSetIndex : sets.length) + 1}
            totalSets={editingSetIndex !== null ? sets.length : sets.length + 1}
            onDelete={editingSetIndex !== null ? () => handleSetDelete(editingSetIndex) : undefined}
          />
        )}

        {/* Add Set Button */}
        {!isAddingSet && editingSetIndex === null && (
          <button
            onClick={() => setIsAddingSet(true)}
            className="w-full py-4 mt-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Add Set
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-4">
          <button
            onClick={handleSaveAndClose}
            className="flex-1 py-3 rounded-lg bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-colors"
          >
            {isEditing ? 'Update' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
