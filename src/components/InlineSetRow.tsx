import React, { useMemo, useCallback } from 'react';
import { ExerciseSet } from '@/types/sets';
import { InlineEditableValue } from './InlineEditableValue';
import { SwipeableSetRow } from './SwipeableSetRow';

interface InlineSetRowProps {
  set: ExerciseSet;
  setIndex: number;
  activityType: string;
  onUpdate: (index: number, field: keyof ExerciseSet, value: number | string) => void;
  onDelete: (index: number) => void;
  onEdit?: (index: number) => void; // Open full editor
  showDeleteButton?: boolean;
}

/**
 * A compact set row with inline editing and swipe-to-delete.
 * Shows key metrics based on activity type and allows quick edits.
 */
export const InlineSetRow: React.FC<InlineSetRowProps> = ({
  set,
  setIndex,
  activityType,
  onUpdate,
  onDelete,
  onEdit,
  showDeleteButton = true,
}) => {
  const handleUpdate = useCallback((field: keyof ExerciseSet, value: number | string) => {
    onUpdate(setIndex, field, value);
  }, [setIndex, onUpdate]);

  const handleDelete = useCallback(() => {
    onDelete(setIndex);
  }, [setIndex, onDelete]);

  const handleRowClick = useCallback(() => {
    if (onEdit) {
      onEdit(setIndex);
    }
  }, [setIndex, onEdit]);

  // Render the appropriate fields based on activity type
  const renderFields = useMemo(() => {
    const fields: React.ReactNode[] = [];

    switch (activityType) {
      case 'strength':
      case 'bodyweight':
      case 'resistance':
        fields.push(
          <div key="weight-reps" className="flex items-center gap-2 flex-1">
            <InlineEditableValue
              value={set.weight}
              onSave={(val) => handleUpdate('weight', val)}
              type="number"
              min={0}
              step={0.5}
              unit="kg"
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0}kg`}
            />
            <span className="text-gray-500">×</span>
            <InlineEditableValue
              value={set.reps}
              onSave={(val) => handleUpdate('reps', val)}
              type="number"
              min={0}
              step={1}
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0}`}
            />
          </div>
        );
        
        if (set.rir !== undefined) {
          fields.push(
            <span key="rir" className="text-gray-400 text-sm">
              RIR: {set.rir}
            </span>
          );
        }
        break;

      case 'endurance':
        fields.push(
          <div key="duration-distance" className="flex items-center gap-3 flex-1">
            <InlineEditableValue
              value={set.duration}
              onSave={(val) => handleUpdate('duration', val)}
              type="number"
              min={0}
              step={1}
              unit="min"
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0} min`}
            />
            {set.distance !== undefined && set.distance > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <InlineEditableValue
                  value={set.distance}
                  onSave={(val) => handleUpdate('distance', val)}
                  type="number"
                  min={0}
                  step={0.1}
                  unit="km"
                  displayClassName="text-white font-medium"
                  formatDisplay={(v) => `${v ?? 0} km`}
                />
              </>
            )}
          </div>
        );
        
        if (set.averageHeartRate) {
          fields.push(
            <span key="hr" className="text-gray-400 text-sm">
              ❤️ {set.averageHeartRate} bpm
            </span>
          );
        }
        break;

      case 'flexibility':
        fields.push(
          <div key="hold-reps" className="flex items-center gap-3 flex-1">
            <InlineEditableValue
              value={set.holdTime}
              onSave={(val) => handleUpdate('holdTime', val)}
              type="number"
              min={0}
              step={5}
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0}s hold`}
            />
            {set.reps && set.reps > 0 && (
              <>
                <span className="text-gray-500">×</span>
                <InlineEditableValue
                  value={set.reps}
                  onSave={(val) => handleUpdate('reps', val)}
                  type="number"
                  min={0}
                  step={1}
                  displayClassName="text-white font-medium"
                  formatDisplay={(v) => `${v ?? 0} reps`}
                />
              </>
            )}
          </div>
        );
        
        if (set.intensity !== undefined) {
          fields.push(
            <span key="intensity" className="text-gray-400 text-sm">
              Intensity: {set.intensity}/10
            </span>
          );
        }
        break;

      case 'sport':
        fields.push(
          <div key="duration" className="flex items-center gap-3 flex-1">
            <InlineEditableValue
              value={set.duration}
              onSave={(val) => handleUpdate('duration', val)}
              type="number"
              min={0}
              step={1}
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0} min`}
            />
            {set.calories && set.calories > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm">
                  🔥 {set.calories} cal
                </span>
              </>
            )}
          </div>
        );
        
        if (set.rpe !== undefined) {
          fields.push(
            <span key="rpe" className="text-gray-400 text-sm">
              RPE: {set.rpe}/10
            </span>
          );
        }
        break;

      case 'speed_agility':
        fields.push(
          <div key="reps-distance" className="flex items-center gap-3 flex-1">
            <InlineEditableValue
              value={set.reps}
              onSave={(val) => handleUpdate('reps', val)}
              type="number"
              min={0}
              step={1}
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0} reps`}
            />
            {set.distance && set.distance > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <InlineEditableValue
                  value={set.distance}
                  onSave={(val) => handleUpdate('distance', val)}
                  type="number"
                  min={0}
                  step={1}
                  displayClassName="text-white font-medium"
                  formatDisplay={(v) => `${v ?? 0}m`}
                />
              </>
            )}
            {set.height && set.height > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <InlineEditableValue
                  value={set.height}
                  onSave={(val) => handleUpdate('height', val)}
                  type="number"
                  min={0}
                  step={1}
                  displayClassName="text-white font-medium"
                  formatDisplay={(v) => `${v ?? 0}cm`}
                />
              </>
            )}
          </div>
        );
        break;

      default:
        fields.push(
          <div key="duration" className="flex items-center gap-3 flex-1">
            <InlineEditableValue
              value={set.duration}
              onSave={(val) => handleUpdate('duration', val)}
              type="number"
              min={0}
              step={1}
              displayClassName="text-white font-medium"
              formatDisplay={(v) => `${v ?? 0} min`}
            />
          </div>
        );
        break;
    }

    return fields;
  }, [activityType, set, handleUpdate]);

  const content = (
    <div
      className={`
        flex items-center justify-between p-3 sm:p-4 bg-[#2a2a2a] rounded-lg
        ${onEdit ? 'cursor-pointer hover:bg-[#333]' : ''}
        transition-colors
      `}
      onClick={handleRowClick}
    >
      {/* Set number */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-gray-400 font-medium w-8 shrink-0">
          #{setIndex + 1}
        </span>
        
        {/* Fields based on activity type */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {renderFields}
        </div>
      </div>

      {/* Edit indicator */}
      {onEdit && (
        <svg 
          className="w-5 h-5 text-gray-500 shrink-0 ml-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      )}
    </div>
  );

  // Wrap with swipe-to-delete if delete is enabled
  if (showDeleteButton) {
    return (
      <SwipeableSetRow onDelete={handleDelete}>
        {content}
      </SwipeableSetRow>
    );
  }

  return content;
};

export default InlineSetRow;
