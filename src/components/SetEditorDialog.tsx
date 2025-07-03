import React, { useState } from 'react';
import { ExerciseSet, DifficultyCategory } from '@/types/exercise';
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

  return (
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
  );
};

export default SetEditorDialog;
