import { ExerciseHistoryEntry } from '@/hooks/useExerciseHistory';
import { ExerciseSet } from '@/types/sets';

export interface ProgressionSuggestion extends ExerciseSet {
  rationale?: string; // Why this suggestion was made
}

/**
 * Calculate days between two dates
 */
export const getDaysSinceLastSession = (lastTimestamp: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastTimestamp.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate average RPE from a set of exercise sets
 */
const calculateAverageRPE = (sets: ExerciseSet[]): number => {
  const setsWithRPE = sets.filter(s => s.rpe && s.rpe > 0);
  if (setsWithRPE.length === 0) return 7; // Default moderate RPE
  
  const totalRPE = setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0);
  return totalRPE / setsWithRPE.length;
};

/**
 * Calculate average RIR (Reps in Reserve) from exercise sets
 */
const calculateAverageRIR = (sets: ExerciseSet[]): number => {
  const setsWithRIR = sets.filter(s => s.rir !== undefined && s.rir >= 0);
  if (setsWithRIR.length === 0) return 2; // Default moderate RIR
  
  const totalRIR = setsWithRIR.reduce((sum, set) => sum + (set.rir || 0), 0);
  return totalRIR / setsWithRIR.length;
};

/**
 * Get the average reps from the last session
 */
const getAverageReps = (sets: ExerciseSet[]): number => {
  const reps = sets.filter(s => s.reps > 0).map(s => s.reps);
  if (reps.length === 0) return 5; // Default
  
  return Math.round(reps.reduce((sum, r) => sum + r, 0) / reps.length);
};

/**
 * Main function to calculate progressive overload suggestions
 * 
 * Algorithm considers:
 * - Previous session's RPE/RIR (intensity markers)
 * - Days since last session (recovery time)
 * - Volume trends
 * - Conservative approach for safety
 * 
 * @param lastSession - The most recent exercise session from history
 * @param daysSinceLastSession - Number of days since the last session
 * @returns Array of suggested sets with progressive overload applied
 */
export function calculateProgressiveSuggestions(
  lastSession: ExerciseHistoryEntry,
  daysSinceLastSession: number
): ProgressionSuggestion[] {
  const lastSets = lastSession.sets;
  
  if (!lastSets || lastSets.length === 0) {
    return [];
  }

  // Calculate metrics from last session
  const avgRPE = calculateAverageRPE(lastSets);
  const avgRIR = calculateAverageRIR(lastSets);
  const lastReps = getAverageReps(lastSets);
  
  // Determine progression strategy based on intensity and recovery
  let weightIncrease = 0;
  let repsIncrease = 0;
  let suggestedRPE = avgRPE;
  let rationale = '';

  // Strategy 1: Very high intensity last session (RPE >= 9)
  // Action: Maintain or slightly reduce - body needs recovery
  if (avgRPE >= 9) {
    weightIncrease = 0;
    repsIncrease = 0;
    suggestedRPE = Math.max(7, avgRPE - 0.5);
    rationale = 'Maintaining load after very high intensity session';
  }
  
  // Strategy 2: High intensity last session (RPE 8-8.9)
  // Action: Maintain weight, same or slightly more reps if well-rested
  else if (avgRPE >= 8 && avgRPE < 9) {
    if (daysSinceLastSession >= 7) {
      weightIncrease = 2.5; // Well rested, small weight increase
      repsIncrease = 0;
      rationale = 'Well rested - small weight increase';
    } else {
      weightIncrease = 0;
      repsIncrease = 0;
      suggestedRPE = avgRPE;
      rationale = 'Maintaining after hard session';
    }
  }
  
  // Strategy 3: Moderate-high intensity (RPE 7-7.9)
  // Action: Standard progressive overload - small weight increase
  else if (avgRPE >= 7 && avgRPE < 8) {
    if (daysSinceLastSession >= 5) {
      weightIncrease = 2.5;
      repsIncrease = 0;
      suggestedRPE = Math.min(8, avgRPE + 0.5);
      rationale = 'Progressive overload - adding 2.5kg';
    } else {
      weightIncrease = 0;
      repsIncrease = 1; // Add a rep instead
      suggestedRPE = avgRPE + 0.5;
      rationale = 'Adding reps for progression';
    }
  }
  
  // Strategy 4: Moderate intensity (RPE 6-6.9)
  // Action: Good opportunity for progression
  else if (avgRPE >= 6 && avgRPE < 7) {
    if (daysSinceLastSession >= 4) {
      weightIncrease = 5; // Can handle more increase
      repsIncrease = 0;
      suggestedRPE = 7.5;
      rationale = 'Room for progression - adding 5kg';
    } else {
      weightIncrease = 2.5;
      repsIncrease = 1;
      suggestedRPE = 7;
      rationale = 'Moderate progression';
    }
  }
  
  // Strategy 5: Low intensity (RPE < 6) or high RIR (>= 4)
  // Action: Significant increase possible
  else if (avgRPE < 6 || avgRIR >= 4) {
    if (daysSinceLastSession >= 3) {
      weightIncrease = 5;
      repsIncrease = 1;
      suggestedRPE = 7.5;
      rationale = 'Previous session too easy - significant increase';
    } else {
      weightIncrease = 2.5;
      repsIncrease = 2;
      suggestedRPE = 7;
      rationale = 'Increasing difficulty';
    }
  }

  // Special consideration: Very long rest (>14 days) - be conservative
  if (daysSinceLastSession > 14) {
    weightIncrease = Math.min(weightIncrease, 2.5);
    repsIncrease = 0;
    suggestedRPE = Math.max(6, suggestedRPE - 1);
    rationale = 'Conservative return after long break';
  }
  
  // Special consideration: Very recent training (<2 days) - maintain or reduce
  if (daysSinceLastSession < 2) {
    weightIncrease = 0;
    repsIncrease = 0;
    suggestedRPE = Math.max(6, avgRPE - 0.5);
    rationale = 'Insufficient recovery - maintaining load';
  }

  // Apply progression to each set from last session
  const suggestedSets: ProgressionSuggestion[] = lastSets.map((set, index) => {
    const newWeight = set.weight ? Math.max(0, set.weight + weightIncrease) : 0;
    const newReps = set.reps ? Math.max(1, set.reps + repsIncrease) : lastReps + repsIncrease;
    
    // Progressive RPE per set (first set easier, last set harder)
    let setRPE = suggestedRPE;
    if (index === 0) {
      setRPE = Math.max(6, suggestedRPE - 0.5); // First set slightly easier
    } else if (index === lastSets.length - 1) {
      setRPE = Math.min(10, suggestedRPE + 0.5); // Last set slightly harder
    }

    return {
      weight: newWeight,
      reps: newReps,
      rpe: setRPE,
      rir: set.rir, // Copy RIR if it exists
      difficulty: set.difficulty,
      restTime: set.restTime,
      notes: '', // Clear notes for new session
      rationale: index === 0 ? rationale : undefined, // Only first set gets rationale
    };
  });

  return suggestedSets;
}

/**
 * Check if progressive overload suggestions should be applied
 * Only apply for resistance training exercises with sufficient history
 */
export function shouldApplyProgressiveOverload(
  lastSession: ExerciseHistoryEntry | undefined,
  exerciseType: string
): boolean {
  // Only apply to strength/resistance exercises
  if (exerciseType !== 'strength' && exerciseType !== 'bodyweight') {
    return false;
  }

  // Need at least one previous session
  if (!lastSession || !lastSession.sets || lastSession.sets.length === 0) {
    return false;
  }

  // Check if last session has weight/reps data
  const hasValidData = lastSession.sets.some(set => 
    set.reps > 0 && (set.weight !== undefined || exerciseType === 'bodyweight')
  );

  return hasValidData;
}

/**
 * Format the progression rationale for display to user
 */
export function formatProgressionRationale(
  lastSession: ExerciseHistoryEntry,
  suggestions: ProgressionSuggestion[],
  daysSinceLastSession: number
): string {
  const rationale = suggestions[0]?.rationale || 'Based on previous performance';
  const daysText = daysSinceLastSession === 1 ? '1 day ago' : `${daysSinceLastSession} days ago`;
  
  return `${rationale} (Last session: ${lastSession.summary}, ${daysText})`;
}
