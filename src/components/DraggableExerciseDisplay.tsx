import React, { useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ExerciseData } from '../services/exerciseDataService';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { SupersetGroup } from '../types/session';
import { useSupersets } from '../context/SupersetContext';
import ExerciseCard from './ExerciseCard';
import SupersetActionsButton from './SupersetActionsButton';

interface DraggableExerciseDisplayProps {
  exercises: UnifiedExerciseData[];
  onEditExercise: (exercise: UnifiedExerciseData) => void;
  onDeleteExercise: (exercise: UnifiedExerciseData) => void;
  onReorderExercises: (exercises: UnifiedExerciseData[]) => void;
}

const DraggableExerciseDisplay: React.FC<DraggableExerciseDisplayProps> = ({
  exercises,
  onEditExercise,
  onDeleteExercise,
  onReorderExercises
}) => {
  const { state, updateExerciseOrder } = useSupersets();

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Call the parent component's reorder handler
    onReorderExercises(items);
    
    // Update exercise order in the superset context
    const exerciseIds = items.map(exercise => exercise.id || '').filter(id => id !== '');
    updateExerciseOrder(exerciseIds);
  };
  
  // Effect to update exercise IDs in the superset context when exercises change
  useEffect(() => {
    const exerciseIds = exercises.map(exercise => exercise.id || '').filter(id => id !== '');
    if (exerciseIds.length > 0) {
      updateExerciseOrder(exerciseIds);
    }
  }, [exercises, updateExerciseOrder]);
  
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
      
      superset.exerciseIds.forEach(exerciseId => {
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex !== -1) {
          supersetExercises.push(exercises[exerciseIndex]);
          supersetIndices.push(exerciseIndex);
          processedExerciseIds.add(exerciseId);
        }
      });
      
      if (supersetExercises.length > 0) {
        groups.push({
          superset,
          exercises: supersetExercises,
          originalIndices: supersetIndices
        });
      }
    });
    
    // Add remaining individual exercises
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="exercises">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-6"
          >
            {groupedExercises.map((group, groupIndex) => (
              <Draggable
                key={group.exercises[0].id || `group-${groupIndex}`}
                draggableId={group.exercises[0].id || `group-${groupIndex}`}
                index={groupIndex}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`transition-all duration-200 ${
                      snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
                    }`}
                  >
                    {/* Drag handle without hashtag number */}
                    <div
                      {...provided.dragHandleProps}
                      className="mb-2 flex justify-center relative"
                    >
                      <div className="w-12 h-1 bg-gray-400 rounded-full hover:bg-gray-300 cursor-grab active:cursor-grabbing"></div>
                    </div>
                    
                    {group.superset ? (
                      // More integrated superset styling
                      <div className="relative bg-[#1a1a1a] border-l-4 border-[#2196F3] rounded-lg p-3 shadow-md mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#2196F3] rounded-full"></div>
                            <h3 className="text-sm font-medium text-white flex items-center">
                              <span className="text-[#2196F3]">Superset:</span>
                              <span className="ml-1">{group.superset.name}</span>
                              <span className="ml-2 text-xs text-[#2196F3]/70">
                                ({group.exercises.length})
                              </span>
                            </h3>
                          </div>
                          {group.exercises[0]?.id && (
                            <div className="flex items-center">
                              <SupersetActionsButton exerciseId={group.exercises[0].id} />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {group.exercises.map((exercise, exerciseIndex) => (
                            <div key={exercise.id || exerciseIndex} className="relative">
                              {/* Simpler connection line */}
                              {exerciseIndex < group.exercises.length - 1 && (
                                <div className="absolute -bottom-2 left-4 h-3 w-0.5 bg-[#2196F3]/40"></div>
                              )}
                              
                              <div className="transition-all duration-200 hover:bg-black/20 rounded-lg">
                                <ExerciseCard
                                  exercise={exercise}
                                  exerciseNumber={groupIndex + 1}
                                  subNumber={exerciseIndex + 1}
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
                      // Individual exercise with simpler styling
                      <div className="border-l-4 border-white/20 rounded-lg shadow-sm mb-4">
                        <ExerciseCard
                          exercise={group.exercises[0]}
                          exerciseNumber={groupIndex + 1}
                          onEdit={() => onEditExercise(group.exercises[0])}
                          onDelete={() => onDeleteExercise(group.exercises[0])}
                          showActions={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableExerciseDisplay;
