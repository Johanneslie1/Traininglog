import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSharedPrograms, copySharedProgram, updateAssignmentStatus } from '@/services/programService';
import { Program } from '@/types/program';
import { 
  DocumentDuplicateIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  PlayIcon,
  ClockIcon,
  ChatAltIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';

interface SharedProgramData {
  id: string;
  programId: string;
  originalProgram: Program;
  sharedBy: string;
  sharedByName?: string;
  sharedAt: string;
  assignmentId: string;
  assignmentStatus: string;
  assignedAt: string;
  coachMessage?: string;
}

interface SharedProgramListProps {
  embedded?: boolean;
}

const SharedProgramList: React.FC<SharedProgramListProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [sharedPrograms, setSharedPrograms] = useState<SharedProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyingProgramId, setCopyingProgramId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const loadSharedPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const programs = await getSharedPrograms();
      setSharedPrograms(programs);
    } catch (err) {
      console.error('Error loading shared programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shared programs');
      toast.error('Failed to load shared programs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedPrograms();
  }, [loadSharedPrograms]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadSharedPrograms();
      }
    };

    const handleFocus = () => {
      loadSharedPrograms();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadSharedPrograms]);

  const handleCopyProgram = async (sharedProgramId: string, programName: string) => {
    if (window.confirm(`Copy "${programName}" to your programs? You'll be able to edit your copy.`)) {
      setCopyingProgramId(sharedProgramId);
      
      try {
        const newProgramId = await copySharedProgram(sharedProgramId);
        toast.success(`Program copied successfully!`);
        
        // Refresh the list to update status
        await loadSharedPrograms();
        
        // Navigate to the new program
        navigate(`/programs/${newProgramId}`);
      } catch (err) {
        console.error('Error copying program:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to copy program');
      } finally {
        setCopyingProgramId(null);
      }
    }
  };

  const handleUpdateStatus = async (
    assignmentId: string, 
    newStatus: 'in-progress' | 'completed',
    programName: string
  ) => {
    setUpdatingStatusId(assignmentId);
    
    try {
      await updateAssignmentStatus(assignmentId, newStatus);
      toast.success(
        newStatus === 'in-progress' 
          ? `Marked "${programName}" as started` 
          : `Marked "${programName}" as completed`
      );
      
      // Refresh the list
      await loadSharedPrograms();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-started':
        return (
          <div className="flex items-center bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
            <ClockIcon className="h-4 w-4 mr-1" />
            Not Started
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full text-sm">
            <PlayIcon className="h-4 w-4 mr-1" />
            In Progress
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Completed
          </div>
        );
      case 'copied':
        return (
          <div className="flex items-center bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm">
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Copied
          </div>
        );
      default:
        return null;
    }
  };

  const getCoachDisplayName = (program: SharedProgramData) => {
    const rawName = program.sharedByName?.trim();
    if (!rawName) {
      return 'Your Coach';
    }

    if (program.sharedBy && rawName === program.sharedBy) {
      return 'Your Coach';
    }

    return rawName;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'py-10' : 'min-h-screen bg-black'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div className="ml-3 text-white">Loading shared programs...</div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-black text-white p-4'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {!embedded && (
            <button
              onClick={() => navigate('/programs')}
              className="text-primary-500 hover:text-primary-400 mb-4 flex items-center"
            >
              ← Back to My Programs
            </button>
          )}
          {embedded ? (
            <h2 className="text-2xl font-bold mb-2">Assigned Programs</h2>
          ) : (
            <h1 className="text-3xl font-bold mb-2">Assigned Programs</h1>
          )}
          <p className="text-gray-400">
            Programs shared with you by your coach
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Programs List */}
        {sharedPrograms.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Assigned Programs</h2>
            <p className="text-gray-400">
              When your coach shares a program with you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sharedPrograms.map((sharedProgram) => {
              const program = sharedProgram.originalProgram;
              const isCopied = sharedProgram.assignmentStatus === 'copied';
              const isInProgress = sharedProgram.assignmentStatus === 'in-progress';
              const isNotStarted = sharedProgram.assignmentStatus === 'not-started';
              const guidedExercises = (program.sessions || []).reduce((count, session) => {
                const sessionGuided = (session.exercises || []).filter((exercise) => {
                  const hasStructured = !!exercise.prescription && exercise.instructionMode === 'structured';
                  const hasFreeform = !!exercise.instructions && exercise.instructionMode === 'freeform';
                  return hasStructured || hasFreeform;
                }).length;
                return count + sessionGuided;
              }, 0);
              
              return (
                <div
                  key={sharedProgram.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-primary-600 transition-colors"
                >
                  {/* Coach Message (if exists) */}
                  {sharedProgram.coachMessage && (
                    <div className="bg-primary-900/20 border-b border-primary-800/30 p-4">
                      <div className="flex items-start gap-3">
                        <ChatAltIcon className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-primary-300 mb-1">
                            Message from your coach:
                          </p>
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {sharedProgram.coachMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Program Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{program.name}</h2>
                        {program.description && (
                          <p className="text-gray-400 mb-3">{program.description}</p>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary-900/30 rounded-full flex items-center justify-center">
                              <span className="text-primary-400 text-xs font-semibold">
                                {getCoachDisplayName(sharedProgram)[0] || 'C'}
                              </span>
                            </div>
                            <span>
                              Coach: {getCoachDisplayName(sharedProgram)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Assigned {getTimeAgo(sharedProgram.assignedAt)}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {program.sessions?.length || 0} session{program.sessions?.length !== 1 ? 's' : ''}
                          </div>
                          {guidedExercises > 0 && (
                            <div className="flex items-center text-primary-300">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              {guidedExercises} guided exercise{guidedExercises !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="ml-4">
                        {getStatusBadge(sharedProgram.assignmentStatus)}
                      </div>
                    </div>

                    {/* Sessions Preview */}
                    {program.sessions && program.sessions.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Sessions:</h3>
                        <div className="space-y-1">
                          {program.sessions.slice(0, 3).map((session, index) => (
                            <div key={session.id} className="text-sm text-gray-300">
                              {index + 1}. {session.name} ({session.exercises?.length || 0} exercises)
                            </div>
                          ))}
                          {program.sessions.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{program.sessions.length - 3} more session{program.sessions.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyProgram(sharedProgram.id, program.name)}
                        disabled={copyingProgramId === sharedProgram.id}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                          isCopied
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {copyingProgramId === sharedProgram.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Copying...
                          </>
                        ) : (
                          <>
                            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                            {isCopied ? 'Already Copied' : 'Copy to My Programs'}
                          </>
                        )}
                      </button>

                      {/* Mark as Started Button */}
                      {isNotStarted && (
                        <button
                          onClick={() => handleUpdateStatus(sharedProgram.assignmentId, 'in-progress', program.name)}
                          disabled={updatingStatusId === sharedProgram.assignmentId}
                          className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatusId === sharedProgram.assignmentId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="h-5 w-5 mr-2" />
                              Mark as Started
                            </>
                          )}
                        </button>
                      )}

                      {/* Mark as Completed Button */}
                      {isInProgress && (
                        <button
                          onClick={() => handleUpdateStatus(sharedProgram.assignmentId, 'completed', program.name)}
                          disabled={updatingStatusId === sharedProgram.assignmentId}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatusId === sharedProgram.assignmentId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Mark as Completed
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedProgramList;
