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
  onCopy?: () => void;
  onAdd?: () => void;
  onMenu?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  sets,
  icon,
  onCopy,
  onAdd,
  onMenu
}) => {
  return (
    <div className="bg-[#1a1a1a] mb-2 rounded-lg overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2d2d2d] flex items-center justify-center">
              {icon ? (
                <img src={icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🏋️</span>
              )}
            </div>
            <h3 className="text-white text-lg">{name}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {onAdd && (
              <button onClick={onAdd} className="p-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            {onCopy && (
              <button onClick={onCopy} className="p-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            )}
            {onMenu && (
              <button onClick={onMenu} className="p-2 text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4">
          {sets.map((set, index) => (
            <div key={index} className="text-center">
              <div className="text-white text-xl">
                {set.weight}<span className="text-gray-500 text-xs ml-1">KG</span>
              </div>
              <div className="text-white text-lg">
                {set.reps}<span className="text-gray-500 text-xs ml-1">REP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseCard;
