import React from 'react';
import { Exercise } from '@/types/exercise';

interface ExerciseCardInfoProps {
  exercise: Exercise;
  compact?: boolean;
}

const ExerciseCardInfo: React.FC<ExerciseCardInfoProps> = ({
  exercise,
  compact = false
}) => {
  return (
    <div className="bg-surface rounded p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{exercise.name}</h3>
        {!compact && exercise.type && (
          <span className="text-sm px-2 py-1 bg-surface-light rounded">
            {exercise.type}
          </span>
        )}
      </div>
      {!compact && exercise.description && (
        <p className="text-sm text-gray-400 mt-2">{exercise.description}</p>
      )}
      {!compact && (
        <div className="mt-2 text-sm">
          <span className="text-gray-500">
            {exercise.primaryMuscles.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExerciseCardInfo;
