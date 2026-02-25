import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart, DragUpdate } from '@hello-pangea/dnd';
import { ExerciseData } from '../services/exerciseDataService';
import { UnifiedExerciseData } from '../utils/unifiedExerciseUtils';
import { SupersetGroup } from '../types/session';
import { useSupersets } from '../context/SupersetContext';
import { 
  loadHiddenExercises, 
  toggleExerciseVisibility as toggleVisibility,
  cleanupHiddenExercises 
} from '../utils/hiddenExercisesStorage';
import ExerciseCard from './ExerciseCard';
import SupersetActionsButton from './SupersetActionsButton';
import toast from 'react-hot-toast';
import { OneRepMaxPrediction } from '@/utils/oneRepMax';

// Haptic feedback utility
const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const durations = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(durations[intensity]);
  }
};

interface DraggableExerciseDisplayProps {
  exercises: UnifiedExerciseData[];
  onEditExercise: (exercise: UnifiedExerciseData) => void;
  onDeleteExercise: (exercise: UnifiedExerciseData) => void;
  onReorderExercises: (exercises: UnifiedExerciseData[]) => void;
  oneRepMaxByExerciseKey?: Record<string, OneRepMaxPrediction>;
  getPerformanceKey: (exercise: UnifiedExerciseData) => string;
  listId?: string;
  compactMode?: boolean;
}

const DraggableExerciseDisplay: React.FC<DraggableExerciseDisplayProps> = ({
  exercises,
  onEditExercise,
  onDeleteExercise,
  onReorderExercises,
  oneRepMaxByExerciseKey = {},
  getPerformanceKey,
  listId = 'main',
  compactMode = false
}) => {
  const { state, updateExerciseOrder } = useSupersets();

  const getExerciseLocalKey = useCallback((exercise: UnifiedExerciseData, index: number) => {
    if (exercise.id) {
      return exercise.id;
    }

    const timestampValue = exercise.timestamp
      ? new Date(exercise.timestamp as Date | string | number).getTime()
      : 'no-time';

    return [
      listId,
      exercise.exerciseName || 'unnamed',
      exercise.activityType || 'resistance',
      timestampValue,
      index
    ].join('-');
  }, [listId]);
  
  // Initialize hidden exercises from localStorage
  const [hiddenExercises, setHiddenExercises] = useState<Set<string>>(loadHiddenExercises);
  
  // Drag state for visual feedback
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Store previous order for undo functionality
  const previousOrderRef = useRef<UnifiedExerciseData[] | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const lastSyncedOrderKeyRef = useRef<string>('');

  // Handle drag start
  const handleDragStart = (_start: DragStart) => {
    setIsDragging(true);
    // Store current order before drag
    previousOrderRef.current = [...exercises];
    // Trigger haptic feedback on drag start
    triggerHapticFeedback('medium');
  };

  // Handle drag update for drop zone highlighting
  const handleDragUpdate = (update: DragUpdate) => {
    if (update.destination) {
      setDragOverIndex(update.destination.index);
    } else {
      setDragOverIndex(null);
    }
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDragOverIndex(null);
    
    if (!result.destination) return;
    
    // Skip if dropped in same position
    if (result.source.index === result.destination.index) {
      previousOrderRef.current = null;
      return;
    }
    
    const items = Array.from(exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Trigger haptic feedback on successful drop
    triggerHapticFeedback('heavy');
    
    // Call the parent component's reorder handler
    onReorderExercises(items);
    
    // Update exercise order in the superset context
    const exerciseIds = items.map(exercise => exercise.id || '').filter(id => id !== '');
    updateExerciseOrder(exerciseIds);
    
    // Enable undo
    setCanUndo(true);
  };

  // Undo last reorder
  const handleUndo = useCallback(() => {
    if (previousOrderRef.current) {
      onReorderExercises(previousOrderRef.current);
      const exerciseIds = previousOrderRef.current.map(exercise => exercise.id || '').filter(id => id !== '');
      updateExerciseOrder(exerciseIds);
      previousOrderRef.current = null;
      setCanUndo(false);
      toast.success('Reorder undone');
      triggerHapticFeedback('light');
    }
  }, [onReorderExercises, updateExerciseOrder]);
  
  // Auto-hide undo after 10 seconds
  useEffect(() => {
    if (canUndo) {
      const timer = setTimeout(() => {
        setCanUndo(false);
        previousOrderRef.current = null;
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [canUndo]);

  // Toggle exercise visibility
  const toggleExerciseVisibility = (exerciseId: string) => {
    setHiddenExercises(prev => toggleVisibility(exerciseId, prev));
  };
  
  // Effect to update exercise IDs in the superset context when exercises change
  useEffect(() => {
    if (listId !== 'main') {
      return;
    }

    const exerciseIds = exercises.map(exercise => exercise.id || '').filter(id => id !== '');
    const orderKey = exerciseIds.join('|');

    if (exerciseIds.length > 0 && orderKey !== lastSyncedOrderKeyRef.current) {
      lastSyncedOrderKeyRef.current = orderKey;
      updateExerciseOrder(exerciseIds);
    }
  }, [exercises, updateExerciseOrder, listId]);

  // Effect to clean up hidden state for deleted exercises
  useEffect(() => {
    const currentExerciseIds = new Set(exercises.map(ex => ex.id || '').filter(id => id !== ''));
    const hiddenIds = Array.from(hiddenExercises);
    const hasStaleIds = hiddenIds.some(id => !currentExerciseIds.has(id));
    
    if (hasStaleIds) {
      setHiddenExercises(prev => cleanupHiddenExercises(prev, currentExerciseIds));
    }
  }, [exercises, hiddenExercises]);
  
  // Group exercises by supersets
  const groupedExercises = React.useMemo(() => {
    const groups: {
      superset: SupersetGroup | null;
      exercises: ExerciseData[];
      originalIndices: number[]; // Track original indices for numbering
      groupKey: string;
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
          originalIndices: supersetIndices,
          groupKey: `superset-${superset.id}`
        });
      }
    });
    
    // Add remaining individual exercises
    exercises.forEach((ex, index) => {
      const localKey = getExerciseLocalKey(ex, index);

      if (!ex.id || !processedExerciseIds.has(ex.id)) {
        groups.push({
          superset: null,
          exercises: [ex],
          originalIndices: [index],
          groupKey: localKey
        });
      }
    });
    
    return groups;
  }, [exercises, getExerciseLocalKey, state.supersets]);

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-text-tertiary">
        <p>No exercises logged yet. Start by adding your first exercise!</p>
      </div>
    );
  }  return (
    <>
      {/* Undo button - shows after reorder */}
      {canUndo && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-full shadow-lg hover:bg-bg-tertiary transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-sm">Undo reorder</span>
          </button>
        </div>
      )}
      
      <DragDropContext 
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId={`exercises-${listId}`}>
          {(provided, droppableSnapshot) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-6 transition-colors duration-200 ${
                droppableSnapshot.isDraggingOver ? 'bg-accent-primary/5 rounded-lg' : ''
              }`}
            >
              {groupedExercises.map((group, groupIndex) => {
                const isDropTarget = isDragging && dragOverIndex === groupIndex;
                const draggableKey = `${listId}-${group.groupKey}`;
                
                return (
                  <Draggable
                    key={draggableKey}
                    draggableId={draggableKey}
                    index={groupIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'scale-105 shadow-2xl z-50 rotate-1' 
                            : isDropTarget 
                              ? 'border-t-2 border-accent-primary pt-2' 
                              : ''
                        }`}
                      >
                        {/* Drag handle - small bar at the top of each exercise */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex justify-center py-1 cursor-grab active:cursor-grabbing touch-manipulation"
                          aria-label={`Hold and drag to reorder exercise ${groupIndex + 1}`}
                        >
                          <div className={`w-10 h-1 rounded-full transition-colors ${
                            snapshot.isDragging ? 'bg-accent-primary' : 'bg-gray-500'
                          }`} />
                        </div>
                        
                        {group.superset ? (
                          // More integrated superset styling
                          <div className="relative bg-bg-secondary border-l-4 border-[#2196F3] rounded-lg p-3 shadow-md mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <h3 className="text-sm font-medium text-text-primary flex items-center">
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
                                    <div className="absolute -bottom-2 left-4 h-3 w-0.5 bg-blue-500/40"></div>
                                  )}
                                  
                                  <div className="transition-all duration-200 hover:bg-black/20 rounded-lg">
                                    <ExerciseCard
                                      exercise={exercise}
                                      oneRepMaxPrediction={oneRepMaxByExerciseKey[getPerformanceKey(exercise)]}
                                      exerciseNumber={groupIndex + 1}
                                      subNumber={exerciseIndex + 1}
                                      forceCompact={compactMode}
                                      onEdit={() => onEditExercise(exercise)}
                                      onDelete={() => onDeleteExercise(exercise)}
                                      showActions={true}
                                      isHidden={hiddenExercises.has(getExerciseLocalKey(exercise, group.originalIndices[exerciseIndex] ?? exerciseIndex))}
                                      onToggleVisibility={() => toggleExerciseVisibility(getExerciseLocalKey(exercise, group.originalIndices[exerciseIndex] ?? exerciseIndex))}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Individual exercise with simpler styling
                          <div className="border-l-4 border-border rounded-lg shadow-sm mb-4">
                            <ExerciseCard
                              exercise={group.exercises[0]}
                              oneRepMaxPrediction={oneRepMaxByExerciseKey[getPerformanceKey(group.exercises[0])]}
                              exerciseNumber={groupIndex + 1}
                              forceCompact={compactMode}
                              onEdit={() => onEditExercise(group.exercises[0])}
                              onDelete={() => onDeleteExercise(group.exercises[0])}
                              showActions={true}
                              isHidden={hiddenExercises.has(getExerciseLocalKey(group.exercises[0], group.originalIndices[0] ?? groupIndex))}
                              onToggleVisibility={() => toggleExerciseVisibility(getExerciseLocalKey(group.exercises[0], group.originalIndices[0] ?? groupIndex))}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default DraggableExerciseDisplay;
