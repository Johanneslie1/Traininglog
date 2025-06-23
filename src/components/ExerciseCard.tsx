import React, { useState } from 'react';
import { ExerciseSet } from '@/types/exercise';

interface ExerciseCardProps {
  name: string;
  sets: ExerciseSet[];
  icon?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSet?: () => void;
  isToday?: boolean;
}

const getDifficultyColor = (difficulty?: string): string => {
  if (!difficulty) return 'var(--color-normal)';
  
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
  onEdit,
  onDelete,
  onAddSet,
  isToday = false
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const formatSet = (set: ExerciseSet) => ({
    weight: set.weight || 0,
    reps: set.reps,
    difficulty: set.difficulty || 'NORMAL'
  });
  
  return (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5">
      {/* Card Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
            {icon ? (
              <span className="text-xl">{icon}</span>
            ) : (
              <span className="text-xl">🏋️</span>
            )}
          </div>
          <h3 className="text-white font-medium text-lg truncate">{name}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          {isToday && onAddSet && (
            <button 
              onClick={onAddSet}
              className="p-2.5 text-[#8B5CF6] hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Add set"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          
          {isToday && (onEdit || onDelete) && (
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2.5 text-white/70 hover:bg-white/5 rounded-lg transition-colors relative"
              aria-label="More options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              
              {showActions && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowActions(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#2a2a2a] rounded-lg shadow-lg overflow-hidden z-20 border border-white/10">
                    {onEdit && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(false);
                          onEdit();
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Exercise
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(false);
                          onDelete();
                        }}
                        className="w-full px-4 py-3 text-left text-red-500 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Exercise
                      </button>
                    )}
                  </div>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sets Display */}
      {sets?.length > 0 && (
        <div className="border-t border-white/5">
          <div className="overflow-x-auto pb-2 px-4 pt-3">
            <div className="flex gap-2">
              {sets.map((set, index) => {
                const formattedSet = formatSet(set);
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 bg-[#2a2a2a] px-3 py-2 rounded-lg"
                    style={{
                      borderLeft: `3px solid ${getDifficultyColor(formattedSet.difficulty)}`
                    }}
                  >
                    <div className="text-white font-medium">
                      {formattedSet.weight > 0 && `${formattedSet.weight}kg `}
                      {formattedSet.reps}r
                    </div>
                    <div className="text-xs text-gray-400">
                      {formattedSet.difficulty}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
