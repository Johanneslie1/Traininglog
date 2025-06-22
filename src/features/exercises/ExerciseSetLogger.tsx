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
    // Check if current set is empty before adding new one
    const lastSet = sets[sets.length - 1];
    if (lastSet && lastSet.reps === 0 && lastSet.weight === 0) {
      return; // Don't add if last set is empty
    }
    setSets([...sets, { reps: 0, weight: 0, difficulty: 'NORMAL' }]);
  };
  
  const copyPreviousSet = () => {
    if (sets.length > 0) {
      const lastSet = sets[sets.length - 1];
      // Only copy if the last set has valid values
      if (lastSet.reps > 0 && lastSet.weight > 0) {
        setSets([...sets, { ...lastSet }]);
      }
    } else {
      // If there are no sets yet, just add an empty one
      addSet();
    }
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };
  const updateSet = (index: number, field: keyof Set, value: number | DifficultyCategory) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };
  
  const setDifficulty = (index: number, difficulty: DifficultyCategory) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], difficulty };
    setSets(newSets);
  };

  const handleSetClick = (index: number) => {
    setSelectedSetIndex(index);
  };

  const updateSelectedSet = (field: keyof Set, value: number | DifficultyCategory) => {
    updateSet(selectedSetIndex, field, value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-0 z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-4 w-full max-w-md mx-4">
        {/* Exercise Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🏋️</span>
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">{exercise.name}</h2>
          </div>
        </div>

        {/* Sets Display - Horizontal Layout */}
        <div className="mb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sets.map((set, index) => (
              <div key={index} className="flex-shrink-0 w-20 bg-[#252525] rounded-lg p-2 text-center">
                <div className="text-white text-xl font-bold mb-1">{set.weight || 0}</div>
                <div className="text-gray-400 text-sm">KG</div>
                <div className="text-white text-xl font-bold mt-2">{set.reps || 0}</div>
                <div className="text-gray-400 text-sm">REP</div>
                <div className="text-xs text-gray-400 mt-1">{set.difficulty}</div>
              </div>
            ))}
            <button
              onClick={addSet}
              className="flex-shrink-0 w-20 h-[120px] bg-[#252525] rounded-lg flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Set Editor */}
        {sets.length > 0 && (
          <div className="bg-[#252525] rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white">Set {sets.length}</span>
              {sets.length > 1 && (
                <button 
                  onClick={() => removeSet(sets.length - 1)} 
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove Set
                </button>
              )}
            </div>
            
            {/* Weight Input */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Weight</span>
                <input
                  type="number"
                  value={sets[sets.length - 1]?.weight || ''}
                  onChange={(e) => updateSet(sets.length - 1, 'weight', Number(e.target.value))}
                  className="bg-transparent text-white text-2xl w-20 focus:outline-none"
                />
                <span className="text-gray-400">kg</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateSet(sets.length - 1, 'weight', Math.max(0, (sets[sets.length - 1]?.weight || 0) - 2.5))} 
                  className="text-white bg-gray-700 px-3 py-1 rounded-md"
                >
                  -
                </button>
                <button 
                  onClick={() => updateSet(sets.length - 1, 'weight', (sets[sets.length - 1]?.weight || 0) + 2.5)} 
                  className="text-white bg-gray-700 px-3 py-1 rounded-md"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reps Input */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Reps</span>
                <input
                  type="number"
                  value={sets[sets.length - 1]?.reps || ''}
                  onChange={(e) => updateSet(sets.length - 1, 'reps', Number(e.target.value))}
                  className="bg-transparent text-white text-2xl w-20 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateSet(sets.length - 1, 'reps', Math.max(0, (sets[sets.length - 1]?.reps || 0) - 1))} 
                  className="text-white bg-gray-700 px-3 py-1 rounded-md"
                >
                  -
                </button>
                <button 
                  onClick={() => updateSet(sets.length - 1, 'reps', (sets[sets.length - 1]?.reps || 0) + 1)} 
                  className="text-white bg-gray-700 px-3 py-1 rounded-md"
                >
                  +
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(DIFFICULTY_CATEGORIES).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(sets.length - 1, level as DifficultyCategory)}
                  className={`py-2 px-1 text-xs rounded-md text-center ${
                    sets[sets.length - 1]?.difficulty === level 
                      ? 'text-white bg-gray-600' 
                      : 'text-gray-400 bg-transparent hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            <button
              onClick={addSet}
              className="bg-[#333] text-white px-4 py-2 rounded text-sm hover:bg-[#444] transition-colors flex-1"
            >
              Add Empty Set
            </button>
            
            <button
              onClick={copyPreviousSet}
              className={`bg-[#444] text-white px-4 py-2 rounded text-sm transition-colors flex-1 ${
                sets.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#555]'
              }`}
              disabled={sets.length === 0}
            >
              Copy Previous Set
            </button>
          </div>
          
          <div className="flex justify-between gap-2 pt-4 border-t border-gray-700">
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors uppercase flex-1 font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors uppercase flex-1 font-medium"
            >
              {isEditing ? 'Save Changes' : 'Add Exercise'}
            </button>
          </div>
        </div>

        <div className="text-white">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2d2d2d] flex items-center justify-center mr-3">
              <span className="text-2xl">🏋️</span>
            </div>
            <h2 className="text-xl font-semibold">{exercise.name}</h2>
          </div>

          {/* Display all sets */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {sets.map((set, index) => (
              <div
                key={index}
                onClick={() => handleSetClick(index)}
                className={`p-3 rounded-lg ${
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
            <div
              onClick={addSet}
              className="p-3 bg-[#2d2d2d] rounded-lg cursor-pointer hover:bg-[#3d3d3d] flex items-center justify-center"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>

          {/* Edit selected set */}
          <div className="bg-[#2d2d2d] p-4 rounded-lg mb-4">
            <h3 className="text-lg mb-4">Set {selectedSetIndex + 1}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Weight</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={sets[selectedSetIndex]?.weight || 0}
                    onChange={(e) => updateSelectedSet('weight', parseFloat(e.target.value) || 0)}
                    className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg w-full"
                    step="0.5"
                  />
                  <span className="ml-2">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Reps</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={sets[selectedSetIndex]?.reps || 0}
                    onChange={(e) => updateSelectedSet('reps', parseInt(e.target.value) || 0)}
                    className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(DIFFICULTY_CATEGORIES).map(({ label }) => (
                    <button
                      key={label}
                      onClick={() => updateSelectedSet('difficulty', label)}
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={copyPreviousSet}
              className="bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
            >
              Copy Previous Set
            </button>
            <button
              onClick={() => removeSet(selectedSetIndex)}
              className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700"
            >
              Remove Set
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCancel}
              className="bg-[#2d2d2d] text-white px-4 py-3 rounded-lg hover:bg-[#3d3d3d]"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
            >
              ADD EXERCISE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
