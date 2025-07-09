import React, { useState, useRef, useEffect } from 'react';
import { ExerciseSet } from '@/types/sets';
import { ExerciseData } from '@/services/exerciseDataService';
import { useSupersets } from '@/context/SupersetContext';

interface ExerciseCardProps {
  exercise: ExerciseData;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const getDifficultyColor = (difficulty?: string): string => {
  if (!difficulty) return 'var(--color-normal)';
  
  switch (difficulty) {
    case 'WARMUP': return 'var(--color-warmup)';
    case 'EASY': return 'var(--color-easy)';
    case 'MODERATE': return 'var(--color-moderate)';
    case 'HARD': return 'var(--color-hard)';
    default: return 'var(--color-moderate)';
  }
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { state, toggleExerciseSelection, getSupersetByExercise, isExerciseInSuperset } = useSupersets();
  
  const superset = getSupersetByExercise(exercise.id || '');
  const isInSuperset = isExerciseInSuperset(exercise.id || '');
  const isSelected = state.selectedExercises.includes(exercise.id || '');
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleSupersetToggle = () => {
    if (exercise.id) {
      toggleExerciseSelection(exercise.id);
    }
  };

  const cardClassName = `bg-[#1a1a1a] rounded-lg p-4 border transition-all duration-200 ${
    isInSuperset 
      ? 'border-[#2196F3] bg-[#2196F3]/5' 
      : isSelected 
      ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' 
      : 'border-white/10'
  }`;

  return (
    <div className={cardClassName}>
      {/* Superset Label */}
      {superset && (
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2 py-1 bg-[#2196F3] text-white text-xs rounded-full font-medium">
            {superset.name}
          </div>
          <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
          </svg>
        </div>
      )}

      {/* Selection indicator during superset creation */}
      {state.isCreating && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSupersetToggle}
            className="w-4 h-4 text-[#8B5CF6] bg-gray-100 border-gray-300 rounded focus:ring-[#8B5CF6] focus:ring-2"
          />
          <span className="text-sm text-gray-400">Select for superset</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">{exercise.exerciseName}</h3>
        {showActions && (
          <div className="flex gap-2">
            {/* Superset toggle during creation */}
            {state.isCreating && (
              <button
                onClick={handleSupersetToggle}
                className={`p-2 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-[#8B5CF6] text-white' 
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                aria-label="Toggle superset selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
                </svg>
              </button>
            )}
            
            {onEdit && (
              <button 
                onClick={onEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Edit exercise"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-500"
                aria-label="Delete exercise"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        {exercise.sets.map((set: ExerciseSet, index: number) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Set {index + 1}</span>
            <span className="text-white">{set.weight}kg × {set.reps}</span>
            {set.difficulty && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: getDifficultyColor(set.difficulty) }}>
                {set.difficulty}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseCard;
