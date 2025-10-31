import React, { useState, useCallback } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { ActivityType } from '@/types/activityTypes';
import SessionBuilder from './SessionBuilder';
import { PencilIcon, TrashIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/outline';
import { usePrograms } from '@/context/ProgramsContext';
import { createSession, deleteSession } from '@/services/programService';
import { auth } from '@/services/firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import SideMenu from '@/components/SideMenu';

interface Props {
  program: Program;
  onBack: () => void;
  onUpdate: (updated: Program) => void;
  selectionMode?: boolean;
}

const ProgramDetail: React.FC<Props> = ({ program, onBack, onUpdate, selectionMode = false }) => {
  const sessions: ProgramSession[] = program.sessions ?? [];
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [, setIsLoading] = useState(false);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(false);
  const [tempName, setTempName] = useState(program.name);
  const [tempDescription, setTempDescription] = useState(program.description || '');
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
    setEditingProgram(true);
    setTempName(program.name);
    setTempDescription(program.description || '');
  };

  const handleSaveProgramEdit = async () => {
    if (!tempName.trim()) {
      alert('Program name cannot be empty');
      return;
    }

    try {
      const programToUpdate: Program = {
        ...program,
        name: tempName.trim(),
        description: tempDescription.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await updateProgram(program.id, programToUpdate);
      onUpdate(programToUpdate);
      setEditingProgram(false);
    } catch (error) {
      console.error('[ProgramDetail] Error updating program:', error);
      alert(error instanceof Error ? error.message : 'Failed to update program. Please try again.');
    }
  };

  const handleCancelProgramEdit = () => {
    setEditingProgram(false);
    setTempName(program.name);
    setTempDescription(program.description || '');
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

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [showSideMenu, setShowSideMenu] = useState(false);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-40">
      {/* Top Bar with Menu and Logout */}
      <div className="bg-[#0f0f0f] px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0 flex-1">
            <button 
              onClick={() => setShowSideMenu(true)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Open Menu"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button onClick={onBack} className="hover:text-white transition-colors flex-shrink-0">
              Programs
            </button>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white truncate">{program.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-start justify-between p-3 sm:p-4 bg-[#1a1a1a] border-b border-white/10 flex-shrink-0 gap-3">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition-all duration-200 flex-shrink-0"
            aria-label="Back to programs"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
          </button>
          <div className="flex-1 min-w-0">
            {editingProgram ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full text-xl font-semibold bg-[#2a2a2a] text-white rounded-lg px-3 py-1 border border-white/10 focus:border-[#8B5CF6] focus:outline-none"
                  autoFocus
                />
                <input
                  type="text"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Program description (optional)"
                  className="w-full text-sm bg-[#2a2a2a] text-gray-300 rounded-lg px-3 py-1 border border-white/10 focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-white break-words">{program.name}</h1>
                {program.description && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5 break-words">{program.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {!selectionMode && (
            <>
              {editingProgram ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleSaveProgramEdit}
                    className="p-1.5 sm:p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-green-400 hover:text-green-300"
                    title="Save changes"
                    aria-label="Save changes"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelProgramEdit}
                    className="p-1.5 sm:p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300"
                    title="Cancel edit"
                    aria-label="Cancel edit"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleProgramEdit}
                    className="p-1.5 sm:p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
                    title="Edit program"
                    aria-label={`Edit program ${program.name}`}
                  >
                    <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleDeleteProgram}
                    disabled={isDeletingProgram}
                    className="p-1.5 sm:p-2.5 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete program"
                    aria-label={`Delete program ${program.name}`}
                  >
                    {isDeletingProgram ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0">
        <div className="space-y-3 max-w-4xl mx-auto">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200">
              {/* Session Header */}
              <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-gray-800/50 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                    <span className="text-xs font-medium text-gray-400 bg-gray-800/60 px-2.5 py-1 rounded-full">
                      {session.exercises.length} exercises
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!selectionMode && (
                    <>
                      <button
                        onClick={() => handleSessionEdit(session)}
                        className="p-1.5 sm:p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
                        title="Edit session"
                        aria-label="Edit session"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 sm:p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300"
                        title="Delete session"
                        aria-label="Delete session"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="p-1.5 sm:p-2 hover:bg-gray-800/60 rounded-xl transition-all duration-200"
                    title={expandedSessions.includes(session.id) ? "Collapse session" : "Expand session"}
                    aria-label={expandedSessions.includes(session.id) ? "Collapse session" : "Expand session"}
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

      {/* Side Menu */}
      <SideMenu
        isOpen={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onShowWorkoutSummary={() => {}}
        onNavigateToday={() => navigate('/')}
        onNavigatePrograms={() => navigate('/programs')}
        onNavigateExercises={() => navigate('/exercises?showCreate=true')}
      />
    </div>
  );
};

export default ProgramDetail;
