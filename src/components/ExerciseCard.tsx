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

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  sets,
  icon,
  onAdd,
  onDelete,
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
              <button onClick={onAdd} className="p-2 text-white hover:text-green-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-2 text-white hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            {onMenu && (
              <button onClick={onMenu} className="p-2 text-white hover:text-blue-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
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
