import { VolumeDataPoint, MuscleVolumeData, TrainingFrequencyData, HeatmapCell, IntensityLevel, ChartDataset } from '@/types/analytics';

/**
 * Format volume data for line charts
 * Groups data by exercise and creates separate datasets
 * @param dataPoints - Array of volume data points
 * @returns Array of chart datasets
 */
export function formatVolumeChartData(dataPoints: VolumeDataPoint[]): ChartDataset[] {
  // Group by exercise
  const exerciseMap = new Map<string, VolumeDataPoint[]>();
  
  dataPoints.forEach(point => {
    const existing = exerciseMap.get(point.exerciseName) || [];
    exerciseMap.set(point.exerciseName, [...existing, point]);
  });
  
  // Create datasets with colors
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  const datasets: ChartDataset[] = [];
  let colorIndex = 0;
  
  exerciseMap.forEach((points, exerciseName) => {
    datasets.push({
      name: exerciseName,
      data: points.sort((a, b) => a.date.localeCompare(b.date)),
      color: colors[colorIndex % colors.length]
    });
    colorIndex++;
  });
  
  return datasets;
}

/**
 * Format volume data for Recharts (merged by date)
 * Creates a single array with all exercises as properties
 * @param dataPoints - Array of volume data points
 * @returns Array of objects suitable for Recharts
 */
export function formatVolumeChartDataForRecharts(dataPoints: VolumeDataPoint[]): any[] {
  const dateMap = new Map<string, any>();
  
  dataPoints.forEach(point => {
    if (!dateMap.has(point.date)) {
      dateMap.set(point.date, { date: point.date });
    }
    
    const dateEntry = dateMap.get(point.date)!;
    dateEntry[point.exerciseName] = point.volume;
  });
  
  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Muscle group colors for consistency across charts
 */
export const MUSCLE_COLORS: Record<string, string> = {
  chest: '#FF6B6B',
  back: '#4ECDC4',
  quadriceps: '#95E1D3',
  hamstrings: '#A8E6CF',
  calves: '#B5E7A0',
  legs: '#95E1D3',
  shoulders: '#F38181',
  biceps: '#AA96DA',
  triceps: '#FCBAD3',
  arms: '#AA96DA',
  forearms: '#C7A8D8',
  core: '#FFD3B6',
  traps: '#98D8C8',
  lats: '#6EC1E4',
  lower_back: '#8FA9B0',
  glutes: '#D4A5A5',
  full_body: '#A8E6CF',
};

/**
 * Format muscle volume data for pie charts
 * @param muscleData - Array of muscle volume data
 * @returns Formatted data for pie charts
 */
export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function formatMuscleDistributionData(muscleData: MuscleVolumeData[]): PieChartData[] {
  return muscleData.map(data => ({
    name: formatMuscleName(data.muscleGroup),
    value: data.totalVolume,
    percentage: data.percentage,
    color: data.color
  }));
}

/**
 * Format muscle volume data for bar charts
 * @param muscleData - Array of muscle volume data
 * @returns Formatted data for bar charts
 */
export interface BarChartData {
  muscle: string;
  volume: number;
  sets: number;
  exercises: number;
  color: string;
}

export function formatMuscleBarChartData(muscleData: MuscleVolumeData[]): BarChartData[] {
  return muscleData.map(data => ({
    muscle: formatMuscleName(data.muscleGroup),
    volume: data.totalVolume,
    sets: data.totalSets,
    exercises: data.exerciseCount,
    color: data.color
  }));
}

/**
 * Format training frequency data for heatmap
 * @param frequencyData - Array of training frequency data
 * @returns Array of heatmap cells
 */
export function formatHeatmapData(frequencyData: TrainingFrequencyData[]): HeatmapCell[] {
  return frequencyData.map(data => ({
    date: data.date,
    value: data.intensity,
    intensity: data.intensity,
    details: data
  }));
}

/**
 * Group heatmap data by week
 * @param cells - Array of heatmap cells
 * @returns Array of weeks, each containing 7 days
 */
export function groupHeatmapByWeek(cells: HeatmapCell[]): HeatmapCell[][] {
  const weeks: HeatmapCell[][] = [];
  let currentWeek: HeatmapCell[] = [];
  
  cells.forEach((cell, index) => {
    currentWeek.push(cell);
    
    // Every 7 days or last item, start new week
    if ((index + 1) % 7 === 0 || index === cells.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  return weeks;
}

/**
 * Get color for intensity level
 * @param intensity - Intensity level (0-4)
 * @returns CSS color string
 */
export function getIntensityColor(intensity: IntensityLevel): string {
  const colors = {
    [IntensityLevel.REST]: '#1f2937',         // gray-800
    [IntensityLevel.LIGHT]: '#064e3b',        // green-900
    [IntensityLevel.MODERATE]: '#065f46',     // green-800
    [IntensityLevel.HIGH]: '#059669',         // green-600
    [IntensityLevel.VERY_HIGH]: '#10b981',    // green-500
  };
  
  return colors[intensity] || colors[IntensityLevel.REST];
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @param format - 'short' | 'medium' | 'long'
 * @returns Formatted date string
 */
export function formatChartDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    case 'medium':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    default:
      return dateString;
  }
}

/**
 * Format muscle group name for display
 * @param muscleGroup - Muscle group key
 * @returns Formatted muscle group name
 */
export function formatMuscleName(muscleGroup: string): string {
  const nameMap: Record<string, string> = {
    chest: 'Chest',
    back: 'Back',
    quadriceps: 'Quadriceps',
    hamstrings: 'Hamstrings',
    calves: 'Calves',
    legs: 'Legs',
    shoulders: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    arms: 'Arms',
    forearms: 'Forearms',
    core: 'Core',
    traps: 'Traps',
    lats: 'Lats',
    lower_back: 'Lower Back',
    glutes: 'Glutes',
    full_body: 'Full Body',
  };
  
  return nameMap[muscleGroup] || muscleGroup;
}

/**
 * Format volume for display
 * @param volume - Volume in kg
 * @param unit - 'kg' | 'lbs'
 * @returns Formatted volume string
 */
export function formatVolume(volume: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  return `${Math.round(volume)} ${unit}`;
}

/**
 * Calculate date range for chart
 * @param days - Number of days
 * @returns Array of ISO date strings
 */
export function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Fill missing dates in data with zero values
 * @param data - Volume data points
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Data with all dates filled
 */
export function fillMissingDates(
  data: VolumeDataPoint[],
  startDate: string,
  endDate: string
): VolumeDataPoint[] {
  const dataMap = new Map(data.map(d => [d.date, d]));
  const filled: VolumeDataPoint[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    if (dataMap.has(dateStr)) {
      filled.push(dataMap.get(dateStr)!);
    } else {
      // Add zero entry for missing date
      filled.push({
        date: dateStr,
        volume: 0,
        totalSets: 0,
        averageWeight: 0,
        averageReps: 0,
        exerciseName: data[0]?.exerciseName || 'Unknown'
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return filled;
}

/**
 * Aggregate data by week
 * @param data - Daily volume data points
 * @returns Weekly aggregated data
 */
export function aggregateByWeek(data: VolumeDataPoint[]): VolumeDataPoint[] {
  const weekMap = new Map<string, VolumeDataPoint[]>();
  
  data.forEach(point => {
    const date = new Date(point.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    
    const existing = weekMap.get(weekKey) || [];
    weekMap.set(weekKey, [...existing, point]);
  });
  
  const weeklyData: VolumeDataPoint[] = [];
  
  weekMap.forEach((points, weekStart) => {
    const totalVolume = points.reduce((sum, p) => sum + p.volume, 0);
    const totalSets = points.reduce((sum, p) => sum + p.totalSets, 0);
    const avgWeight = points.reduce((sum, p) => sum + p.averageWeight, 0) / points.length;
    const avgReps = points.reduce((sum, p) => sum + p.averageReps, 0) / points.length;
    
    weeklyData.push({
      date: weekStart,
      volume: totalVolume,
      totalSets: totalSets,
      averageWeight: Math.round(avgWeight * 10) / 10,
      averageReps: Math.round(avgReps * 10) / 10,
      exerciseName: points[0].exerciseName
    });
  });
  
  return weeklyData.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate data by month
 * @param data - Daily volume data points
 * @returns Monthly aggregated data
 */
export function aggregateByMonth(data: VolumeDataPoint[]): VolumeDataPoint[] {
  const monthMap = new Map<string, VolumeDataPoint[]>();
  
  data.forEach(point => {
    const date = new Date(point.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = monthMap.get(monthKey) || [];
    monthMap.set(monthKey, [...existing, point]);
  });
  
  const monthlyData: VolumeDataPoint[] = [];
  
  monthMap.forEach((points, monthKey) => {
    const totalVolume = points.reduce((sum, p) => sum + p.volume, 0);
    const totalSets = points.reduce((sum, p) => sum + p.totalSets, 0);
    const avgWeight = points.reduce((sum, p) => sum + p.averageWeight, 0) / points.length;
    const avgReps = points.reduce((sum, p) => sum + p.averageReps, 0) / points.length;
    
    monthlyData.push({
      date: `${monthKey}-01`,
      volume: totalVolume,
      totalSets: totalSets,
      averageWeight: Math.round(avgWeight * 10) / 10,
      averageReps: Math.round(avgReps * 10) / 10,
      exerciseName: points[0].exerciseName
    });
  });
  
  return monthlyData.sort((a, b) => a.date.localeCompare(b.date));
}
