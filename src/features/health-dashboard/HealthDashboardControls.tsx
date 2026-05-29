import React from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from '@heroicons/react/outline';
import type { CoachRatingsViewMode } from '@/types/coachRatings';
import { formatCompactDate, formatWeekRange, viewModeLabels } from '@/features/health-dashboard/healthDashboardFormatters';

interface HealthDashboardControlsProps {
  selectedDate: string;
  periodStartDate: string;
  periodEndDate: string;
  viewMode: CoachRatingsViewMode;
  isDayMode: boolean;
  onViewModeChange: (mode: CoachRatingsViewMode) => void;
  onSelectDay: (dateKey: string) => void;
  onSelectWeekStart: (dateKey: string) => void;
  onMovePeriod: (direction: -1 | 1) => void;
  onRefresh: () => void;
  refreshLabel?: string;
  surfaceClassName?: string;
  children?: React.ReactNode;
}

export const HealthDashboardControls: React.FC<HealthDashboardControlsProps> = ({
  selectedDate,
  periodStartDate,
  periodEndDate,
  viewMode,
  isDayMode,
  onViewModeChange,
  onSelectDay,
  onSelectWeekStart,
  onMovePeriod,
  onRefresh,
  refreshLabel = 'Refresh',
  surfaceClassName = 'bg-bg-primary',
  children,
}) => {
  const selectedDateLabel = formatCompactDate(selectedDate);
  const periodRangeLabel = formatWeekRange(periodStartDate, periodEndDate);

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className={`flex h-11 items-center overflow-hidden rounded-full border border-border ${surfaceClassName} p-1`}>
          {(Object.keys(viewModeLabels) as CoachRatingsViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={`h-full rounded-full px-3 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-accent-primary text-text-inverse'
                  : 'text-text-secondary hover:text-accent-primary'
              }`}
              aria-pressed={viewMode === mode}
            >
              {viewModeLabels[mode]}
            </button>
          ))}
        </div>

        {isDayMode ? (
          <label className={`group relative flex h-11 min-w-44 items-center gap-2 rounded-full border border-border ${surfaceClassName} px-4 text-sm text-text-primary transition-colors hover:border-accent-primary`}>
            <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
            <span className="font-medium">{selectedDateLabel}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onSelectDay(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Daily date"
            />
          </label>
        ) : (
          <label className={`group relative flex h-11 min-w-56 items-center gap-2 rounded-full border border-border ${surfaceClassName} px-4 text-sm text-text-primary transition-colors hover:border-accent-primary`}>
            <CalendarIcon className="h-4 w-4 text-text-tertiary group-hover:text-accent-primary" />
            <span className="font-medium">Week of {periodRangeLabel}</span>
            <input
              type="date"
              value={periodStartDate}
              onChange={(event) => onSelectWeekStart(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Select week"
            />
          </label>
        )}

        <div className={`flex h-11 items-center overflow-hidden rounded-full border border-border ${surfaceClassName}`}>
          <button
            type="button"
            onClick={() => onMovePeriod(-1)}
            className="flex h-full w-11 items-center justify-center text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
            aria-label={isDayMode ? 'Previous day' : 'Previous week'}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMovePeriod(1)}
            className="flex h-full w-11 items-center justify-center border-l border-border text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
            aria-label={isDayMode ? 'Next day' : 'Next week'}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-accent-hover"
          aria-label={refreshLabel}
        >
          <RefreshIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{refreshLabel}</span>
        </button>
      </div>

      {children}
    </div>
  );
};
