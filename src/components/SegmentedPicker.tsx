import React from 'react';

interface SegmentedPickerProps {
  label: string;
  value: number | undefined;
  options: number[];
  onChange: (value: number | undefined) => void;
  /** Optional tooltip text keyed by option value */
  tooltips?: Record<number, string>;
  /** Highlight colour for the active button */
  colorScheme?: 'blue' | 'orange';
}

/**
 * A compact row of tap-buttons for selecting a single numeric value.
 * Tapping the active value deselects it (clears to undefined).
 */
const SegmentedPicker: React.FC<SegmentedPickerProps> = ({
  label,
  value,
  options,
  onChange,
  tooltips,
  colorScheme = 'blue',
}) => {
  const activeBase =
    colorScheme === 'orange'
      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
      : 'bg-accent-primary text-white border-accent-primary shadow-sm';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[20px]">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </label>
        {value !== undefined && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-0.5">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              title={tooltips?.[opt]}
              onClick={(e) => {
                e.stopPropagation();
                onChange(isSelected ? undefined : opt);
              }}
              className={[
                'flex-1 h-8 rounded text-sm font-semibold border transition-all',
                isSelected
                  ? activeBase
                  : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent-primary hover:text-text-primary',
              ].join(' ')}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Show tooltip text for the selected value */}
      {value !== undefined && tooltips?.[value] !== undefined && (
        <p className="text-xs text-text-secondary italic">{tooltips[value]}</p>
      )}
    </div>
  );
};

export default SegmentedPicker;
