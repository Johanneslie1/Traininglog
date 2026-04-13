import React from 'react';
import { UnifiedExerciseLog } from '@/types/session';
import { TRAINING_TYPE_CONFIG } from '@/config/trainingTypeConfig';

interface UniversalExerciseCardProps {
  exercise: UnifiedExerciseLog;
  onEdit: () => void;
  onDelete: () => void;
  onAddToSuperset?: () => void;
}

export const UniversalExerciseCard: React.FC<UniversalExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  onAddToSuperset
}) => {
  const config = TRAINING_TYPE_CONFIG[exercise.trainingType];
  
  // Calculate summary metric based on type
  const getSummaryMetric = (): string => {
    const sets = exercise.sets || [];
    if (sets.length === 0) return 'No sets logged';

    switch (config.summaryMetric) {
      case 'volume':
        const totalVolume = sets.reduce((sum, set) => 
          sum + ((set.weight || 0) * (set.reps || 0)), 0
        );
        return `Total Volume: ${totalVolume} kg`;
      
      case 'duration':
        const totalDuration = sets.reduce((sum, set) => 
          sum + (set.duration || 0), 0
        );
        return `Total Duration: ${totalDuration.toFixed(1)} min`;
      
      case 'distance':
        const totalDistance = sets.reduce((sum, set) => 
          sum + (set.distance || 0), 0
        );
        return `Total Distance: ${totalDistance.toFixed(2)} km`;
      
      default:
        return `${sets.length} set${sets.length !== 1 ? 's' : ''}`;
    }
  };

  const formatSetSummary = (setIndex: number, set: any): string => {
    const items = [];
    
    if (set.weight !== undefined && set.reps !== undefined) {
      items.push(`${set.weight}kg × ${set.reps}`);
    }
    if (set.duration !== undefined && set.distance !== undefined) {
      items.push(`${set.distance}km / ${set.duration}min`);
    } else if (set.duration !== undefined) {
      items.push(`${set.duration}min`);
    } else if (set.distance !== undefined) {
      items.push(`${set.distance}km`);
    }
    
    if (set.rpe) items.push(`RPE ${set.rpe}`);
    if (set.intensity) items.push(`Intensity ${set.intensity}/10`);
    if (set.pace) items.push(`${set.pace}/km`);
    
    return items.length > 0 ? items.join(' • ') : `Set ${setIndex + 1}`;
  };

  return (
    <div className="bg-bg-tertiary rounded-lg p-4 border border-border hover:border-border-hover transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-text-primary font-semibold">
            {config.icon} {exercise.exerciseName}
          </h3>
          <p className="text-xs text-text-tertiary">{config.label}</p>
        </div>
      </div>

      {/* Summary Metric */}
      <div className="text-sm text-accent-primary font-medium mb-3">
        {getSummaryMetric()}
      </div>

      {/* Set Details */}
      <div className="space-y-1 text-xs text-gray-400 mb-3">
        {exercise.sets.slice(0, 3).map((set, idx) => (
          <div key={idx} className="text-text-tertiary">
            Set {idx + 1}: {formatSetSummary(idx, set)}
          </div>
        ))}
        {exercise.sets.length > 3 && (
          <div className="text-gray-600 text-xs italic">
            ... and {exercise.sets.length - 3} more
          </div>
        )}
      </div>

      {/* Notes */}
      {exercise.notes && (
        <div className="text-xs text-text-tertiary mb-3 italic">
          "{exercise.notes}"
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onAddToSuperset && exercise.trainingType === 'strength' && (
          <button
            onClick={onAddToSuperset}
            className="flex-1 text-xs px-2 py-1.5 bg-blue-700/60 hover:bg-blue-600 rounded text-white transition-colors"
          >
            Add to Superset
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 text-xs px-2 py-1.5 bg-amber-700/60 hover:bg-amber-600 rounded text-white transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 text-xs px-2 py-1.5 bg-red-700/60 hover:bg-red-600 rounded text-white transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default UniversalExerciseCard;

