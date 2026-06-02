import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSharedPrograms, copySharedProgram, updateAssignmentStatus } from '@/services/programService';
import { usePrograms } from '@/context/ProgramsContext';
import { Program } from '@/types/program';
import { 
  DocumentDuplicateIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  PlayIcon,
  ChatAltIcon
} from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { EmptyState, InlineErrorState, MetricChip, SectionDivider, Skeleton, StatusBadge, ViewToggle } from '@/components/ui';
import { formatRelativeDate, formatRelativeWithAbsolute } from '@/utils/displayFormatters';

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
  const { refresh: refreshPrograms } = usePrograms();
  const [sharedPrograms, setSharedPrograms] = useState<SharedProgramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyingProgramId, setCopyingProgramId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

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

        await refreshPrograms();
        
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

  const groupedPrograms = useMemo(() => {
    const groups = [
      { status: 'not-started', label: 'Assigned' },
      { status: 'in-progress', label: 'In Progress' },
      { status: 'completed', label: 'Completed' },
      { status: 'copied', label: 'Copied' },
    ];

    return groups
      .map((group) => ({
        ...group,
        items: sharedPrograms.filter((program) => program.assignmentStatus === group.status),
      }))
      .filter((group) => group.items.length > 0);
  }, [sharedPrograms]);

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
      <div className={`${embedded ? 'py-4' : 'min-h-screen bg-bg-primary p-4'}`}>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton variant="rectangular" height="90px" className="rounded-2xl" />
          <Skeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-bg-primary p-4 text-text-primary'}`}>
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
          <p className="text-text-tertiary">
            Programs shared with you by your coach
          </p>
          {sharedPrograms.length > 0 && (
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              className="mt-4"
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'detailed', label: 'Detailed' },
              ]}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <InlineErrorState className="mb-6" title="Could not load assigned programs" message={error} />
        )}

        {/* Programs List */}
        {sharedPrograms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-secondary">
            <EmptyState
              icon={<CalendarIcon className="h-8 w-8" />}
              title="No assigned programs"
              description="When your coach shares a program with you, it will appear here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {groupedPrograms.map((group) => (
              <div key={group.status} className="space-y-4">
                <SectionDivider label={group.label} count={group.items.length} />
                {group.items.map((sharedProgram) => {
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
                  className="overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-md transition-all hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-glow"
                >
                  {/* Coach Message (if exists) */}
                  {sharedProgram.coachMessage && (
                    <div className="bg-info-bg border-b border-info-border p-4">
                      <div className="flex items-start gap-3">
                        <ChatAltIcon className="h-5 w-5 text-info-text mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-info-text mb-1">
                            Message from your coach:
                          </p>
                          <p className="text-text-secondary whitespace-pre-wrap">
                            {sharedProgram.coachMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    {/* Program Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">{program.name}</h2>
                        {program.description && (
                          <p className="text-text-tertiary mb-3">{program.description}</p>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap gap-2 text-sm text-text-muted">
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
                            Assigned {viewMode === 'detailed'
                              ? formatRelativeWithAbsolute(sharedProgram.assignedAt)
                              : formatRelativeDate(sharedProgram.assignedAt)}
                          </div>
                          <MetricChip label="Sessions" value={program.sessions?.length || 0} />
                          {viewMode === 'detailed' && (
                            <MetricChip
                              label="Coach"
                              value={getCoachDisplayName(sharedProgram)}
                            />
                          )}
                          {guidedExercises > 0 && (
                            <MetricChip label="Guided" value={guidedExercises} tone="accent" />
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="ml-4">
                        <StatusBadge status={sharedProgram.assignmentStatus} />
                      </div>
                    </div>

                    {/* Sessions Preview */}
                    {program.sessions && program.sessions.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-text-tertiary mb-2">Sessions:</h3>
                        <div className="space-y-1">
                          {program.sessions.slice(0, 3).map((session, index) => (
                            <div key={session.id} className="rounded-xl border border-border bg-bg-tertiary/60 px-3 py-2 text-sm text-text-secondary">
                              {index + 1}. {session.name} ({session.exercises?.length || 0} exercises)
                            </div>
                          ))}
                          {program.sessions.length > 3 && (
                            <div className="text-sm text-text-muted">
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
                        className={`flex min-h-[44px] items-center rounded-xl px-4 py-2 font-semibold transition-all ${
                          isCopied
                            ? 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                            : 'bg-accent-primary text-text-on-accent hover:bg-accent-hover hover:shadow-glow'
                        }`}
                      >
                        {copyingProgramId === sharedProgram.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-text-on-accent mr-2"></div>
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
                          className="flex min-h-[44px] items-center rounded-xl border border-warning-border bg-warning-bg px-4 py-2 font-semibold text-warning-text transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingStatusId === sharedProgram.assignmentId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-warning-text mr-2"></div>
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
                          className="flex min-h-[44px] items-center rounded-xl border border-success-border bg-success-bg px-4 py-2 font-semibold text-success-text transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingStatusId === sharedProgram.assignmentId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-success-text mr-2"></div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedProgramList;
