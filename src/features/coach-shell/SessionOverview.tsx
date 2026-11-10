import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import type { TeamMember } from '@/services/teamService';
import type { CoachPlacement } from '@/features/coach-shell/deskPlan';
import { memberLabel } from '@/features/coach-shell/deskPlan';
import {
  buildAthleteSessions,
  chooseSessionId,
  sportsLoadSession,
  type AthleteSessionView,
  type SetTableExercise,
} from '@/features/coach-shell/overviewSetTable';
import {
  sessionProgressLabel,
  type SessionProgressStatus,
} from '@/features/coach-shell/sessionProgress';
import { useTodayTrainingLogs } from '@/features/coach-shell/useTodayTrainingLogs';
import type { SportsLoadSession } from '@/types/srpe';
import { dateKeyToLocalDate } from '@/utils/dateUtils';

const STACK_LIMIT = 10;

function progressBadgeClass(status: SessionProgressStatus): string {
  switch (status) {
    case 'logging':
      return 'bg-accent-primary/15 text-accent-primary';
    case 'started':
      return 'bg-bg-tertiary text-text-primary';
    default:
      return 'bg-bg-tertiary text-text-secondary';
  }
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

function sportsTimestamp(value: SportsLoadSession['timestamp']): number {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.getTime() : 0;
  }
  if (value && typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

function SetTable({ exercise }: { exercise: SetTableExercise }) {
  return (
    <table className="w-full border-collapse text-left text-xs">
      <caption className="mb-1 text-left text-xs font-semibold text-text-primary">{exercise.name}</caption>
      <thead>
        <tr className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
          <th scope="col" className="py-1 pr-2 font-medium">Set</th>
          <th scope="col" className="py-1 pr-2 font-medium">Reps</th>
          <th scope="col" className="py-1 pr-2 font-medium">Load</th>
          <th scope="col" className="py-1 font-medium">RPE</th>
        </tr>
      </thead>
      <tbody>
        {exercise.rows.map((row) => (
          <tr key={row.id} className={row.logged ? 'text-text-primary' : 'text-text-tertiary'}>
            <th scope="row" className="py-0.5 pr-2 font-medium">{row.setNumber}</th>
            <td className="py-0.5 pr-2">{row.reps}</td>
            <td className="py-0.5 pr-2">{row.load}</td>
            <td className="py-0.5">{row.rpe}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface SessionOverviewProps {
  teamName: string | null;
  members: TeamMember[];
  placements: CoachPlacement[];
  today: string;
  linkedDate: string | null;
  loading: boolean;
  loadError: string | null;
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
  const athleteIds = useMemo(() => members.map((member) => member.id), [members]);
  const memberKey = athleteIds.join('|');
  const { logsByAthlete, sportsLoadByAthlete, failedAthleteIds, live, settled } = useTodayTrainingLogs(athleteIds, today);
  const sessionsByAthlete = useMemo(() => {
    const map = new Map<string, AthleteSessionView[]>();
    athleteIds.forEach((athleteId) => {
      const athletePlacements = todayPlacements
        .filter((placement) => placement.athleteId === athleteId)
        .map((placement) => ({
          id: placement.id,
          sessionId: placement.sessionId,
          sessionName: placement.sessionName,
          programName: placement.programName,
          exercises: placement.exercises,
        }));
      const training = buildAthleteSessions(athletePlacements, logsByAthlete[athleteId] ?? []);
      const sports = (sportsLoadByAthlete[athleteId] ?? []).map((session) => sportsLoadSession({
        id: session.id,
        name: session.sessionName?.trim() || session.sportName?.trim() || 'Sports load',
        rpe: session.rpe,
        durationMinutes: session.durationMinutes,
        timestampMs: sportsTimestamp(session.timestamp),
      }));
      map.set(athleteId, [...training, ...sports]);
    });
    return map;
  }, [athleteIds, logsByAthlete, sportsLoadByAthlete, todayPlacements]);

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [stacked, setStacked] = useState(false);
  const [sessionChoice, setSessionChoice] = useState<Record<string, string>>({});
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const columnRefs = useRef(new Map<string, HTMLElement>());
  const pendingScroll = useRef<string | null>(null);
  const openedFromAnotherDay = Boolean(linkedDate && linkedDate !== today);

  useEffect(() => {
    setOpenIds([]);
    setSessionChoice({});
    setLimitNote(null);
    setStacked(false);
  }, [memberKey]);

  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    columnRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [openIds]);

  const openAthlete = (athleteId: string) => {
    if (openIds.includes(athleteId)) {
      columnRefs.current.get(athleteId)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      return;
    }
    if (stacked && openIds.length >= STACK_LIMIT) {
      setLimitNote('Stack shows 10 athletes. Close one to open another.');
      return;
    }
    pendingScroll.current = athleteId;
    setLimitNote(null);
    setOpenIds((current) => [...current, athleteId]);
  };

  const closeAthlete = (athleteId: string) => {
    setOpenIds((current) => current.filter((id) => id !== athleteId));
    setLimitNote(null);
  };

  const toggleStack = () => {
    if (!stacked && openIds.length > STACK_LIMIT) {
      setLimitNote('Close columns until 10 are open, then stack them.');
      return;
    }
    setLimitNote(null);
    setStacked((current) => !current);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setOpenIds((current) => {
      const next = [...current];
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination!.index, 0, moved);
      return next;
    });
  };

  const rosterLine = (athleteId: string) => {
    const sessions = sessionsByAthlete.get(athleteId) ?? [];
    const activeId = chooseSessionId(sessions, sessionChoice[athleteId]);
    const active = sessions.find((session) => session.id === activeId);
    if (!active) return 'No session today';
    return active.name;
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-tertiary">{formatToday(today)}</p>
            <h2 className="mt-1 text-2xl font-bold">Session overview</h2>
            {teamName && <p className="mt-1 text-sm font-medium text-text-secondary">{teamName}</p>}
          </div>
          {athleteIds.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {failedAthleteIds.length === athleteIds.length ? 'Live updates are unavailable' : live ? 'Live' : 'Connecting'}
            </p>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Today only. Click an athlete to open a column. Drag a column header to reorder. Choose the team in the left menu.
        </p>
        {openedFromAnotherDay && (
          <p className="mt-2 text-sm text-text-secondary">
            This screen follows today. Past days stay on the calendar.
          </p>
        )}
      </div>

      {loadError && (
        <p className="mx-4 mt-4 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary md:mx-6" role="alert">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="px-4 py-8 text-sm text-text-secondary md:px-6">Loading today&apos;s sessions…</p>
      ) : !teamName ? (
        <p className="px-4 py-8 text-sm text-text-secondary md:px-6">
          No team yet. Create one in the phone app, then assign work here.
        </p>
      ) : members.length === 0 ? (
        <p className="px-4 py-8 text-sm text-text-secondary md:px-6">
          {teamName} has no athletes yet. Add athletes in the phone app, or choose another team in the left menu.
        </p>
      ) : (
        <div className="mt-4 flex min-h-0 flex-1">
          <div className="flex w-52 shrink-0 flex-col border-r border-border">
            <div className="px-3 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Athletes</p>
              <p className="mt-1 text-xs text-text-tertiary">Click to open</p>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
              {athleteIds.map((athleteId) => {
                const member = membersById.get(athleteId);
                const open = openIds.includes(athleteId);
                const sessions = sessionsByAthlete.get(athleteId) ?? [];
                const activeId = chooseSessionId(sessions, sessionChoice[athleteId]);
                const active = sessions.find((session) => session.id === activeId);
                const status = active?.status ?? 'not-started';
                return (
                  <li key={athleteId}>
                    <button
                      type="button"
                      aria-pressed={open}
                      className={`w-full rounded-lg px-2 py-2 text-left ${open ? 'bg-accent-primary/15' : 'hover:bg-bg-tertiary'}`}
                      onClick={() => openAthlete(athleteId)}
                    >
                      <span className="block text-sm font-semibold">{member ? memberLabel(member) : 'Athlete'}</span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-text-secondary">{rosterLine(athleteId)}</span>
                        {active && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${progressBadgeClass(status)}`}>
                            {sessionProgressLabel(status)}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2">
              <p className="text-xs text-text-tertiary">
                {stacked
                  ? 'Stacked. Ten athletes fit. Drag a header to reorder.'
                  : 'Five columns fit on screen. More than five scroll sideways.'}
              </p>
              <button
                type="button"
                aria-pressed={stacked}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${stacked ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                onClick={toggleStack}
              >
                {stacked ? 'Side by side' : 'Stack'}
              </button>
            </div>
            {limitNote && (
              <p className="px-4 pb-2 text-xs text-text-secondary" role="status">{limitNote}</p>
            )}
            {!settled && openIds.length === 0 && (
              <p className="px-4 text-xs text-text-tertiary">Connecting to today&apos;s logs…</p>
            )}
            {openIds.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-secondary">
                Click an athlete to open their session.
              </p>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="overview-columns" direction={stacked ? 'vertical' : 'horizontal'}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={stacked
                        ? 'grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-auto px-4 pb-4 md:grid-cols-5'
                        : 'flex min-h-0 flex-1 items-start gap-2 overflow-x-auto px-4 pb-4'}
                    >
                      {openIds.map((athleteId, index) => {
                        const member = membersById.get(athleteId);
                        const name = member ? memberLabel(member) : 'Athlete';
                        const sessions = sessionsByAthlete.get(athleteId) ?? [];
                        const selectedId = chooseSessionId(sessions, sessionChoice[athleteId]);
                        const selected = sessions.find((session) => session.id === selectedId) ?? null;
                        const failed = failedAthleteIds.includes(athleteId);
                        return (
                          <Draggable key={athleteId} draggableId={athleteId} index={index}>
                            {(dragProvided, snapshot) => (
                              <article
                                id={`overview-column-${athleteId}`}
                                ref={(node) => {
                                  dragProvided.innerRef(node);
                                  if (node) columnRefs.current.set(athleteId, node);
                                  else columnRefs.current.delete(athleteId);
                                }}
                                {...dragProvided.draggableProps}
                                className={`rounded-2xl border bg-bg-secondary p-3 ${
                                  snapshot.isDragging ? 'border-accent-primary' : 'border-border'
                                } ${stacked ? 'min-w-0' : 'min-w-[10rem] shrink-0 grow basis-[calc((100%-2rem)/5)]'}`}
                              >
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing"
                                    aria-label={`Reorder ${name}`}
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <h3 className="truncate text-sm font-semibold">{name}</h3>
                                  </button>
                                  {selected && (
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${progressBadgeClass(selected.status)}`}>
                                      {sessionProgressLabel(selected.status)}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-md px-1.5 text-sm text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
                                    aria-label={`Close ${name}`}
                                    onClick={() => closeAthlete(athleteId)}
                                  >
                                    ×
                                  </button>
                                </div>
                                {failed && (
                                  <p className="mt-2 text-xs text-text-secondary">Live updates are unavailable for this athlete.</p>
                                )}
                                {sessions.length === 0 ? (
                                  <p className="mt-3 text-xs text-text-secondary">Nothing assigned or logged today.</p>
                                ) : (
                                  <>
                                    {sessions.length > 1 ? (
                                      <label className="mt-3 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                                        Session
                                        <select
                                          className="mt-1 w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs font-medium normal-case tracking-normal text-text-primary"
                                          aria-label={`Session for ${name}`}
                                          value={selected?.id ?? ''}
                                          onChange={(event) => {
                                            setSessionChoice((current) => ({ ...current, [athleteId]: event.target.value }));
                                          }}
                                        >
                                          {sessions.map((session) => (
                                            <option key={session.id} value={session.id}>{session.name}</option>
                                          ))}
                                        </select>
                                      </label>
                                    ) : (
                                      <p className="mt-2 text-xs font-medium text-text-secondary">{selected?.name}</p>
                                    )}
                                    {selected?.detail && (
                                      <p className="mt-1 text-[11px] text-text-tertiary">{selected.detail}</p>
                                    )}
                                    <div className="mt-3 space-y-3">
                                      {selected?.exercises.map((exercise) => (
                                        <SetTable key={exercise.id} exercise={exercise} />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </article>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default SessionOverview;
