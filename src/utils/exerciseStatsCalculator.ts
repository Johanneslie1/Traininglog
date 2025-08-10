import { ExerciseSet } from '../types/sets';
import { ExerciseLog } from '../types/exercise';
import { ExerciseType } from '../config/exerciseTypes';

export interface ExerciseStats {
  totalSets: number;
  totalVolume?: number; // For strength exercises (weight * reps)
  totalDistance?: number; // For endurance exercises
  totalDuration?: number; // For time-based exercises
  averageRPE?: number;
  averageRIR?: number;
  maxWeight?: number;
  maxReps?: number;
  totalHRZoneTime?: {
    zone1: number;
    zone2: number;
    zone3: number;
  };
  strengthMetrics?: {
    oneRepMax?: number; // Estimated 1RM
    volumeLoad: number; // Total weight moved
    averageIntensity: number; // Average weight used
  };
  enduranceMetrics?: {
    totalTime: number;
    totalDistance: number;
    averagePace?: number; // minutes per km
    hrDistribution: {
      zone1Percentage: number;
      zone2Percentage: number;
      zone3Percentage: number;
    };
  };
}

/**
 * Calculate comprehensive stats for a single exercise session
 */
export const calculateExerciseSessionStats = (sets: ExerciseSet[], exerciseType: ExerciseType): ExerciseStats => {
  const stats: ExerciseStats = {
    totalSets: sets.length
  };
  
  if (sets.length === 0) return stats;
  
  // Calculate basic stats
  const rpeValues = sets.filter(set => set.rpe !== undefined).map(set => set.rpe!);
  const rirValues = sets.filter(set => set.rir !== undefined).map(set => set.rir!);
  
  if (rpeValues.length > 0) {
    stats.averageRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  }
  
  if (rirValues.length > 0) {
    stats.averageRIR = rirValues.reduce((sum, rir) => sum + rir, 0) / rirValues.length;
  }
  
  // Type-specific calculations
  switch (exerciseType) {
    case 'strength':
      stats.strengthMetrics = calculateStrengthMetrics(sets);
      stats.totalVolume = stats.strengthMetrics.volumeLoad;
      stats.maxWeight = Math.max(...sets.filter(s => s.weight).map(s => s.weight!));
      stats.maxReps = Math.max(...sets.filter(s => s.reps).map(s => s.reps!));
      break;
      
    case 'endurance':
    case 'teamSports':
    case 'other':
      stats.enduranceMetrics = calculateEnduranceMetrics(sets);
      stats.totalDistance = stats.enduranceMetrics.totalDistance;
      stats.totalDuration = stats.enduranceMetrics.totalTime;
      stats.totalHRZoneTime = {
        zone1: sets.reduce((sum, set) => sum + (set.hrZone1 || 0), 0),
        zone2: sets.reduce((sum, set) => sum + (set.hrZone2 || 0), 0),
        zone3: sets.reduce((sum, set) => sum + (set.hrZone3 || 0), 0)
      };
      break;
      
    case 'flexibility':
      stats.totalDuration = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
      break;
      
    case 'plyometrics':
      stats.maxReps = Math.max(...sets.filter(s => s.reps).map(s => s.reps!));
      const heights = sets.filter(s => s.height).map(s => s.height!);
      if (heights.length > 0) {
        // Store max height in totalVolume field for plyometrics
        stats.totalVolume = Math.max(...heights);
      }
      break;
  }
  
  return stats;
};

/**
 * Calculate strength-specific metrics
 */
export const calculateStrengthMetrics = (sets: ExerciseSet[]): NonNullable<ExerciseStats['strengthMetrics']> => {
  const validSets = sets.filter(set => set.weight !== undefined && set.reps !== undefined);
  
  if (validSets.length === 0) {
    return {
      volumeLoad: 0,
      averageIntensity: 0
    };
  }
  
  // Calculate volume load (weight * reps for all sets)
  const volumeLoad = validSets.reduce((total, set) => {
    return total + (set.weight! * set.reps!);
  }, 0);
  
  // Calculate average intensity (average weight used)
  const totalWeight = validSets.reduce((sum, set) => sum + set.weight!, 0);
  const averageIntensity = totalWeight / validSets.length;
  
  // Estimate 1RM using Epley formula (weight * (1 + reps/30))
  const estimatedMaxes = validSets.map(set => {
    return set.weight! * (1 + set.reps! / 30);
  });
  const oneRepMax = Math.max(...estimatedMaxes);
  
  return {
    volumeLoad,
    averageIntensity,
    oneRepMax
  };
};

/**
 * Calculate endurance-specific metrics
 */
export const calculateEnduranceMetrics = (sets: ExerciseSet[]): NonNullable<ExerciseStats['enduranceMetrics']> => {
  const totalTime = sets.reduce((sum, set) => sum + (set.duration || 0), 0);
  const totalDistance = sets.reduce((sum, set) => sum + (set.distance || 0), 0);
  
  // Calculate average pace (minutes per km)
  let averagePace: number | undefined;
  if (totalDistance > 0 && totalTime > 0) {
    averagePace = totalTime / totalDistance;
  }
  
  // Calculate HR zone distribution
  const totalHRTime = sets.reduce((sum, set) => {
    return sum + (set.hrZone1 || 0) + (set.hrZone2 || 0) + (set.hrZone3 || 0);
  }, 0);
  
  const zone1Time = sets.reduce((sum, set) => sum + (set.hrZone1 || 0), 0);
  const zone2Time = sets.reduce((sum, set) => sum + (set.hrZone2 || 0), 0);
  const zone3Time = sets.reduce((sum, set) => sum + (set.hrZone3 || 0), 0);
  
  const hrDistribution = {
    zone1Percentage: totalHRTime > 0 ? (zone1Time / totalHRTime) * 100 : 0,
    zone2Percentage: totalHRTime > 0 ? (zone2Time / totalHRTime) * 100 : 0,
    zone3Percentage: totalHRTime > 0 ? (zone3Time / totalHRTime) * 100 : 0
  };
  
  return {
    totalTime,
    totalDistance,
    averagePace,
    hrDistribution
  };
};

/**
 * Calculate aggregate stats across multiple exercise logs
 */
export const calculateAggregateStats = (exerciseLogs: ExerciseLog[]): Map<string, ExerciseStats> => {
  const statsMap = new Map<string, ExerciseStats>();
  
  exerciseLogs.forEach(log => {
    const exerciseType = (log.exerciseType || 'strength') as ExerciseType; // Default to strength for backward compatibility
    const existingStats = statsMap.get(log.exerciseName);
    const sessionStats = calculateExerciseSessionStats(log.sets, exerciseType);
    
    if (existingStats) {
      // Aggregate with existing stats
      const aggregated: ExerciseStats = {
        totalSets: existingStats.totalSets + sessionStats.totalSets,
        totalVolume: (existingStats.totalVolume || 0) + (sessionStats.totalVolume || 0),
        totalDistance: (existingStats.totalDistance || 0) + (sessionStats.totalDistance || 0),
        totalDuration: (existingStats.totalDuration || 0) + (sessionStats.totalDuration || 0),
        maxWeight: Math.max(existingStats.maxWeight || 0, sessionStats.maxWeight || 0),
        maxReps: Math.max(existingStats.maxReps || 0, sessionStats.maxReps || 0)
      };
      
      // Average RPE and RIR (weighted by number of sets)
      if (existingStats.averageRPE && sessionStats.averageRPE) {
        const totalSets = existingStats.totalSets + sessionStats.totalSets;
        aggregated.averageRPE = (
          (existingStats.averageRPE * existingStats.totalSets) +
          (sessionStats.averageRPE * sessionStats.totalSets)
        ) / totalSets;
      } else {
        aggregated.averageRPE = existingStats.averageRPE || sessionStats.averageRPE;
      }
      
      if (existingStats.averageRIR && sessionStats.averageRIR) {
        const totalSets = existingStats.totalSets + sessionStats.totalSets;
        aggregated.averageRIR = (
          (existingStats.averageRIR * existingStats.totalSets) +
          (sessionStats.averageRIR * sessionStats.totalSets)
        ) / totalSets;
      } else {
        aggregated.averageRIR = existingStats.averageRIR || sessionStats.averageRIR;
      }
      
      // Aggregate HR zone time
      if (existingStats.totalHRZoneTime && sessionStats.totalHRZoneTime) {
        aggregated.totalHRZoneTime = {
          zone1: existingStats.totalHRZoneTime.zone1 + sessionStats.totalHRZoneTime.zone1,
          zone2: existingStats.totalHRZoneTime.zone2 + sessionStats.totalHRZoneTime.zone2,
          zone3: existingStats.totalHRZoneTime.zone3 + sessionStats.totalHRZoneTime.zone3
        };
      } else {
        aggregated.totalHRZoneTime = existingStats.totalHRZoneTime || sessionStats.totalHRZoneTime;
      }
      
      statsMap.set(log.exerciseName, aggregated);
    } else {
      statsMap.set(log.exerciseName, sessionStats);
    }
  });
  
  return statsMap;
};

/**
 * Format stats for display
 */
export const formatStatsForDisplay = (stats: ExerciseStats, exerciseType: ExerciseType): Record<string, string> => {
  const formatted: Record<string, string> = {};
  
  formatted['Total Sets'] = stats.totalSets.toString();
  
  switch (exerciseType) {
    case 'strength':
      if (stats.totalVolume) {
        formatted['Total Volume'] = `${stats.totalVolume.toLocaleString()} kg`;
      }
      if (stats.maxWeight) {
        formatted['Max Weight'] = `${stats.maxWeight} kg`;
      }
      if (stats.averageRIR !== undefined) {
        formatted['Average RIR'] = stats.averageRIR.toFixed(1);
      }
      if (stats.strengthMetrics?.oneRepMax) {
        formatted['Est. 1RM'] = `${stats.strengthMetrics.oneRepMax.toFixed(1)} kg`;
      }
      break;
      
    case 'endurance':
    case 'teamSports':
    case 'other':
      if (stats.totalDistance) {
        formatted['Total Distance'] = `${stats.totalDistance.toFixed(2)} km`;
      }
      if (stats.totalDuration) {
        formatted['Total Time'] = `${Math.floor(stats.totalDuration / 60)}h ${(stats.totalDuration % 60).toFixed(0)}m`;
      }
      if (stats.enduranceMetrics?.averagePace) {
        const pace = stats.enduranceMetrics.averagePace;
        const minutes = Math.floor(pace);
        const seconds = Math.floor((pace - minutes) * 60);
        formatted['Average Pace'] = `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
      }
      break;
      
    case 'flexibility':
      if (stats.totalDuration) {
        formatted['Total Time'] = `${stats.totalDuration.toFixed(0)} minutes`;
      }
      break;
      
    case 'plyometrics':
      if (stats.maxReps) {
        formatted['Max Reps'] = stats.maxReps.toString();
      }
      if (stats.totalVolume) {
        formatted['Max Height'] = `${stats.totalVolume} cm`;
      }
      break;
  }
  
  if (stats.averageRPE !== undefined) {
    formatted['Average RPE'] = stats.averageRPE.toFixed(1);
  }
  
  return formatted;
};
