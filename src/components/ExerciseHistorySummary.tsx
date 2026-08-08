import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ExerciseHistoryData,
  formatResistanceHighlight,
} from '@/hooks/useExerciseHistory';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';

interface ExerciseHistorySummaryProps {
  exerciseName: string;
  historyData: ExerciseHistoryData;
  onCopyLastValues?: (sets: ExerciseSet[]) => void;
  compact?: boolean;
}

/**
 * Trend indicator component
 */
const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'same' | 'none'; details?: string }> = ({ 
  trend, 
  details 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <span className="text-green-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      case 'down':
        return (
          <span className="text-red-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      case 'same':
        return (
          <span className="text-gray-400 flex items-center gap-1" title={details}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            {details && <span className="text-xs">{details}</span>}
          </span>
        );
      default:
        return null;
    }
  };

  return getTrendIcon();
};

const CopyButton: React.FC<{
  onCopy: () => void;
  compact?: boolean;
}> = ({ onCopy, compact }) => {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="flex-shrink-0 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="Copy last values"
        aria-label="Copy last values"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
      title="Copy last values to pre-fill the form"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Copy last values
    </button>
  );
};

/**
 * Exercise History Summary component
 * Shows last session best set for progressive overload; PR is behind a toggle
 */
export const ExerciseHistorySummary: React.FC<ExerciseHistorySummaryProps> = ({
  exerciseName: _exerciseName,
  historyData,
  onCopyLastValues,
  compact = false,
}) => {
  const [showPr, setShowPr] = useState(false);

  const {
    lastPerformed,
    history,
    lastHighlight,
    bestWeightSet,
    trend,
    trendDetails,
    isLoading,
    error,
  } = historyData;

  const handleCopy = () => {
    if (onCopyLastValues) {
      const sets = historyData.copyLastValues();
      if (sets.length > 0) {
        onCopyLastValues(sets);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`${compact ? 'py-1' : 'py-2 px-3'} bg-white/5 rounded-lg animate-pulse`}>
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - don't show error to user
  }

  if (!lastPerformed) {
    return (
      <div className={`${compact ? 'py-1 px-2' : 'py-2 px-3'} bg-white/5 rounded-lg`}>
        <p className="text-gray-400 text-sm">First time logging this exercise</p>
      </div>
    );
  }

  const isResistance =
    lastPerformed.activityType === ActivityType.RESISTANCE ||
    Boolean(lastHighlight) ||
    Boolean(bestWeightSet);

  const formattedDate = format(lastPerformed.timestamp, 'MMM d');

  if (isResistance && (lastHighlight || bestWeightSet)) {
    const lastText = lastHighlight
      ? formatResistanceHighlight(lastHighlight)
      : null;
    const lastDate = lastHighlight
      ? format(lastHighlight.timestamp, 'MMM d')
      : format((lastPerformed.displayDate || lastPerformed.timestamp), 'MMM d');
    const bestText = bestWeightSet
      ? formatResistanceHighlight({
          ...bestWeightSet,
          // PR line: weight × reps only (highest weight, most reps at that weight)
          rpe: undefined,
          difficulty: undefined,
        })
      : null;
    const bestDate = bestWeightSet ? format(bestWeightSet.timestamp, 'MMM d') : null;
    const hasDistinctPr =
      Boolean(bestText) &&
      (!lastHighlight ||
        !bestWeightSet ||
        bestWeightSet.weight !== lastHighlight.weight ||
        bestWeightSet.reps !== lastHighlight.reps ||
        bestWeightSet.timestamp.getTime() !== lastHighlight.timestamp.getTime());

    const prToggle = hasDistinctPr ? (
      <button
        type="button"
        onClick={() => setShowPr((current) => !current)}
        className="text-xs text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
        aria-expanded={showPr}
      >
        {showPr ? 'Hide PR' : 'Show PR'}
      </button>
    ) : null;

    const prRow =
      showPr && hasDistinctPr && bestText ? (
        <div className={compact ? 'text-gray-300 text-sm' : 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5'}>
          <span className="text-gray-400 text-sm">PR:</span>{' '}
          <span className="text-white font-medium">{bestText}</span>
          {bestDate && (
            <span className="text-gray-400 text-sm">{compact ? `(${bestDate})` : `on ${bestDate}`}</span>
          )}
        </div>
      ) : null;

    if (compact) {
      return (
        <div className="py-2 px-3 bg-white/5 rounded-lg space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1 text-sm">
              {lastText ? (
                <div className="text-gray-300">
                  <span className="text-gray-400">Last:</span>{' '}
                  <span className="text-white font-medium">{lastText}</span>
                  <span className="text-gray-400 ml-1">({lastDate})</span>
                </div>
              ) : (
                <div className="text-gray-400">No weighted set in recent history</div>
              )}
              {prRow}
              {prToggle}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendIndicator trend={trend} />
              {onCopyLastValues && <CopyButton onCopy={handleCopy} compact />}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/5 rounded-lg p-3 mb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 space-y-1.5">
            {lastText ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-gray-400 text-sm">Last:</span>
                <span className="text-white font-medium">{lastText}</span>
                <span className="text-gray-400 text-sm">on {lastDate}</span>
                <TrendIndicator trend={trend} details={trendDetails} />
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No weighted set in recent history</div>
            )}
            {prRow}
            {prToggle}
          </div>
          {onCopyLastValues && <CopyButton onCopy={handleCopy} />}
        </div>

        {history.length > 1 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-1.5">Recent history:</p>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`text-xs px-2 py-1 rounded ${
                    index === 0 ? 'bg-blue-600/20 text-blue-300' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {format(entry.displayDate || entry.timestamp, 'MMM d')}: {entry.summary}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-resistance fallback
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 py-1 px-2 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
          <span className="truncate">
            Last: <span className="text-white font-medium">{lastPerformed.summary}</span>
            <span className="text-gray-400 ml-1">({formattedDate})</span>
          </span>
          <TrendIndicator trend={trend} />
        </div>
        {onCopyLastValues && <CopyButton onCopy={handleCopy} compact />}
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Last time:</span>
          <span className="text-white font-medium">{lastPerformed.summary}</span>
          <span className="text-gray-400 text-sm">on {formattedDate}</span>
          <TrendIndicator trend={trend} details={trendDetails} />
        </div>
        {onCopyLastValues && <CopyButton onCopy={handleCopy} />}
      </div>

      {history.length > 1 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1.5">Recent history:</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 3).map((entry, index) => (
              <div
                key={entry.id}
                className={`text-xs px-2 py-1 rounded ${
                  index === 0 ? 'bg-blue-600/20 text-blue-300' : 'bg-white/5 text-gray-400'
                }`}
              >
                {format(entry.displayDate || entry.timestamp, 'MMM d')}: {entry.summary}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseHistorySummary;
