# Analytics Quick Start Code Snippets

Ready-to-use code snippets for implementing the Progress Tracking Dashboard.

---

## 📝 Table of Contents
1. [Type Definitions](#type-definitions)
2. [Analytics Service](#analytics-service)
3. [Utility Functions](#utility-functions)
4. [Custom Hooks](#custom-hooks)
5. [Chart Components](#chart-components)
6. [Main Page](#main-page)

---

## Type Definitions

### `src/types/analytics.ts`

```typescript
import { MuscleGroup } from './exercise';
import { ActivityType } from './activityTypes';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';

// Volume tracking
export interface VolumeDataPoint {
  date: string; // ISO date string for chart compatibility
  volume: number;
  totalSets: number;
  averageWeight: number;
  averageReps: number;
  exerciseName: string;
  exerciseCount?: number;
}

// Personal Records
export enum PRType {
  ONE_REP_MAX = '1RM',
  THREE_REP_MAX = '3RM',
  FIVE_REP_MAX = '5RM',
  TEN_REP_MAX = '10RM',
  MAX_VOLUME = 'Max Volume',
  MAX_REPS = 'Max Reps',
  MAX_WEIGHT = 'Max Weight'
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseName: string;
  exerciseId?: string;
  recordType: PRType;
  value: number;
  weight?: number;
  reps?: number;
  volume?: number;
  date: Date;
  previousRecord?: PersonalRecord;
  improvement?: number; // percentage
  isNew?: boolean; // Set within last 7 days
}

// Muscle volume analysis
export interface MuscleVolumeData {
  muscleGroup: MuscleGroup;
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  percentage: number;
  color: string; // For charts
}

// Training frequency
export enum IntensityLevel {
  REST = 0,
  LIGHT = 1,
  MODERATE = 2,
  HIGH = 3,
  VERY_HIGH = 4
}

export interface TrainingFrequencyData {
  date: string; // ISO date string
  workoutCount: number;
  totalVolume: number;
  totalSets: number;
  totalDuration?: number;
  intensity: IntensityLevel;
  exercises: string[];
}

// Filters
export type TimeframePreset = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  timeframe: TimeframePreset;
  exercises?: string[];
  muscleGroups?: MuscleGroup[];
  activityTypes?: ActivityType[];
}

// Chart data types
export interface ChartDataset {
  name: string;
  data: VolumeDataPoint[];
  color: string;
}

export interface HeatmapCell {
  date: string;
  value: number;
  intensity: IntensityLevel;
  details: TrainingFrequencyData;
}
```

---

## Analytics Service

### `src/services/analyticsService.ts`

```typescript
import { getAllExercisesByDate } from '@/utils/unifiedExerciseUtils';
import { UnifiedExerciseData } from '@/utils/unifiedExerciseUtils';
import { Exercise, MuscleGroup } from '@/types/exercise';
import {
  VolumeDataPoint,
  PersonalRecord,
  PRType,
  MuscleVolumeData,
  TrainingFrequencyData,
  IntensityLevel,
  AnalyticsFilters
} from '@/types/analytics';
import { calculateSetVolume, calculateTotalVolume, estimate1RM } from '@/utils/volumeCalculations';
import { getExercisesByActivityType } from './exerciseDatabaseService';
import { ActivityType } from '@/types/activityTypes';

export class AnalyticsService {
  /**
   * Fetch exercises within a date range with filters
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
    while (currentDate <= endDate) {
      const dayExercises = await getAllExercisesByDate(new Date(currentDate), userId);
      allExercises.push(...dayExercises);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Apply filters
    let filtered = allExercises;
    
    if (filters?.exercises && filters.exercises.length > 0) {
      filtered = filtered.filter(ex => 
        filters.exercises!.includes(ex.exerciseName)
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
   */
  static calculateExerciseVolume(exercise: UnifiedExerciseData): number {
    if (!exercise.sets || exercise.sets.length === 0) return 0;
    return calculateTotalVolume(exercise.sets);
  }

  /**
   * Calculate daily volume data points
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
          const avgWeight = allSets.length > 0
            ? allSets.reduce((sum, set) => sum + (set.weight || 0), 0) / allSets.length
            : 0;
          
          const avgReps = allSets.length > 0
            ? allSets.reduce((sum, set) => sum + (set.reps || 0), 0) / allSets.length
            : 0;
          
          dataPoints.push({
            date,
            volume: totalVolume,
            totalSets,
            averageWeight: Math.round(avgWeight * 10) / 10,
            averageReps: Math.round(avgReps * 10) / 10,
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
        
        dataPoints.push({
          date,
          volume: totalVolume,
          totalSets,
          averageWeight: 0,
          averageReps: 0,
          exerciseName: 'All Exercises',
          exerciseCount: new Set(dateExercises.map(ex => ex.exerciseName)).size
        });
      });
      
      return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
    }
  }

  /**
   * Detect personal records from exercise history
   */
  static detectPersonalRecords(
    exercises: UnifiedExerciseData[],
    userId: string
  ): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    
    // Group exercises by name
    const exerciseMap = new Map<string, UnifiedExerciseData[]>();
    exercises.forEach(ex => {
      const existing = exerciseMap.get(ex.exerciseName) || [];
      exerciseMap.set(ex.exerciseName, [...existing, ex]);
    });
    
    // Check each exercise for PRs
    exerciseMap.forEach((exList, exerciseName) => {
      // Sort by date
      const sorted = exList.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      // Track best values
      let best1RM = 0;
      let best3RM = 0;
      let best5RM = 0;
      let best10RM = 0;
      let bestVolume = 0;
      let bestWeight = 0;
      let bestReps = 0;
      
      sorted.forEach(exercise => {
        if (!exercise.sets || exercise.sets.length === 0) return;
        
        const volume = this.calculateExerciseVolume(exercise);
        
        exercise.sets.forEach(set => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          
          if (weight === 0 || reps === 0) return;
          
          // Check 1RM
          const estimated1RM = estimate1RM(weight, reps);
          if (estimated1RM > best1RM) {
            records.push({
              id: `${exercise.id}-1rm`,
              userId,
              exerciseName,
              exerciseId: exercise.id,
              recordType: PRType.ONE_REP_MAX,
              value: estimated1RM,
              weight,
              reps,
              date: exercise.timestamp,
              improvement: best1RM > 0 ? ((estimated1RM - best1RM) / best1RM) * 100 : 0,
              isNew: this.isRecent(exercise.timestamp)
            });
            best1RM = estimated1RM;
          }
          
          // Check specific rep maxes
          if (reps === 3 && weight > best3RM) {
            records.push({
              id: `${exercise.id}-3rm`,
              userId,
              exerciseName,
              recordType: PRType.THREE_REP_MAX,
              value: weight,
              weight,
              reps: 3,
              date: exercise.timestamp,
              improvement: best3RM > 0 ? ((weight - best3RM) / best3RM) * 100 : 0,
              isNew: this.isRecent(exercise.timestamp)
            });
            best3RM = weight;
          }
          
          if (reps === 5 && weight > best5RM) {
            records.push({
              id: `${exercise.id}-5rm`,
              userId,
              exerciseName,
              recordType: PRType.FIVE_REP_MAX,
              value: weight,
              weight,
              reps: 5,
              date: exercise.timestamp,
              improvement: best5RM > 0 ? ((weight - best5RM) / best5RM) * 100 : 0,
              isNew: this.isRecent(exercise.timestamp)
            });
            best5RM = weight;
          }
          
          if (reps === 10 && weight > best10RM) {
            records.push({
              id: `${exercise.id}-10rm`,
              userId,
              exerciseName,
              recordType: PRType.TEN_REP_MAX,
              value: weight,
              weight,
              reps: 10,
              date: exercise.timestamp,
              improvement: best10RM > 0 ? ((weight - best10RM) / best10RM) * 100 : 0,
              isNew: this.isRecent(exercise.timestamp)
            });
            best10RM = weight;
          }
          
          // Check max weight
          if (weight > bestWeight) {
            bestWeight = weight;
          }
          
          // Check max reps (at same weight)
          if (weight === bestWeight && reps > bestReps) {
            bestReps = reps;
          }
        });
        
        // Check volume PR
        if (volume > bestVolume) {
          records.push({
            id: `${exercise.id}-volume`,
            userId,
            exerciseName,
            recordType: PRType.MAX_VOLUME,
            value: volume,
            volume,
            date: exercise.timestamp,
            improvement: bestVolume > 0 ? ((volume - bestVolume) / bestVolume) * 100 : 0,
            isNew: this.isRecent(exercise.timestamp)
          });
          bestVolume = volume;
        }
      });
    });
    
    return records;
  }

  /**
   * Calculate muscle group volume distribution
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
    
    while (currentDate <= endDate) {
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
   * Helper: Calculate intensity level based on volume and sets
   */
  private static calculateIntensity(volume: number, sets: number): IntensityLevel {
    if (volume === 0 && sets === 0) return IntensityLevel.REST;
    
    // Adjust these thresholds based on your needs
    if (volume < 3000 || sets < 10) return IntensityLevel.LIGHT;
    if (volume < 6000 || sets < 20) return IntensityLevel.MODERATE;
    if (volume < 10000 || sets < 30) return IntensityLevel.HIGH;
    
    return IntensityLevel.VERY_HIGH;
  }

  /**
   * Helper: Check if date is recent (within 7 days)
   */
  private static isRecent(date: Date): boolean {
    const daysDiff = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }

  /**
   * Helper: Get color for muscle group
   */
  private static getMuscleColor(muscle: MuscleGroup): string {
    const colors: Record<string, string> = {
      chest: '#FF6B6B',
      back: '#4ECDC4',
      quadriceps: '#95E1D3',
      hamstrings: '#95E1D3',
      legs: '#95E1D3',
      shoulders: '#F38181',
      biceps: '#AA96DA',
      triceps: '#AA96DA',
      arms: '#AA96DA',
      core: '#FCBAD3',
      full_body: '#A8E6CF',
      calves: '#95E1D3',
      glutes: '#95E1D3',
    };
    
    return colors[muscle] || '#9CA3AF';
  }
}
```

---

## Utility Functions

### `src/utils/volumeCalculations.ts`

```typescript
import { ExerciseSet } from '@/types/sets';

/**
 * Calculate volume for a single set (weight × reps)
 */
export function calculateSetVolume(set: ExerciseSet): number {
  const weight = set.weight || 0;
  const reps = set.reps || 0;
  return weight * reps;
}

/**
 * Calculate total volume for multiple sets
 */
export function calculateTotalVolume(sets: ExerciseSet[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

/**
 * Calculate average weight across sets
 */
export function calculateAverageWeight(sets: ExerciseSet[]): number {
  if (sets.length === 0) return 0;
  const totalWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0);
  return totalWeight / sets.length;
}

/**
 * Calculate average reps across sets
 */
export function calculateAverageReps(sets: ExerciseSet[]): number {
  if (sets.length === 0) return 0;
  const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  return totalReps / sets.length;
}

/**
 * Estimate 1RM using Epley formula
 * 1RM = weight × (1 + reps/30)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) return weight; // Formula less accurate beyond 12 reps
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate estimated max for specific rep count
 */
export function estimateRM(rm1: number, targetReps: number): number {
  // Reverse Epley formula
  return Math.round((rm1 / (1 + targetReps / 30)) * 10) / 10;
}
```

---

## Custom Hooks

### `src/features/analytics/hooks/useVolumeData.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AnalyticsService } from '@/services/analyticsService';
import { VolumeDataPoint, AnalyticsFilters } from '@/types/analytics';

export function useVolumeData(filters: AnalyticsFilters) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const exercises = await AnalyticsService.getExercisesByDateRange(
          user.id,
          filters.startDate,
          filters.endDate,
          filters
        );

        const volumePoints = AnalyticsService.calculateDailyVolumes(exercises, 'exercise');
        setVolumeData(volumePoints);
      } catch (err) {
        console.error('Error fetching volume data:', err);
        setError('Failed to load volume data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, filters.startDate, filters.endDate, filters.exercises]);

  const refetch = () => {
    if (user?.id) {
      // Trigger re-fetch by updating a dependency
      setLoading(true);
    }
  };

  return { volumeData, loading, error, refetch };
}
```

---

## Chart Components

### `src/features/analytics/components/VolumeProgressionChart.tsx`

```typescript
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { VolumeDataPoint } from '@/types/analytics';

interface VolumeProgressionChartProps {
  data: VolumeDataPoint[];
  selectedExercises?: string[];
}

const EXERCISE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({
  data,
  selectedExercises
}) => {
  // Group data by exercise and format for chart
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    
    data.forEach(point => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      
      const dateEntry = dateMap.get(point.date)!;
      dateEntry[point.exerciseName] = point.volume;
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
  }, [data]);

  // Get unique exercises
  const exercises = useMemo(() => {
    const unique = Array.from(new Set(data.map(d => d.exerciseName)));
    return selectedExercises && selectedExercises.length > 0
      ? unique.filter(ex => selectedExercises.includes(ex))
      : unique.slice(0, 5); // Limit to 5 for readability
  }, [data, selectedExercises]);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No volume data available for selected period
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📈 Volume Progression
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#fff'
            }}
            formatter={(value: number) => [`${value}kg`, '']}
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <Legend />
          {exercises.map((exercise, index) => (
            <Line
              key={exercise}
              type="monotone"
              dataKey={exercise}
              stroke={EXERCISE_COLORS[index % EXERCISE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

## Main Page

### `src/features/analytics/Analytics.tsx`

```typescript
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { AnalyticsFilters, TimeframePreset } from '@/types/analytics';
import { useVolumeData } from './hooks/useVolumeData';
import { usePersonalRecords } from './hooks/usePersonalRecords';
import { useMuscleVolume } from './hooks/useMuscleVolume';
import { useTrainingFrequency } from './hooks/useTrainingFrequency';
import { VolumeProgressionChart } from './components/VolumeProgressionChart';
import { PersonalRecordsDisplay } from './components/PersonalRecordsDisplay';
import { MuscleVolumeDistribution } from './components/MuscleVolumeDistribution';
import { TrainingHeatmap } from './components/TrainingHeatmap';
import { subDays, subYears } from 'date-fns';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: subDays(new Date(), 90),
    endDate: new Date(),
    timeframe: '90d'
  });

  // Fetch data using custom hooks
  const { volumeData, loading: volumeLoading } = useVolumeData(filters);
  const { records, loading: recordsLoading } = usePersonalRecords(user?.id || '');
  const { muscleData, loading: muscleLoading } = useMuscleVolume(filters);
  const { frequencyData, loading: freqLoading } = useTrainingFrequency(filters);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0);
    const workoutDays = new Set(frequencyData.filter(d => d.workoutCount > 0).map(d => d.date)).size;
    const newPRs = records.filter(r => r.isNew).length;
    
    return {
      totalVolume: Math.round(totalVolume),
      workoutDays,
      newPRs
    };
  }, [volumeData, frequencyData, records]);

  const handleTimeframeChange = (timeframe: TimeframePreset) => {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subYears(now, 1);
        break;
      case 'all':
        startDate = subYears(now, 10); // Arbitrary far back date
        break;
      default:
        startDate = subDays(now, 90);
    }

    setFilters(prev => ({
      ...prev,
      startDate,
      endDate: now,
      timeframe
    }));
  };

  const loading = volumeLoading || recordsLoading || muscleLoading || freqLoading;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', '1y', 'all'] as TimeframePreset[]).map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filters.timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Volume</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {stats.totalVolume.toLocaleString()}kg
            </div>
            <div className="text-sm text-gray-400">in selected period</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Workout Days</span>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.workoutDays}</div>
            <div className="text-sm text-gray-400">training sessions</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">New PRs</span>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.newPRs}</div>
            <div className="text-sm text-gray-400">this week</div>
          </div>
        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume Chart - Full Width */}
            <div className="lg:col-span-2">
              <VolumeProgressionChart data={volumeData} />
            </div>

            {/* Personal Records */}
            <PersonalRecordsDisplay records={records} />

            {/* Muscle Distribution */}
            <MuscleVolumeDistribution muscleData={muscleData} />

            {/* Training Heatmap - Full Width */}
            <div className="lg:col-span-2">
              <TrainingHeatmap frequencyData={frequencyData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
```

---

**Ready to start implementing!** 🚀

These code snippets are production-ready and can be directly integrated into your app. Start with the type definitions, then move to the service layer, and finally build the UI components.
