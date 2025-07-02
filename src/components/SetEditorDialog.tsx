import React, { useState } from 'react';
import { ExerciseSet, DifficultyCategory, DIFFICULTY_RPE_MAP } from '@/types/exercise';

interface SetEditorDialogProps {
  onSave: (set: ExerciseSet) => void;
  onClose: () => void;
  initialSet?: ExerciseSet;
  exerciseName?: string;
  previousSet?: ExerciseSet;
}

export const SetEditorDialog: React.FC<SetEditorDialogProps> = ({
  onSave,
  onClose,
  initialSet,
  exerciseName,
  previousSet
}) => {
  const [set, setSet] = useState<ExerciseSet>(() => ({
    reps: initialSet?.reps || 0,
    weight: initialSet?.weight || 0,
    difficulty: initialSet?.difficulty || DifficultyCategory.EASY,
    comment: initialSet?.comment || ''
  }));

  const handleWeightChange = (delta: number) => {
    setSet(prev => ({ ...prev, weight: Math.max(0, Math.min(999, prev.weight + delta)) }));
  };

  const handleRepsChange = (delta: number) => {
    setSet(prev => ({ ...prev, reps: Math.max(0, Math.min(99, prev.reps + delta)) }));
  };

  const getDifficultyColor = (difficulty: DifficultyCategory) => {
    switch (difficulty) {
      case DifficultyCategory.WARMUP:
        return 'bg-blue-600';
      case DifficultyCategory.EASY:
        return 'bg-green-600';
      case DifficultyCategory.MODERATE:
        return 'bg-yellow-600';
      case DifficultyCategory.HARD:
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#121212] rounded-t-xl shadow-xl transform translate-y-0 transition-transform max-h-[90vh] overflow-y-auto">
        {/* Large Header */}
        <div className="px-4 pt-6 pb-4 bg-[#1a1a1a]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {initialSet ? 'Edit Set' : 'Add Set'}
              </h2>
              {exerciseName && (
                <p className="text-gray-400">{exerciseName}</p>
              )}
            </div>
            {previousSet && !initialSet && (
              <button
                onClick={() => setSet({
                  reps: previousSet.reps,
                  weight: previousSet.weight,
                  difficulty: previousSet.difficulty,
                  comment: previousSet.comment || ''
                })}
                className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
                title="Copy values from previous set"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Copy Previous</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Weight and Reps Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Weight Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">Weight (kg)</label>
              <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10">
                <button
                  onClick={() => handleWeightChange(-2.5)}
                  className="p-3 text-gray-400 hover:text-white focus:outline-none"
                  title="Decrease weight by 2.5kg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => setSet(prev => ({ ...prev, weight: Math.max(0, Math.min(999, parseFloat(e.target.value) || 0)) }))
                  }
                  className="flex-1 bg-transparent text-white text-center focus:outline-none"
                  placeholder="0"
                />
                <button
                  onClick={() => handleWeightChange(2.5)}
                  className="p-3 text-gray-400 hover:text-white focus:outline-none"
                  title="Increase weight by 2.5kg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">Reps</label>
              <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10">
                <button
                  onClick={() => handleRepsChange(-1)}
                  className="p-3 text-gray-400 hover:text-white focus:outline-none"
                  title="Decrease reps by 1"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) => setSet(prev => ({ ...prev, reps: Math.max(0, Math.min(99, parseInt(e.target.value) || 0)) }))
                  }
                  className="flex-1 bg-transparent text-white text-center focus:outline-none"
                  placeholder="0"
                />
                <button
                  onClick={() => handleRepsChange(1)}
                  className="p-3 text-gray-400 hover:text-white focus:outline-none"
                  title="Increase reps by 1"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Difficulty Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">How was the set?</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(DIFFICULTY_RPE_MAP).map(([difficulty, rpe]) => (
                <button
                  key={difficulty}
                  onClick={() => setSet(prev => ({ ...prev, difficulty: difficulty as DifficultyCategory }))
                  }
                  className={`p-2 rounded-lg transition-colors text-center ${
                    set.difficulty === difficulty
                      ? `${getDifficultyColor(difficulty as DifficultyCategory)} text-white`
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
                  }`}
                  title={`RPE ${rpe.min}-${rpe.max}`}
                >
                  <div className="text-sm font-medium">{difficulty}</div>
                  <div className="text-xs opacity-75">RPE {rpe.min}-{rpe.max}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              value={set.comment || ''}
              onChange={(e) => setSet(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Add a note..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(set);
                onClose();
              }}
              className="px-4 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors"
            >
              {initialSet ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
