import React, { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { ProgramSession, ProgramExercise } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import ExerciseHistoryPicker from './ExerciseHistoryPicker';
import ProgramExercisePicker from './ProgramExercisePicker';
import ExerciseDatabasePicker from './ExerciseDatabasePicker';
import ExerciseSearch from '@/features/exercises/ExerciseSearch';
import CopyFromPreviousSessionDialog from '@/features/exercises/CopyFromPreviousSessionDialog';
import ProgramAddExerciseOptions from './ProgramAddExerciseOptions';
import { usePersistedFormState } from '@/hooks/usePersistedState';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

interface SessionBuilderProps {
  onClose: () => void;
  onSave: (session: Omit<ProgramSession, 'userId'>) => void;
  initialSession?: Partial<ProgramSession>;
  sessionName?: string;
}

type ViewState = 'main' | 'exerciseSelection' | 'search' | 'programPicker' | 'copyPrevious' | 'history' | 'database';

interface SessionBuilderState {
  sessionName: string;
  sessionNotes: string;
  exercises: Exercise[];
}

const SessionBuilder: React.FC<SessionBuilderProps> = ({
  onClose,
  onSave,
  initialSession,
  sessionName = ''
}) => {
  // Use persisted state for the session builder
  const formId = initialSession?.id ? `session-builder-${initialSession.id}` : 'session-builder-new';
  const [persistedState, setPersistedState, clearPersistedState] = usePersistedFormState<SessionBuilderState>(
    formId,
    {
      sessionName: initialSession?.name || sessionName,
      sessionNotes: initialSession?.notes || '',
      exercises: initialSession?.exercises?.map(ex => ({
        id: ex.id,
        name: ex.name,
        type: 'strength' as const,
        category: 'compound' as const,
        primaryMuscles: [],
        secondaryMuscles: [],
        instructions: [],
        description: ex.notes || '',
        defaultUnit: 'kg' as const,
        metrics: { trackWeight: true, trackReps: true },
        activityType: ex.activityType || ActivityType.RESISTANCE
      })) || [],
    }
  );

  const [view, setView] = useState<ViewState>('main');

  // Helper function to get activity type display info
  const getActivityTypeInfo = (activityType?: ActivityType) => {
    const type = activityType || ActivityType.RESISTANCE;
    switch (type) {
      case ActivityType.RESISTANCE:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
      case ActivityType.SPORT:
        return { label: 'Sport', color: 'bg-green-600', textColor: 'text-green-100' };
      case ActivityType.STRETCHING:
        return { label: 'Stretching', color: 'bg-purple-600', textColor: 'text-purple-100' };
      case ActivityType.ENDURANCE:
        return { label: 'Endurance', color: 'bg-orange-600', textColor: 'text-orange-100' };
      case ActivityType.SPEED_AGILITY:
        return { label: 'Speed/Agility', color: 'bg-red-600', textColor: 'text-red-100' };
      case ActivityType.OTHER:
        return { label: 'Other', color: 'bg-gray-600', textColor: 'text-gray-100' };
      default:
        return { label: 'Resistance', color: 'bg-blue-600', textColor: 'text-blue-100' };
    }
  };

  // Use persisted state
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(persistedState.exercises);
  const [currentSessionName, setCurrentSessionName] = useState(persistedState.sessionName);
  const [sessionNotes, setSessionNotes] = useState(persistedState.sessionNotes);
  
  // Update persisted state whenever these values change
  useEffect(() => {
    setPersistedState({
      sessionName: currentSessionName,
      sessionNotes: sessionNotes,
      exercises: selectedExercises,
    });
  }, [currentSessionName, sessionNotes, selectedExercises, setPersistedState]);
  const [editingExerciseName, setEditingExerciseName] = useState<number | null>(null);
  const [tempExerciseName, setTempExerciseName] = useState('');
  const [lastAction, setLastAction] = useState<{
    type: 'reorder';
    data: Exercise[];
  } | null>(null);
  
  // UserId for CopyFromPreviousSessionDialog - must be at top level to avoid hooks violation
  const [userId, setUserId] = useState('');
  
  // Get userId from Firebase auth
  useEffect(() => {
    const getUserId = async () => {
      const { auth } = await import('@/services/firebase/config');
      return auth.currentUser?.uid || '';
    };
    getUserId().then(setUserId);
  }, []);

  // Exercise selection handlers - extract exercises from the objects
  const handleAddFromHistory = (exercises: { exercise: Exercise; sets: any[] }[]) => {
    const exercisesToAdd = exercises.map(item => item.exercise);
    setSelectedExercises(prev => [...prev, ...exercisesToAdd]);
    setView('main');
  };

  const handleAddFromPrograms = (exercises: { exercise: Exercise; sets: any[] }[]) => {
    const exercisesToAdd = exercises.map(item => item.exercise);
    setSelectedExercises(prev => [...prev, ...exercisesToAdd]);
    setView('main');
  };

  const handleAddFromDatabase = (exercises: { exercise: Exercise; sets: any[] }[]) => {
    const exercisesToAdd = exercises.map(item => item.exercise);
    setSelectedExercises(prev => [...prev, ...exercisesToAdd]);
    setView('main');
  };


  const handleExerciseSelect = (exercise: any) => {
    // Just add the exercise directly without sets editor
    setSelectedExercises(prev => [...prev, exercise]);
    setView('main');
  };



  // Exercise management utilities
  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const previousExercises = [...selectedExercises];
    const result = [...selectedExercises];
    if (direction === 'up' && index > 0) {
      [result[index], result[index - 1]] = [result[index - 1], result[index]];
    } else if (direction === 'down' && index < result.length - 1) {
      [result[index], result[index + 1]] = [result[index + 1], result[index]];
    }
    setLastAction({ type: 'reorder', data: previousExercises });
    setSelectedExercises(result);
  };

  const handleExerciseDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const previousExercises = [...selectedExercises];
    const newExercises = Array.from(selectedExercises);
    const [removed] = newExercises.splice(sourceIndex, 1);
    newExercises.splice(destIndex, 0, removed);

    setLastAction({ type: 'reorder', data: previousExercises });
    setSelectedExercises(newExercises);
    toast.success('Exercise reordered');
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'reorder') {
      setSelectedExercises(lastAction.data);
      setLastAction(null);
      toast.success('Undo successful');
    }
  };

  const handleEditExerciseName = (exerciseIndex: number) => {
    setTempExerciseName(selectedExercises[exerciseIndex].name);
    setEditingExerciseName(exerciseIndex);
  };

  const handleSaveExerciseName = () => {
    if (!tempExerciseName.trim()) {
      alert('Exercise name cannot be empty');
      return;
    }
    
    if (editingExerciseName !== null) {
      setSelectedExercises(prev => {
        const newExercises = [...prev];
        newExercises[editingExerciseName] = {
          ...newExercises[editingExerciseName],
          name: tempExerciseName.trim()
        };
        return newExercises;
      });
      setEditingExerciseName(null);
      setTempExerciseName('');
    }
  };

  const handleCancelExerciseNameEdit = () => {
    setEditingExerciseName(null);
    setTempExerciseName('');
  };

  const handleDuplicateExercise = (exerciseIndex: number) => {
    const exerciseToDuplicate = selectedExercises[exerciseIndex];
    const duplicatedExercise: Exercise = {
      ...exerciseToDuplicate,
      id: `${exerciseToDuplicate.id}-duplicate-${Date.now()}`,
      name: `${exerciseToDuplicate.name} (Copy)`
    };
    
    setSelectedExercises(prev => [
      ...prev.slice(0, exerciseIndex + 1),
      duplicatedExercise,
      ...prev.slice(exerciseIndex + 1)
    ]);
  };

  const handleSaveSession = async () => {
    if (!currentSessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    // Validate that all exercises have names
    const exercisesWithoutNames = selectedExercises.filter(item => !item.name?.trim());
    if (exercisesWithoutNames.length > 0) {
      alert(`Please ensure all exercises have names. Found ${exercisesWithoutNames.length} exercise(s) without names.`);
      return;
    }

    // Convert exercises to ProgramExercise format (exercise reference only)
    const exercises: ProgramExercise[] = selectedExercises.map((item, index) => {
      // Ensure we have a valid exercise ID (not temporary)
      let exerciseId = item.id;
      let exerciseRef: string | undefined;
      
      // If the ID starts with 'default-', 'imported-', or 'temp-', it's from the static database
      // In this case, we keep it as-is since these are valid references to the exercise data
      if (!exerciseId || exerciseId === '') {
        console.warn('[SessionBuilder] Exercise without ID detected:', item.name);
        exerciseId = `custom-${Date.now()}-${index}`;
      } else if (!exerciseId.startsWith('temp-') && !exerciseId.startsWith('default-') && !exerciseId.startsWith('imported-')) {
        // This is a Firestore document ID - create a reference path
        exerciseRef = `exercises/${exerciseId}`;
      }
      
      return {
        id: exerciseId,
        name: item.name,
        exerciseRef,
        order: index,
        notes: item.description || '',
        activityType: item.activityType || ActivityType.RESISTANCE // Default to RESISTANCE for backward compatibility
      };
    });

    const session: Omit<ProgramSession, 'userId'> = {
      id: initialSession?.id || '',
      name: currentSessionName.trim(),
      exercises,
      notes: sessionNotes.trim()
    };

    // Clear persisted form data after successful save
    clearPersistedState();
    console.log('[SessionBuilder] Cleared persisted form data');

    onSave(session);
  };

  // Conditional rendering for different views
  if (view === 'programPicker') {
    return (
      <ProgramExercisePicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromPrograms}
      />
    );
  }

  if (view === 'copyPrevious') {
    return (
      <CopyFromPreviousSessionDialog
        isOpen={true}
        onClose={() => setView('main')}
        currentDate={new Date()}
        onExercisesSelected={(exercises) => {
          // Convert ExerciseData to Exercise format
          const exercisesToAdd = exercises.map(ex => ({
            id: ex.id || `temp-${Date.now()}`,
            name: ex.exerciseName,
            type: 'strength' as const,
            category: 'compound' as const,
            primaryMuscles: [],
            secondaryMuscles: [],
            instructions: [],
            description: '',
            defaultUnit: 'kg' as const,
            metrics: { trackWeight: true, trackReps: true },
            activityType: ex.activityType || ActivityType.RESISTANCE // Use stored activityType or default to RESISTANCE
          }));
          setSelectedExercises(prev => [...prev, ...exercisesToAdd]);
          setView('main');
        }}
        userId={userId}
      />
    );
  }

  if (view === 'history') {
    return (
      <ExerciseHistoryPicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromHistory}
      />
    );
  }

  if (view === 'database') {
    return (
      <ExerciseDatabasePicker
        onClose={() => setView('main')}
        onSelectExercises={handleAddFromDatabase}
      />
    );
  }

  if (view === 'search') {
    return (
      <ExerciseSearch
        onClose={() => setView('main')}
        onSelectExercise={handleExerciseSelect}
      />
    );
  }

  if (view === 'exerciseSelection') {
    return (
      <ProgramAddExerciseOptions
        onClose={() => setView('main')}
        onAddExercises={(items) => {
          const exercisesToAdd = items.map(item => item.exercise);
          setSelectedExercises(prev => [...prev, ...exercisesToAdd]);
          setView('main');
        }}
        onOpenProgramPicker={() => setView('programPicker')}
        onOpenCopyPrevious={() => setView('copyPrevious')}
        onOpenHistory={() => {}} // No longer used
        onOpenDatabase={() => {}} // No longer used
      />
    );
  }

  // Main session builder view
  return (
    <div className="fixed inset-0 bg-black z-[80] flex flex-col">
      {/* Breadcrumb */}
      <div className="bg-[#0f0f0f] px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Programs</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Program</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white">{initialSession ? 'Edit Session' : 'New Session'}</span>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm border-b border-white/10 min-h-[64px] flex-shrink-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-medium truncate">Session Builder</h1>
        </div>
        
        <button
          onClick={handleSaveSession}
          className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors font-medium flex-shrink-0 ml-4"
        >
          Save Session
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 min-h-0 bg-black">
        {/* Session Details */}
        <div className="mb-6 space-y-4 max-w-full max-w-4xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Name
            </label>
            <input
              type="text"
              value={currentSessionName}
              onChange={(e) => setCurrentSessionName(e.target.value)}
              placeholder="Enter session name"
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Add any notes for this session..."
              rows={3}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#8B5CF6] resize-none"
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-white">Exercises</h2>
              {lastAction && (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Undo last action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </button>
              )}
            </div>
            <button
              onClick={() => setView('exerciseSelection')}
              className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors border border-white/10 flex-shrink-0"
            >
              Add Exercise
            </button>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-white/10">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                No exercises added yet
              </div>
              <button
                onClick={() => setView('exerciseSelection')}
                className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors font-medium"
              >
                Add First Exercise
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleExerciseDragEnd}>
              <Droppable droppableId="exercises">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-purple-500/5 rounded-xl p-2' : ''
                    }`}
                  >
                    {selectedExercises.map((exercise, exerciseIndex) => (
                      <Draggable key={`${exercise.id}-${exerciseIndex}`} draggableId={`${exercise.id}-${exerciseIndex}`} index={exerciseIndex}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-[#1a1a1a] rounded-xl border p-4 transition-all ${
                              snapshot.isDragging
                                ? 'border-purple-500 shadow-2xl shadow-purple-500/20 scale-102'
                                : 'border-white/10'
                            }`}
                          >
                            {/* Exercise Header */}
                            <div className="flex items-start justify-between gap-3">
                              {/* Drag Handle + Exercise Info */}
                              <div 
                                {...provided.dragHandleProps}
                                className="flex items-start gap-3 flex-1 min-w-0 cursor-move group"
                              >
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex-shrink-0 mt-1">
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingExerciseName === exerciseIndex ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={tempExerciseName}
                                        onChange={(e) => setTempExerciseName(e.target.value)}
                                        className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/10 rounded text-white text-lg font-medium focus:outline-none focus:border-[#8B5CF6]"
                                        autoFocus
                                      />
                                      <button
                                        onClick={handleSaveExerciseName}
                                        className="p-1 hover:bg-white/10 rounded text-green-400 flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={handleCancelExerciseNameEdit}
                                        className="p-1 hover:bg-white/10 rounded text-red-400 flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEditExerciseName(exerciseIndex)}
                                      className="text-left hover:bg-white/5 rounded p-1 -m-1 transition-colors w-full"
                                    >
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="text-lg font-medium text-white break-words">{exercise.name}</h3>
                                        <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor}`}>
                                          {getActivityTypeInfo(exercise.activityType).label}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-400">Sets and reps will be logged during workout</p>
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Exercise Controls */}
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                {/* Move Up */}
                                {exerciseIndex > 0 && (
                                  <button
                                    onClick={() => moveExercise(exerciseIndex, 'up')}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    title="Move up"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                )}
                                
                                {/* Move Down */}
                                {exerciseIndex < selectedExercises.length - 1 && (
                                  <button
                                    onClick={() => moveExercise(exerciseIndex, 'down')}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    title="Move down"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                                
                                {/* Duplicate */}
                                <button
                                  onClick={() => handleDuplicateExercise(exerciseIndex)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                  title="Duplicate exercise"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                
                                {/* Delete */}
                                <button
                                  onClick={() => handleRemoveExercise(exerciseIndex)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                  title="Remove exercise"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </main>
    </div>
  );
};

export default SessionBuilder;
