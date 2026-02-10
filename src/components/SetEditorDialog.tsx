import React, { useState, useEffect } from 'react';
import { ExerciseSet } from '@/types/sets';
import { DifficultyCategory } from '@/types/difficulty';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

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
  previousSet,
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

  const handleCopyPreviousSet = () => {
    if (!previousSet) return;
    try {
      console.log('Copying set:', previousSet); // Debug log
      setSet({
        reps: previousSet.reps,
        weight: previousSet.weight,
        difficulty: previousSet.difficulty,
        comment: previousSet.comment || ''
      });
      toast.success(`Copied set: ${previousSet.weight}kg × ${previousSet.reps}`, {
        id: 'copy-set-success',
      });
    } catch (error) {
      console.error('Error copying set:', error);
      toast.error('Failed to copy set values');
    }
  };

  // Verify props in development
  useEffect(() => {
    console.log('SetEditorDialog mounted with props:', { 
      previousSet, 
      setNumber, 
      totalSets,
      initialSet 
    });
  }, [previousSet, setNumber, totalSets, initialSet]);

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50 max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-text-primary truncate flex-1">
            {exerciseName}
          </h2>
          {previousSet && (
            <button
              onClick={handleCopyPreviousSet}
              className="ml-2 w-[44px] h-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-text-primary flex items-center justify-center shrink-0 group relative"
              aria-label={`Copy values from previous set (${previousSet.weight}kg × ${previousSet.reps})`}
              title={`Copy previous set: ${previousSet.weight}kg × ${previousSet.reps}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-sm bg-black/90 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Copy: {previousSet.weight}kg × {previousSet.reps}
              </span>
            </button>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg text-text-primary">
            Set №{setNumber} of {totalSets}
          </span>
          <span className="text-sm text-text-tertiary ml-2">
            {format(new Date(), 'dd. MMM, HH:mm')}
          </span>
        </div>
      </header>

      {/* Main Content - Scrollable if needed */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-full">
        {/* Weight Input */}
        <div className="space-y-2 max-w-full">
          <label className="text-lg text-text-primary">Weight (kg)</label>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => handleWeightChange(-2.5)}
              className="w-[44px] h-[44px] rounded-full bg-bg-tertiary text-text-primary text-2xl flex items-center justify-center active:bg-bg-tertiary shrink-0"
              aria-label="Decrease weight"
            >
              −
            </button>
            <div className="flex-1 min-w-0 px-2">
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) => handleNumberInput(e, 'weight')}
                step="2.5"
                className="w-full bg-transparent text-center text-2xl sm:text-3xl font-semibold text-text-primary border-b-2 border-white/20 focus:border-purple-500 focus:outline-none"
                inputMode="decimal"
              />
            </div>
            <button
              onClick={() => handleWeightChange(2.5)}
              className="w-[44px] h-[44px] rounded-full bg-bg-tertiary text-text-primary text-2xl flex items-center justify-center active:bg-bg-tertiary shrink-0"
              aria-label="Increase weight"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="space-y-2 max-w-full">
          <label className="text-lg text-text-primary">Reps</label>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => handleRepsChange(-1)}
              className="w-[44px] h-[44px] rounded-full bg-bg-tertiary text-text-primary text-2xl flex items-center justify-center active:bg-bg-tertiary shrink-0"
              aria-label="Decrease reps"
            >
              −
            </button>
            <div className="flex-1 min-w-0 px-2">
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) => handleNumberInput(e, 'reps')}
                className="w-full bg-transparent text-center text-2xl sm:text-3xl font-semibold text-text-primary border-b-2 border-white/20 focus:border-purple-500 focus:outline-none"
                inputMode="numeric"
              />
            </div>
            <button
              onClick={() => handleRepsChange(1)}
              className="w-[44px] h-[44px] rounded-full bg-bg-tertiary text-text-primary text-2xl flex items-center justify-center active:bg-bg-tertiary shrink-0"
              aria-label="Increase reps"
            >
              +
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-2 max-w-full">
          <label className="text-lg text-text-primary">How was the set?</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.values(DifficultyCategory).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSet(prev => ({ ...prev, difficulty }))}
                className={`min-h-[44px] rounded-lg ${
                  set.difficulty === difficulty 
                    ? 'bg-purple-600 text-text-primary' 
                    : 'bg-bg-tertiary text-text-secondary'
                } text-sm font-medium transition-colors`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 max-w-full">
          <label className="text-lg text-text-primary">Notes (optional)</label>
          <textarea
            value={set.comment || ''}
            onChange={(e) => setSet(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Add a note..."
            className="w-full h-24 px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-red-500/10 text-red-500 font-medium min-h-[44px]"
            >
              Delete Set
            </button>
          )}
          <div className="flex items-stretch sm:items-center gap-3 flex-1 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-lg bg-white/10 text-text-primary font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(set)}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-lg bg-purple-600 text-text-primary font-medium min-h-[44px]"
            >
              Save
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SetEditorDialog;
