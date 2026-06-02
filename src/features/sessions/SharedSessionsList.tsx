import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SharedSessionAssignment } from '@/types/program';
import { getSharedSessionsForAthlete, updateSharedSessionStatus } from '@/services/sessionService';
import { normalizeActivityType } from '@/types/activityLog';
import { formatPrescription } from '@/utils/prescriptionUtils';
import { ClockIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ActivityBadge, EmptyState, MetricChip, SectionDivider, Skeleton, StatusBadge, ViewToggle } from '@/components/ui';
import { formatRelativeDate, formatRelativeWithAbsolute } from '@/utils/displayFormatters';

interface SharedSessionsListProps {
  embedded?: boolean;
}

const SharedSessionsList: React.FC<SharedSessionsListProps> = ({ embedded = false }) => {
  const [assignments, setAssignments] = useState<SharedSessionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const navigate = useNavigate();

  const loadSharedSessions = useCallback(async () => {
    try {
      setLoading(true);
      const sessions = await getSharedSessionsForAthlete();
      // Sort by assigned date (newest first)
      sessions.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      setAssignments(sessions);
    } catch (err) {
      console.error('Error loading shared sessions:', err);
      toast.error('Failed to load shared sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedSessions();
  }, [loadSharedSessions]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadSharedSessions();
      }
    };

    const handleFocus = () => {
      loadSharedSessions();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadSharedSessions]);

  const toggleExpand = (assignmentId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleStatusUpdate = async (assignmentId: string, status: SharedSessionAssignment['status']) => {
    try {
      await updateSharedSessionStatus(assignmentId, status);
      setAssignments(prev => 
        prev.map(a => a.id === assignmentId ? {
          ...a,
          status,
          ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {})
        } : a)
      );
      toast.success('Status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleLogSession = (assignment: SharedSessionAssignment) => {
    const sharedSessionImportRequestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${assignment.id}-${Date.now()}`;

    // Navigate to logging with the session exercises pre-loaded
    navigate('/', { 
      state: { 
        sharedSessionAssignment: assignment,
        sharedSessionImportRequestId,
        exercises: assignment.sessionData.exercises 
      } 
    });
  };

  const groupedAssignments = useMemo(() => {
    const groups = [
      { status: 'not-started', label: 'Assigned' },
      { status: 'in-progress', label: 'In Progress' },
      { status: 'completed', label: 'Completed' },
      { status: 'copied', label: 'Copied' },
    ];

    return groups
      .map((group) => ({
        ...group,
        items: assignments.filter((assignment) => assignment.status === group.status),
      }))
      .filter((group) => group.items.length > 0);
  }, [assignments]);

  const getGuidedExerciseCount = (assignment: SharedSessionAssignment) => {
    return assignment.sessionData.exercises.filter((exercise) => {
      const hasStructured = !!exercise.prescription && exercise.instructionMode === 'structured';
      const hasFreeform = !!exercise.instructions && exercise.instructionMode === 'freeform';
      return hasStructured || hasFreeform;
    }).length;
  };

  const getCoachDisplayName = (assignment: SharedSessionAssignment) => {
    const rawName = assignment.sharedByName?.trim();
    if (!rawName) {
      return 'Your Coach';
    }

    if (assignment.sharedBy && rawName === assignment.sharedBy) {
      return 'Your Coach';
    }

    return rawName;
  };

  const getStatusHelperText = (assignment: SharedSessionAssignment) => {
    if (assignment.status === 'completed') {
      return assignment.completedAt
        ? `Completed ${formatRelativeDate(assignment.completedAt)}`
        : 'Completed based on your logged session progress';
    }

    if (assignment.status === 'in-progress') {
      return 'Continue logging this assigned session to complete it';
    }

    return 'Start this assigned session when you are ready';
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
    <div className={`${embedded ? '' : 'min-h-screen bg-bg-primary text-text-primary'}`}>
      {/* Header */}
      {embedded ? (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Assigned Sessions</h2>
          <p className="text-text-secondary text-sm">
            Sessions assigned to you by your coach
          </p>
          {assignments.length > 0 && (
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
      ) : (
        <header className="bg-bg-secondary border-b border-border p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-1">Shared Sessions</h1>
            <p className="text-text-secondary text-sm">
              Sessions assigned to you by your coach
            </p>
            {assignments.length > 0 && (
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
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto ${embedded ? '' : 'p-4 pb-20'}`}>
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg-secondary">
            <EmptyState
              icon={<UserIcon className="h-8 w-8" />}
              title="No shared sessions yet"
              description="Your coach will assign training sessions here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {groupedAssignments.map((group) => (
              <div key={group.status} className="space-y-4">
                <SectionDivider label={group.label} count={group.items.length} />
                {group.items.map(assignment => {
              const session = assignment.sessionData;
              const isExpanded = expandedSessions.has(assignment.id);
              const guidedExerciseCount = getGuidedExerciseCount(assignment);

              return (
                <div
                  key={assignment.id}
                  className="overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-md transition-all hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-glow"
                >
                  {/* Session Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary mb-1">
                          {session.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
                          {session.isWarmupSession && (
                            <span className="px-2 py-0.5 rounded-full bg-info-bg text-info-text text-xs font-medium">
                              Warm-up session
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {viewMode === 'detailed'
                              ? formatRelativeWithAbsolute(assignment.assignedAt)
                              : formatRelativeDate(assignment.assignedAt)}
                          </span>
                          <MetricChip label="Exercises" value={session.exercises.length} />
                          {viewMode === 'detailed' && <MetricChip label="Coach" value={getCoachDisplayName(assignment)} />}
                          {guidedExerciseCount > 0 && (
                            <MetricChip label="Guided" value={guidedExerciseCount} tone="accent" />
                          )}
                        </div>
                      </div>
                      <StatusBadge status={assignment.status} className="flex-shrink-0" />
                    </div>

                    {/* Coach Message */}
                    {assignment.coachMessage && (
                      <div className="bg-info-bg border border-info-border rounded-lg p-3 mb-3">
                        <p className="text-sm text-info-text italic">
                          "{assignment.coachMessage}"
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleLogSession(assignment)}
                        className="min-h-[44px] flex-1 min-w-[140px] rounded-xl bg-accent-primary px-4 py-2 font-semibold text-text-on-accent transition-all hover:bg-accent-hover hover:shadow-glow"
                      >
                        {assignment.status === 'completed'
                          ? 'Log Again'
                          : guidedExerciseCount > 0
                            ? 'Log with Guide'
                            : 'Log Now'}
                      </button>
                      <button
                        onClick={() => toggleExpand(assignment.id)}
                        className="min-h-[44px] flex-1 min-w-[140px] rounded-xl border border-border bg-bg-tertiary px-4 py-2 font-semibold text-text-primary transition-colors hover:bg-bg-quaternary"
                      >
                        {isExpanded ? 'Hide' : 'View'} Details
                      </button>
                      {assignment.status === 'not-started' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'in-progress')}
                          className="min-h-[44px] rounded-xl bg-status-info px-4 py-2 font-semibold text-text-on-accent transition-colors hover:opacity-90"
                        >
                          Start
                        </button>
                      )}
                      {assignment.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'completed')}
                          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-status-success px-4 py-2 font-semibold text-text-on-accent transition-colors hover:opacity-90"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Complete
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      {getStatusHelperText(assignment)}
                    </p>
                  </div>

                  {/* Expanded Exercise List */}
                  {isExpanded && (
                    <div className="p-4 bg-bg-primary">
                      <h4 className="text-sm font-semibold text-text-secondary mb-3">Exercises:</h4>
                      <div className="space-y-2">
                        {session.exercises.map((exercise, idx) => (
                          <div
                            key={exercise.id}
                            className="bg-bg-tertiary rounded-lg p-3 hover:bg-bg-quaternary transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-text-tertiary text-sm font-medium w-6">
                                    {idx + 1}.
                                  </span>
                                  <h5 className="text-text-primary font-medium">{exercise.name}</h5>
                                  <ActivityBadge activityType={exercise.activityType} />
                                </div>
                                {exercise.prescription && exercise.instructionMode === 'structured' && (
                                  <div className="text-sm text-info-text ml-8">
                                    📋 {formatPrescription(exercise.prescription, normalizeActivityType(exercise.activityType))}
                                  </div>
                                )}
                                {exercise.instructions && exercise.instructionMode === 'freeform' && (
                                  <div className="text-sm text-accent-primary italic ml-8">
                                    {exercise.instructions}
                                  </div>
                                )}
                                {exercise.notes && (
                                  <div className="text-sm text-text-tertiary ml-8 mt-1">
                                    Note: {exercise.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedSessionsList;
