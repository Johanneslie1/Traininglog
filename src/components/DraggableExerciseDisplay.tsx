import React, { useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ExerciseData } from '../services/exerciseDataService';
import { SupersetGroup } from '../types/session';
import { useSupersets } from '../context/SupersetContext';
import ExerciseCard from './ExerciseCard';
import SupersetActionsButton from './SupersetActionsButton';

interface DraggableExerciseDisplayProps {
  exercises: ExerciseData[];
  onEditExercise: (exercise: ExerciseData) => void;
  onDeleteExercise: (exercise: ExerciseData) => void;
  onReorderExercises: (exercises: ExerciseData[]) => void;
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
                      // Superset group with enhanced visual styling
                      <div className="relative bg-gradient-to-r from-[#2196F3]/20 to-[#2196F3]/15 border-3 border-[#2196F3] rounded-xl p-6 shadow-lg shadow-[#2196F3]/25 mb-8">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-t-xl"></div>
                        <div className="absolute -top-3 left-4 px-3 py-1 bg-[#2196F3] text-white text-xs rounded-full font-medium">
                          SUPERSET
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-[#2196F3] rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-semibold text-white">{group.superset.name}</h3>
                            <span className="text-sm px-2 py-1 bg-[#2196F3]/20 text-[#2196F3] rounded-full">
                              {group.exercises.length} exercises
                            </span>
                          </div>
                          {group.exercises[0]?.id && (
                            <div className="flex items-center gap-2">
                              <SupersetActionsButton exerciseId={group.exercises[0].id} />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-6">
                          {group.exercises.map((exercise, exerciseIndex) => (
                            <div key={exercise.id || exerciseIndex} className="relative">
                              {/* Enhanced connection line for superset flow */}
                              {exerciseIndex < group.exercises.length - 1 && (
                                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                                  <div className="w-1 h-6 bg-gradient-to-b from-[#2196F3] to-[#1976D2]"></div>
                                  <div className="w-3 h-3 bg-[#2196F3] rounded-full"></div>
                                </div>
                              )}
                              
                              <div className="transform transition-all duration-200 hover:scale-[1.01] border border-[#2196F3]/30 rounded-xl p-1">
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
                      // Individual exercise with enhanced styling
                      <div className="border-2 border-white/20 rounded-xl shadow-md mb-6">
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
