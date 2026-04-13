import React from 'react';
import { Program } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';

interface ProgramCardProps {
  program: Program;
  onClick: (program: Program) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onClick }) => {
  // Analyze program composition
  const getProgramComposition = () => {
    const activityTypes = new Set<ActivityType>();
    let totalExercises = 0;

    program.sessions?.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (exercise.activityType) {
          activityTypes.add(exercise.activityType);
        } else {
          activityTypes.add(ActivityType.RESISTANCE); // Default for legacy exercises
        }
        totalExercises++;
      });
    });

    return {
      types: Array.from(activityTypes),
      totalExercises,
      isMixed: activityTypes.size > 1
    };
  };

  const composition = getProgramComposition();

  // Helper function to get activity type display info
  const getActivityTypeInfo = (activityType: ActivityType) => {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
      case ActivityType.SPORT:
        return { label: 'Sport', color: 'bg-green-600', textColor: 'text-green-100' };
      case ActivityType.STRETCHING:
        return { label: 'Flexibility', color: 'bg-purple-600', textColor: 'text-purple-100' };
      case ActivityType.ENDURANCE:
        return { label: 'Endurance', color: 'bg-orange-600', textColor: 'text-orange-100' };
      case ActivityType.SPEED_AGILITY:
        return { label: 'Speed', color: 'bg-red-600', textColor: 'text-red-100' };
      case ActivityType.OTHER:
        return { label: 'Other', color: 'bg-gray-600', textColor: 'text-gray-100' };
      default:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(program)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(program);
        }
      }}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-bg-tertiary hover:bg-bg-tertiary transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent-primary"
    >
      {/* Image or gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Program info */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-left">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
          {program.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-text-tertiary">
            {program.sessions?.length || 0} sessions • {composition.totalExercises} exercises
          </span>
        </div>
        
        {/* Activity Type Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {composition.types.slice(0, 3).map(type => {
            const typeInfo = getActivityTypeInfo(type);
            return (
              <span 
                key={type} 
                className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color} ${typeInfo.textColor}`}
              >
                {typeInfo.label}
              </span>
            );
          })}
          {composition.types.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-600 text-gray-100">
              +{composition.types.length - 3}
            </span>
          )}
        </div>
        
        {program.description && (
          <p className="mt-2 text-sm text-text-tertiary line-clamp-2">
            {program.description}
          </p>
        )}
      </div>

      {/* More options button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Handle options menu
        }}
        aria-label="Open program options"
        className="absolute top-2 right-2 p-2 text-text-secondary hover:text-text-primary bg-black/20 hover:bg-black/40 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  );
};

export default ProgramCard;

