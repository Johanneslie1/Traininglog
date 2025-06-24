import React from 'react';
import { Exercise } from '@/types/exercise';

export interface UpdatedExerciseCardProps {
  exercise: Exercise;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const UpdatedExerciseCard: React.FC<UpdatedExerciseCardProps> = ({ 
  exercise,
  onEdit,
  onDelete,
  showActions = true
}) => {
  return (
    <div className="bg-surface p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{exercise.name}</h3>
          <div className="text-sm text-gray-600">
            <p>{exercise.type} • {exercise.category}</p>
            {exercise.primaryMuscles && (
              <p>Primary muscles: {exercise.primaryMuscles.join(', ')}</p>
            )}
          </div>
        </div>
        {showActions && (
          <div className="space-x-2">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="text-primary hover:text-primary-dark"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      {exercise.description && (
        <p className="mt-2 text-sm text-gray-700">{exercise.description}</p>
      )}
      {exercise.equipment && exercise.equipment.length > 0 && (
        <div className="mt-2 text-sm">
          <span className="font-medium">Equipment: </span>
          {exercise.equipment.join(', ')}
        </div>
      )}
    </div>
  );
};

export default UpdatedExerciseCard;
