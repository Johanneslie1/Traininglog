import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { Exercise, MuscleGroup } from '@/types/exercise';
import {
  ActivityAnalytics,
  VolumeDataPoint,
  PersonalRecord,
  MuscleVolumeData,
  MuscleGroupAnalytics,
  MuscleGroupTrainingStatus,
  TrainingFrequencyData,
  IntensityLevel,
  AnalyticsFilters,
  AnalyticsSummary,
  TrainingStreak,
  PeriodComparison
} from '@/types/analytics';
import { ActivityType } from '@/types/activityTypes';
import { SrpeLog } from '@/types/srpe';
import {
  calculateTotalVolume,
  calculateAverageWeight,
  calculateAverageReps
} from '@/utils/volumeCalculations';
import { getAllPRsByExercise } from '@/utils/prDetection';
import { MUSCLE_COLORS } from '@/utils/chartDataFormatters';

/**
 * Analytics Service
 * Provides data processing and calculations for analytics features
 */
export class AnalyticsService {
  private static excludeWarmups(exercises: UnifiedExerciseData[]): UnifiedExerciseData[] {
    return exercises.filter((exercise) => !exercise.isWarmup);
  }

  private static countWorkouts(exercises: UnifiedExerciseData[]): number {
    if (exercises.length === 0) return 0;

    const sessionIdSet = new Set(
      exercises
        .map((exercise) => exercise.sessionId)
        .filter((sessionId): sessionId is string => Boolean(sessionId))
    );

    const legacyDateSet = new Set(
      exercises
        .filter((exercise) => !exercise.sessionId)
        .map((exercise) => exercise.timestamp.toISOString().split('T')[0])
    );

    return sessionIdSet.size + legacyDateSet.size;
  }

  private static calculatePercentageChange(current: number, previous: number): number {
    if (previous <= 0) return 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  private static formatActivityLabel(activityType?: ActivityType): string {
    switch (activityType) {
      case ActivityType.RESISTANCE:
        return 'Resistance';
      case ActivityType.SPORT:
        return 'Sport';
      case ActivityType.ENDURANCE:
        return 'Endurance';
      case ActivityType.SPEED_AGILITY:
        return 'Speed & agility';
      case ActivityType.STRETCHING:
        return 'Mobility';
      case ActivityType.OTHER:
        return 'Other';
      default:
        return 'Uncategorised';
    }
  }

  private static normaliseDurationMinutes(value?: number): number {
    if (!value || value <= 0) return 0;
    // Activity logs are mostly minutes, but some migrated rows store seconds.
    return value > 240 ? Math.round((value / 60) * 10) / 10 : value;
  }

  /**
   * Fetch exercises within a date range with optional filters
   * @param userId - User ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param filters - Optional filters to apply
   * @returns Array of exercises
   */
  static async getExercisesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    filters?: Partial<AnalyticsFilters>
  ): Promise<UnifiedExerciseData[]> {
    const allExercises: UnifiedExerciseData[] = [];
    
    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    while (currentDate <= end) {
      try {
        const dayExercises = await getAllExercisesByDate(new Date(currentDate), userId);
        allExercises.push(...dayExercises);
      } catch (error) {
        console.error(`Error loading exercises for ${currentDate.toISOString()}:`, error);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Apply filters
    let filtered = allExercises;
    
    if (filters?.exercises && filters.exercises.length > 0) {
      filtered = filtered.filter(ex =>
        filters.exercises!.some(name => 
          ex.exerciseName.toLowerCase() === name.toLowerCase()
        )
      );
    }
    
    if (filters?.activityTypes && filters.activityTypes.length > 0) {
      filtered = filtered.filter(ex =>
        ex.activityType && filters.activityTypes!.includes(ex.activityType)
      );
    }
    
    return this.excludeWarmups(filtered);
  }

  /**
   * Calculate total volume for an exercise
   * @param exercise - Exercise data
   * @returns Total volume
   */
  static calculateExerciseVolume(exercise: UnifiedExerciseData): number {
    if (!exercise.sets || exercise.sets.length === 0) return 0;
    return calculateTotalVolume(exercise.sets);
  }

  /**
   * Calculate daily volume data points
   * @param exercises - Array of exercises
   * @param groupBy - Group by 'exercise' or 'day'
   * @returns Array of volume data points
   */
  static calculateDailyVolumes(
    exercises: UnifiedExerciseData[],
    groupBy: 'exercise' | 'day' = 'exercise'
  ): VolumeDataPoint[] {
    const filteredExercises = this.excludeWarmups(exercises);

    if (groupBy === 'exercise') {
      // Group by exercise name
      const exerciseMap = new Map<string, UnifiedExerciseData[]>();
      
      filteredExercises.forEach(ex => {
        const existing = exerciseMap.get(ex.exerciseName) || [];
        exerciseMap.set(ex.exerciseName, [...existing, ex]);
      });
      
      const dataPoints: VolumeDataPoint[] = [];
      
      exerciseMap.forEach((exList, exerciseName) => {
        // Group by date within each exercise
        const dateMap = new Map<string, UnifiedExerciseData[]>();
        
        exList.forEach(ex => {
          const dateStr = ex.timestamp.toISOString().split('T')[0];
          const existing = dateMap.get(dateStr) || [];
          dateMap.set(dateStr, [...existing, ex]);
        });
        
        dateMap.forEach((dateExercises, date) => {
          const totalVolume = dateExercises.reduce(
            (sum, ex) => sum + this.calculateExerciseVolume(ex),
            0
          );
          
          const totalSets = dateExercises.reduce(
            (sum, ex) => sum + (ex.sets?.length || 0),
            0
          );
          
          const allSets = dateExercises.flatMap(ex => ex.sets || []);
          const avgWeight = allSets.length > 0 ? calculateAverageWeight(allSets) : 0;
          const avgReps = allSets.length > 0 ? calculateAverageReps(allSets) : 0;
          
          dataPoints.push({
            date,
            volume: totalVolume,
            totalSets,
            averageWeight: avgWeight,
            averageReps: avgReps,
            exerciseName
          });
        });
      });
      
      return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // Group by day only
      const dateMap = new Map<string, UnifiedExerciseData[]>();
      
      filteredExercises.forEach(ex => {
        const dateStr = ex.timestamp.toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || [];
        dateMap.set(dateStr, [...existing, ex]);
      });
      
      const dataPoints: VolumeDataPoint[] = [];
      
      dateMap.forEach((dateExercises, date) => {
        const totalVolume = dateExercises.reduce(
          (sum, ex) => sum + this.calculateExerciseVolume(ex),
          0
        );
        
        const totalSets = dateExercises.reduce(
          (sum, ex) => sum + (ex.sets?.length || 0),
          0
        );
        
        const allSets = dateExercises.flatMap(ex => ex.sets || []);
        const avgWeight = allSets.length > 0 ? calculateAverageWeight(allSets) : 0;
        const avgReps = allSets.length > 0 ? calculateAverageReps(allSets) : 0;
        
        dataPoints.push({
          date,
          volume: totalVolume,
          totalSets,
          averageWeight: avgWeight,
          averageReps: avgReps,
          exerciseName: 'All Exercises',
          exerciseCount: new Set(dateExercises.map(ex => ex.exerciseName)).size
        });
      });
      
      return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  static calculateActivityAnalytics(
    currentExercises: UnifiedExerciseData[],
    previousExercises: UnifiedExerciseData[] = [],
    currentSrpeLogs: SrpeLog[] = [],
    previousSrpeLogs: SrpeLog[] = []
  ): ActivityAnalytics[] {
    type Accumulator = Omit<ActivityAnalytics, 'loadChange' | 'topExercises'> & {
      rpeTotal: number;
      rpeCount: number;
      exerciseLoads: Map<string, number>;
    };

    const build = (exercises: UnifiedExerciseData[], srpeLogs: SrpeLog[]): Map<string, Accumulator> => {
      const map = new Map<string, Accumulator>();

      const getOrCreate = (
        activityKey: string,
        label: string,
        activityType?: ActivityType
      ): Accumulator => {
        if (!map.has(activityKey)) {
          map.set(activityKey, {
            activityKey,
            activityType,
            label,
            sessionCount: 0,
            exerciseCount: 0,
            totalLoad: 0,
            totalVolume: 0,
            totalSets: 0,
            totalReps: 0,
            totalDurationMinutes: 0,
            totalDistanceMeters: 0,
            averageRpe: 0,
            rpeTotal: 0,
            rpeCount: 0,
            exerciseLoads: new Map<string, number>(),
          });
        }
        return map.get(activityKey)!;
      };

      const filteredExercises = this.excludeWarmups(exercises);
      const sessionKeysByActivity = new Map<string, Set<string>>();

      filteredExercises.forEach((exercise) => {
        const activityType = exercise.activityType || ActivityType.RESISTANCE;
        const activityKey = activityType;
        const acc = getOrCreate(activityKey, this.formatActivityLabel(activityType), activityType);
        const sets = exercise.sets || [];
        const volume = this.calculateExerciseVolume(exercise);
        const sessionKey = exercise.sessionId || `${exercise.timestamp.toISOString().split('T')[0]}:${exercise.exerciseName}`;
        const sessionKeys = sessionKeysByActivity.get(activityKey) || new Set<string>();
        sessionKeys.add(sessionKey);
        sessionKeysByActivity.set(activityKey, sessionKeys);

        acc.exerciseCount += 1;
        acc.totalVolume += volume;
        acc.totalSets += sets.length;

        sets.forEach((set) => {
          acc.totalReps += set.reps || 0;
          acc.totalDurationMinutes += this.normaliseDurationMinutes(set.duration);
          acc.totalDistanceMeters += set.distance || 0;

          const effort = set.rpe || set.intensity || 0;
          if (effort > 0) {
            acc.rpeTotal += effort;
            acc.rpeCount += 1;
          }
        });

        const averageEffort = acc.rpeCount > 0 ? acc.rpeTotal / acc.rpeCount : 0;
        const durationLoad = acc.totalDurationMinutes > 0 && averageEffort > 0
          ? acc.totalDurationMinutes * averageEffort
          : 0;
        const repLoad = acc.totalReps > 0 && averageEffort > 0 ? acc.totalReps * averageEffort : 0;

        acc.totalLoad = activityType === ActivityType.RESISTANCE
          ? acc.totalVolume
          : Math.round(Math.max(durationLoad, repLoad, acc.totalVolume) * 10) / 10;
        acc.exerciseLoads.set(
          exercise.exerciseName,
          (acc.exerciseLoads.get(exercise.exerciseName) || 0) + Math.max(volume, sets.length)
        );
      });

      srpeLogs.forEach((log) => {
        const acc = getOrCreate('sportsLoad', 'Sports load', ActivityType.SPORT);
        acc.sessionCount += 1;
        acc.exerciseCount += 1;
        acc.totalDurationMinutes += log.durationMinutes || 0;
        acc.totalLoad += log.sessionLoad || 0;
        acc.rpeTotal += log.rpe || 0;
        acc.rpeCount += log.rpe ? 1 : 0;
        acc.exerciseLoads.set(log.sportName || 'Sports load', (acc.exerciseLoads.get(log.sportName || 'Sports load') || 0) + (log.sessionLoad || 0));
      });

      sessionKeysByActivity.forEach((keys, activityKey) => {
        const acc = map.get(activityKey);
        if (acc) acc.sessionCount = keys.size;
      });

      return map;
    };

    const current = build(currentExercises, currentSrpeLogs);
    const previous = build(previousExercises, previousSrpeLogs);

    return Array.from(current.values())
      .map((acc) => {
        const previousLoad = previous.get(acc.activityKey)?.totalLoad || 0;
        const topExercises = Array.from(acc.exerciseLoads.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        return {
          activityKey: acc.activityKey,
          activityType: acc.activityType,
          label: acc.label,
          sessionCount: acc.sessionCount,
          exerciseCount: acc.exerciseCount,
          totalLoad: Math.round(acc.totalLoad),
          totalVolume: Math.round(acc.totalVolume),
          totalSets: acc.totalSets,
          totalReps: acc.totalReps,
          totalDurationMinutes: Math.round(acc.totalDurationMinutes),
          totalDistanceMeters: Math.round(acc.totalDistanceMeters),
          averageRpe: acc.rpeCount > 0 ? Math.round((acc.rpeTotal / acc.rpeCount) * 10) / 10 : 0,
          loadChange: this.calculatePercentageChange(acc.totalLoad, previousLoad),
          topExercises,
        };
      })
      .sort((a, b) => b.totalLoad - a.totalLoad || b.sessionCount - a.sessionCount);
  }

  /**
   * Detect personal records from exercise history
   * @param exercises - Array of exercises
   * @param userId - User ID
   * @returns Array of personal records
   */
  static detectPersonalRecords(
    exercises: UnifiedExerciseData[],
    userId: string
  ): PersonalRecord[] {
    const filteredExercises = this.excludeWarmups(exercises);
    const records: PersonalRecord[] = [];
    
    // Get all PRs by exercise
    const allPRs = getAllPRsByExercise(filteredExercises, userId);
    
    // Flatten to array
    allPRs.forEach(prMap => {
      prMap.forEach(pr => {
        records.push(pr);
      });
    });
    
    // Sort by date (most recent first)
    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Calculate muscle group volume distribution
   * @param exercises - Array of exercises
   * @param exerciseDatabase - Exercise database for muscle group mapping
   * @returns Array of muscle volume data
   */
  static calculateMuscleVolumes(
    exercises: UnifiedExerciseData[],
    exerciseDatabase: Exercise[]
  ): MuscleVolumeData[] {
    const filteredExercises = this.excludeWarmups(exercises);
    const muscleVolumeMap = new Map<MuscleGroup, number>();
    const muscleSetsMap = new Map<MuscleGroup, number>();
    const muscleExercisesMap = new Map<MuscleGroup, Set<string>>();
    
    filteredExercises.forEach(loggedEx => {
      // Find exercise in database to get muscle groups
      const dbExercise = exerciseDatabase.find(
        db => db.name.toLowerCase() === loggedEx.exerciseName.toLowerCase()
      );
      
      if (!dbExercise || !dbExercise.primaryMuscles) return;
      
      const volume = this.calculateExerciseVolume(loggedEx);
      const sets = loggedEx.sets?.length || 0;
      
      // Primary muscles get full volume
      dbExercise.primaryMuscles.forEach(muscle => {
        const current = muscleVolumeMap.get(muscle) || 0;
        muscleVolumeMap.set(muscle, current + volume);
        
        const currentSets = muscleSetsMap.get(muscle) || 0;
        muscleSetsMap.set(muscle, currentSets + sets);
        
        const exercises = muscleExercisesMap.get(muscle) || new Set();
        exercises.add(loggedEx.exerciseName);
        muscleExercisesMap.set(muscle, exercises);
      });
      
      // Secondary muscles get 50% volume
      if (dbExercise.secondaryMuscles) {
        dbExercise.secondaryMuscles.forEach(muscle => {
          const current = muscleVolumeMap.get(muscle) || 0;
          muscleVolumeMap.set(muscle, current + volume * 0.5);
          
          const currentSets = muscleSetsMap.get(muscle) || 0;
          muscleSetsMap.set(muscle, currentSets + sets * 0.5);
          
          const exercises = muscleExercisesMap.get(muscle) || new Set();
          exercises.add(loggedEx.exerciseName);
          muscleExercisesMap.set(muscle, exercises);
        });
      }
    });
    
    // Calculate total volume for percentages
    const totalVolume = Array.from(muscleVolumeMap.values()).reduce((a, b) => a + b, 0);
    
    // Convert to array
    const muscleData: MuscleVolumeData[] = [];
    muscleVolumeMap.forEach((volume, muscle) => {
      muscleData.push({
        muscleGroup: muscle,
        totalVolume: Math.round(volume),
        totalSets: Math.round(muscleSetsMap.get(muscle) || 0),
        exerciseCount: muscleExercisesMap.get(muscle)?.size || 0,
        percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0,
        color: this.getMuscleColor(muscle)
      });
    });
    
    return muscleData.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  static calculateMuscleGroupAnalytics(
    currentExercises: UnifiedExerciseData[],
    previousExercises: UnifiedExerciseData[],
    exerciseDatabase: Exercise[]
  ): MuscleGroupAnalytics[] {
    type MuscleAccumulator = {
      volume: number;
      sets: number;
      exercises: Set<string>;
      exerciseLoads: Map<string, number>;
      activityTypes: Set<ActivityType>;
      rpeTotal: number;
      rpeCount: number;
    };

    const createAccumulator = (): MuscleAccumulator => ({
      volume: 0,
      sets: 0,
      exercises: new Set<string>(),
      exerciseLoads: new Map<string, number>(),
      activityTypes: new Set<ActivityType>(),
      rpeTotal: 0,
      rpeCount: 0,
    });

    const build = (exercises: UnifiedExerciseData[]): Map<MuscleGroup, MuscleAccumulator> => {
      const map = new Map<MuscleGroup, MuscleAccumulator>();
      const filteredExercises = this.excludeWarmups(exercises);

      filteredExercises.forEach((loggedEx) => {
        const dbExercise = exerciseDatabase.find(
          db => db.name.toLowerCase() === loggedEx.exerciseName.toLowerCase()
        );

        if (!dbExercise?.primaryMuscles?.length) return;

        const volume = this.calculateExerciseVolume(loggedEx);
        const sets = loggedEx.sets?.length || 0;
        const activityType = loggedEx.activityType || ActivityType.RESISTANCE;
        const rpeValues = (loggedEx.sets || [])
          .map(set => set.rpe)
          .filter((rpe): rpe is number => typeof rpe === 'number' && rpe > 0);
        const rpeTotal = rpeValues.reduce((sum, rpe) => sum + rpe, 0);

        const addContribution = (muscle: MuscleGroup, multiplier: number) => {
          const acc = map.get(muscle) || createAccumulator();
          const muscleVolume = volume * multiplier;
          const muscleSets = sets * multiplier;

          acc.volume += muscleVolume;
          acc.sets += muscleSets;
          acc.exercises.add(loggedEx.exerciseName);
          acc.activityTypes.add(activityType);
          acc.rpeTotal += rpeTotal;
          acc.rpeCount += rpeValues.length;
          acc.exerciseLoads.set(
            loggedEx.exerciseName,
            (acc.exerciseLoads.get(loggedEx.exerciseName) || 0) + Math.max(muscleVolume, muscleSets)
          );

          map.set(muscle, acc);
        };

        dbExercise.primaryMuscles.forEach(muscle => addContribution(muscle, 1));
        dbExercise.secondaryMuscles?.forEach(muscle => addContribution(muscle, 0.5));
      });

      return map;
    };

    const current = build(currentExercises);
    const previous = build(previousExercises);
    const totalVolume = Array.from(current.values()).reduce((sum, acc) => sum + acc.volume, 0);

    const getStatus = (
      totalSets: number,
      volumeChange: number,
      setsChange: number,
      averageRpe: number
    ): MuscleGroupTrainingStatus => {
      if (averageRpe >= 8.5 && (volumeChange >= 20 || setsChange >= 20)) return 'fatigue_risk';
      if (volumeChange >= 40 || setsChange >= 40) return 'high_spike';
      if (totalSets > 0 && totalSets < 4) return 'undertrained';
      if (Math.abs(volumeChange) <= 10 && Math.abs(setsChange) <= 10) return 'stable';
      return 'productive';
    };

    return Array.from(current.entries())
      .map(([muscleGroup, acc]) => {
        const prev = previous.get(muscleGroup);
        const totalVolumeForMuscle = Math.round(acc.volume);
        const totalSetsForMuscle = Math.round(acc.sets);
        const volumeChange = this.calculatePercentageChange(acc.volume, prev?.volume || 0);
        const setsChange = this.calculatePercentageChange(acc.sets, prev?.sets || 0);
        const averageRpe = acc.rpeCount > 0 ? Math.round((acc.rpeTotal / acc.rpeCount) * 10) / 10 : 0;
        const topExercises = Array.from(acc.exerciseLoads.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        return {
          muscleGroup,
          totalVolume: totalVolumeForMuscle,
          totalSets: totalSetsForMuscle,
          exerciseCount: acc.exercises.size,
          percentage: totalVolume > 0 ? Math.round((acc.volume / totalVolume) * 100) : 0,
          color: this.getMuscleColor(muscleGroup),
          volumeChange,
          setsChange,
          activityTypes: Array.from(acc.activityTypes).sort(),
          topExercises,
          averageRpe,
          status: getStatus(totalSetsForMuscle, volumeChange, setsChange, averageRpe),
        };
      })
      .sort((a, b) => b.totalSets - a.totalSets || b.totalVolume - a.totalVolume);
  }

  /**
   * Calculate training frequency data for heatmap
   * @param exercises - Array of exercises
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of training frequency data
   */
  static calculateTrainingFrequency(
    exercises: UnifiedExerciseData[],
    startDate: Date,
    endDate: Date
  ): TrainingFrequencyData[] {
    const filteredExercises = this.excludeWarmups(exercises);
    const frequencyMap = new Map<string, UnifiedExerciseData[]>();
    
    // Group exercises by date
    filteredExercises.forEach(ex => {
      const dateStr = ex.timestamp.toISOString().split('T')[0];
      const existing = frequencyMap.get(dateStr) || [];
      frequencyMap.set(dateStr, [...existing, ex]);
    });
    
    // Create data for each day in range
    const frequencyData: TrainingFrequencyData[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayExercises = frequencyMap.get(dateStr) || [];
      
      const totalVolume = dayExercises.reduce(
        (sum, ex) => sum + this.calculateExerciseVolume(ex),
        0
      );
      
      const totalSets = dayExercises.reduce(
        (sum, ex) => sum + (ex.sets?.length || 0),
        0
      );
      
      const intensity = this.calculateIntensity(totalVolume, totalSets);
      
      frequencyData.push({
        date: dateStr,
        workoutCount: dayExercises.length,
        totalVolume,
        totalSets,
        intensity,
        exercises: dayExercises.map(ex => ex.exerciseName)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return frequencyData;
  }

  /**
   * Calculate analytics summary statistics
   * @param exercises - Array of exercises
   * @param startDate - Start date
   * @param endDate - End date
   * @param userId - User ID
   * @param exerciseDatabase - Exercise database
   * @returns Analytics summary
   */
  static calculateAnalyticsSummary(
    exercises: UnifiedExerciseData[],
    startDate: Date,
    endDate: Date,
    userId: string,
    exerciseDatabase: Exercise[]
  ): AnalyticsSummary {
    const filteredExercises = this.excludeWarmups(exercises);

    const totalVolume = filteredExercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    
    const workoutCount = this.countWorkouts(filteredExercises);
    
    const totalSets = filteredExercises.reduce(
      (sum, ex) => sum + (ex.sets?.length || 0),
      0
    );
    
    const uniqueExercises = new Set(filteredExercises.map(ex => ex.exerciseName)).size;
    
    const averageVolumePerWorkout = workoutCount > 0 ? totalVolume / workoutCount : 0;
    
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const weeks = daysDiff / 7;
    const averageWorkoutsPerWeek = weeks > 0 ? workoutCount / weeks : 0;
    
    // Get recent PRs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPRs = this.detectPersonalRecords(filteredExercises, userId).filter(
      pr => pr.date >= sevenDaysAgo
    );
    
    // Calculate muscle balance
    const muscleVolumes = this.calculateMuscleVolumes(filteredExercises, exerciseDatabase);
    const muscleGroupBalance = this.calculateMuscleBalance(muscleVolumes);
    
    // Calculate consistency
    const frequencyData = this.calculateTrainingFrequency(filteredExercises, startDate, endDate);
    const consistencyScore = this.calculateConsistencyScore(frequencyData);
    
    // Calculate current streak
    const streak = this.calculateStreak(frequencyData);
    
    return {
      totalVolume: Math.round(totalVolume),
      totalWorkouts: workoutCount,
      totalSets,
      totalExercises: uniqueExercises,
      averageVolumePerWorkout: Math.round(averageVolumePerWorkout),
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 10) / 10,
      newPRCount: recentPRs.length,
      muscleGroupBalance,
      consistencyScore,
      currentStreak: streak.currentStreak
    };
  }

  /**
   * Calculate training streak
   * @param frequencyData - Training frequency data
   * @returns Training streak information
   */
  static calculateStreak(frequencyData: TrainingFrequencyData[]): TrainingStreak {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let streakStartDate: Date | undefined;
    
    // Sort by date descending (most recent first)
    const sorted = [...frequencyData].sort((a, b) => b.date.localeCompare(a.date));
    
    // Calculate current streak from today backwards
    for (const data of sorted) {
      if (data.workoutCount > 0) {
        currentStreak++;
        if (currentStreak === 1) {
          streakStartDate = new Date(data.date);
        }
      } else {
        break; // Streak broken
      }
    }
    
    // Calculate longest streak
    for (const data of frequencyData) {
      if (data.workoutCount > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      currentStreak,
      longestStreak,
      streakStartDate
    };
  }

  /**
   * Calculate muscle group balance score (0-100)
   * Higher score = better balance
   * @param muscleVolumes - Muscle volume data
   * @returns Balance score
   */
  private static calculateMuscleBalance(muscleVolumes: MuscleVolumeData[]): number {
    if (muscleVolumes.length === 0) return 0;
    
    const percentages = muscleVolumes.map(m => m.percentage);
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    
    // Calculate standard deviation
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / percentages.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev = better balance
    // Scale to 0-100 (assuming stdDev of 20 is poor, 0 is perfect)
    const balanceScore = Math.max(0, Math.min(100, 100 - (stdDev * 5)));
    
    return Math.round(balanceScore);
  }

  /**
   * Calculate consistency score (0-100)
   * Based on regularity of training
   * @param frequencyData - Training frequency data
   * @returns Consistency score
   */
  private static calculateConsistencyScore(frequencyData: TrainingFrequencyData[]): number {
    if (frequencyData.length === 0) return 0;
    
    const workoutDays = frequencyData.filter(d => d.workoutCount > 0).length;
    const totalDays = frequencyData.length;
    
    // Calculate percentage of days with workouts
    const workoutRate = (workoutDays / totalDays) * 100;
    
    // Bonus for regular patterns (penalize large gaps)
    const gaps: number[] = [];
    let currentGap = 0;
    
    for (const data of frequencyData) {
      if (data.workoutCount === 0) {
        currentGap++;
      } else {
        if (currentGap > 0) {
          gaps.push(currentGap);
        }
        currentGap = 0;
      }
    }
    
    // Penalize large gaps (more than 3 days)
    const largeGaps = gaps.filter(g => g > 3).length;
    const gapPenalty = Math.min(20, largeGaps * 5);
    
    const consistencyScore = Math.max(0, Math.min(100, workoutRate - gapPenalty));
    
    return Math.round(consistencyScore);
  }

  /**
   * Calculate intensity level based on volume and sets
   * @param volume - Total volume
   * @param sets - Total sets
   * @returns Intensity level
   */
  private static calculateIntensity(volume: number, sets: number): IntensityLevel {
    if (volume === 0 && sets === 0) return IntensityLevel.REST;
    
    // Adjust these thresholds based on typical training volumes
    if (volume < 3000 || sets < 10) return IntensityLevel.LIGHT;
    if (volume < 6000 || sets < 20) return IntensityLevel.MODERATE;
    if (volume < 10000 || sets < 30) return IntensityLevel.HIGH;
    
    return IntensityLevel.VERY_HIGH;
  }

  /**
   * Get color for muscle group
   * @param muscle - Muscle group
   * @returns Hex color string
   */
  private static getMuscleColor(muscle: MuscleGroup): string {
    return MUSCLE_COLORS[muscle] || '#9CA3AF';
  }

  /**
   * Compare two time periods
   * @param currentExercises - Exercises from current period
   * @param previousExercises - Exercises from previous period
   * @returns Period comparison data
   */
  static comparePeriods(
    currentExercises: UnifiedExerciseData[],
    previousExercises: UnifiedExerciseData[]
  ): PeriodComparison {
    const filteredCurrentExercises = this.excludeWarmups(currentExercises);
    const filteredPreviousExercises = this.excludeWarmups(previousExercises);

    const currentVolume = filteredCurrentExercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    const currentWorkouts = this.countWorkouts(filteredCurrentExercises);
    const currentExerciseCount = new Set(filteredCurrentExercises.map(ex => ex.exerciseName)).size;
    
    const previousVolume = filteredPreviousExercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    const previousWorkouts = this.countWorkouts(filteredPreviousExercises);
    const previousExerciseCount = new Set(filteredPreviousExercises.map(ex => ex.exerciseName)).size;
    
    const volumeChange = previousVolume > 0 
      ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100 * 10) / 10
      : 0;
    
    const workoutsChange = previousWorkouts > 0
      ? Math.round(((currentWorkouts - previousWorkouts) / previousWorkouts) * 100 * 10) / 10
      : 0;
    
    const exercisesChange = previousExerciseCount > 0
      ? Math.round(((currentExerciseCount - previousExerciseCount) / previousExerciseCount) * 100 * 10) / 10
      : 0;
    
    return {
      current: {
        volume: Math.round(currentVolume),
        workouts: currentWorkouts,
        exercises: currentExerciseCount
      },
      previous: {
        volume: Math.round(previousVolume),
        workouts: previousWorkouts,
        exercises: previousExerciseCount
      },
      changes: {
        volumeChange,
        workoutsChange,
        exercisesChange
      }
    };
  }
}

export default AnalyticsService;
