import React from 'react';
import { Program } from '@/types/program';

interface ProgramCardProps {
  program: Program;
  onClick: (program: Program) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onClick }) => {
  return (
    <button
      onClick={() => onClick(program)}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#2a2a2a] hover:bg-[#333] transition-all hover:scale-[1.02]"
    >
      {/* Image or gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Program info */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-left">
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
          {program.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {program.level && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
              {program.level.toUpperCase()}
            </span>
          )}
          <span className="text-sm text-gray-400">
            {program.sessions?.length || 0} sessions
          </span>
          {program.description && (
            <p className="mt-2 text-sm text-gray-400 line-clamp-2">
              {program.description}
            </p>
          )}
        </div>
      </div>

      {/* More options button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Handle options menu
        }}
        className="absolute top-2 right-2 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </button>
  );
};

export default ProgramCard;
