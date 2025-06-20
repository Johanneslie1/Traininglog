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
      rpe?: number; // Keep for backward compatibility
    }>;
  };
  onSave: (sets: Set[]) => void;
  onCancel: () => void;
}

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel
}) => {  // Try to get existing sets from the exercise, or start with one empty set
  const [sets, setSets] = useState<Set[]>(() => {
    if (exercise.sets && exercise.sets.length > 0) {
      // Convert old rpe to difficulty if needed
      return exercise.sets.map(set => {
        const newSet: Set = { 
          reps: set.reps, 
          weight: set.weight 
        };
        
        // If set has rpe, convert to difficulty
        if (set.rpe !== undefined) {
          if (set.rpe <= 3) newSet.difficulty = 'WARMUP';
          else if (set.rpe <= 5) newSet.difficulty = 'EASY';
          else if (set.rpe <= 7) newSet.difficulty = 'NORMAL';
          else if (set.rpe <= 8) newSet.difficulty = 'HARD';
          else if (set.rpe <= 9) newSet.difficulty = 'FAILURE';
          else newSet.difficulty = 'DROP';
        } else if (set.difficulty) {
          newSet.difficulty = set.difficulty;
        }
        
        return newSet;
      });
    }
    return [{ reps: 0, weight: 0, difficulty: 'NORMAL' }];
  });
  
  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0, difficulty: 'NORMAL' }]);
  };
  
  const copyPreviousSet = () => {
    if (sets.length > 0) {
      // Get the last set
      const lastSet = sets[sets.length - 1];
      // Add a copy of it
      setSets([...sets, { ...lastSet }]);
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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end p-0 z-50">      <div className="bg-[#1a1a1a] rounded-t-3xl p-4 w-full max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white text-center">
          <div>Set №{sets.length}</div>
          <div className="text-base font-normal text-gray-400">{exercise.name}</div>
        </h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
          {sets.map((set, index) => (
            <div key={index} className="space-y-2 bg-[#232323] rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-white">Set №{index + 1}</span>
                <button
                  onClick={() => removeSet(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ✕
                </button>
              </div>
                <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="text-gray-400 text-xs block mb-1">KG</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(index, 'weight', Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-2 border rounded bg-[#252525] text-white border-gray-700 text-base"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="text-gray-400 text-xs block mb-1">REP</label>
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2 border rounded bg-[#252525] text-white border-gray-700 text-base"
                  />
                </div>
              </div><div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => setDifficulty(index, 'WARMUP')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'WARMUP' ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  WARMUP
                </button>
                <button
                  onClick={() => setDifficulty(index, 'EASY')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'EASY' ? 'bg-green-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  EASY
                </button>
                <button
                  onClick={() => setDifficulty(index, 'NORMAL')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'NORMAL' ? 'bg-yellow-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  NORMAL
                </button>
                <button
                  onClick={() => setDifficulty(index, 'HARD')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'HARD' ? 'bg-red-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  HARD
                </button>
                <button
                  onClick={() => setDifficulty(index, 'FAILURE')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'FAILURE' ? 'bg-amber-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  FAILURE
                </button>
                <button
                  onClick={() => setDifficulty(index, 'DROP')}
                  className={`py-1 px-2 rounded text-xs font-medium ${set.difficulty === 'DROP' ? 'bg-purple-600 text-white' : 'bg-[#333] text-gray-300'}`}
                >
                  DROP
                </button>
              </div>
            </div>
          ))}
        </div>        <div className="mt-4">
          <div className="flex justify-between gap-2 mb-3">
            <button
              onClick={addSet}
              className="bg-[#333] text-white px-3 py-1.5 rounded text-sm hover:bg-[#444] transition-colors flex-1"
            >
              Add Empty Set
            </button>
            
            <button
              onClick={copyPreviousSet}
              className="bg-[#444] text-white px-3 py-1.5 rounded text-sm hover:bg-[#555] transition-colors flex-1"
              disabled={sets.length === 0}
            >
              Copy Previous Set
            </button>
          </div>
          
          <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors uppercase flex-1 text-sm font-medium"
            >
              CANCEL
            </button>
            
            <button
              onClick={() => onSave(sets)}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors uppercase flex-1 text-sm font-medium"
            >
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
