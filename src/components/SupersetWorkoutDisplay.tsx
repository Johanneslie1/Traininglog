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

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No exercises logged yet. Start by adding your first exercise!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedExercises.map((group, groupIndex) => (
        <div key={group.exercises[0].id || `group-${groupIndex}`} className="transition-all duration-200">
          {group.superset ? (
            // Superset group with enhanced visual styling
            <div className="relative bg-gradient-to-r from-[#2196F3]/15 to-[#2196F3]/10 border-2 border-[#2196F3] rounded-xl p-6 shadow-lg shadow-[#2196F3]/20">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-t-xl"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#2196F3] rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-white">{group.superset.name}</h3>
                  <span className="text-sm px-2 py-1 bg-[#2196F3]/20 text-[#2196F3] rounded-full">
                    {group.exercises.length} exercises
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1a3 3 0 004.24-4.24l-1.1-1.102z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                {group.exercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id || exerciseIndex} className="relative">
                    {/* Enhanced connection line for superset flow */}
                    {exerciseIndex < group.exercises.length - 1 && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-gradient-to-b from-[#2196F3] to-[#1976D2]"></div>
                        <div className="w-2 h-2 bg-[#2196F3] rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                      <ExerciseCard
                        exercise={exercise}
                        exerciseNumber={group.originalIndices[exerciseIndex] + 1}
                        onEdit={() => onEditExercise(exercise)}
                        onDelete={() => onDeleteExercise(exercise)}
                        showActions={true}
                      />
                    </div>
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
