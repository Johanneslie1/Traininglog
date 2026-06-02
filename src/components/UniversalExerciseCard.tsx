import React from 'react';
import { UnifiedExerciseLog } from '@/types/session';
import { TRAINING_TYPE_CONFIG } from '@/config/trainingTypeConfig';
import { Button, MetricChip } from '@/components/ui';
import { formatDistance, formatDuration, formatSetSummary as formatDisplaySetSummary, formatTrainingVolume } from '@/utils/displayFormatters';

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
  
  const getSummaryMetric = (): { label: string; value: string; tone?: 'default' | 'accent' | 'info' } => {
    const sets = exercise.sets || [];
    if (sets.length === 0) return { label: 'Sets', value: 'None' };

    switch (config.summaryMetric) {
      case 'volume':
        const totalVolume = sets.reduce((sum, set) => 
          sum + ((set.weight || 0) * (set.reps || 0)), 0
        );
        return { label: 'Volume', value: formatTrainingVolume(totalVolume), tone: 'accent' };
      
      case 'duration':
        const totalDuration = sets.reduce((sum, set) => 
          sum + (set.duration || 0), 0
        );
        return { label: 'Duration', value: formatDuration(totalDuration), tone: 'info' };
      
      case 'distance':
        const totalDistance = sets.reduce((sum, set) => 
          sum + (set.distance || 0), 0
        );
        return { label: 'Distance', value: formatDistance(totalDistance), tone: 'info' };
      
      default:
        return { label: 'Sets', value: `${sets.length}`, tone: 'default' };
    }
  };

  const formatSetSummary = (setIndex: number, set: any): string => {
    const summary = formatDisplaySetSummary(set);
    return summary.length > 0 ? summary : `Set ${setIndex + 1}`;
  };

  const summaryMetric = getSummaryMetric();

  return (
    <div className="rounded-2xl border border-border bg-bg-secondary p-4 transition-all hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-glow">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-text-primary">
            <span className="mr-2">{config.icon}</span>{exercise.exerciseName}
          </h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-text-tertiary">{config.label}</p>
        </div>
        <MetricChip label={summaryMetric.label} value={summaryMetric.value} tone={summaryMetric.tone} />
      </div>

      <div className="mb-3 space-y-1 rounded-xl border border-border bg-bg-tertiary/70 p-3 text-xs">
        {exercise.sets.slice(0, 3).map((set, idx) => (
          <div key={idx} className="text-text-secondary">
            Set {idx + 1}: {formatSetSummary(idx, set)}
          </div>
        ))}
        {exercise.sets.length > 3 && (
          <div className="text-xs italic text-text-tertiary">
            ... and {exercise.sets.length - 3} more
          </div>
        )}
      </div>

      {exercise.notes && (
        <div className="mb-3 rounded-xl border border-border bg-bg-tertiary/50 p-3 text-xs italic text-text-tertiary">
          "{exercise.notes}"
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {onAddToSuperset && exercise.trainingType === 'strength' && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddToSuperset}
            className="flex-1"
          >
            Add to Superset
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onEdit}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onDelete}
          className="flex-1"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default UniversalExerciseCard;

