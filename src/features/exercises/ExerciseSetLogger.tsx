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

  return (
    <div className="text-white p-4">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2d2d2d] flex items-center justify-center mr-3">
          <span className="text-2xl">🏋️</span>
        </div>
        <h2 className="text-xl font-semibold">{exercise.name}</h2>
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {sets.map((set, index) => (
          <div
            key={index}
            onClick={() => setSelectedSetIndex(index)}
            className={`p-4 rounded-lg ${
              index === selectedSetIndex
                ? 'bg-purple-600 ring-2 ring-purple-400'
                : 'bg-[#2d2d2d]'
            } cursor-pointer transition-all`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{set.weight}</div>
              <div className="text-sm text-gray-400">KG</div>
            </div>
            <div className="text-center mt-2">
              <div className="text-xl">{set.reps}</div>
              <div className="text-sm text-gray-400">REP</div>
            </div>
            <div className="text-center mt-1">
              <div className="text-xs text-gray-400">{set.difficulty}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Set Editor */}
      <div className="bg-[#2d2d2d] p-4 rounded-lg mb-6">
        <h3 className="text-lg mb-4">Set {selectedSetIndex + 1}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={sets[selectedSetIndex]?.weight || 0}
              onChange={(e) => updateSet('weight', Math.max(0, parseFloat(e.target.value) || 0))}
              className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Reps</label>
            <input
              type="number"
              value={sets[selectedSetIndex]?.reps || 0}
              onChange={(e) => updateSet('reps', Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg w-full"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(DIFFICULTY_CATEGORIES).map(({ label }) => (
                <button
                  key={label}
                  onClick={() => updateSet('difficulty', label)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    sets[selectedSetIndex]?.difficulty === label
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-400'
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
      <div className="grid grid-cols-2 gap-4 mb-4">
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

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => removeSet(selectedSetIndex)}
          className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          disabled={sets.length <= 1}
        >
          Remove Set
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
        >
          Save Exercise
        </button>
      </div>

      <button
        onClick={onCancel}
        className="w-full bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
      >
        Cancel
      </button>
    </div>
  );
};
