import React, { useState, useEffect } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { PlusIcon, BookmarkIcon, TrashIcon, PencilIcon, MenuIcon } from '@heroicons/react/outline';
import SessionBuilder from './SessionBuilder';
import { auth } from '@/services/firebase/config';
import { usePersistedFormState } from '@/hooks/usePersistedState';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { buildSupersetDisplayTitle, buildSupersetLabels } from '@/utils/supersetUtils';
import { ActivityBadge, Button, EmptyState, InlineErrorState, MetricChip } from '@/components/ui';

interface ProgramBuilderProps {
  onClose: () => void;
  onSave: (program: Omit<Program, 'id' | 'userId'>) => void;
  initialProgram?: Partial<Program>;
}

interface ProgramBuilderState {
  programName: string;
  programDescription: string;
  sessions: ProgramSession[];
}

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  onClose,
  onSave,
  initialProgram
}) => {
  // Use persisted state for the entire form
  const formId = initialProgram?.id ? `program-builder-${initialProgram.id}` : 'program-builder-new';
  const [persistedState, setPersistedState, clearPersistedState] = usePersistedFormState<ProgramBuilderState>(
    formId,
    {
      programName: initialProgram?.name || '',
      programDescription: initialProgram?.description || '',
      sessions: initialProgram?.sessions || [],
    }
  );

  const [programName, setProgramName] = useState(persistedState.programName);
  const [programDescription, setProgramDescription] = useState(persistedState.programDescription);
  const [sessions, setSessions] = useState<ProgramSession[]>(persistedState.sessions);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'reorderSessions' | 'moveExercise';
    data: any;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update persisted state whenever form values change
  useEffect(() => {
    setPersistedState({
      programName,
      programDescription,
      sessions,
    });
  }, [programName, programDescription, sessions, setPersistedState]);

  // Helper function to get activity type display info
  const getActivityTypeInfo = (activityType?: ActivityType) => {
    const type = normalizeActivityType(activityType);
    switch (type) {
      case ActivityType.RESISTANCE:
        return { label: 'Resistance', color: 'bg-activity-resistance', textColor: 'text-text-on-accent' };
      case ActivityType.SPORT:
        return { label: 'Sport', color: 'bg-activity-sport', textColor: 'text-text-on-accent' };
      case ActivityType.STRETCHING:
        return { label: 'Stretching', color: 'bg-activity-stretching', textColor: 'text-text-on-accent' };
      case ActivityType.ENDURANCE:
        return { label: 'Endurance', color: 'bg-activity-endurance', textColor: 'text-text-on-accent' };
      case ActivityType.SPEED_AGILITY:
        return { label: 'Speed/Agility', color: 'bg-activity-speed', textColor: 'text-text-on-accent' };
      case ActivityType.OTHER:
        return { label: 'Other', color: 'bg-activity-other', textColor: 'text-text-on-accent' };
      default:
        return { label: 'Resistance', color: 'bg-activity-resistance', textColor: 'text-text-on-accent' };
    }
  };

  // Analyze program composition
  const getProgramAnalytics = () => {
    const activityCounts: Record<string, number> = {};
    let totalExercises = 0;
    const uniqueTypes = new Set<ActivityType>();

    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const type = normalizeActivityType(exercise.activityType);
        activityCounts[type] = (activityCounts[type] || 0) + 1;
        uniqueTypes.add(type);
        totalExercises++;
      });
    });

    return {
      activityCounts,
      totalExercises,
      uniqueTypes: Array.from(uniqueTypes),
      isBalanced: uniqueTypes.size >= 2,
      resistanceOnly: uniqueTypes.size === 1 && uniqueTypes.has(ActivityType.RESISTANCE)
    };
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setShowSessionBuilder(true);
  };

  const handleEditSession = (session: ProgramSession) => {
    setEditingSession(session);
    setShowSessionBuilder(true);
  };

  const handleSaveSession = (sessionData: Omit<ProgramSession, 'userId'>) => {
    const user = auth.currentUser;
    if (!user) return;

    const session: ProgramSession = {
      ...sessionData,
      userId: user.uid
    };

    console.log('[ProgramBuilder] Saving session:', {
      sessionId: session.id,
      sessionName: session.name,
      exerciseCount: session.exercises.length,
      exercises: session.exercises.map(ex => ({ id: ex.id, name: ex.name, exerciseRef: ex.exerciseRef })),
      isEditing: !!editingSession
    });

    if (editingSession) {
      // Update existing session
      setSessions(prev => prev.map(s => s.id === editingSession.id ? session : s));
      console.log('[ProgramBuilder] Updated existing session');
    } else {
      // Add new session with a temporary ID that will be replaced on save
      const sessionWithId = {
        ...session,
        id: session.id || `temp-session-${Date.now()}`
      };
      setSessions(prev => {
        const newSessions = [...prev, sessionWithId];
        console.log('[ProgramBuilder] Added new session. Total sessions:', newSessions.length);
        return newSessions;
      });
    }
    
    setShowSessionBuilder(false);
    setEditingSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const moveSession = (index: number, direction: 'up' | 'down') => {
    const previousSessions = [...sessions];
    const newSessions = [...sessions];
    if (direction === 'up' && index > 0) {
      [newSessions[index - 1], newSessions[index]] = [newSessions[index], newSessions[index - 1]];
    } else if (direction === 'down' && index < sessions.length - 1) {
      [newSessions[index], newSessions[index + 1]] = [newSessions[index + 1], newSessions[index]];
    }
    
    // Update order property
    newSessions.forEach((session, idx) => {
      session.order = idx;
    });
    
    setLastAction({ type: 'reorderSessions', data: previousSessions });
    setSessions(newSessions);
  };

  const handleSessionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const previousSessions = [...sessions];
    const newSessions = Array.from(sessions);
    const [removed] = newSessions.splice(sourceIndex, 1);
    newSessions.splice(destIndex, 0, removed);

    // Update order property
    newSessions.forEach((session, idx) => {
      session.order = idx;
    });

    setLastAction({ type: 'reorderSessions', data: previousSessions });
    setSessions(newSessions);
    toast.success('Session reordered');
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'reorderSessions') {
      setSessions(lastAction.data);
      setLastAction(null);
      toast.success('Undo successful');
    }
  };

  const saveAsTemplate = () => {
    if (!programName.trim()) {
      setValidationError('Please enter a program name before saving a template.');
      return;
    }

    try {
      const analytics = getProgramAnalytics();
      const templates = JSON.parse(localStorage.getItem('program-templates') || '[]');
      const newTemplate = {
        id: Date.now().toString(),
        name: programName,
        description: programDescription,
        sessions: sessions,
        createdAt: new Date().toISOString(),
        // Enhanced template metadata
        activityTypes: analytics.uniqueTypes,
        totalExercises: analytics.totalExercises,
        isBalanced: analytics.isBalanced,
        activityCounts: analytics.activityCounts
      };
      
      templates.push(newTemplate);
      localStorage.setItem('program-templates', JSON.stringify(templates));
      setShowSaveTemplate(false);
      toast.success(`Template saved with ${analytics.totalExercises} exercises`);
    } catch (error) {
      console.error('Error saving template:', error);
      setValidationError('Failed to save template.');
    }
  };

  const handleSaveProgram = () => {
    setValidationError(null);

    if (!programName.trim()) {
      setValidationError('Please enter a program name.');
      return;
    }

    if (sessions.length === 0) {
      setValidationError('Please add at least one session.');
      return;
    }

    // Activity type validation
    const analytics = getProgramAnalytics();
    if (analytics.totalExercises === 0) {
      setValidationError('Please add at least one exercise to your program.');
      return;
    }

    // Provide feedback about program composition
    if (analytics.resistanceOnly && sessions.length > 1) {
      const confirmed = confirm(
        `Your program contains only resistance exercises. Consider adding variety with:\n\n` +
        `• Endurance activities (running, cycling)\n` +
        `• Flexibility work (stretching, yoga)\n` +
        `• Sport-specific training\n\n` +
        `Save anyway?`
      );
      if (!confirmed) return;
    }

    const user = auth.currentUser;
    if (!user) {
      setValidationError('You must be logged in to save a program.');
      return;
    }

    console.log('[ProgramBuilder] Saving program:', {
      name: programName,
      sessionCount: sessions.length,
      totalExercises: analytics.totalExercises,
      activityTypes: analytics.uniqueTypes,
      isBalanced: analytics.isBalanced,
      sessions: sessions.map(s => ({ 
        id: s.id, 
        name: s.name, 
        exerciseCount: s.exercises.length,
        exercises: s.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          exerciseRef: ex.exerciseRef,
          activityType: ex.activityType
        }))
      }))
    });

    const program: Omit<Program, 'id' | 'userId'> = {
      name: programName,
      description: programDescription,
      createdBy: user.uid,
      createdAt: initialProgram?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: sessions,
      isPublic: initialProgram?.isPublic || false,
      tags: initialProgram?.tags || []
    };

    // Clear persisted form data after successful save
    clearPersistedState();
    console.log('[ProgramBuilder] Cleared persisted form data');
    
    onSave(program);
  };

  const getTotalExercises = () => {
    return sessions.reduce((total, session) => total + session.exercises.length, 0);
  };

  const handleClose = () => {
    // Check if there's unsaved work
    const hasUnsavedWork = programName.trim() || programDescription.trim() || sessions.length > 0;
    
    if (hasUnsavedWork) {
      const confirmed = window.confirm(
        'You have unsaved changes. Your progress has been saved automatically and will be restored if you come back. Do you want to close?'
      );
      if (!confirmed) return;
    }
    
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-bg-primary bg-opacity-70 z-50">
        <div className="bg-bg-secondary rounded-xl w-full max-w-6xl h-5/6 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-text-primary">
                {initialProgram ? 'Edit Program' : 'Create Program'}
              </h2>
              <button 
                onClick={handleClose}
                className="text-text-tertiary hover:text-text-primary text-2xl font-bold w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            {/* Program Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Push/Pull/Legs, Upper/Lower Split"
                  value={programName}
                  onChange={(e) => {
                    setProgramName(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none text-lg"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={sessions.length === 0}
                  variant="success"
                  leftIcon={<BookmarkIcon className="w-4 h-4" />}
                >
                  Save as Template
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Program Description (Optional)
                </label>
                <textarea
                  placeholder="Describe your program goals, frequency, and notes..."
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-border focus:border-accent-primary focus:outline-none resize-none"
                  rows={3}
                />
              </div>
              {validationError && (
                <InlineErrorState title="Program needs attention" message={validationError} />
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-border bg-bg-primary/40">
                <EmptyState
                  icon={<PlusIcon className="h-8 w-8" />}
                  title="No sessions added yet"
                  description="Create sessions like Push Day, Pull Day, Leg Day, or warm-ups to structure this program."
                  primaryAction={{
                    label: 'Create First Session',
                    onClick: handleAddSession,
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-text-primary">
                    Program Sessions ({sessions.length})
                  </h3>
                  <div className="flex items-center gap-3">
                    <MetricChip label="Exercises" value={getTotalExercises()} />
                    {lastAction && (
                      <button
                        onClick={handleUndo}
                        className="px-3 py-1.5 bg-warning-bg hover:opacity-90 text-warning-text border border-warning-border text-sm rounded-lg transition-colors flex items-center gap-2"
                        title="Undo last action"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Undo
                      </button>
                    )}
                  </div>
                </div>
                
                <DragDropContext onDragEnd={handleSessionDragEnd}>
                  <Droppable droppableId="sessions">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-focus-bg rounded-xl p-2' : ''
                        }`}
                      >
                        {sessions.map((session, index) => (
                          <Draggable key={session.id} draggableId={session.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-bg-secondary rounded-xl p-5 border transition-all ${
                                  snapshot.isDragging
                                    ? 'border-accent-primary shadow-2xl shadow-glow scale-102'
                                    : 'border-border hover:border-border-hover'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  {/* Drag Handle */}
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="flex items-center gap-3 flex-1 cursor-move group"
                                  >
                                    <div className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-bg-tertiary group-hover:bg-hover-overlay transition-colors flex items-center justify-center">
                                      <MenuIcon className="w-5 h-5 text-text-tertiary group-hover:text-text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-text-primary font-semibold text-lg">{session.name}</h4>
                                      <div className="text-sm text-text-tertiary mt-1">
                                        {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
                                        {session.notes && (
                                          <span className="ml-2 text-text-tertiary">• {session.notes}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => moveSession(index, 'up')}
                                      disabled={index === 0}
                                    className="min-h-[44px] min-w-[44px] p-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Move up"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => moveSession(index, 'down')}
                                      disabled={index === sessions.length - 1}
                                      className="min-h-[44px] min-w-[44px] p-2 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      title="Move down"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      onClick={() => handleEditSession(session)}
                                      className="min-h-[44px] min-w-[44px] p-2 text-accent-secondary hover:text-accent-primary transition-colors"
                                      title="Edit session"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSession(session.id)}
                                      className="min-h-[44px] min-w-[44px] p-2 text-error-text hover:bg-error-bg rounded-lg transition-colors"
                                      title="Delete session"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Exercise Preview */}
                                {session.exercises.length > 0 && (
                                  <div className="mt-4 p-4 bg-bg-secondary rounded-lg border border-border">
                                    <div className="text-xs font-medium text-text-tertiary mb-3">EXERCISES:</div>

                                    {(() => {
                                      const exerciseOrder = (session.exerciseOrder && session.exerciseOrder.length > 0)
                                        ? session.exerciseOrder
                                        : session.exercises.map((exercise) => exercise.id);
                                      const labelsByExerciseId = buildSupersetLabels(session.supersets || [], exerciseOrder);

                                      return (
                                        <>
                                          {(session.supersets || []).length > 0 && (
                                            <div className="mb-3 space-y-1">
                                              {(session.supersets || []).map((superset) => (
                                                <div
                                                  key={`${session.id}-superset-${superset.id}`}
                                                  className="text-xs rounded-md border border-border-focus bg-focus-bg px-2 py-1 text-accent-secondary"
                                                >
                                                  {buildSupersetDisplayTitle(superset, labelsByExerciseId)}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {session.exercises.slice(0, 6).map((exercise, idx) => (
                                              <div key={`${session.id}-exercise-${idx}-${exercise.name}`} className="text-sm text-text-secondary flex items-center gap-2">
                                                <ActivityBadge activityType={exercise.activityType} variant="dot" />
                                                {labelsByExerciseId[exercise.id]?.label && (
                                                  <span className="px-1.5 py-0.5 text-xs rounded border border-border-focus bg-focus-bg text-accent-secondary">
                                                    {labelsByExerciseId[exercise.id].label}
                                                  </span>
                                                )}
                                                <span className="truncate flex-1">
                                                  {exercise.name}
                                                </span>
                                                <ActivityBadge activityType={exercise.activityType} variant="soft" />
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      );
                                    })()}
                                    {session.exercises.length > 6 && (
                                      <div className="text-xs text-text-tertiary mt-3 text-center">
                                        +{session.exercises.length - 6} more exercises...
                                      </div>
                                    )}
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

                {/* Add Session Button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={handleAddSession}
                    className="px-8 py-4 bg-accent-primary text-text-on-accent rounded-lg hover:bg-accent-hover flex items-center gap-2 mx-auto text-lg font-medium transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Another Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-bg-secondary">
            <div className="flex items-center justify-between">
              <div className="text-text-tertiary text-sm">
                <div className="font-medium">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {getProgramAnalytics().totalExercises} exercises
                </div>
                {getProgramAnalytics().totalExercises > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getProgramAnalytics().uniqueTypes.map(type => {
                      const typeInfo = getActivityTypeInfo(type);
                      const count = getProgramAnalytics().activityCounts[type] || 0;
                      return (
                        <ActivityBadge
                          key={type}
                          activityType={type}
                          title={`${count} ${typeInfo.label.toLowerCase()} exercise${count !== 1 ? 's' : ''}`}
                        />
                      );
                    })}
                  </div>
                )}
                <div className="text-xs text-text-tertiary mt-1">
                  {getProgramAnalytics().isBalanced 
                    ? '🎯 Well-balanced program with multiple activity types'
                    : getProgramAnalytics().resistanceOnly 
                      ? '💪 Resistance-focused program'
                      : '💡 Add variety with different activity types'
                  }
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={sessions.length === 0 || !programName.trim()}
                >
                  {initialProgram ? 'Update Program' : 'Save Program'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Builder Modal */}
      {showSessionBuilder && (
        <SessionBuilder
          onClose={() => {
            setShowSessionBuilder(false);
            setEditingSession(null);
          }}
          onSave={handleSaveSession}
          initialSession={editingSession || undefined}
          sessionName={editingSession ? editingSession.name : `Session ${sessions.length + 1}`}
        />
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 flex items-center justify-center bg-bg-primary bg-opacity-70 z-60">
          <div className="bg-bg-secondary p-6 rounded-lg max-w-md w-full">
            <h3 className="text-text-primary text-lg font-bold mb-4">Save as Template</h3>
            <p className="text-text-tertiary text-sm mb-4">
              This will save the entire program with all sessions as a reusable template.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveTemplate(false)}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded hover:bg-bg-quaternary"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                className="flex-1 px-4 py-2 bg-status-success text-text-on-accent rounded hover:opacity-90"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgramBuilder;

