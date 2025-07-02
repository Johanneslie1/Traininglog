import React, { useState } from 'react';
import { Program, ProgramSession } from '@/types/program';
import SessionModal from './SessionModal';
import { Exercise, ExerciseSet } from '@/types/exercise';

interface Props {
  program: Program;
  onBack: () => void;
  onUpdate: (updated: Program) => void;
  onSelectExercises?: (exercises: { exercise: Exercise; sets: ExerciseSet[] }[]) => void;
  selectionMode?: boolean;
}

const ProgramDetail: React.FC<Props> = ({ program, onBack, onUpdate, onSelectExercises, selectionMode = false }) => {
  const sessions: ProgramSession[] = program.sessions ?? [];
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<{ sessionId: string; exerciseId: string }[]>([]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectExercise = (sessionId: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(sel => 
        sel.sessionId === sessionId && sel.exerciseId === exerciseId
      );
      
      if (isSelected) {
        return prev.filter(sel => 
          !(sel.sessionId === sessionId && sel.exerciseId === exerciseId)
        );
      } else {
        return [...prev, { sessionId, exerciseId }];
      }
    });
  };

  const handleSelectSession = (sessionId: string, exercises: ProgramSession['exercises']) => {
    setSelectedExercises(prev => {
      const sessionExercises = exercises.map(ex => ({
        sessionId,
        exerciseId: ex.id
      }));
      
      const hasAllSelected = exercises.every(ex => 
        prev.some(sel => sel.sessionId === sessionId && sel.exerciseId === ex.id)
      );
      
      if (hasAllSelected) {
        // Deselect all in this session
        return prev.filter(sel => sel.sessionId !== sessionId);
      } else {
        // Select all in this session
        return [...prev.filter(sel => sel.sessionId !== sessionId), ...sessionExercises];
      }
    });
  };

  const handleAddSelected = () => {
    if (!onSelectExercises) return;
    
    const exercisesToAdd = selectedExercises.map(sel => {
      const session = sessions.find(s => s.id === sel.sessionId);
      const exercise = session?.exercises.find(e => e.id === sel.exerciseId);
      
      if (!exercise) return null;

      return {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          type: 'strength' as const,
          category: 'compound' as const,
          primaryMuscles: [],
          secondaryMuscles: [],
          instructions: [],
          description: exercise.notes || '',
          defaultUnit: 'kg' as const,
          metrics: {
            trackWeight: true,
            trackReps: true,
          }
        },
        sets: Array(exercise.sets).fill({
          reps: exercise.reps,
          weight: exercise.weight || 0,
          difficulty: 'MODERATE' as const
        })
      };
    }).filter((ex): ex is NonNullable<typeof ex> => ex !== null);

    onSelectExercises(exercisesToAdd);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-blue-500">&larr; Back</button>
        {selectionMode && selectedExercises.length > 0 && (
          <button
            onClick={handleAddSelected}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            Add Selected ({selectedExercises.length})
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-2">{program.name}</h2>
      <div className="mb-4 text-gray-400">{program.description}</div>

      <div className="mb-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Sessions</h3>
        {sessions.length > 0 ? (
          sessions.map(session => (
            <div key={session.id} className="bg-[#181A20] rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#1E2028] transition-colors"
              >
                <div>
                  <h4 className="font-bold text-white">{session.name}</h4>
                  <p className="text-sm text-gray-400">{session.exercises.length} exercises</p>
                </div>
                
                {selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSession(session.id, session.exercises);
                    }}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {session.exercises.every(ex => 
                      selectedExercises.some(sel => 
                        sel.sessionId === session.id && sel.exerciseId === ex.id
                      )
                    )
                      ? 'Deselect All'
                      : 'Select All'
                    }
                  </button>
                )}
              </button>

              {expandedSessions.includes(session.id) && (
                <div className="border-t border-white/10">
                  {session.exercises.map((ex, idx) => (
                    <div
                      key={ex.id || `${ex.name}-${idx}`}
                      className={`flex items-start gap-4 p-4 hover:bg-[#1E2028] transition-colors ${
                        idx !== session.exercises.length - 1 ? 'border-b border-white/10' : ''
                      }`}
                    >
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedExercises.some(sel => 
                            sel.sessionId === session.id && sel.exerciseId === ex.id
                          )}
                          onChange={() => handleSelectExercise(session.id, ex.id)}
                          className="mt-1 w-5 h-5 rounded border-white/20 bg-[#1a1a1a] checked:bg-purple-600 focus:ring-purple-600"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{ex.name}</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ex.sets > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                              {ex.sets} sets
                            </span>
                          )}
                          {ex.reps > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-[#1a1a1a] text-sm text-gray-400">
                              {ex.reps} reps
                            </span>
                          )}
                        </div>
                      </div>
                      {!selectionMode && (
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-400 text-sm hover:text-blue-300"
                            onClick={() => {/* Add edit functionality */}}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-400 text-sm hover:text-red-300"
                            onClick={() => {/* Add remove functionality */}}
                          >
                            Remove
                          </button>
                        </div>
                      )}
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
            onClick={() => setShowSessionModal(true)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Session
          </button>
        )}
      </div>

      <SessionModal 
        isOpen={showSessionModal} 
        onClose={() => setShowSessionModal(false)} 
        onSave={(session) => {
          const updatedSessions = [...sessions, session];
          onUpdate({ ...program, sessions: updatedSessions });
          setShowSessionModal(false);
        }} 
      />

      {editingSession && (
        <SessionModal 
          isOpen={true}
          onClose={() => setEditingSession(null)}
          onSave={(updated) => {
            const updatedSessions = sessions.map(s => 
              s.id === updated.id ? updated : s
            );
            onUpdate({ ...program, sessions: updatedSessions });
            setEditingSession(null);
          }}
          initialData={editingSession}
        />
      )}
    </div>
  );
};

export default ProgramDetail;
