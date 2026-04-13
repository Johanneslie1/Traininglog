import React from 'react';
import { ExerciseSet } from '@/types/sets';
import { Exercise } from '@/types/exercise';
import { DifficultyCategory } from '@/types/difficulty';

interface WorkoutAnalyticsProps {
  exercises: Array<{
    exercise: Exercise;
    sets: ExerciseSet[];
  }>;
  title?: string;
  className?: string;
}

const WorkoutAnalytics: React.FC<WorkoutAnalyticsProps> = ({
  exercises,
  title = "Workout Overview",
  className = ""
}) => {
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const totalVolume = exercises.reduce((sum, item) => 
    sum + item.sets.reduce((setSum, set) => setSum + (set.weight || 0) * (set.reps || 0), 0), 0
  );
  const totalReps = exercises.reduce((sum, item) => 
    sum + item.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0), 0
  );

  // Calculate estimated workout duration (rough estimate based on sets)
  const estimatedDuration = Math.round((totalSets * 2.5 + totalExercises * 1.5)); // 2.5 min per set + 1.5 min per exercise transition

  // Calculate intensity score (weighted by difficulty)
  const intensityScore = exercises.reduce((sum, item) => {
    const exerciseIntensity = item.sets.reduce((setSum, set) => {
      const baseScore = (set.weight || 0) * (set.reps || 0);
      const difficultyMultiplier = set.difficulty === DifficultyCategory.HARD ? 1.2 : 
                                 set.difficulty === DifficultyCategory.EASY ? 0.8 : 1.0;
      return setSum + (baseScore * difficultyMultiplier);
    }, 0);
    return sum + exerciseIntensity;
  }, 0);

  if (totalExercises === 0) {
    return (
      <div className={`p-4 bg-bg-tertiary rounded-lg ${className}`}>
        <div className="text-center text-text-tertiary">
          <span className="text-2xl">💪</span>
          <p className="mt-2 text-sm">Add exercises to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-bg-secondary rounded-lg border border-border ${className}`}>
      <div className="text-sm text-text-tertiary mb-3 font-medium">{title}</div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-text-primary">{totalExercises}</div>
          <div className="text-xs text-text-tertiary">Exercises</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-lg font-semibold text-text-primary">{totalSets}</div>
          <div className="text-xs text-text-tertiary">Total Sets</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-lg font-semibold text-text-primary">
            {totalVolume >= 1000 ? `${Math.round(totalVolume / 1000)}k` : totalVolume}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Volume (kg)</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-lg font-semibold text-text-primary">{totalReps}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Reps</div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-border">
        <div className="grid grid-cols-2 gap-4 text-center text-xs">
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">{estimatedDuration}min</div>
            <div className="text-gray-500 dark:text-gray-400">Est. Duration</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">
              {intensityScore >= 10000 ? `${Math.round(intensityScore / 1000)}k` : Math.round(intensityScore)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Intensity</div>
          </div>
        </div>
      </div>

      {/* Exercise Breakdown (if space allows) */}
      {exercises.length <= 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-border">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Exercise Breakdown:</div>
          <div className="space-y-1">
            {exercises.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {item.exercise.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {item.sets.length} sets
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutAnalytics;
