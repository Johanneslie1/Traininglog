import React, { useState, useEffect, useCallback } from 'react';
import { SharedSessionAssignment } from '@/types/program';
import { getSharedSessionsForAthlete, updateSharedSessionStatus } from '@/services/sessionService';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';
import { formatPrescription } from '@/utils/prescriptionUtils';
import { ClockIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SharedSessionsListProps {
  embedded?: boolean;
}

const SharedSessionsList: React.FC<SharedSessionsListProps> = ({ embedded = false }) => {
  const [assignments, setAssignments] = useState<SharedSessionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-started':
        return { label: 'Not Started', color: 'bg-bg-tertiary', textColor: 'text-text-secondary' };
      case 'in-progress':
        return { label: 'In Progress', color: 'bg-info-bg', textColor: 'text-info-text' };
      case 'completed':
        return { label: 'Completed', color: 'bg-success-bg', textColor: 'text-success-text' };
      case 'copied':
        return { label: 'Copied', color: 'bg-accent-100', textColor: 'text-accent-700' };
      default:
        return { label: status, color: 'bg-bg-tertiary', textColor: 'text-text-secondary' };
    }
  };

  const getActivityTypeInfo = (activityType?: ActivityType) => {
    const type = normalizeActivityType(activityType);
    switch (type) {
      case ActivityType.RESISTANCE:
        return { label: 'Resistance', color: 'bg-activity-resistance-bg', textColor: 'text-activity-resistance' };
      case ActivityType.SPORT:
        return { label: 'Sport', color: 'bg-activity-sport-bg', textColor: 'text-activity-sport' };
      case ActivityType.STRETCHING:
        return { label: 'Stretching', color: 'bg-activity-stretching-bg', textColor: 'text-activity-stretching' };
      case ActivityType.ENDURANCE:
        return { label: 'Endurance', color: 'bg-activity-endurance-bg', textColor: 'text-activity-endurance' };
      case ActivityType.SPEED_AGILITY:
        return { label: 'Speed/Agility', color: 'bg-activity-speed-bg', textColor: 'text-activity-speed' };
      case ActivityType.OTHER:
        return { label: 'Other', color: 'bg-activity-other-bg', textColor: 'text-activity-other' };
      default:
        return { label: 'Resistance', color: 'bg-activity-resistance-bg', textColor: 'text-activity-resistance' };
    }
  };

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
        ? `Completed ${formatDate(assignment.completedAt)}`
        : 'Completed based on your logged session progress';
    }

    if (assignment.status === 'in-progress') {
      return 'Continue logging this assigned session to complete it';
    }

    return 'Start this assigned session when you are ready';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'py-10' : 'min-h-screen bg-bg-primary'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading shared sessions...</p>
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
        </div>
      ) : (
        <header className="bg-bg-secondary border-b border-border p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-1">Shared Sessions</h1>
            <p className="text-text-secondary text-sm">
              Sessions assigned to you by your coach
            </p>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto ${embedded ? '' : 'p-4 pb-20'}`}>
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary/50 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No shared sessions yet</h3>
            <p className="text-text-tertiary text-sm">
              Your coach will assign training sessions here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => {
              const session = assignment.sessionData;
              const isExpanded = expandedSessions.has(assignment.id);
              const statusBadge = getStatusBadge(assignment.status);
              const guidedExerciseCount = getGuidedExerciseCount(assignment);

              return (
                <div
                  key={assignment.id}
                  className="bg-bg-secondary rounded-xl border border-border hover:border-border-hover transition-all overflow-hidden"
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
                            {formatDate(assignment.assignedAt)}
                          </span>
                          <span>•</span>
                          <span>{session.exercises.length} exercises</span>
                          <span>•</span>
                          <span className="text-text-secondary">Coach: {getCoachDisplayName(assignment)}</span>
                          {guidedExerciseCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-accent-primary">{guidedExerciseCount} guided</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color} ${statusBadge.textColor} flex-shrink-0`}>
                        {statusBadge.label}
                      </span>
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
                        className="flex-1 min-w-[140px] px-4 py-2 bg-accent-primary hover:bg-accent-hover text-text-on-accent rounded-lg font-medium transition-colors"
                      >
                        {assignment.status === 'completed'
                          ? 'Log Again'
                          : guidedExerciseCount > 0
                            ? 'Log with Guide'
                            : 'Log Now'}
                      </button>
                      <button
                        onClick={() => toggleExpand(assignment.id)}
                        className="flex-1 min-w-[140px] px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary text-text-primary rounded-lg font-medium transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'View'} Details
                      </button>
                      {assignment.status === 'not-started' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'in-progress')}
                          className="px-4 py-2 bg-status-info hover:opacity-90 text-text-on-accent rounded-lg font-medium transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {assignment.status === 'in-progress' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'completed')}
                          className="px-4 py-2 bg-status-success hover:opacity-90 text-text-on-accent rounded-lg font-medium transition-colors flex items-center gap-2"
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
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getActivityTypeInfo(exercise.activityType).color} ${getActivityTypeInfo(exercise.activityType).textColor}`}>
                                    {getActivityTypeInfo(exercise.activityType).label}
                                  </span>
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
        )}
      </main>
    </div>
  );
};

export default SharedSessionsList;
