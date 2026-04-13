import React from 'react';

interface RPESliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
  label?: string;
}

const RPE_SCALE_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate-Easy',
  4: 'Moderate',
  5: 'Moderate-Hard',
  6: 'Hard',
  7: 'Very Hard',
  8: 'Extremely Hard',
  9: 'Near Maximum',
  10: 'Maximum',
};

/**
 * RPE Slider Component - For non-resistance activities
 * Provides a range slider for Rating of Perceived Exertion (1-10)
 * with visual feedback and accessibility support
 */
export const RPESlider: React.FC<RPESliderProps> = ({ value, onChange, label = 'RPE (1-10)' }) => {
  const currentValue = value || 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        <span className="text-lg font-semibold text-orange-400 bg-bg-tertiary px-3 py-1 rounded">
          {currentValue}
        </span>
      </div>

      {/* Range slider */}
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={currentValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`RPE from 1 (Very Easy) to 10 (Maximum)`}
        aria-valuetext={`RPE ${currentValue}: ${RPE_SCALE_LABELS[currentValue] || 'Unknown'}`}
        aria-valuenow={currentValue}
        aria-valuemin={1}
        aria-valuemax={10}
        className="w-full h-3 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-orange-500 slider"
        style={{
          background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((currentValue - 1) / 9) * 100}%, rgb(55, 65, 81) ${((currentValue - 1) / 9) * 100}%, rgb(55, 65, 81) 100%)`
        }}
      />

      {/* Scale labels and description */}
      <div className="flex justify-between items-center text-xs text-gray-500 px-1">
        <span className="flex flex-col items-start">
          <span className="font-semibold text-gray-400">1</span>
          <span className="text-[10px]">Very Easy</span>
        </span>
        <span className="text-center flex-1">
          <span className="text-gray-400">5 - Moderate</span>
        </span>
        <span className="flex flex-col items-end">
          <span className="font-semibold text-gray-400">10</span>
          <span className="text-[10px]">Maximum</span>
        </span>
      </div>

      {/* Current description */}
      <div className="text-center text-sm text-gray-400 bg-bg-tertiary/50 rounded py-2">
        {RPE_SCALE_LABELS[currentValue]}
      </div>
    </div>
  );
};
