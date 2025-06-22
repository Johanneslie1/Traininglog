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

export interface Set {
  reps: number;
  weight?: number;  // Make weight optional
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
    return [{ reps: 1, difficulty: 'NORMAL' }];
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
    // Validate that all sets have at least 1 rep
    const invalidSets = sets.filter(set => !set.reps || set.reps < 1);
    if (invalidSets.length > 0) {
      alert('Each set must have at least 1 rep');
      return;
    }
    onSave(sets, exercise.id);
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    if (lastSet && lastSet.reps === 0 && lastSet.weight === 0) {
      return;
    }
    const newSet: Set = { reps: 1, difficulty: 'NORMAL' as DifficultyCategory };
    setSets([...sets, newSet]);
    setSelectedSetIndex(sets.length);
  };
    const copyPreviousSet = () => {
    if (sets.length > 0) {
      const lastSet = sets[sets.length - 1];
      // Only copy if the last set has valid values (at least 1 rep)
      if (lastSet.reps > 0) {
        const newSet = { ...lastSet };
        setSets([...sets, newSet]);
        setSelectedSetIndex(sets.length);
      }
    } else {
      // If there are no sets yet, just add an empty one
      addSet();
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
    const currentSet = sets[selectedSetIndex];
    const currentValue = field === 'reps' ? (currentSet.reps || 0) : (currentSet.weight || 0);
    const newValue = increment ? currentValue + step : Math.max(0, currentValue - step);
    updateSet(field, newValue);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col max-w-md mx-auto">
      {/* Exercise Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🏋️</span>
        </div>
        <h2 className="text-xl text-white">{exercise.name}</h2>
      </div>

      {/* Sets Overview */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sets.map((set, index) => (
            <div
              key={index}
              onClick={() => setSelectedSetIndex(index)}
              className={`flex-shrink-0 w-24 bg-gray-800 p-3 rounded-lg cursor-pointer transition-all ${
                selectedSetIndex === index ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="text-center">
                <div className="text-xl text-white">{set.weight}<span className="text-sm text-gray-400 ml-1">kg</span></div>
                <div className="text-lg text-white">{set.reps}<span className="text-sm text-gray-400 ml-1">rep</span></div>
                <div className="text-xs text-gray-400 mt-1">{set.difficulty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Set Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg text-white mb-6">Set {selectedSetIndex + 1}</h3>

          {/* Weight Input */}
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Weight</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => adjustValue('weight', false)} 
                className="w-12 h-12 bg-gray-800 rounded-lg text-white text-2xl flex items-center justify-center"
              >
                -
              </button>              <input
                type="number"
                value={sets[selectedSetIndex].weight}
                onChange={(e) => updateSet('weight', Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 bg-gray-800 rounded-lg py-3 px-4 text-center text-xl text-white"
                step="2.5"
                inputMode="decimal"
              />
              <button 
                onClick={() => adjustValue('weight', true)} 
                className="w-12 h-12 bg-gray-800 rounded-lg text-white text-2xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Reps Input */}
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Reps</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => adjustValue('reps', false)} 
                className="w-12 h-12 bg-gray-800 rounded-lg text-white text-2xl flex items-center justify-center"
              >
                -
              </button>              <input
                type="number"
                value={sets[selectedSetIndex].reps}
                onChange={(e) => updateSet('reps', Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-gray-800 rounded-lg py-3 px-4 text-center text-xl text-white"
                inputMode="numeric"
              />
              <button 
                onClick={() => adjustValue('reps', true)} 
                className="w-12 h-12 bg-gray-800 rounded-lg text-white text-2xl flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Difficulty Buttons */}
          <div>
            <label className="block text-gray-400 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(DIFFICULTY_CATEGORIES).map(({ label }) => (
                <button
                  key={label}
                  onClick={() => updateSet('difficulty', label)}
                  className={`py-2 px-3 rounded-lg text-sm ${
                    sets[selectedSetIndex].difficulty === label
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addSet}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg"
          >
            Add Empty Set
          </button>
          <button
            onClick={copyPreviousSet}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg"
          >
            Copy Previous Set
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-4 py-3 rounded-lg"
          >
            {isEditing ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
};
