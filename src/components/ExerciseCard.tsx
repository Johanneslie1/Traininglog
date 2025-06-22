import React from 'react';
import { DifficultyCategory } from '@/utils/localStorageUtils';

interface Set {
  weight: number;
  reps: number;
  difficulty?: DifficultyCategory;
}

interface ExerciseCardProps {
  name: string;
  sets: Set[];
  icon?: string;
  onAdd?: () => void;
  onDelete?: () => void;
  onMenu?: () => void;
}

const getDifficultyColor = (difficulty?: DifficultyCategory): string => {
  switch (difficulty) {
    case 'WARMUP': return 'var(--color-warmup)';
    case 'EASY': return 'var(--color-easy)';
    case 'NORMAL': return 'var(--color-normal)';
    case 'HARD': return 'var(--color-hard)';
    case 'FAILURE': return 'var(--color-failure)';
    case 'DROP': return 'var(--color-drop)';
    default: return 'var(--color-normal)';
  }
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  sets,
  icon,
  onAdd,
  onDelete,
  onMenu
}) => {
  const totalVolume = sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
  
  return (
    <div className="card group relative overflow-hidden">
      {/* Swipe Actions - Hidden by default, shown on swipe */}
      <div className="absolute inset-y-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
        {onAdd && (
          <button 
            onClick={onAdd}
            className="px-4 flex items-center justify-center bg-accent-primary text-white"
            aria-label="Add set"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button 
            onClick={onDelete}
            className="px-4 flex items-center justify-center bg-error text-white"
            aria-label="Delete exercise"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
              {icon ? (
                <img src={icon} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-2xl">🏋️</span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
              <p className="text-sm text-text-secondary">{sets.length} sets · {totalVolume}kg total</p>
            </div>
          </div>
          {onMenu && (
            <button 
              onClick={onMenu}
              className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Sets Grid */}
        <div className="grid grid-cols-3 gap-2">
          {sets.map((set, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-bg-tertiary relative overflow-hidden"
              style={{
                '--difficulty-color': getDifficultyColor(set.difficulty)
              } as React.CSSProperties}
            >
              {/* Difficulty Indicator */}
              <div 
                className="absolute inset-x-0 top-0 h-1 opacity-75"
                style={{ backgroundColor: 'var(--difficulty-color)' }}
              />
              
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary">
                  {set.weight}<span className="text-text-secondary text-sm ml-1">kg</span>
                </div>
                <div className="text-lg text-text-primary">
                  {set.reps}<span className="text-text-secondary text-sm ml-1">rep</span>
                </div>
                {set.difficulty && (
                  <div className="text-xs mt-1 opacity-75" style={{ color: 'var(--difficulty-color)' }}>
                    {set.difficulty}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseCard;
