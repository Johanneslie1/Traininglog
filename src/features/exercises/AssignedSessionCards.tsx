import React from 'react';
import Button from '@/components/ui/Button';
import { orderedSessionExercises } from '@/features/exercises/assignedSessionPlan';
import { plannedSummary } from '@/features/coach-shell/monitorLines';
import type { SharedSessionAssignment } from '@/types/program';

interface AssignedSessionCardsProps {
  assignments: SharedSessionAssignment[];
  startingAssignmentId: string | null;
  decliningAssignmentId: string | null;
  onStart: (assignment: SharedSessionAssignment) => void;
  onDecline: (assignment: SharedSessionAssignment) => void;
}

const AssignedSessionCards: React.FC<AssignedSessionCardsProps> = ({
  assignments,
  startingAssignmentId,
  decliningAssignmentId,
  onStart,
  onDecline,
}) => {
  if (assignments.length === 0) return null;
  const busy = startingAssignmentId !== null || decliningAssignmentId !== null;

  return (
    <section className="mb-4 space-y-3" aria-label="Assigned sessions">
      {assignments.map((assignment) => {
        const exercises = orderedSessionExercises(assignment);
        const programName = assignment.sourceProgramName?.trim();
        const starting = startingAssignmentId === assignment.id;
        const declining = decliningAssignmentId === assignment.id;
        return (
          <article key={assignment.id} className="rounded-2xl border border-border bg-bg-secondary p-4">
            <p className="text-xs font-medium text-text-tertiary">
              From your coach{programName ? ` · ${programName}` : ''}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">{assignment.sessionData.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} · not started
            </p>
            {assignment.coachMessage?.trim() && (
              <p className="mt-2 text-sm text-text-secondary">{assignment.coachMessage.trim()}</p>
            )}
            <ul className="mt-3 space-y-2">
              {exercises.map((exercise) => {
                const summary = plannedSummary(exercise.prescription, exercise.activityType);
                return (
                  <li key={exercise.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-text-primary">{exercise.name}</span>
                    {summary && <span className="text-right text-text-tertiary">{summary}</span>}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                fullWidth
                isLoading={starting}
                disabled={busy}
                onClick={() => onStart(assignment)}
              >
                Start session
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                isLoading={declining}
                disabled={busy}
                onClick={() => onDecline(assignment)}
              >
                Decline
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default AssignedSessionCards;
