import React, { useState, useCallback } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import SessionModal from './SessionModal';
import SessionBuilder from './SessionBuilder';
import ProgramBuilder from './ProgramBuilder';
import { PencilIcon, TrashIcon, ChevronDownIcon, CogIcon, ArrowLeftIcon } from '@heroicons/react/outline';
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
            id: ex.id || undefined,
            name: ex.name,
            notes: ex.notes,
            order: ex.order
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
    <div className="min-h-screen bg-black/90 text-white">
      <div className="p-6">
      {/* Header - Match LogOptions styling */}
      <header className="sticky top-0 flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">{program.name}</h1>
            {program.description && (
              <p className="text-sm text-gray-400 mt-0.5">{program.description}</p>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {!selectionMode && (
            <>
              <button
                onClick={handleProgramEdit}
                className="p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
                title="Edit program"
                aria-label={`Edit program ${program.name}`}
              >
                <CogIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={isDeletingProgram}
                className="p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete program"
                aria-label={`Delete program ${program.name}`}
              >
                {isDeletingProgram ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <TrashIcon className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-safe min-h-0 p-6">

      <div className="space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200">
              {/* Session Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                    <span className="text-xs font-medium text-gray-400 bg-gray-800/60 px-2.5 py-1 rounded-full">
                      {session.exercises.length} exercises
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {!selectionMode && (
                    <>
                      <button
                        onClick={() => handleSessionEdit(session)}
                        className="p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
                        title="Edit session"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300"
                        title="Delete session"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200"
                    title={expandedSessions.includes(session.id) ? "Collapse session" : "Expand session"}
                  >
                    <ChevronDownIcon
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        expandedSessions.includes(session.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Session Content */}
              {expandedSessions.includes(session.id) && (
                <div className="p-1">
                  {session.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id}
                      className={`px-4 py-3 hover:bg-gray-800/40 transition-all duration-200 rounded-xl mx-1 ${
                        index !== session.exercises.length - 1 ? 'mb-1' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-medium text-white">{exercise.name}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor}`}>
                              {getActivityTypeInfo(exercise.activityType).label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            Sets and reps will be logged during workout
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
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No sessions yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first training session to get started</p>
          </div>
        )}
        
        {!selectionMode && (
          <button 
            onClick={() => {
              setEditingSession(null);
              setShowSessionBuilder(true);
            }} 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl border border-blue-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Session
          </button>
        )}
      </div>
      </main>

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
    </div>
  );
};

export default ProgramDetail;
