import React, { useState, useRef, useEffect } from 'react';
import { ExerciseSet } from '@/types/exercise';
import { ExerciseData } from '@/services/exerciseDataService';

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

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">{exercise.exerciseName}</h3>
        {showActions && (
          <div className="flex gap-2">
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
