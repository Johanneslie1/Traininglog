import React from 'react';
import { ExerciseData } from '@/services/exerciseDataService';
import { SupersetGroup } from '@/types/session';
import { useSupersets } from '@/context/SupersetContext';
import ExerciseCard from '@/components/ExerciseCard';

interface SupersetWorkoutDisplayProps {
  exercises: ExerciseData[];
  onEditExercise: (exercise: ExerciseData) => void;
  onDeleteExercise: (exercise: ExerciseData) => void;
}

const SupersetWorkoutDisplay: React.FC<SupersetWorkoutDisplayProps> = ({
  exercises,
  onEditExercise,
  onDeleteExercise
}) => {
  const { state } = useSupersets();
  
  // Group exercises by supersets
  const groupedExercises = React.useMemo(() => {
    const groups: {
      superset: SupersetGroup | null;
      exercises: ExerciseData[];
      originalIndices: number[]; // Track original indices for numbering
    }[] = [];
    
    const processedExerciseIds = new Set<string>();
    
    // Process supersets first
    state.supersets.forEach(superset => {
      const supersetExercises: ExerciseData[] = [];
      const supersetIndices: number[] = [];
      
      exercises.forEach((ex, index) => {
        if (ex.id && superset.exerciseIds.includes(ex.id)) {
          supersetExercises.push(ex);
          supersetIndices.push(index);
        }
      });
      
      if (supersetExercises.length > 0) {
        groups.push({
          superset,
          exercises: supersetExercises,
          originalIndices: supersetIndices
        });
        
        supersetExercises.forEach(ex => {
          if (ex.id) processedExerciseIds.add(ex.id);
        });
      }
    });
    
    // Add individual exercises
    exercises.forEach((ex, index) => {
      if (ex.id && !processedExerciseIds.has(ex.id)) {
        groups.push({
          superset: null,
          exercises: [ex],
          originalIndices: [index]
        });
      }
    });
    
    return groups;
  }, [exercises, state.supersets]);

  return (
    <div className="space-y-6">
      {groupedExercises.map((group, groupIndex) => (
        <div key={groupIndex}>
          {group.superset ? (
            // Superset group
            <div className="bg-[#2196F3]/10 border border-[#2196F3] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#2196F3] rounded-full"></div>
                  <h3 className="text-lg font-semibold text-white">{group.superset.name}</h3>
                  <span className="text-sm text-gray-400">
                    {group.exercises.length} exercises
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                {group.exercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id || exerciseIndex} className="relative">
                    {/* Connection line for superset flow */}
                    {exerciseIndex < group.exercises.length - 1 && (
                      <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-[#2196F3] opacity-60"></div>
                    )}
                    
                    <ExerciseCard
                      exercise={exercise}
                      exerciseNumber={group.originalIndices[exerciseIndex] + 1}
                      onEdit={() => onEditExercise(exercise)}
                      onDelete={() => onDeleteExercise(exercise)}
                      showActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Individual exercise
            <ExerciseCard
              exercise={group.exercises[0]}
              exerciseNumber={group.originalIndices[0] + 1}
              onEdit={() => onEditExercise(group.exercises[0])}
              onDelete={() => onDeleteExercise(group.exercises[0])}
              showActions={true}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SupersetWorkoutDisplay;
