import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { usePrograms } from '@/context/ProgramsContext';
import ShareProgramDialog from '@/features/programs/ShareProgramDialog';
import { Program } from '@/types/program';
import { ShareIcon, ClipboardListIcon } from '@heroicons/react/outline';

const CoachProgramAssignmentPanel: React.FC = () => {
  const navigate = useNavigate();
  const { programs, isLoading } = usePrograms();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const coachPrograms = useMemo(
    () => programs.filter((program) => !currentUserId || program.userId === currentUserId),
    [programs, currentUserId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assign Programs</h2>
          <p className="text-sm text-gray-400">Select a program and assign it to athletes on your teams</p>
        </div>
      </div>

      {coachPrograms.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <ClipboardListIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No programs available</h3>
          <p className="text-sm text-gray-400 mb-5">Create your first program before assigning it to athletes.</p>
          <button
            onClick={() => navigate('/programs')}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
          >
            Go to Programs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coachPrograms.map((program) => (
            <div
              key={program.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2">{program.name}</h3>
              <p className="text-sm text-gray-400 mb-4 min-h-[40px] line-clamp-2">
                {program.description || 'No description'}
              </p>
              <div className="text-xs text-gray-500 mb-4">
                {program.sessions?.length || 0} session{(program.sessions?.length || 0) !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => setSelectedProgram(program)}
                  className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ShareIcon className="h-4 w-4" />
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <ShareProgramDialog
          programId={selectedProgram.id}
          programName={selectedProgram.name}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
};

export default CoachProgramAssignmentPanel;