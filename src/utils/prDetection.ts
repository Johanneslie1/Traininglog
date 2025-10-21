import { PersonalRecord, PRType } from '@/types/analytics';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { ExerciseSet } from '@/types/sets';
import { estimate1RM } from './volumeCalculations';

/**
 * Detect if a new PR was set for a specific exercise
 * @param currentExercise - The exercise to check
 * @param historicalExercises - Previous exercises of the same name
 * @param userId - User ID
 * @returns PersonalRecord if a new PR was detected, null otherwise
 */
export function detectPR(
  currentExercise: UnifiedExerciseData,
  historicalExercises: UnifiedExerciseData[],
  userId: string
): PersonalRecord | null {
  if (!currentExercise.sets || currentExercise.sets.length === 0) {
    return null;
  }

  // Get historical PRs
  const historicalPRs = getExercisePRs(currentExercise.exerciseName, historicalExercises, userId);
  
  // Check each set for potential PRs
  let newPR: PersonalRecord | null = null;
  
  for (const set of currentExercise.sets) {
    const weight = set.weight || 0;
    const reps = set.reps || 0;
    
    if (weight === 0 || reps === 0) continue;
    
    // Check 1RM
    const estimated1RM = estimate1RM(weight, reps);
    const current1RM = historicalPRs.get(PRType.ONE_REP_MAX);
    
    if (!current1RM || estimated1RM > current1RM.value) {
      newPR = {
        id: `${currentExercise.id}-1rm`,
        userId,
        exerciseName: currentExercise.exerciseName,
        exerciseId: currentExercise.id,
        recordType: PRType.ONE_REP_MAX,
        value: estimated1RM,
        weight,
        reps,
        date: currentExercise.timestamp,
        previousRecord: current1RM,
        improvement: current1RM ? Math.round(((estimated1RM - current1RM.value) / current1RM.value) * 100 * 10) / 10 : 100,
        isNew: true
      };
      break; // Return first PR found
    }
    
    // Check specific rep maxes
    if (reps === 3) {
      const current3RM = historicalPRs.get(PRType.THREE_REP_MAX);
      if (!current3RM || weight > current3RM.value) {
        newPR = {
          id: `${currentExercise.id}-3rm`,
          userId,
          exerciseName: currentExercise.exerciseName,
          recordType: PRType.THREE_REP_MAX,
          value: weight,
          weight,
          reps: 3,
          date: currentExercise.timestamp,
          previousRecord: current3RM,
          improvement: current3RM ? Math.round(((weight - current3RM.value) / current3RM.value) * 100 * 10) / 10 : 100,
          isNew: true
        };
        break;
      }
    }
    
    if (reps === 5) {
      const current5RM = historicalPRs.get(PRType.FIVE_REP_MAX);
      if (!current5RM || weight > current5RM.value) {
        newPR = {
          id: `${currentExercise.id}-5rm`,
          userId,
          exerciseName: currentExercise.exerciseName,
          recordType: PRType.FIVE_REP_MAX,
          value: weight,
          weight,
          reps: 5,
          date: currentExercise.timestamp,
          previousRecord: current5RM,
          improvement: current5RM ? Math.round(((weight - current5RM.value) / current5RM.value) * 100 * 10) / 10 : 100,
          isNew: true
        };
        break;
      }
    }
    
    if (reps === 10) {
      const current10RM = historicalPRs.get(PRType.TEN_REP_MAX);
      if (!current10RM || weight > current10RM.value) {
        newPR = {
          id: `${currentExercise.id}-10rm`,
          userId,
          exerciseName: currentExercise.exerciseName,
          recordType: PRType.TEN_REP_MAX,
          value: weight,
          weight,
          reps: 10,
          date: currentExercise.timestamp,
          previousRecord: current10RM,
          improvement: current10RM ? Math.round(((weight - current10RM.value) / current10RM.value) * 100 * 10) / 10 : 100,
          isNew: true
        };
        break;
      }
    }
  }
  
  return newPR;
}

/**
 * Get all current PRs for a specific exercise
 * @param exerciseName - Name of the exercise
 * @param exercises - All historical exercises
 * @param userId - User ID
 * @returns Map of PR types to PersonalRecord
 */
export function getExercisePRs(
  exerciseName: string,
  exercises: UnifiedExerciseData[],
  userId: string
): Map<PRType, PersonalRecord> {
  const prs = new Map<PRType, PersonalRecord>();
  
  // Filter exercises by name
  const exerciseHistory = exercises.filter(
    ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );
  
  let best1RM = 0;
  let best3RM = 0;
  let best5RM = 0;
  let best10RM = 0;
  let bestVolume = 0;
  let bestWeight = 0;
  let bestReps = 0;
  
  let best1RMExercise: UnifiedExerciseData | null = null;
  let best3RMExercise: UnifiedExerciseData | null = null;
  let best5RMExercise: UnifiedExerciseData | null = null;
  let best10RMExercise: UnifiedExerciseData | null = null;
  let bestVolumeExercise: UnifiedExerciseData | null = null;
  let bestWeightExercise: UnifiedExerciseData | null = null;
  let bestRepsExercise: UnifiedExerciseData | null = null;
  
  let best1RMSet: ExerciseSet | null = null;
  let best3RMSet: ExerciseSet | null = null;
  let best5RMSet: ExerciseSet | null = null;
  let best10RMSet: ExerciseSet | null = null;
  let bestWeightSet: ExerciseSet | null = null;
  let bestRepsSet: ExerciseSet | null = null;
  
  // Scan all exercises for best performances
  for (const exercise of exerciseHistory) {
    if (!exercise.sets || exercise.sets.length === 0) continue;
    
    // Calculate volume for this exercise
    const volume = exercise.sets.reduce((sum, set) => {
      return sum + (set.weight || 0) * (set.reps || 0);
    }, 0);
    
    if (volume > bestVolume) {
      bestVolume = volume;
      bestVolumeExercise = exercise;
    }
    
    // Check each set
    for (const set of exercise.sets) {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      
      if (weight === 0 || reps === 0) continue;
      
      // Check 1RM
      const estimated1RM = estimate1RM(weight, reps);
      if (estimated1RM > best1RM) {
        best1RM = estimated1RM;
        best1RMExercise = exercise;
        best1RMSet = set;
      }
      
      // Check specific rep ranges
      if (reps === 3 && weight > best3RM) {
        best3RM = weight;
        best3RMExercise = exercise;
        best3RMSet = set;
      }
      
      if (reps === 5 && weight > best5RM) {
        best5RM = weight;
        best5RMExercise = exercise;
        best5RMSet = set;
      }
      
      if (reps === 10 && weight > best10RM) {
        best10RM = weight;
        best10RMExercise = exercise;
        best10RMSet = set;
      }
      
      // Check max weight
      if (weight > bestWeight) {
        bestWeight = weight;
        bestWeightExercise = exercise;
        bestWeightSet = set;
      }
      
      // Check max reps (at same weight or higher)
      if (weight >= bestWeight && reps > bestReps) {
        bestReps = reps;
        bestRepsExercise = exercise;
        bestRepsSet = set;
      }
    }
  }
  
  // Create PR records
  if (best1RMExercise && best1RMSet) {
    prs.set(PRType.ONE_REP_MAX, {
      id: `${best1RMExercise.id}-1rm`,
      userId,
      exerciseName,
      exerciseId: best1RMExercise.id,
      recordType: PRType.ONE_REP_MAX,
      value: best1RM,
      weight: best1RMSet.weight,
      reps: best1RMSet.reps,
      date: best1RMExercise.timestamp,
      isNew: isRecent(best1RMExercise.timestamp)
    });
  }
  
  if (best3RMExercise && best3RMSet) {
    prs.set(PRType.THREE_REP_MAX, {
      id: `${best3RMExercise.id}-3rm`,
      userId,
      exerciseName,
      recordType: PRType.THREE_REP_MAX,
      value: best3RM,
      weight: best3RMSet.weight,
      reps: 3,
      date: best3RMExercise.timestamp,
      isNew: isRecent(best3RMExercise.timestamp)
    });
  }
  
  if (best5RMExercise && best5RMSet) {
    prs.set(PRType.FIVE_REP_MAX, {
      id: `${best5RMExercise.id}-5rm`,
      userId,
      exerciseName,
      recordType: PRType.FIVE_REP_MAX,
      value: best5RM,
      weight: best5RMSet.weight,
      reps: 5,
      date: best5RMExercise.timestamp,
      isNew: isRecent(best5RMExercise.timestamp)
    });
  }
  
  if (best10RMExercise && best10RMSet) {
    prs.set(PRType.TEN_REP_MAX, {
      id: `${best10RMExercise.id}-10rm`,
      userId,
      exerciseName,
      recordType: PRType.TEN_REP_MAX,
      value: best10RM,
      weight: best10RMSet.weight,
      reps: 10,
      date: best10RMExercise.timestamp,
      isNew: isRecent(best10RMExercise.timestamp)
    });
  }
  
  if (bestVolumeExercise) {
    prs.set(PRType.MAX_VOLUME, {
      id: `${bestVolumeExercise.id}-volume`,
      userId,
      exerciseName,
      recordType: PRType.MAX_VOLUME,
      value: bestVolume,
      volume: bestVolume,
      date: bestVolumeExercise.timestamp,
      isNew: isRecent(bestVolumeExercise.timestamp)
    });
  }
  
  if (bestWeightExercise && bestWeightSet) {
    prs.set(PRType.MAX_WEIGHT, {
      id: `${bestWeightExercise.id}-weight`,
      userId,
      exerciseName,
      recordType: PRType.MAX_WEIGHT,
      value: bestWeight,
      weight: bestWeight,
      reps: bestWeightSet.reps,
      date: bestWeightExercise.timestamp,
      isNew: isRecent(bestWeightExercise.timestamp)
    });
  }
  
  if (bestRepsExercise && bestRepsSet) {
    prs.set(PRType.MAX_REPS, {
      id: `${bestRepsExercise.id}-reps`,
      userId,
      exerciseName,
      recordType: PRType.MAX_REPS,
      value: bestReps,
      weight: bestRepsSet.weight,
      reps: bestReps,
      date: bestRepsExercise.timestamp,
      isNew: isRecent(bestRepsExercise.timestamp)
    });
  }
  
  return prs;
}

/**
 * Compare two records and calculate improvement
 * @param current - Current record
 * @param previous - Previous record
 * @returns Percentage improvement
 */
export function compareRecords(current: PersonalRecord, previous: PersonalRecord): number {
  if (previous.value === 0) return 0;
  return Math.round(((current.value - previous.value) / previous.value) * 100 * 10) / 10;
}

/**
 * Check if a date is recent (within 7 days)
 * @param date - Date to check
 * @returns True if within last 7 days
 */
function isRecent(date: Date): boolean {
  const now = new Date();
  const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
}

/**
 * Get all PRs grouped by exercise
 * @param exercises - All exercises
 * @param userId - User ID
 * @returns Map of exercise names to their PRs
 */
export function getAllPRsByExercise(
  exercises: UnifiedExerciseData[],
  userId: string
): Map<string, Map<PRType, PersonalRecord>> {
  const exerciseNames = new Set(exercises.map(ex => ex.exerciseName));
  const allPRs = new Map<string, Map<PRType, PersonalRecord>>();
  
  exerciseNames.forEach(name => {
    const prs = getExercisePRs(name, exercises, userId);
    if (prs.size > 0) {
      allPRs.set(name, prs);
    }
  });
  
  return allPRs;
}

/**
 * Get recent PRs (within specified days)
 * @param exercises - All exercises
 * @param userId - User ID
 * @param days - Number of days to look back (default: 7)
 * @returns Array of recent PRs
 */
export function getRecentPRs(
  exercises: UnifiedExerciseData[],
  userId: string,
  days: number = 7
): PersonalRecord[] {
  const allPRs = getAllPRsByExercise(exercises, userId);
  const recentPRs: PersonalRecord[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  allPRs.forEach(prMap => {
    prMap.forEach(pr => {
      if (pr.date >= cutoffDate) {
        recentPRs.push(pr);
      }
    });
  });
  
  return recentPRs.sort((a, b) => b.date.getTime() - a.date.getTime());
}
