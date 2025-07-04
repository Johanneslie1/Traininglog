import React, { useState } from 'react';
import { ExerciseSet } from '@/types/sets';
import { DifficultyCategory } from '@/types/difficulty';
import { format } from 'date-fns';

interface SetEditorDialogProps {
  onSave: (set: ExerciseSet) => void;
  onClose: () => void;
  initialSet?: ExerciseSet;
  previousSet?: ExerciseSet;
  exerciseName?: string;
  setNumber?: number;
  totalSets?: number;
  onDelete?: () => void;
}

export const SetEditorDialog: React.FC<SetEditorDialogProps> = ({
  onSave,
  onClose,
  initialSet,
  exerciseName,
  setNumber,
  totalSets,
  onDelete
}) => {
  const [set, setSet] = useState<ExerciseSet>({
    reps: initialSet?.reps || 0,
    weight: initialSet?.weight || 0,
    difficulty: initialSet?.difficulty || DifficultyCategory.EASY,
    comment: initialSet?.comment || ''
  });

  const handleWeightChange = (delta: number) => {
    setSet(prev => ({ ...prev, weight: Math.max(0, +(prev.weight + delta).toFixed(1)) }));
  };

  const handleRepsChange = (delta: number) => {
    setSet(prev => ({ ...prev, reps: Math.max(0, prev.reps + delta) }));
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'weight' | 'reps') => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (!isNaN(value)) {
      setSet(prev => ({ 
        ...prev, 
        [field]: field === 'weight' ? Math.max(0, Math.min(999.9, value)) : Math.max(0, Math.min(999, Math.floor(value)))
      }));
    }
  };

  const difficultyOptions = [
    { value: DifficultyCategory.WARMUP, label: 'WARMUP' },
    { value: DifficultyCategory.EASY, label: 'EASY' },
    { value: DifficultyCategory.NORMAL, label: 'NORMAL' },
    { value: DifficultyCategory.HARD, label: 'HARD' },
    { value: DifficultyCategory.DROP, label: 'DROP' }
  ];

  return (
    <React.Fragment>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50">
        <div className="w-full max-w-md bg-[#1a1a1a] rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{exerciseName}</h2>
              <div className="text-gray-400">
                Set {setNumber} of {totalSets}
              </div>
            </div>

            {/* Weight Input */}
            <div className="mb-6">
              <label className="text-gray-400 mb-2 block">Weight (kg)</label>
              <div className="flex items-center bg-[#2a2a2a] rounded-lg p-2">
                <button
                  className="w-12 h-12 flex items-center justify-center text-2xl text-white bg-[#3a3a3a] rounded-lg"
                  onClick={() => handleWeightChange(-2.5)}
                >
                  -
                </button>
                <input
                  type="number"
                  className="flex-1 bg-transparent text-center text-2xl text-white mx-4"
                  value={set.weight || ''}
                  onChange={(e) => handleNumberInput(e, 'weight')}
                />
                <button
                  className="w-12 h-12 flex items-center justify-center text-2xl text-white bg-[#3a3a3a] rounded-lg"
                  onClick={() => handleWeightChange(2.5)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Reps Input */}
            <div className="mb-6">
              <label className="text-gray-400 mb-2 block">Reps</label>
              <div className="flex items-center bg-[#2a2a2a] rounded-lg p-2">
                <button
                  className="w-12 h-12 flex items-center justify-center text-2xl text-white bg-[#3a3a3a] rounded-lg"
                  onClick={() => handleRepsChange(-1)}
                >
                  -
                </button>
                <input
                  type="number"
                  className="flex-1 bg-transparent text-center text-2xl text-white mx-4"
                  value={set.reps || ''}
                  onChange={(e) => handleNumberInput(e, 'reps')}
                />
                <button
                  className="w-12 h-12 flex items-center justify-center text-2xl text-white bg-[#3a3a3a] rounded-lg"
                  onClick={() => handleRepsChange(1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-6">
              <label className="text-gray-400 mb-2 block">How was the set?</label>
              <div className="grid grid-cols-5 gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors
                      ${set.difficulty === option.value 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'}`}
                    onClick={() => setSet(prev => ({ ...prev, difficulty: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="mb-6">
              <label className="text-gray-400 mb-2 block">Notes (optional)</label>
              <textarea
                className="w-full bg-[#2a2a2a] rounded-lg p-3 text-white resize-none"
                rows={3}
                value={set.comment || ''}
                onChange={(e) => setSet(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Add a note..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-[#2a2a2a] text-white font-medium hover:bg-[#3a3a3a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(set)}
                className="flex-1 py-3 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
        {/* Header */}
        <header className="px-4 py-3 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-1">
            {exerciseName}
          </h2>
          <div className="flex justify-between items-center">
            <span className="text-lg text-white/90">
              Set №{setNumber} of {totalSets}
            </span>
            <span className="text-sm text-white/60">
              {format(new Date(), 'dd. MMM, HH:mm')}
            </span>
          </div>
        </header>

        {/* Main Content - Scrollable if needed */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {/* Weight Input */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">Weight (kg)</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleWeightChange(-2.5)}
                className="w-14 h-14 rounded-full bg-[#2a2a2a] text-white/90 text-2xl flex items-center justify-center active:bg-[#333]"
              >
                −
              </button>
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) => handleNumberInput(e, 'weight')}
                step="2.5"
                className="flex-1 bg-transparent text-center text-3xl font-semibold text-white border-b-2 border-white/20 focus:border-purple-500 focus:outline-none"
                inputMode="decimal"
              />
              <button
                onClick={() => handleWeightChange(2.5)}
                className="w-14 h-14 rounded-full bg-[#2a2a2a] text-white/90 text-2xl flex items-center justify-center active:bg-[#333]"
              >
                +
              </button>
            </div>
          </div>

          {/* Reps Input */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">Reps</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleRepsChange(-1)}
                className="w-14 h-14 rounded-full bg-[#2a2a2a] text-white/90 text-2xl flex items-center justify-center active:bg-[#333]"
              >
                −
              </button>
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) => handleNumberInput(e, 'reps')}
                className="flex-1 bg-transparent text-center text-3xl font-semibold text-white border-b-2 border-white/20 focus:border-purple-500 focus:outline-none"
                inputMode="numeric"
              />
              <button
                onClick={() => handleRepsChange(1)}
                className="w-14 h-14 rounded-full bg-[#2a2a2a] text-white/90 text-2xl flex items-center justify-center active:bg-[#333]"
              >
                +
              </button>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">How was the set?</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.values(DifficultyCategory).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSet(prev => ({ ...prev, difficulty }))
                  }
                  className={`px-3 py-2 rounded-lg ${
                    set.difficulty === difficulty 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#2a2a2a] text-white/70'
                  } text-sm font-medium transition-colors`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-lg text-white/90">Notes (optional)</label>
            <textarea
              value={set.comment || ''}
              onChange={(e) => setSet(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Add a note..."
              className="w-full h-24 px-4 py-3 rounded-lg bg-[#2a2a2a] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-4">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-6 py-2.5 rounded-lg bg-red-500/10 text-red-500 font-medium"
            >
              Delete
            </button>
          )}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-white/10 text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(set)}
              className="px-8 py-2.5 rounded-lg bg-purple-600 text-white font-medium"
            >
              Save
            </button>
          </div>
        </footer>
      </div>
    </React.Fragment>
  );
};

export default SetEditorDialog;
