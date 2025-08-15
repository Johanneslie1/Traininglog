import React, { useState } from 'react';
import { Program, ProgramSession } from '@/types/program';
import { PlusIcon, BookmarkIcon, TrashIcon, PencilIcon } from '@heroicons/react/outline';
import SessionBuilder from './SessionBuilder';
import { auth } from '@/services/firebase/config';

interface ProgramBuilderProps {
  onClose: () => void;
  onSave: (program: Omit<Program, 'id' | 'userId'>) => void;
  initialProgram?: Partial<Program>;
}

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({
  onClose,
  onSave,
  initialProgram
}) => {
  const [programName, setProgramName] = useState(initialProgram?.name || '');
  const [programDescription, setProgramDescription] = useState(initialProgram?.description || '');
  const [programLevel, setProgramLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialProgram?.level || 'beginner'
  );
  const [sessions, setSessions] = useState<ProgramSession[]>(initialProgram?.sessions || []);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

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
      isEditing: !!editingSession
    });

    if (editingSession) {
      // Update existing session
      setSessions(prev => prev.map(s => s.id === editingSession.id ? session : s));
      console.log('[ProgramBuilder] Updated existing session');
    } else {
      // Add new session
      setSessions(prev => {
        const newSessions = [...prev, session];
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
    
    setSessions(newSessions);
  };

  const saveAsTemplate = () => {
    if (!programName.trim()) {
      alert('Please enter a program name first');
      return;
    }

    try {
      const templates = JSON.parse(localStorage.getItem('program-templates') || '[]');
      const newTemplate = {
        id: Date.now().toString(),
        name: programName,
        description: programDescription,
        level: programLevel,
        sessions: sessions,
        createdAt: new Date().toISOString()
      };
      
      templates.push(newTemplate);
      localStorage.setItem('program-templates', JSON.stringify(templates));
      setShowSaveTemplate(false);
      alert('Program saved as template!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleSaveProgram = () => {
    if (!programName.trim()) {
      alert('Please enter a program name');
      return;
    }

    if (sessions.length === 0) {
      alert('Please add at least one session');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to save a program');
      return;
    }

    console.log('[ProgramBuilder] Saving program:', {
      name: programName,
      sessionCount: sessions.length,
      totalExercises: getTotalExercises(),
      sessions: sessions.map(s => ({ id: s.id, name: s.name, exerciseCount: s.exercises.length }))
    });

    const program: Omit<Program, 'id' | 'userId'> = {
      name: programName,
      description: programDescription,
      level: programLevel,
      createdBy: user.uid,
      createdAt: initialProgram?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: sessions,
      isPublic: initialProgram?.isPublic || false,
      tags: initialProgram?.tags || []
    };

    onSave(program);
  };

  const getTotalExercises = () => {
    return sessions.reduce((total, session) => total + session.exercises.length, 0);
  };



  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-[#23272F] rounded-xl w-full max-w-6xl h-5/6 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">
                {initialProgram ? 'Edit Program' : 'Create Program'}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            {/* Program Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Push/Pull/Legs, Upper/Lower Split"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none text-lg"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={programLevel}
                    onChange={(e) => setProgramLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="w-full px-4 py-3 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="beginner">🟢 Beginner</option>
                    <option value="intermediate">🟡 Intermediate</option>
                    <option value="advanced">🔴 Advanced</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowSaveTemplate(true)}
                    disabled={sessions.length === 0}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    Save as Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program Description (Optional)
                </label>
                <textarea
                  placeholder="Describe your program goals, frequency, and notes..."
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[#181A20] text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <PlusIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No sessions added yet</h3>
                <p className="text-gray-500 mb-6">Create sessions like "Push Day", "Pull Day", "Leg Day" etc.</p>
                <button
                  onClick={handleAddSession}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto text-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create First Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Program Sessions ({sessions.length})
                  </h3>
                  <div className="text-sm text-gray-400">
                    {getTotalExercises()} exercises
                  </div>
                </div>
                
                {sessions.map((session, index) => (
                  <div key={session.id} className="bg-[#181A20] rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg">{session.name}</h4>
                        <div className="text-sm text-gray-400 mt-1">
                          {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} • 
                          {session.exercises.length} exercises
                          {session.notes && (
                            <span className="ml-2 text-gray-500">• {session.notes}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSession(index, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSession(index, 'down')}
                          disabled={index === sessions.length - 1}
                          className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEditSession(session)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit session"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete session"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise Preview */}
                    {session.exercises.length > 0 && (
                      <div className="mt-4 p-4 bg-[#23272F] rounded-lg border border-white/5">
                        <div className="text-xs font-medium text-gray-400 mb-3">EXERCISES:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {session.exercises.slice(0, 6).map((exercise, idx) => (
                            <div key={`${session.id}-exercise-${idx}-${exercise.name}`} className="text-sm text-gray-300 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                              <span className="truncate">
                                {exercise.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {session.exercises.length > 6 && (
                          <div className="text-xs text-gray-500 mt-3 text-center">
                            +{session.exercises.length - 6} more exercises...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Session Button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={handleAddSession}
                    className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto text-lg font-medium transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Another Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-[#1A1D23]">
            <div className="flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                <div className="font-medium">
                  {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {getTotalExercises()} exercises
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 Create sessions first, then add exercises to each session
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProgram}
                  disabled={sessions.length === 0 || !programName.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {initialProgram ? 'Update Program' : 'Save Program'}
                </button>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-60">
          <div className="bg-[#23272F] p-6 rounded-lg max-w-md w-full">
            <h3 className="text-white text-lg font-bold mb-4">Save as Template</h3>
            <p className="text-gray-400 text-sm mb-4">
              This will save the entire program with all sessions as a reusable template.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveTemplate(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
