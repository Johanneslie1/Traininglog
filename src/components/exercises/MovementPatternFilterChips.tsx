import React, { useId, useState } from 'react';
import { FilterIcon } from '@heroicons/react/outline';
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

interface MovementPatternFilterToggleProps {
  open: boolean;
  onToggle: () => void;
  panelId: string;
  activeCount?: number;
}

export const MovementPatternFilterToggle: React.FC<MovementPatternFilterToggleProps> = ({
  open,
  onToggle,
  panelId,
  activeCount = 0,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-controls={panelId}
    className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium min-h-[48px] transition-colors ${
      open || activeCount > 0
        ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
        : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
    }`}
  >
    <FilterIcon className="h-4 w-4" />
    <span>{open ? 'Hide' : 'Filters'}</span>
    {activeCount > 0 && (
      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent-primary px-1 text-[10px] font-semibold text-text-on-accent">
        {activeCount}
      </span>
    )}
  </button>
);

export const ActiveMovementPatternChip: React.FC<{
  pattern: MovementPattern;
  onClear: () => void;
}> = ({ pattern, onClear }) => (
  <button
    type="button"
    onClick={onClear}
    className="inline-flex items-center gap-1 rounded-lg bg-accent-primary px-3 py-1 text-sm font-medium text-text-inverse"
    aria-label={`Clear ${shortMovementPatternLabel(pattern)} filter`}
  >
    {shortMovementPatternLabel(pattern)}
    <span aria-hidden="true">×</span>
  </button>
);

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

export const CollapsibleMovementPatternFilter: React.FC<MovementPatternFilterChipsProps> = ({
  selected,
  onSelect,
  patterns,
}) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <MovementPatternFilterToggle
          open={open}
          onToggle={() => setOpen((value) => !value)}
          panelId={panelId}
          activeCount={selected ? 1 : 0}
        />
        {!open && selected ? (
          <ActiveMovementPatternChip pattern={selected} onClear={() => onSelect('')} />
        ) : null}
      </div>
      <div id={panelId} hidden={!open}>
        <MovementPatternFilterChips selected={selected} onSelect={onSelect} patterns={patterns} />
      </div>
    </div>
  );
};
