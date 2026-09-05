import React from 'react';
import {
  MOVEMENT_PATTERNS,
  shortMovementPatternLabel,
  type MovementPattern,
} from '@/data/movementPatterns';

interface MovementPatternFilterChipsProps {
  selected: MovementPattern | '';
  onSelect: (pattern: MovementPattern | '') => void;
  patterns?: readonly MovementPattern[];
}

export const MovementPatternFilterChips: React.FC<MovementPatternFilterChipsProps> = ({
  selected,
  onSelect,
  patterns = MOVEMENT_PATTERNS,
}) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label="Movement pattern">
    <button
      type="button"
      onClick={() => onSelect('')}
      className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
        selected === ''
          ? 'bg-accent-primary text-text-inverse'
          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-quaternary hover:text-text-primary'
      }`}
    >
      All patterns
    </button>
    {patterns.map((pattern) => {
      const active = selected === pattern;
      return (
        <button
          key={pattern}
          type="button"
          onClick={() => onSelect(active ? '' : pattern)}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
            active
              ? 'bg-accent-primary text-text-inverse'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-quaternary hover:text-text-primary'
          }`}
        >
          {shortMovementPatternLabel(pattern)}
        </button>
      );
    })}
  </div>
);
