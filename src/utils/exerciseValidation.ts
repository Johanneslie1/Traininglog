import { ExerciseSet } from '../types/sets';
import { ExerciseType, getExerciseTypeConfig, validateRequiredStats } from '../config/exerciseTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SetValidationResult extends ValidationResult {
  missingRequiredStats: string[];
}

/**
 * Validates an exercise set based on the exercise type
 */
export const validateExerciseSet = (set: Partial<ExerciseSet>, exerciseType: ExerciseType): SetValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getExerciseTypeConfig(exerciseType);
  
  // Check required stats
  const { isValid, missingStats } = validateRequiredStats(set, exerciseType);
  
  if (!isValid) {
    missingStats.forEach(stat => {
      errors.push(`${stat} is required for ${config.displayName} exercises`);
    });
  }
  
  // Type-specific validations
  switch (exerciseType) {
    case 'strength':
      if (set.weight !== undefined && set.weight < 0) {
        errors.push('Weight cannot be negative');
      }
      if (set.reps !== undefined && set.reps < 1) {
        errors.push('Reps must be at least 1');
      }
      if (set.rir !== undefined && (set.rir < 0 || set.rir > 10)) {
        errors.push('RIR must be between 0 and 10');
      }
      break;
      
    case 'plyometrics':
      if (set.reps !== undefined && set.reps < 1) {
        errors.push('Reps must be at least 1');
      }
      if (set.rpe !== undefined && (set.rpe < 1 || set.rpe > 10)) {
        errors.push('RPE must be between 1 and 10');
      }
      if (set.height !== undefined && set.height < 0) {
        errors.push('Height cannot be negative');
      }
      break;
      
    case 'endurance':
    case 'teamSports':
    case 'other':
      if (set.duration !== undefined && set.duration <= 0) {
        errors.push('Duration must be greater than 0');
      }
      if (set.distance !== undefined && set.distance < 0) {
        errors.push('Distance cannot be negative');
      }
      if (set.rpe !== undefined && (set.rpe < 1 || set.rpe > 10)) {
        errors.push('RPE must be between 1 and 10');
      }
      // Validate HR zones
      const totalHRTime = (set.hrZone1 || 0) + (set.hrZone2 || 0) + (set.hrZone3 || 0);
      if (set.duration && totalHRTime > set.duration) {
        warnings.push('Total HR zone time exceeds exercise duration');
      }
      break;
      
    case 'flexibility':
      if (set.duration !== undefined && set.duration <= 0) {
        errors.push('Duration must be greater than 0');
      }
      if (set.intensity !== undefined && (set.intensity < 1 || set.intensity > 10)) {
        errors.push('Intensity must be between 1 and 10');
      }
      if (set.stretchType && set.stretchType.trim().length === 0) {
        errors.push('Stretch type cannot be empty');
      }
      break;
  }
  
  // General validations
  if (set.restTime !== undefined && set.restTime < 0) {
    errors.push('Rest time cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingRequiredStats: missingStats
  };
};

/**
 * Validates multiple sets for an exercise
 */
export const validateExerciseSets = (sets: Partial<ExerciseSet>[], exerciseType: ExerciseType): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  if (sets.length === 0) {
    allErrors.push('At least one set is required');
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }
  
  sets.forEach((set, index) => {
    const result = validateExerciseSet(set, exerciseType);
    result.errors.forEach(error => {
      allErrors.push(`Set ${index + 1}: ${error}`);
    });
    result.warnings.forEach(warning => {
      allWarnings.push(`Set ${index + 1}: ${warning}`);
    });
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * Get default set template for exercise type
 */
export const getDefaultSetForType = (exerciseType: ExerciseType): Partial<ExerciseSet> => {
  const config = getExerciseTypeConfig(exerciseType);
  const defaultSet: Partial<ExerciseSet> = {};
  
  // Set defaults based on required stats
  config.requiredStats.forEach(stat => {
    switch (stat) {
      case 'sets':
        defaultSet.sets = 1;
        break;
      case 'reps':
        defaultSet.reps = exerciseType === 'strength' ? 8 : 10;
        break;
      case 'weight':
        defaultSet.weight = 0;
        break;
      case 'rir':
        defaultSet.rir = 2;
        break;
      case 'rpe':
        defaultSet.rpe = 5;
        break;
      case 'duration':
        if (exerciseType === 'flexibility') {
          defaultSet.duration = 0.5; // 30 seconds in minutes
        } else if (exerciseType === 'endurance') {
          defaultSet.duration = 30; // 30 minutes default for running/cycling
        } else {
          defaultSet.duration = 60; // 60 minutes for team sports and other activities
        }
        break;
      case 'distance':
        defaultSet.distance = 5; // 5km default
        break;
      case 'intensity':
        defaultSet.intensity = 5;
        break;
      case 'stretchType':
        defaultSet.stretchType = 'Static Hold';
        break;
    }
  });
  
  return defaultSet;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (result: ValidationResult): string => {
  if (result.isValid) return '';
  
  let message = 'Please fix the following issues:\n';
  result.errors.forEach(error => {
    message += `• ${error}\n`;
  });
  
  if (result.warnings.length > 0) {
    message += '\nWarnings:\n';
    result.warnings.forEach(warning => {
      message += `• ${warning}\n`;
    });
  }
  
  return message.trim();
};
