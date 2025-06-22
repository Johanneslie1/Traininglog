import React, { useState } from 'react';
import { Exercise } from '@/types/exercise';

// Difficulty categories that correspond to RPE values
export type DifficultyCategory = 'WARMUP' | 'EASY' | 'NORMAL' | 'HARD' | 'FAILURE' | 'DROP';
export const DIFFICULTY_CATEGORIES: { [key: string]: { label: DifficultyCategory, rpe: number } } = {
  WARMUP: { label: 'WARMUP', rpe: 2 },
  EASY: { label: 'EASY', rpe: 4 },
  NORMAL: { label: 'NORMAL', rpe: 6 },
  HARD: { label: 'HARD', rpe: 8 },
  FAILURE: { label: 'FAILURE', rpe: 9 },
  DROP: { label: 'DROP', rpe: 10 },
};

interface Set {
  reps: number;
  weight: number;
  difficulty?: DifficultyCategory;
}

interface ExerciseSetLoggerProps {
  exercise: Partial<Exercise> & { 
    id: string; 
    name: string;
    sets?: Array<{
      reps: number;
      weight: number;
      difficulty?: DifficultyCategory;
      rpe?: number;
    }>;
  };
  onSave: (sets: Set[], exerciseId: string) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [sets, setSets] = useState<Set[]>(() => {
    if (isEditing && exercise.sets && exercise.sets.length > 0) {
      return exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        difficulty: set.difficulty || convertRpeToDifficulty(set.rpe)
      }));
    }
    return [{ reps: 0, weight: 0, difficulty: 'NORMAL' }];
  });

  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(sets.length - 1);

  // Helper function to convert RPE to difficulty
  const convertRpeToDifficulty = (rpe?: number): DifficultyCategory => {
    if (!rpe) return 'NORMAL';
    if (rpe <= 3) return 'WARMUP';
    if (rpe <= 5) return 'EASY';
    if (rpe <= 7) return 'NORMAL';
    if (rpe <= 8) return 'HARD';
    if (rpe <= 9) return 'FAILURE';
    return 'DROP';
  };

  const handleSave = () => {
    // Filter out empty sets
    const validSets = sets.filter(set => set.reps > 0 && set.weight > 0);
    if (validSets.length === 0) {
      alert('Please add at least one valid set with reps and weight');
      return;
    }
    onSave(validSets, exercise.id);
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    if (lastSet && lastSet.reps === 0 && lastSet.weight === 0) {
      return;
    }
    const newSet: Set = { reps: 0, weight: 0, difficulty: 'NORMAL' as DifficultyCategory };
    setSets([...sets, newSet]);
    setSelectedSetIndex(sets.length);
  };
  
  const copyPreviousSet = () => {
    if (sets.length > 0) {
      const lastSet = sets[sets.length - 1];
      // Only copy if the last set has valid values
      if (lastSet.reps > 0 && lastSet.weight > 0) {
        const newSet = { ...lastSet };
        setSets([...sets, newSet]);
        setSelectedSetIndex(sets.length);
      }
    } else {
      // If there are no sets yet, just add an empty one
      addSet();
    }
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
    if (selectedSetIndex === index) {
      setSelectedSetIndex(Math.max(0, index - 1));
    } else if (selectedSetIndex > index) {
      setSelectedSetIndex(selectedSetIndex - 1);
    }
  };

  const updateSet = (field: keyof Set, value: number | DifficultyCategory) => {
    setSets(sets.map((set, index) => 
      index === selectedSetIndex
        ? { ...set, [field]: value }
        : set
    ));
  };

  const adjustValue = (field: 'weight' | 'reps', increment: boolean) => {
    const step = field === 'weight' ? 2.5 : 1;
    const currentValue = sets[selectedSetIndex][field];
    const newValue = increment ? currentValue + step : Math.max(0, currentValue - step);
    updateSet(field, newValue);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
      {/* Exercise Header */}
      <div className="flex items-center p-4 border-b border-[#2d2d2d]">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#2d2d2d] flex items-center justify-center mr-3">
          <span className="text-xl">🏆</span>
        </div>
        <h2 className="text-lg font-semibold flex-grow">{exercise.name}</h2>
      </div>

      {/* Sets Overview */}
      <div className="flex overflow-x-auto p-4 gap-3 border-b border-[#2d2d2d]">
        {sets.map((set, index) => (
          <div
            key={index}
            onClick={() => setSelectedSetIndex(index)}
            className={`flex-shrink-0 w-24 p-3 rounded-lg ${
              index === selectedSetIndex
                ? 'bg-purple-600 ring-2 ring-purple-400'
                : 'bg-[#2d2d2d]'
            } cursor-pointer transition-all`}
          >
            <div className="text-center">
              <div className="text-lg font-bold">{set.weight}kg</div>
              <div className="text-sm">{set.reps} reps</div>
              <div className="text-xs text-gray-400 mt-1">{set.difficulty}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Set Editor */}
      <div className="flex-grow p-4">
        <h3 className="text-lg font-medium mb-4">Set {selectedSetIndex + 1}</h3>
        
        {/* Weight Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustValue('weight', false)}
              className="w-12 h-12 rounded-lg bg-[#2d2d2d] text-2xl flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              value={sets[selectedSetIndex]?.weight || 0}
              onChange={(e) => updateSet('weight', Math.max(0, parseFloat(e.target.value) || 0))}
              className="flex-grow bg-[#2d2d2d] text-center text-xl py-2 rounded-lg"
              step="2.5"
            />
            <button
              onClick={() => adjustValue('weight', true)}
              className="w-12 h-12 rounded-lg bg-[#2d2d2d] text-2xl flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Reps</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustValue('reps', false)}
              className="w-12 h-12 rounded-lg bg-[#2d2d2d] text-2xl flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              value={sets[selectedSetIndex]?.reps || 0}
              onChange={(e) => updateSet('reps', Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-grow bg-[#2d2d2d] text-center text-xl py-2 rounded-lg"
            />
            <button
              onClick={() => adjustValue('reps', true)}
              className="w-12 h-12 rounded-lg bg-[#2d2d2d] text-2xl flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(DIFFICULTY_CATEGORIES).map(({ label }) => (
              <button
                key={label}
                onClick={() => updateSet('difficulty', label)}
                className={`px-3 py-2 rounded-lg ${
                  sets[selectedSetIndex]?.difficulty === label
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#2d2d2d] text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-[#2d2d2d] space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addSet}
            className="bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
          >
            Add Empty Set
          </button>
          <button
            onClick={copyPreviousSet}
            className="bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
          >
            Copy Previous Set
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
          >
            Save Exercise
          </button>
        </div>
      </div>
    </div>
  );
};
