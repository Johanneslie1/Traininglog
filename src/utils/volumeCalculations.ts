import { ExerciseSet } from '@/types/sets';

/**
 * Calculate volume for a single set (weight × reps)
 * @param set - The exercise set
 * @returns Volume in kg (or lbs depending on unit)
 */
export function calculateSetVolume(set: ExerciseSet): number {
  const weight = set.weight || 0;
  const reps = set.reps || 0;
  return weight * reps;
}

/**
 * Calculate total volume for multiple sets
 * @param sets - Array of exercise sets
 * @returns Total volume across all sets
 */
export function calculateTotalVolume(sets: ExerciseSet[]): number {
  if (!sets || sets.length === 0) return 0;
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

/**
 * Calculate average weight across sets
 * @param sets - Array of exercise sets
 * @returns Average weight, rounded to 1 decimal place
 */
export function calculateAverageWeight(sets: ExerciseSet[]): number {
  if (!sets || sets.length === 0) return 0;
  
  const setsWithWeight = sets.filter(set => (set.weight || 0) > 0);
  if (setsWithWeight.length === 0) return 0;
  
  const totalWeight = setsWithWeight.reduce((sum, set) => sum + (set.weight || 0), 0);
  return Math.round((totalWeight / setsWithWeight.length) * 10) / 10;
}

/**
 * Calculate average reps across sets
 * @param sets - Array of exercise sets
 * @returns Average reps, rounded to 1 decimal place
 */
export function calculateAverageReps(sets: ExerciseSet[]): number {
  if (!sets || sets.length === 0) return 0;
  
  const setsWithReps = sets.filter(set => (set.reps || 0) > 0);
  if (setsWithReps.length === 0) return 0;
  
  const totalReps = setsWithReps.reduce((sum, set) => sum + (set.reps || 0), 0);
  return Math.round((totalReps / setsWithReps.length) * 10) / 10;
}

/**
 * Estimate 1RM using Epley formula: 1RM = weight × (1 + reps/30)
 * Note: This formula is most accurate for 1-12 reps
 * @param weight - Weight lifted
 * @param reps - Number of reps performed
 * @returns Estimated 1RM, rounded to 1 decimal place
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight === 0 || reps === 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) {
    // Formula becomes less accurate beyond 12 reps, just return the weight
    return weight;
  }
  
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate estimated max for specific rep count using reverse Epley formula
 * @param rm1 - Estimated 1RM
 * @param targetReps - Target number of reps
 * @returns Estimated weight for target reps
 */
export function estimateRM(rm1: number, targetReps: number): number {
  if (rm1 === 0 || targetReps === 0) return 0;
  if (targetReps === 1) return rm1;
  
  // Reverse Epley: weight = 1RM / (1 + reps/30)
  return Math.round((rm1 / (1 + targetReps / 30)) * 10) / 10;
}

/**
 * Find the best set in terms of volume
 * @param sets - Array of exercise sets
 * @returns The set with highest volume
 */
export function findBestVolumeSet(sets: ExerciseSet[]): ExerciseSet | null {
  if (!sets || sets.length === 0) return null;
  
  return sets.reduce((best, current) => {
    const currentVolume = calculateSetVolume(current);
    const bestVolume = calculateSetVolume(best);
    return currentVolume > bestVolume ? current : best;
  });
}

/**
 * Find the heaviest set
 * @param sets - Array of exercise sets
 * @returns The set with highest weight
 */
export function findHeaviestSet(sets: ExerciseSet[]): ExerciseSet | null {
  if (!sets || sets.length === 0) return null;
  
  return sets.reduce((heaviest, current) => {
    const currentWeight = current.weight || 0;
    const heaviestWeight = heaviest.weight || 0;
    return currentWeight > heaviestWeight ? current : heaviest;
  });
}

/**
 * Find the set with most reps
 * @param sets - Array of exercise sets
 * @returns The set with highest reps
 */
export function findHighestRepSet(sets: ExerciseSet[]): ExerciseSet | null {
  if (!sets || sets.length === 0) return null;
  
  return sets.reduce((highest, current) => {
    const currentReps = current.reps || 0;
    const highestReps = highest.reps || 0;
    return currentReps > highestReps ? current : highest;
  });
}

/**
 * Calculate percentage improvement between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage improvement (positive for increase, negative for decrease)
 */
export function calculateImprovement(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Calculate total tonnage (alternative to volume, often used in powerlifting)
 * Tonnage = (weight × reps × sets)
 * @param sets - Array of exercise sets
 * @returns Total tonnage
 */
export function calculateTonnage(sets: ExerciseSet[]): number {
  return calculateTotalVolume(sets); // Same calculation for our purposes
}

/**
 * Calculate relative intensity (percentage of 1RM used)
 * @param weight - Weight used
 * @param estimated1RM - Estimated 1RM
 * @returns Percentage of 1RM
 */
export function calculateRelativeIntensity(weight: number, estimated1RM: number): number {
  if (estimated1RM === 0) return 0;
  return Math.round((weight / estimated1RM) * 100);
}

/**
 * Calculate training volume load (TVL) for multiple exercises
 * @param exerciseSets - Array of exercise set arrays
 * @returns Total volume across all exercises
 */
export function calculateTrainingVolumeLoad(exerciseSets: ExerciseSet[][]): number {
  return exerciseSets.reduce((total, sets) => total + calculateTotalVolume(sets), 0);
}
