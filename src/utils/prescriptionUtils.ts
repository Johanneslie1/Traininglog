import { Prescription, NumberOrRange } from '@/types/program';
import { ExerciseSet } from '@/types/sets';
import { ActivityType } from '@/types/activityTypes';

/**
 * Get the value from a NumberOrRange (returns midpoint for ranges)
 */
export function getNumberValue(value: NumberOrRange | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Math.round((value.min + value.max) / 2);
}

/**
 * Get the minimum value from a NumberOrRange
 */
export function getMinValue(value: NumberOrRange | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.min;
}

/**
 * Get the maximum value from a NumberOrRange
 */
export function getMaxValue(value: NumberOrRange | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.max;
}

/**
 * Format a NumberOrRange for display
 */
export function formatNumberRange(value: NumberOrRange | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  return `${value.min}-${value.max}`;
}

/**
 * Convert a prescription to an array of ExerciseSets for auto-fill
 * @param prescription The prescription from the program
 * @param activityType The activity type of the exercise
 * @param user1RM Optional 1RM for calculating percentages (not implemented yet)
 * @returns Array of ExerciseSets with default values based on prescription
 */
export function prescriptionToSets(
  prescription: Prescription,
  activityType: ActivityType,
  user1RM?: number
): ExerciseSet[] {
  const numSets = getNumberValue(prescription.sets) || 1;
  const sets: ExerciseSet[] = [];

  for (let i = 0; i < numSets; i++) {
    const set: ExerciseSet = {
      weight: 0,
      reps: 0,
    };

    // Activity-type specific fields
    switch (activityType) {
      case ActivityType.RESISTANCE:
        set.reps = getNumberValue(prescription.reps) || 0;
        
        // Calculate weight if prescription exists
        if (prescription.weight) {
          if (prescription.weight.type === 'absolute') {
            set.weight = getNumberValue(prescription.weight.value);
          } else if (prescription.weight.type === 'percentage' && user1RM) {
            const percentage = getNumberValue(prescription.weight.value);
            set.weight = Math.round((percentage / 100) * user1RM);
          }
          // For RPE type, weight is left at 0 (user adjusts based on feeling)
        }
        
        if (prescription.rpe) {
          set.rpe = prescription.rpe;
        }
        break;

      case ActivityType.ENDURANCE:
      case ActivityType.SPORT:
        if (prescription.duration) {
          set.duration = getNumberValue(prescription.duration);
        }
        if (prescription.distance) {
          set.distance = getNumberValue(prescription.distance);
        }
        if (prescription.intensity) {
          set.intensity = prescription.intensity;
        }
        break;

      case ActivityType.STRETCHING:
        if (prescription.duration) {
          set.holdTime = getNumberValue(prescription.duration);
        }
        if (prescription.intensity) {
          set.flexibility = prescription.intensity;
        }
        break;

      case ActivityType.SPEED_AGILITY:
        if (prescription.reps) {
          set.reps = getNumberValue(prescription.reps);
        }
        if (prescription.distance) {
          set.distance = getNumberValue(prescription.distance);
        }
        break;

      case ActivityType.OTHER:
        // Generic fields
        if (prescription.reps) {
          set.reps = getNumberValue(prescription.reps);
        }
        if (prescription.duration) {
          set.duration = getNumberValue(prescription.duration);
        }
        break;
    }

    // Add rest time if specified (stored in comment for now)
    if (prescription.rest) {
      set.restTime = prescription.rest;
    }

    sets.push(set);
  }

  return sets;
}

/**
 * Format a prescription for display in the UI
 * @param prescription The prescription to format
 * @param activityType The activity type determines which fields to show
 * @returns A human-readable string like "4×8-10 @ 75-80%"
 */
export function formatPrescription(
  prescription: Prescription | undefined,
  activityType: ActivityType
): string {
  if (!prescription) return '';

  const parts: string[] = [];

  // Sets (common to all types)
  if (prescription.sets) {
    parts.push(`${formatNumberRange(prescription.sets)} sets`);
  }

  switch (activityType) {
    case ActivityType.RESISTANCE:
      // Reps
      if (prescription.reps) {
        parts.push(`× ${formatNumberRange(prescription.reps)} reps`);
      }

      // Weight
      if (prescription.weight) {
        const value = formatNumberRange(prescription.weight.value);
        switch (prescription.weight.type) {
          case 'percentage':
            parts.push(`@ ${value}%`);
            break;
          case 'absolute':
            parts.push(`@ ${value}kg`);
            break;
          case 'rpe':
            parts.push(`RPE ${value}`);
            break;
        }
      } else if (prescription.rpe) {
        parts.push(`RPE ${prescription.rpe}`);
      }

      // Rest
      if (prescription.rest) {
        parts.push(`${prescription.rest}s rest`);
      }

      // Tempo
      if (prescription.tempo) {
        parts.push(`Tempo: ${prescription.tempo}`);
      }
      break;

    case ActivityType.ENDURANCE:
    case ActivityType.SPORT:
      if (prescription.duration) {
        const mins = Math.floor(getNumberValue(prescription.duration) / 60);
        parts.push(`${mins} min`);
      }
      if (prescription.distance) {
        parts.push(`${formatNumberRange(prescription.distance)} km`);
      }
      if (prescription.intensity) {
        parts.push(`Intensity: ${prescription.intensity}/10`);
      }
      break;

    case ActivityType.STRETCHING:
      if (prescription.duration) {
        parts.push(`${formatNumberRange(prescription.duration)}s hold`);
      }
      if (prescription.intensity) {
        parts.push(`Intensity: ${prescription.intensity}/10`);
      }
      break;

    case ActivityType.SPEED_AGILITY:
      if (prescription.reps) {
        parts.push(`× ${formatNumberRange(prescription.reps)} reps`);
      }
      if (prescription.distance) {
        parts.push(`${formatNumberRange(prescription.distance)}m`);
      }
      break;

    case ActivityType.OTHER:
      if (prescription.reps) {
        parts.push(`× ${formatNumberRange(prescription.reps)} reps`);
      }
      if (prescription.duration) {
        parts.push(`${formatNumberRange(prescription.duration)}s`);
      }
      break;
  }

  return parts.join(' ');
}

/**
 * Format a compact prescription badge for display in lists
 * @param prescription The prescription to format
 * @param activityType The activity type
 * @returns A short string like "4×8-10 @ 75%" or "20min @ 7/10"
 */
export function formatPrescriptionBadge(
  prescription: Prescription | undefined,
  activityType: ActivityType
): string {
  if (!prescription) return '';

  switch (activityType) {
    case ActivityType.RESISTANCE:
      const sets = formatNumberRange(prescription.sets);
      const reps = formatNumberRange(prescription.reps);
      let badge = `${sets}×${reps}`;
      
      if (prescription.weight) {
        const value = formatNumberRange(prescription.weight.value);
        if (prescription.weight.type === 'percentage') {
          badge += ` @ ${value}%`;
        } else if (prescription.weight.type === 'absolute') {
          badge += ` @ ${value}kg`;
        } else if (prescription.weight.type === 'rpe') {
          badge += ` RPE${value}`;
        }
      }
      return badge;

    case ActivityType.ENDURANCE:
    case ActivityType.SPORT:
      const duration = prescription.duration ? `${Math.floor(getNumberValue(prescription.duration) / 60)}min` : '';
      const distance = prescription.distance ? `${formatNumberRange(prescription.distance)}km` : '';
      const intensity = prescription.intensity ? `@ ${prescription.intensity}/10` : '';
      return [duration, distance, intensity].filter(Boolean).join(' ');

    case ActivityType.STRETCHING:
      return prescription.duration ? `${formatNumberRange(prescription.duration)}s hold` : '';

    case ActivityType.SPEED_AGILITY:
      const repsSpeed = prescription.reps ? `${formatNumberRange(prescription.reps)}x` : '';
      const dist = prescription.distance ? `${formatNumberRange(prescription.distance)}m` : '';
      return [repsSpeed, dist].filter(Boolean).join(' ');

    default:
      return formatPrescription(prescription, activityType);
  }
}

/**
 * Compare actual performed sets against prescription and calculate adherence
 * Returns metrics for analytics (future use)
 */
export interface AdherenceMetrics {
  setsCompleted: number;
  setsTarget: number;
  averageReps: number;
  targetReps?: NumberOrRange;
  withinRange: boolean;
  adherencePercentage: number;
}

export function comparePrescriptionToActual(
  prescription: Prescription | undefined,
  actualSets: ExerciseSet[],
  activityType: ActivityType
): AdherenceMetrics | null {
  if (!prescription) return null;

  const targetSets = getNumberValue(prescription.sets) || 0;
  const completedSets = actualSets.length;

  const metrics: AdherenceMetrics = {
    setsCompleted: completedSets,
    setsTarget: targetSets,
    averageReps: 0,
    withinRange: true,
    adherencePercentage: 0,
  };

  // Activity-specific comparisons
  if (activityType === ActivityType.RESISTANCE && prescription.reps) {
    metrics.targetReps = prescription.reps;
    
    const totalReps = actualSets.reduce((sum, set) => sum + (set.reps || 0), 0);
    metrics.averageReps = completedSets > 0 ? totalReps / completedSets : 0;

    // Check if within range
    const minReps = getMinValue(prescription.reps);
    const maxReps = getMaxValue(prescription.reps);
    metrics.withinRange = actualSets.every(
      set => set.reps >= minReps && set.reps <= maxReps
    );
  }

  // Calculate overall adherence
  const setsAdherence = targetSets > 0 ? (completedSets / targetSets) * 100 : 100;
  metrics.adherencePercentage = Math.min(setsAdherence, 100);

  return metrics;
}

/**
 * Validate that a prescription has the required fields for its activity type
 */
export function validatePrescription(
  prescription: Prescription,
  activityType: ActivityType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Sets should always be specified
  if (!prescription.sets) {
    errors.push('Number of sets is required');
  }

  switch (activityType) {
    case ActivityType.RESISTANCE:
      if (!prescription.reps && !prescription.duration) {
        errors.push('Reps or duration is required for resistance training');
      }
      break;

    case ActivityType.ENDURANCE:
    case ActivityType.SPORT:
      if (!prescription.duration && !prescription.distance) {
        errors.push('Duration or distance is required for endurance activities');
      }
      break;

    case ActivityType.STRETCHING:
      if (!prescription.duration) {
        errors.push('Duration is required for stretching exercises');
      }
      break;

    case ActivityType.SPEED_AGILITY:
      if (!prescription.reps && !prescription.distance) {
        errors.push('Reps or distance is required for speed/agility drills');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
