import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import type { Program } from '@/types/program';
import type { TeamMember } from '@/services/teamService';
import {
  clearPlannedDate,
  placeSessionOnDate,
  placeSessionOnDates,
} from '@/services/coachPlacementService';
import type { CoachPlacement } from '@/features/coach-shell/deskPlan';
import {
  buildBulkPlaceTargets,
  cellKey,
  selectionSummary,
  toggleAthleteAcrossDates,
  toggleCellKey,
  toggleDateAcrossAthletes,
  uniqueSelectedAthletes,
  uniqueSelectedDates,
} from '@/features/coach-shell/calendarSelection';
import type { CalendarCellDaySummary } from '@/features/coach-shell/calendarLoggedSummary';
import { useTeamCalendarLogs } from '@/features/coach-shell/useTeamCalendarLogs';
import {
  chunkWeeks,
  dayCaption,
  memberLabel,
  programPlacementDates,
  rangeDates,
  rangeTitle,
  sessionsInProgramOrder,
  shiftAnchor,
  weekdayLabel,
  type CalendarRange,
} from '@/features/coach-shell/deskPlan';

interface CoachCalendarProps {
  teamName: string | null;
  members: TeamMember[];
  placements: CoachPlacement[];
  programs: Program[];
  today: string;
  loading: boolean;
  loadError: string | null;
  onChanged: () => Promise<void>;
  onOpenOverview: (date: string) => void;
}

const RANGES: Array<{ id: CalendarRange; label: string }> = [
  { id: 'week', label: 'Week' },
  { id: 'biweek', label: '2 weeks' },
  { id: 'fourweek', label: '4 weeks' },
  { id: 'year', label: 'Year' },
];

const COACH_NOTE_MAX = 500;

function actionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/permission/i.test(error.message)) return 'You do not have permission to change that assignment.';
    if (error.message && error.message.length < 160) return error.message;
  }
  return fallback;
}

function LoggedWorkChips({ summary }: { summary?: CalendarCellDaySummary }) {
  if (!summary?.hasLoggedWork) return null;
  const typeChips = summary.chips.filter((chip) => chip.kind !== 'sportsLoad');
  const loadChip = summary.chips.find((chip) => chip.kind === 'sportsLoad');
  return (
    <>
      {typeChips.map((chip) => (
        <span
          key={chip.kind}
          className="truncate rounded border border-border px-1 py-0.5 text-[11px] text-text-secondary"
        >
          {chip.label}
        </span>
      ))}
      {loadChip && (
        <span className="truncate rounded border border-accent-primary px-1 py-0.5 text-[11px] text-accent-primary">
          {loadChip.label}
        </span>
      )}
      {summary.collapsedTypeCount > 0 && (
        <span className="text-[11px] text-text-tertiary">
          +{summary.collapsedTypeCount} type{summary.collapsedTypeCount === 1 ? '' : 's'}
        </span>
      )}
    </>
  );
}

function YearPresenceDots({
  summary,
  hasPlanned,
}: {
  summary?: CalendarCellDaySummary;
  hasPlanned: boolean;
}) {
  const hasLoggedGym = Boolean(summary?.chips.some((chip) => chip.kind !== 'sportsLoad'));
  const hasLoad = Boolean(summary?.totalSportsLoad && summary.totalSportsLoad > 0);
  if (!hasPlanned && !hasLoggedGym && !hasLoad) return null;
  return (
    <span className="mt-auto flex items-center gap-1 px-0.5 pt-0.5" aria-hidden>
      {hasPlanned && <span className="h-1.5 w-1.5 rounded-full bg-bg-secondary ring-1 ring-border" />}
      {hasLoggedGym && <span className="h-1.5 w-1.5 rounded-full border border-border" />}
      {hasLoad && <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />}
    </span>
  );
}

const CoachCalendar: React.FC<CoachCalendarProps> = ({
  teamName,
  members,
  placements,
  programs,
  today,
  loading,
  loadError,
  onChanged,
  onOpenOverview,
}) => {
  const [range, setRange] = useState<CalendarRange>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedCells, setSelectedCells] = useState<Set<string>>(() => new Set());
  const [programId, setProgramId] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [coachNote, setCoachNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const memberIds = new Set(members.map((member) => member.id));
    setSelectedCells((current) => {
      const next = new Set([...current].filter((key) => {
        const athleteId = key.split('|')[0];
        return memberIds.has(athleteId);
      }));
      return next.size === current.size ? current : next;
    });
  }, [members]);

  const dates = useMemo(() => rangeDates(anchor, range), [anchor, range]);
  const weeks = useMemo(() => chunkWeeks(dates), [dates]);
  const title = rangeTitle(dates);
  const athleteIds = useMemo(() => members.map((member) => member.id), [members]);
  const { summaries: logSummaries, loading: logsLoading } = useTeamCalendarLogs(athleteIds, dates);
  const compactLogged = range === 'year';
  const selectedProgram = programs.find((program) => program.id === programId) ?? null;
  const programSessions = useMemo(
    () => (selectedProgram ? sessionsInProgramOrder(selectedProgram.sessions ?? []) : []),
    [selectedProgram]
  );

  useEffect(() => {
    if (!sessionKey) return;
    const stillThere = programSessions.some((session) => `${programId}::${session.id}` === sessionKey);
    if (!stillThere) setSessionKey('');
  }, [programId, programSessions, sessionKey]);

  const selectedSession = programSessions.find((session) => `${programId}::${session.id}` === sessionKey) ?? null;
  const summary = selectionSummary(selectedCells);
  const selectedDates = uniqueSelectedDates(selectedCells);
  const selectedAthleteIds = uniqueSelectedAthletes(selectedCells);
  const singleCellKey = summary.cellCount === 1 ? [...selectedCells][0] : null;
  const singleCell = singleCellKey
    ? { athleteId: singleCellKey.split('|')[0], date: singleCellKey.slice(singleCellKey.indexOf('|') + 1) }
    : null;
  const cellPlacements = singleCell
    ? placements.filter(
      (placement) => placement.athleteId === singleCell.athleteId && placement.plannedDates.includes(singleCell.date)
    )
    : [];
  const trimmedNote = coachNote.trim();
  const overviewDate = selectedDates.length === 1 ? selectedDates[0] : today;

  const placeSession = async () => {
    if (summary.cellCount === 0 || !selectedSession || !selectedProgram) return;
    const targets = buildBulkPlaceTargets(selectedCells, selectedSession.id, placements);
    if (targets.length === 0) {
      toast.success('That session is already on the selected days.');
      return;
    }
    setSaving(true);
    try {
      const placed = await placeSessionOnDates({
        session: selectedSession,
        targets,
        programId: selectedProgram.id,
        programName: selectedProgram.name,
        coachMessage: trimmedNote || undefined,
      });
      await onChanged();
      toast.success(placed === 1 ? 'Placed on 1 cell' : `Placed on ${placed} cells`);
    } catch (error) {
      toast.error(actionError(error, 'Could not place that session.'));
      await onChanged().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  };

  const placeProgram = async () => {
    if (summary.cellCount === 0 || !selectedProgram) return;
    if (selectedDates.length !== 1) {
      toast.error('Place program needs one start day. Select cells on a single date.');
      return;
    }
    const startDate = selectedDates[0];
    const sessions = programSessions.filter((session) => session.exercises?.length);
    if (sessions.length === 0) {
      toast.error('Add at least one exercise before assigning this program.');
      return;
    }
    setSaving(true);
    try {
      let placed = 0;
      for (const athleteId of selectedAthleteIds) {
        const planned = programPlacementDates(startDate, sessions.length);
        const pending = sessions.flatMap((session, index) => {
          const date = planned[index];
          const existing = placements.find(
            (placement) => placement.athleteId === athleteId && placement.sessionId === session.id
          );
          if (!date || existing?.plannedDates.includes(date)) return [];
          return [{ session, date, assignmentId: existing?.id }];
        });
        for (const item of pending) {
          await placeSessionOnDate({
            session: item.session,
            athleteId,
            date: item.date,
            assignmentId: item.assignmentId,
            programId: selectedProgram.id,
            programName: selectedProgram.name,
            coachMessage: trimmedNote || undefined,
          });
          placed += 1;
        }
      }
      await onChanged();
      if (placed === 0) toast.success('Those sessions are already placed.');
      else toast.success(placed === 1 ? 'Program placed on 1 cell' : `Program placed on ${placed} cells`);
    } catch (error) {
      toast.error(actionError(error, 'Could not place that program.'));
      await onChanged().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  };

  const clearDate = async (assignmentId: string, date: string) => {
    setSaving(true);
    try {
      await clearPlannedDate(assignmentId, date);
      await onChanged();
      toast.success('Date cleared. The assignment stays.');
    } catch (error) {
      toast.error(actionError(error, 'Could not clear that date.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Calendar</h2>
            <p className="mt-1 text-sm text-text-secondary">{title}</p>
            {teamName && (
              <p className="mt-1 text-sm font-medium text-text-secondary">{teamName}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Calendar range">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={range === item.id}
                className={`rounded-lg px-3 py-1.5 text-sm ${range === item.id ? 'bg-bg-tertiary font-semibold text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'}`}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAnchor((current) => shiftAnchor(current, range, -1))}>
              Previous
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAnchor(new Date())}>
              Today
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setAnchor((current) => shiftAnchor(current, range, 1))}>
              Next
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-border px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-text-secondary" aria-live="polite">
            {summary.cellCount > 0
              ? `${summary.athleteCount} athlete${summary.athleteCount === 1 ? '' : 's'} · ${summary.dayCount} day${summary.dayCount === 1 ? '' : 's'} · ${summary.cellCount} cell${summary.cellCount === 1 ? '' : 's'}`
              : 'Select athlete/day cells to assign a program or a session.'}
          </p>
          {summary.cellCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCells(new Set())}>
              Clear selection
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-text-tertiary">
          Click cells to toggle. Athlete names select that row; day headers select that column. Place program needs one start day.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] text-text-primary">Session</span>
            Planned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-secondary">Resistance · 4</span>
            Logged
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-accent-primary px-1.5 py-0.5 text-[10px] text-accent-primary">Load 320</span>
            Sports load
          </span>
          {logsLoading && <span className="text-text-tertiary">Updating logs…</span>}
        </div>
        {loadError && (
          <p className="mt-3 text-sm text-text-primary" role="alert">{loadError}</p>
        )}
        {programs.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Build a program in the phone app, then assign it here.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-text-secondary">
                Program
                <select
                  className="mt-1 block min-w-48 rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                >
                  <option value="">Choose a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-text-secondary">
                Session
                <select
                  className="mt-1 block min-w-48 rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                  value={sessionKey}
                  onChange={(event) => setSessionKey(event.target.value)}
                  disabled={!selectedProgram}
                >
                  <option value="">Choose a session</option>
                  {programSessions.map((session) => (
                    <option key={session.id} value={`${programId}::${session.id}`}>{session.name}</option>
                  ))}
                </select>
              </label>
              <Button type="button" size="sm" onClick={placeSession} disabled={summary.cellCount === 0 || !selectedSession || saving}>
                Place session
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={placeProgram}
                disabled={summary.cellCount === 0 || !selectedProgram || saving}
              >
                Place program
              </Button>
            </div>
            <label className="block max-w-xl text-sm text-text-secondary" htmlFor="coach-desk-note">
              Note for athletes (optional)
              <textarea
                id="coach-desk-note"
                className="mt-1 block w-full rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
                rows={2}
                value={coachNote}
                onChange={(event) => setCoachNote(event.target.value.slice(0, COACH_NOTE_MAX))}
                placeholder="Optional message shown with the assigned session"
              />
              <span className="mt-1 block text-xs text-text-tertiary">{coachNote.length}/{COACH_NOTE_MAX}</span>
            </label>
          </div>
        )}
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenOverview(overviewDate)}>
            Open session overview
          </Button>
        </div>
        {cellPlacements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cellPlacements.map((placement) => (
              <Button
                key={placement.id}
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={() => singleCell && clearDate(placement.id, singleCell.date)}
              >
                Clear {placement.sessionName}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading your team…</p>
        ) : !teamName ? (
          <p className="max-w-xl text-sm text-text-secondary">No team yet. Create one in the phone app, then assign work here.</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {teamName} has no athletes yet. Choose another team in the left menu, or add athletes in the phone app.
          </p>
        ) : (
          <div className="space-y-6">
            {weeks.map((week) => (
              <div key={week[0]} className="min-w-[52rem]">
                <div className="grid grid-cols-[8.5rem_repeat(7,minmax(6.5rem,1fr))] gap-1">
                  <div />
                  {week.map((date) => (
                    <button
                      key={date}
                      type="button"
                      className={`px-1 pb-1 text-center text-xs hover:bg-bg-tertiary ${date === today ? 'font-semibold text-accent-primary' : 'text-text-secondary'}`}
                      onClick={() => setSelectedCells((current) => toggleDateAcrossAthletes(current, date, members.map((m) => m.id)))}
                      aria-label={`Select all athletes on ${date}`}
                    >
                      <div>{weekdayLabel(date)}</div>
                      <div>{dayCaption(date)}</div>
                    </button>
                  ))}
                  {members.map((member) => (
                    <React.Fragment key={member.id}>
                      <button
                        type="button"
                        className="sticky left-0 z-10 flex items-center bg-bg-primary pr-2 text-left text-sm font-medium hover:bg-bg-tertiary"
                        onClick={() => setSelectedCells((current) => toggleAthleteAcrossDates(current, member.id, dates))}
                        aria-label={`Select ${memberLabel(member)} across visible days`}
                      >
                        {memberLabel(member)}
                      </button>
                      {week.map((date) => {
                        const onDay = placements.filter(
                          (placement) => placement.athleteId === member.id && placement.plannedDates.includes(date)
                        );
                        const selected = selectedCells.has(cellKey({ athleteId: member.id, date }));
                        const dayLog = logSummaries.get(cellKey({ athleteId: member.id, date }));
                        return (
                          <button
                            key={date}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${memberLabel(member)} ${date}`}
                            className={`flex min-h-[4.5rem] flex-col items-stretch gap-1 rounded-lg border p-1 text-left ${selected ? 'border-accent-primary bg-bg-tertiary' : 'border-border bg-bg-primary hover:border-border-hover'}`}
                            onClick={() => setSelectedCells((current) => toggleCellKey(current, { athleteId: member.id, date }))}
                          >
                            {compactLogged ? (
                              <YearPresenceDots summary={dayLog} hasPlanned={onDay.length > 0} />
                            ) : (
                              <>
                                {onDay.slice(0, 2).map((placement) => (
                                  <span key={placement.id} className="truncate rounded bg-bg-secondary px-1 py-0.5 text-[11px] text-text-primary">
                                    {placement.sessionName}
                                  </span>
                                ))}
                                {onDay.length > 2 && (
                                  <span className="text-[11px] text-text-tertiary">+{onDay.length - 2}</span>
                                )}
                                <LoggedWorkChips summary={dayLog} />
                              </>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoachCalendar;
