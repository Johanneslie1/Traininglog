import React, { useState, useCallback } from 'react';
import { Program, ProgramSession } from '@/types/program';
import SessionModal from './SessionModal';
import SessionBuilder from './SessionBuilder';
import ProgramBuilder from './ProgramBuilder';
import { PencilIcon, TrashIcon, ChevronDownIcon, CogIcon } from '@heroicons/react/outline';
import { usePrograms } from '@/context/ProgramsContext';
import { createSession, deleteSession } from '@/services/programService';

interface Props {
  program: Program;
  onBack: () => void;
  onUpdate: (updated: Program) => void;
  selectionMode?: boolean;
}

const ProgramDetail: React.FC<Props> = ({ program, onBack, onUpdate, selectionMode = false }) => {
  const sessions: ProgramSession[] = program.sessions ?? [];
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [showProgramEditor, setShowProgramEditor] = useState(false);
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [, setIsLoading] = useState(false);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const { updateSessionInProgram: updateSession, deleteProgram, updateProgram } = usePrograms();

  React.useEffect(() => {
    // Set a timeout to show loading state for maximum 2 seconds
    let timeoutId: NodeJS.Timeout;
    
    if (sessions.length === 0) {
      setIsLoading(true);
      timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessions.length]);

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        console.log('[ProgramDetail] Deleting session:', sessionId);
        // Delete from Firestore first
        await deleteSession(program.id, sessionId);
        console.log('[ProgramDetail] Session deleted from Firestore');
        
        // Update local state
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        onUpdate({ ...program, sessions: updatedSessions });
        console.log('[ProgramDetail] Local state updated after session deletion');
      } catch (error) {
        console.error('Error deleting session:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete session. Please try again.');
      }
    }
  }, [program, sessions, onUpdate]);

  const handleSessionSave = useCallback(async (session: ProgramSession) => {
    try {
      setIsLoading(true);
      console.log('[ProgramDetail] Starting session save:', { 
        sessionId: session.id, 
        sessionName: session.name, 
        isEdit: !!editingSession,
        exerciseCount: session.exercises.length 
      });
      
      if (editingSession) {
        // Update existing session's exercises
        console.log('[ProgramDetail] Updating existing session via updateSession service');
        await updateSession(program.id, session.id, session.exercises);
        
        // Update local state, preserving order
        const updatedSessions = sessions.map(s => 
          s.id === session.id 
            ? { ...session, order: s.order } 
            : s);
        onUpdate({ ...program, sessions: updatedSessions });
        console.log('[ProgramDetail] Local state updated for existing session');
      } else {
        // Add new session - persist to Firestore first
        console.log('[ProgramDetail] Creating new session via createSession service');
        const existingOrders = sessions.map(s => s.order ?? 0);
        const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
        
        const sessionToCreate = {
          name: session.name,
          exercises: session.exercises.map(ex => ({
            ...ex,
            id: ex.id || undefined // Let Firestore generate IDs for new exercises
          })),
          order: nextOrder
        };
        
        // Create session in Firestore
        const newSessionId = await createSession(program.id, sessionToCreate);
        console.log('[ProgramDetail] New session created in Firestore with ID:', newSessionId);
        
        // Update local state with the new session including the Firestore-generated ID
        const newSession = {
          ...session,
          id: newSessionId,
          order: nextOrder
        };
        
        // Add session and sort by order
        const updatedSessions = [...sessions, newSession]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          
        onUpdate({ ...program, sessions: updatedSessions });
        console.log('[ProgramDetail] Local state updated with new session');
      }
      
      setShowSessionModal(false);
      setEditingSession(null);
      
      // Expand the newly added/edited session
      if (!expandedSessions.includes(session.id)) {
        setExpandedSessions(prev => [...prev, session.id]);
      }
    } catch (error) {
      console.error('[ProgramDetail] Error saving session:', error);
      alert(error instanceof Error ? error.message : 'Failed to save session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [program, sessions, onUpdate, editingSession, updateSession, expandedSessions]);

  const handleDeleteProgram = async () => {
    if (window.confirm(`Are you sure you want to delete the program "${program.name}"? This will delete all sessions and exercises. This action cannot be undone.`)) {
      setIsDeletingProgram(true);
      
      try {
        console.log('[ProgramDetail] Deleting program:', program.id);
        await deleteProgram(program.id);
        console.log('[ProgramDetail] Program deleted successfully');
        // Navigate back to programs list after successful deletion
        onBack();
      } catch (error) {
        console.error('[ProgramDetail] Error deleting program:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete program. Please try again.');
      } finally {
        setIsDeletingProgram(false);
      }
    }
  };

  const handleProgramEdit = () => {
    setShowProgramEditor(true);
  };

  const handleProgramUpdate = async (updatedProgram: Omit<Program, 'id' | 'userId'>) => {
    try {
      const programToUpdate: Program = {
        ...program,
        ...updatedProgram,
        updatedAt: new Date().toISOString()
      };
      
      await updateProgram(program.id, programToUpdate);
      onUpdate(programToUpdate);
      setShowProgramEditor(false);
    } catch (error) {
      console.error('[ProgramDetail] Error updating program:', error);
      alert(error instanceof Error ? error.message : 'Failed to update program. Please try again.');
    }
  };

  const handleSessionEdit = (session: ProgramSession) => {
    setEditingSession(session);
    setShowSessionBuilder(true);
  };

  const handleSessionBuilderSave = async (sessionData: Omit<ProgramSession, 'userId'>) => {
    try {
      setIsLoading(true);
      
      if (editingSession) {
        // Update existing session
        const updatedSession = {
          ...sessionData,
          id: editingSession.id,
          userId: editingSession.userId
        };
        
        await updateSession(program.id, editingSession.id, updatedSession.exercises);
        
        // Update local state
        const updatedSessions = sessions.map(s => 
          s.id === editingSession.id ? updatedSession : s
        );
        onUpdate({ ...program, sessions: updatedSessions });
      } else {
        // Create new session - use the existing logic from handleSaveSession
        const user = await import('firebase/auth').then(auth => auth.getAuth().currentUser);
        if (!user) throw new Error('User must be logged in');
        
        const session = {
          ...sessionData,
          userId: user.uid
        };
        
        const nextOrder = Math.max(...sessions.map(s => s.order ?? 0), 0) + 1;
        const sessionToCreate = {
          ...session,
          exercises: session.exercises.map(ex => ({
            ...ex,
            id: ex.id || undefined
          })),
          order: nextOrder
        };
        
        const newSessionId = await createSession(program.id, sessionToCreate);
        const newSession = {
          ...session,
          id: newSessionId,
          order: nextOrder
        };
        
        const updatedSessions = [...sessions, newSession]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          
        onUpdate({ ...program, sessions: updatedSessions });
        
        if (!expandedSessions.includes(newSession.id)) {
          setExpandedSessions(prev => [...prev, newSession.id]);
        }
      }
      
      setShowSessionBuilder(false);
      setEditingSession(null);
    } catch (error) {
      console.error('[ProgramDetail] Error saving session:', error);
      alert(error instanceof Error ? error.message : 'Failed to save session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{program.name}</h1>
          <p className="text-gray-400 mt-1">{program.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!selectionMode && (
            <>
              <button
                onClick={handleProgramEdit}
                className="p-2 hover:bg-blue-600/20 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                title="Edit program"
                aria-label={`Edit program ${program.name}`}
              >
                <CogIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={isDeletingProgram}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete program"
                aria-label={`Delete program ${program.name}`}
              >
                {isDeletingProgram ? (
                  <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <TrashIcon className="w-6 h-6" />
                )}
              </button>
            </>
          )}
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-lg border border-white/5">
              {/* Session Header */}
              <div className="bg-gradient-to-r from-[#2a2a2a] to-[#222] px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {session.name}
                    <span className="text-sm font-normal text-gray-400 bg-black/20 px-2 py-0.5 rounded-full">
                      {session.exercises.length} exercises
                    </span>
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  {!selectionMode && (
                    <>
                      <button
                        onClick={() => handleSessionEdit(session)}
                        className="p-2 hover:bg-black/20 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                        title="Edit session"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 hover:bg-black/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                        title="Delete session"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="p-2 hover:bg-black/20 rounded-lg transition-colors"
                    title={expandedSessions.includes(session.id) ? "Collapse session" : "Expand session"}
                  >
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedSessions.includes(session.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Session Content */}
              {expandedSessions.includes(session.id) && (
                <div className="divide-y divide-white/5">
                  {session.exercises.map((exercise) => (
                    <div 
                      key={exercise.id}
                      className="px-6 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-white">{exercise.name}</h4>
                          <div className="text-sm text-gray-400 mt-1">
                            {exercise.sets} sets × {exercise.reps} reps
                            {typeof exercise.weight === 'number' && exercise.weight > 0 && ` @ ${exercise.weight}kg`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-500">No sessions yet.</div>
        )}
        
        {!selectionMode && (
          <button 
            onClick={() => {
              setEditingSession(null);
              setShowSessionBuilder(true);
            }} 
            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Session
          </button>
        )}
      </div>

      {/* Program Editor Modal */}
      {showProgramEditor && (
        <ProgramBuilder
          onClose={() => setShowProgramEditor(false)}
          onSave={handleProgramUpdate}
          initialProgram={program}
        />
      )}

      {/* Session Builder Modal */}
      {showSessionBuilder && (
        <SessionBuilder
          onClose={() => {
            setShowSessionBuilder(false);
            setEditingSession(null);
          }}
          onSave={handleSessionBuilderSave}
          initialSession={editingSession || undefined}
        />
      )}

      {/* Legacy Session Modal - Keep for backward compatibility if needed */}
      <SessionModal 
        isOpen={showSessionModal} 
        onClose={() => setShowSessionModal(false)} 
        onSave={handleSessionSave}
      />

      {editingSession && showSessionModal && (
        <SessionModal 
          isOpen={true}
          onClose={() => setEditingSession(null)}
          onSave={handleSessionSave}
          initialData={editingSession}
        />
      )}
    </div>
  );
};

export default ProgramDetail;
