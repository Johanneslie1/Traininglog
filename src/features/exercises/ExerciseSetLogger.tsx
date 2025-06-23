import React, { useState } from 'react';
import { Exercise, ExerciseSet, DifficultyCategory } from '@/types/exercise';

export const DIFFICULTY_CATEGORIES: { [key: string]: { label: DifficultyCategory, rpe: number } } = {
  easy: { label: DifficultyCategory.EASY, rpe: 4 },
  moderate: { label: DifficultyCategory.MODERATE, rpe: 6 },
  hard: { label: DifficultyCategory.HARD, rpe: 8 },
  'very hard': { label: DifficultyCategory.VERY_HARD, rpe: 9 },
  'max effort': { label: DifficultyCategory.MAX_EFFORT, rpe: 10 },
};

interface ExerciseSetLoggerProps {
  exercise: Partial<Exercise> & { 
    id: string; 
    name: string;
    sets?: ExerciseSet[];
  };  onSave: (sets: ExerciseSet[], exerciseId: string) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const ExerciseSetLogger: React.FC<ExerciseSetLoggerProps> = ({
  exercise,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [sets, setSets] = useState<ExerciseSet[]>(() => {
    if (isEditing && exercise.sets && exercise.sets.length > 0) {      return exercise.sets.map(set => ({
        reps: set.reps || 0,
        weight: set.weight || 0,
        difficulty: set.difficulty || DifficultyCategory.MODERATE
      }));
    }
    return [{ reps: 0, weight: 0, difficulty: DifficultyCategory.MODERATE }];
  });

  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(sets.length - 1);

  const handleIncrement = (type: 'weight' | 'reps', amount: number) => {
    setSets(sets.map((set, index) => {
      if (index === selectedSetIndex) {
        const currentValue = type === 'weight' ? set.weight : set.reps;
        const newValue = Math.max(0, (currentValue || 0) + amount);
        return {
          ...set,
          [type]: type === 'weight' ? Math.min(999, newValue) : Math.min(99, newValue)
        };
      }
      return set;
    }));
  };

  const handleInputChange = (type: 'weight' | 'reps', value: string) => {
    const numValue = parseInt(value) || 0;
    const maxValue = type === 'weight' ? 999 : 99;
    
    setSets(sets.map((set, index) => {
      if (index === selectedSetIndex) {
        return {
          ...set,
          [type]: Math.min(maxValue, Math.max(0, numValue))
        };
      }
      return set;
    }));
  };

  const handleDelete = () => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, index) => index !== selectedSetIndex);
      setSets(newSets);
      setSelectedSetIndex(Math.min(selectedSetIndex, newSets.length - 1));
    }
  };

  const handleCopyPreviousSet = () => {
    if (selectedSetIndex > 0) {
      const previousSet = sets[selectedSetIndex - 1];
      setSets(sets.map((set, index) => 
        index === selectedSetIndex
          ? { ...previousSet }
          : set
      ));
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-white text-lg font-medium">{exercise.name}</h2>
        </div>
        <button
          onClick={() => onSave(sets, exercise.id)}
          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
        >
          Save
        </button>
      </header>

      {/* Sets Overview */}
      <div className="bg-[#1a1a1a] border-b border-white/10">
        <div className="flex gap-2 p-4 overflow-x-auto">
          {sets.map((set, index) => (
            <button
              key={index}
              onClick={() => setSelectedSetIndex(index)}
              className={`flex-shrink-0 p-3 rounded-lg ${
                selectedSetIndex === index 
                  ? 'bg-[#8B5CF6] text-white' 
                  : 'bg-[#2a2a2a] text-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-lg">{set.weight || 0}<span className="text-xs ml-1">kg</span></div>
                <div className="text-lg">{set.reps || 0}<span className="text-xs ml-1">reps</span></div>
                <div className="text-xs mt-1">{set.difficulty}</div>
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              setSets([...sets, { reps: 0, weight: 0, difficulty: 'moderate' as DifficultyCategory }]);
              setSelectedSetIndex(sets.length);
            }}
            className="flex-shrink-0 w-16 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-[#8B5CF6] hover:bg-white/5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Copy Previous Set Button */}
      {selectedSetIndex > 0 && (
        <button
          onClick={handleCopyPreviousSet}
          className="mx-4 mt-4 py-3 px-4 bg-[#2a2a2a] rounded-lg text-[#8B5CF6] font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy Previous Set
        </button>
      )}

      {/* Input Area */}
      <div className="flex-1 bg-[#1a1a1a] p-4 space-y-6">
        {/* Weight Input */}
        <div>
          <label className="text-sm text-gray-400 block mb-2">Weight (kg)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleIncrement('weight', -2.5)}
              className="w-14 h-14 bg-[#2a2a2a] rounded-lg text-white text-2xl flex items-center justify-center hover:bg-white/5"
            >
              -
            </button>
            <div className="flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={sets[selectedSetIndex].weight || 0}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-center px-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <button
              onClick={() => handleIncrement('weight', 2.5)}
              className="w-14 h-14 bg-[#2a2a2a] rounded-lg text-white text-2xl flex items-center justify-center hover:bg-white/5"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div>
          <label className="text-sm text-gray-400 block mb-2">Reps</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleIncrement('reps', -1)}
              className="w-14 h-14 bg-[#2a2a2a] rounded-lg text-white text-2xl flex items-center justify-center hover:bg-white/5"
            >
              -
            </button>
            <div className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                value={sets[selectedSetIndex].reps || 0}
                onChange={(e) => handleInputChange('reps', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-center px-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <button
              onClick={() => handleIncrement('reps', 1)}
              className="w-14 h-14 bg-[#2a2a2a] rounded-lg text-white text-2xl flex items-center justify-center hover:bg-white/5"
            >
              +
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="text-sm text-gray-400 block mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(DIFFICULTY_CATEGORIES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => {
                  setSets(sets.map((set, index) => 
                    index === selectedSetIndex
                      ? { ...set, difficulty: label }
                      : set
                  ));
                }}
                className={`py-3 px-3 rounded-lg text-sm font-medium ${
                  sets[selectedSetIndex]?.difficulty === label
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#2a2a2a] text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Set Button */}
      {sets.length > 1 && (
        <div className="bg-[#1a1a1a] p-4 border-t border-white/10">
          <button
            onClick={handleDelete}
            className="w-full py-3 text-red-500 bg-[#2a2a2a] rounded-lg hover:bg-white/5 transition-colors"
          >
            Delete Set
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseSetLogger;
