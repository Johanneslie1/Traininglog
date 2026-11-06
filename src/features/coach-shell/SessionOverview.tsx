import React, { useMemo } from 'react';
import type { TeamMember } from '@/services/teamService';
import type { CoachPlacement } from '@/features/coach-shell/deskPlan';
import { memberLabel } from '@/features/coach-shell/deskPlan';
import {
  assignLogsToSessions,
  buildMonitorLines,
  linesForLoggedExercise,
  plannedSummary,
  sessionActivityLabel,
  unmatchedSessionLogs,
} from '@/features/coach-shell/monitorLines';
import { useTodayTrainingLogs } from '@/features/coach-shell/useTodayTrainingLogs';
import { dateKeyToLocalDate } from '@/utils/dateUtils';

interface SessionOverviewProps {
  teamName: string | null;
  members: TeamMember[];
  placements: CoachPlacement[];
  today: string;
  linkedDate: string | null;
  loading: boolean;
  loadError: string | null;
}

function formatToday(dateKey: string): string {
  const date = dateKeyToLocalDate(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

const SessionOverview: React.FC<SessionOverviewProps> = ({
  teamName,
  members,
  placements,
  today,
  linkedDate,
  loading,
  loadError,
}) => {
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const todayPlacements = useMemo(
    () => placements
      .filter((placement) => membersById.has(placement.athleteId) && placement.plannedDates.includes(today))
      .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt) || a.sessionName.localeCompare(b.sessionName)),
    [membersById, placements, today]
  );
  const athleteIds = useMemo(
    () => [...new Set(todayPlacements.map((placement) => placement.athleteId))],
    [todayPlacements]
  );
  const { logsByAthlete, failedAthleteIds, live } = useTodayTrainingLogs(athleteIds, today);
  const openedFromAnotherDay = Boolean(linkedDate && linkedDate !== today);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-4 py-5 md:px-8">
      <div className="max-w-6xl">
        <p className="text-sm font-medium text-text-tertiary">{formatToday(today)}</p>
        <h2 className="mt-1 text-2xl font-bold">Session overview</h2>
        {teamName && (
          <p className="mt-1 text-sm font-medium text-text-secondary">{teamName}</p>
        )}
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Today only. Planned work fills in when an athlete saves a set. Choose the team in the left menu.
        </p>
        {openedFromAnotherDay && (
          <p className="mt-2 text-sm text-text-secondary">
            This screen follows today&apos;s assignments. Past days stay on the calendar.
          </p>
        )}
        {athleteIds.length > 0 && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {failedAthleteIds.length === athleteIds.length ? 'Live updates are unavailable' : live ? 'Live' : 'Connecting'}
          </p>
        )}
      </div>

      {loadError && (
        <p className="mt-4 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary" role="alert">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-text-secondary">Loading today&apos;s sessions…</p>
      ) : !teamName ? (
        <p className="mt-8 max-w-xl text-sm text-text-secondary">
          No team yet. Create one in the phone app, then assign work here.
        </p>
      ) : members.length === 0 ? (
        <p className="mt-8 max-w-xl text-sm text-text-secondary">
          {teamName} has no athletes yet. Add athletes in the phone app, or choose another team in the left menu.
        </p>
      ) : todayPlacements.length === 0 ? (
        <p className="mt-8 max-w-xl text-sm text-text-secondary">
          No athletes on {teamName} have a session assigned for today. Place one on the calendar.
        </p>
      ) : (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-6">
          {athleteIds.map((athleteId) => {
            const member = membersById.get(athleteId);
            const sessions = todayPlacements.filter((placement) => placement.athleteId === athleteId);
            const logs = logsByAthlete[athleteId] ?? [];
            const assigned = assignLogsToSessions(
              sessions.map((session) => ({ id: session.sessionId, exercises: session.exercises })),
              logs
            );
            const failed = failedAthleteIds.includes(athleteId);
            return (
              <article
                key={athleteId}
                className="w-80 shrink-0 rounded-2xl border border-border bg-bg-secondary p-4"
              >
                <h3 className="text-base font-semibold">{member ? memberLabel(member) : 'Athlete'}</h3>
                {failed && (
                  <p className="mt-2 text-xs text-text-secondary">Live updates are unavailable for this athlete. The plan is still shown.</p>
                )}
                <div className="mt-4 space-y-5">
                  {sessions.map((session) => {
                    const sessionLogs = assigned.bySessionId[session.sessionId] ?? [];
                    const extras = unmatchedSessionLogs(session.exercises, sessionLogs);
                    return (
                      <div key={session.id}>
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold">{session.sessionName}</h4>
                          <span className="rounded-full bg-bg-tertiary px-2 py-1 text-xs text-text-secondary">
                            {sessionActivityLabel(session.exercises)}
                          </span>
                        </div>
                        {session.programName && (
                          <p className="mt-1 text-xs text-text-tertiary">{session.programName}</p>
                        )}
                        <ul className="mt-3 space-y-3">
                          {session.exercises.map((exercise) => {
                            const summary = plannedSummary(exercise.prescription, exercise.activityType);
                            return (
                              <li key={exercise.id}>
                                {summary && <p className="text-xs text-text-tertiary">{summary}</p>}
                                <ul className="mt-1 space-y-1">
                                  {buildMonitorLines(exercise, sessionLogs).map((line) => (
                                    <li key={line.id} className="flex items-baseline justify-between gap-3 text-sm">
                                      <span className="text-text-secondary">{line.label}</span>
                                      <span className={line.logged ? 'text-text-primary' : 'text-text-tertiary'}>{line.detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            );
                          })}
                        </ul>
                        {extras.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Also logged</p>
                            <ul className="mt-1 space-y-1">
                              {extras.flatMap((log) => linesForLoggedExercise(log)).map((line) => (
                                <li key={line.id} className="flex items-baseline justify-between gap-3 text-sm">
                                  <span className="text-text-secondary">{line.label}</span>
                                  <span className="text-text-primary">{line.detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SessionOverview;
