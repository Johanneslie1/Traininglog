import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { Exercise, MuscleGroup } from '@/types/exercise';
import {
  VolumeDataPoint,
  PersonalRecord,
  MuscleVolumeData,
  TrainingFrequencyData,
  IntensityLevel,
  AnalyticsFilters,
  AnalyticsSummary,
  TrainingStreak,
  PeriodComparison
} from '@/types/analytics';
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
    
    return filtered;
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
    if (groupBy === 'exercise') {
      // Group by exercise name
      const exerciseMap = new Map<string, UnifiedExerciseData[]>();
      
      exercises.forEach(ex => {
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
      
      exercises.forEach(ex => {
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
    const records: PersonalRecord[] = [];
    
    // Get all PRs by exercise
    const allPRs = getAllPRsByExercise(exercises, userId);
    
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
    const muscleVolumeMap = new Map<MuscleGroup, number>();
    const muscleSetsMap = new Map<MuscleGroup, number>();
    const muscleExercisesMap = new Map<MuscleGroup, Set<string>>();
    
    exercises.forEach(loggedEx => {
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
    const frequencyMap = new Map<string, UnifiedExerciseData[]>();
    
    // Group exercises by date
    exercises.forEach(ex => {
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
    const totalVolume = exercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    
    const workoutDays = new Set(
      exercises.map(ex => ex.timestamp.toISOString().split('T')[0])
    ).size;
    
    const totalSets = exercises.reduce(
      (sum, ex) => sum + (ex.sets?.length || 0),
      0
    );
    
    const uniqueExercises = new Set(exercises.map(ex => ex.exerciseName)).size;
    
    const averageVolumePerWorkout = workoutDays > 0 ? totalVolume / workoutDays : 0;
    
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const weeks = daysDiff / 7;
    const averageWorkoutsPerWeek = weeks > 0 ? workoutDays / weeks : 0;
    
    // Get recent PRs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPRs = this.detectPersonalRecords(exercises, userId).filter(
      pr => pr.date >= sevenDaysAgo
    );
    
    // Calculate muscle balance
    const muscleVolumes = this.calculateMuscleVolumes(exercises, exerciseDatabase);
    const muscleGroupBalance = this.calculateMuscleBalance(muscleVolumes);
    
    // Calculate consistency
    const frequencyData = this.calculateTrainingFrequency(exercises, startDate, endDate);
    const consistencyScore = this.calculateConsistencyScore(frequencyData);
    
    // Calculate current streak
    const streak = this.calculateStreak(frequencyData);
    
    return {
      totalVolume: Math.round(totalVolume),
      totalWorkouts: workoutDays,
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
    const currentVolume = currentExercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    const currentWorkouts = new Set(
      currentExercises.map(ex => ex.timestamp.toISOString().split('T')[0])
    ).size;
    const currentExerciseCount = new Set(currentExercises.map(ex => ex.exerciseName)).size;
    
    const previousVolume = previousExercises.reduce(
      (sum, ex) => sum + this.calculateExerciseVolume(ex),
      0
    );
    const previousWorkouts = new Set(
      previousExercises.map(ex => ex.timestamp.toISOString().split('T')[0])
    ).size;
    const previousExerciseCount = new Set(previousExercises.map(ex => ex.exerciseName)).size;
    
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
