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
import { buildSupersetDisplayTitle, buildSupersetLabels } from '@/utils/supersetUtils';
import { EmptyState } from '@/components/ui';

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
  listId?: string;
  compactMode?: boolean;
}

const DragHandleIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <span
    className={`flex w-3 flex-col items-center gap-0.5 ${active ? 'text-accent-primary' : 'text-text-tertiary'}`}
    aria-hidden
  >
    <span className="h-0.5 w-3 rounded-full bg-current" />
    <span className="h-0.5 w-3 rounded-full bg-current" />
    <span className="h-0.5 w-3 rounded-full bg-current" />
  </span>
);

const DraggableExerciseDisplay: React.FC<DraggableExerciseDisplayProps> = ({
  exercises,
  onEditExercise,
  onDeleteExercise,
  onReorderExercises,
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

  // Handle drag end event — indices are group rows (exercise or whole superset)
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDragOverIndex(null);
    
    if (!result.destination) return;
    
    // Skip if dropped in same position
    if (result.source.index === result.destination.index) {
      previousOrderRef.current = null;
      return;
    }
    
    const reorderedGroups = Array.from(groupedExercises);
    const [movedGroup] = reorderedGroups.splice(result.source.index, 1);
    reorderedGroups.splice(result.destination.index, 0, movedGroup);
    const items = reorderedGroups.flatMap((group) => group.exercises);
    
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
  const exerciseOrder = React.useMemo(
    () => exercises.map((exercise) => exercise.id).filter((id): id is string => Boolean(id)),
    [exercises]
  );

  const labelsByExerciseId = React.useMemo(
    () => buildSupersetLabels(state.supersets, exerciseOrder),
    [state.supersets, exerciseOrder]
  );

  const groupedExercises = React.useMemo(() => {
    const groups: {
      superset: SupersetGroup | null;
      exercises: ExerciseData[];
      originalIndices: number[]; // Track original indices for numbering
      groupKey: string;
    }[] = [];
    
    const processedExerciseIds = new Set<string>();
    
    const sortedSupersets = [...state.supersets].sort((a, b) => {
      const aFirstExerciseId = a.exerciseIds.find((exerciseId) => labelsByExerciseId[exerciseId]);
      const bFirstExerciseId = b.exerciseIds.find((exerciseId) => labelsByExerciseId[exerciseId]);
      const aIndex = aFirstExerciseId ? labelsByExerciseId[aFirstExerciseId]?.supersetIndex ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const bIndex = bFirstExerciseId ? labelsByExerciseId[bFirstExerciseId]?.supersetIndex ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    });

    // Process supersets first
    sortedSupersets.forEach(superset => {
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
  }, [exercises, getExerciseLocalKey, labelsByExerciseId, state.supersets]);

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-bg-secondary">
        <EmptyState
          illustration="workout"
          title="No exercises logged yet"
          description="Start by adding your first exercise."
        />
      </div>
    );
  }

  return (
    <>
      {/* Undo button - shows after reorder */}
      {canUndo && (
        <div className="fixed bottom-app-floating left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <button
            onClick={handleUndo}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-bg-secondary px-4 py-2 text-text-primary transition-colors hover:bg-bg-tertiary"
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
              className={`rounded-2xl border border-border bg-bg-secondary transition-all duration-200 ${
                droppableSnapshot.isDraggingOver ? 'ring-2 ring-accent-primary/40' : ''
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
                        className={`border-b border-border last:border-b-0 transition-colors ${
                          snapshot.isDragging 
                            ? 'z-50 rounded-xl bg-bg-secondary ring-2 ring-accent-primary' 
                            : isDropTarget 
                              ? 'bg-accent-primary/10' 
                              : ''
                        }`}
                      >
                        <div className="flex items-stretch gap-1 px-2">
                          <button
                            type="button"
                            {...provided.dragHandleProps}
                            className="flex shrink-0 cursor-grab touch-manipulation items-center justify-center self-stretch px-1.5 py-3 active:cursor-grabbing"
                            aria-label={`Hold and drag to reorder exercise ${groupIndex + 1}`}
                          >
                            <DragHandleIcon active={snapshot.isDragging} />
                          </button>

                          <div className="min-w-0 flex-1 py-0.5">
                            {group.superset ? (
                              <div className="relative my-1 rounded-xl border-l-2 border-l-accent-primary pl-2">
                                <div className="mb-0.5 flex items-center justify-between gap-2 px-1 pt-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-semibold text-accent-primary">
                                      {buildSupersetDisplayTitle(group.superset, labelsByExerciseId)}
                                    </h3>
                                    <span className="text-[11px] text-text-tertiary">
                                      {group.exercises.length}
                                    </span>
                                  </div>
                                  {group.exercises[0]?.id && (
                                    <SupersetActionsButton exerciseId={group.exercises[0].id} />
                                  )}
                                </div>

                                <div className="divide-y divide-border/70">
                                  {group.exercises.map((exercise, exerciseIndex) => (
                                    <ExerciseCard
                                      key={exercise.id || exerciseIndex}
                                      exercise={exercise}
                                      variant="logRow"
                                      supersetLabel={exercise.id ? labelsByExerciseId[exercise.id]?.label : undefined}
                                      forceCompact={compactMode}
                                      onEdit={() => onEditExercise(exercise)}
                                      onDelete={() => onDeleteExercise(exercise)}
                                      showActions={true}
                                      isHidden={hiddenExercises.has(getExerciseLocalKey(exercise, group.originalIndices[exerciseIndex] ?? exerciseIndex))}
                                      onToggleVisibility={() => toggleExerciseVisibility(getExerciseLocalKey(exercise, group.originalIndices[exerciseIndex] ?? exerciseIndex))}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <ExerciseCard
                                exercise={group.exercises[0]}
                                variant="logRow"
                                exerciseNumber={groupIndex + 1}
                                forceCompact={compactMode}
                                onEdit={() => onEditExercise(group.exercises[0])}
                                onDelete={() => onDeleteExercise(group.exercises[0])}
                                showActions={true}
                                isHidden={hiddenExercises.has(getExerciseLocalKey(group.exercises[0], group.originalIndices[0] ?? groupIndex))}
                                onToggleVisibility={() => toggleExerciseVisibility(getExerciseLocalKey(group.exercises[0], group.originalIndices[0] ?? groupIndex))}
                              />
                            )}
                          </div>
                        </div>
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
