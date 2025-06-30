import React, { useState } from 'react';
import { Program, ProgramSession } from '@/types/program';
// Removed CopyFromPreviousDayButton import (no longer needed)
import SessionModal from './SessionModal';

interface Props {
  program: Program;
  onBack: () => void;
  onUpdate: (updated: Program) => void;
}

const ProgramDetail: React.FC<Props> = ({ program, onBack, onUpdate }) => {

  // Flat sessions list (no weeks/days)
  const sessions: ProgramSession[] = program.sessions ?? [];

  const [showSessionModal, setShowSessionModal] = useState(false);

  // No copy from previous day needed

  // Add a new session to the flat sessions array
  const handleAddSession = (session: ProgramSession) => {
    const updatedSessions = [...sessions, session];
    onUpdate({ ...program, sessions: updatedSessions });
    setShowSessionModal(false);
  };

  // Removed unused handleEditSession (no longer needed)

  // Remove a session
  const handleRemoveSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    onUpdate({ ...program, sessions: updatedSessions });
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-blue-500">&larr; Back</button>
      <h2 className="text-2xl font-bold mb-2">{program.name}</h2>
      <div className="mb-4 text-gray-400">{program.description}</div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Sessions</h3>
        {sessions.length > 0 ? (
          sessions.map(session => (
            <div key={session.id} className="bg-[#181A20] rounded p-3 mb-2">
              <div className="font-bold text-white flex justify-between items-center">
                {session.name}
                <span>
                  <button className="text-blue-400 mr-2" onClick={() => {/* TODO: open edit modal */}}>Edit</button>
                  <button className="text-red-400" onClick={() => handleRemoveSession(session.id)}>Delete</button>
                </span>
              </div>
              <ul className="ml-4 mt-1">
                {session.exercises.map((ex, idx) => (
                  <li key={ex.id || ex.name + '-' + idx} className="text-gray-300 text-sm">{ex.name} - {ex.sets} x {ex.reps}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No sessions yet.</div>
        )}
        <button onClick={() => setShowSessionModal(true)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Add Session</button>
      </div>

      <SessionModal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} onSave={handleAddSession} />
    </div>
  );
};

export default ProgramDetail;
