import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import type { Program } from '@/types/program';
import type { TeamMember } from '@/services/teamService';
import { clearPlannedDate, placeSessionOnDate, type CoachPlacement } from '@/services/coachPlacementService';
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

function actionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (/permission/i.test(error.message)) return 'You do not have permission to change that assignment.';
    if (error.message && error.message.length < 160) return error.message;
  }
  return fallback;
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
  const [selection, setSelection] = useState<{ athleteId: string; date: string } | null>(null);
  const [programId, setProgramId] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelection((current) => {
      if (!current) return current;
      return members.some((member) => member.id === current.athleteId) ? current : null;
    });
  }, [members]);

  const dates = useMemo(() => rangeDates(anchor, range), [anchor, range]);
  const weeks = useMemo(() => chunkWeeks(dates), [dates]);
  const title = rangeTitle(dates);
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
  const selectedMember = members.find((member) => member.id === selection?.athleteId) ?? null;
  const cellPlacements = placements.filter(
    (placement) => placement.athleteId === selection?.athleteId && selection && placement.plannedDates.includes(selection.date)
  );

  const placeSession = async () => {
    if (!selection || !selectedSession || !selectedProgram) return;
    const existing = placements.find(
      (placement) => placement.athleteId === selection.athleteId && placement.sessionId === selectedSession.id
    );
    if (existing?.plannedDates.includes(selection.date)) {
      toast.success('That session is already on this day.');
      return;
    }
    setSaving(true);
    try {
      await placeSessionOnDate({
        session: selectedSession,
        athleteId: selection.athleteId,
        date: selection.date,
        assignmentId: existing?.id,
        programId: selectedProgram.id,
        programName: selectedProgram.name,
      });
      await onChanged();
      toast.success('Session placed.');
    } catch (error) {
      toast.error(actionError(error, 'Could not place that session.'));
      await onChanged().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  };

  const placeProgram = async () => {
    if (!selection || !selectedProgram) return;
    const sessions = programSessions.filter((session) => session.exercises?.length);
    if (sessions.length === 0) {
      toast.error('Add at least one exercise before assigning this program.');
      return;
    }
    const planned = programPlacementDates(selection.date, sessions.length);
    const pending = sessions.flatMap((session, index) => {
      const date = planned[index];
      const existing = placements.find(
        (placement) => placement.athleteId === selection.athleteId && placement.sessionId === session.id
      );
      if (!date || existing?.plannedDates.includes(date)) return [];
      return [{ session, date, assignmentId: existing?.id }];
    });
    if (pending.length === 0) {
      toast.success('Those sessions are already placed.');
      return;
    }
    setSaving(true);
    try {
      for (const item of pending) {
        await placeSessionOnDate({
          session: item.session,
          athleteId: selection.athleteId,
          date: item.date,
          assignmentId: item.assignmentId,
          programId: selectedProgram.id,
          programName: selectedProgram.name,
        });
      }
      await onChanged();
      toast.success('Program placed.');
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
        <p className="text-sm text-text-secondary" aria-live="polite">
          {selectedMember && selection
            ? `${memberLabel(selectedMember)} · ${selection.date}`
            : 'Select an athlete and a day to assign a program or a session.'}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          A session can sit on more than one day. Placing a program lays its sessions on the following days, in program order.
        </p>
        {loadError && (
          <p className="mt-3 text-sm text-text-primary" role="alert">{loadError}</p>
        )}
        {programs.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">Build a program in the phone app, then assign it here.</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
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
            <Button type="button" size="sm" onClick={placeSession} disabled={!selection || !selectedSession || saving}>
              Place session
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={placeProgram} disabled={!selection || !selectedProgram || saving}>
              Place program
            </Button>
          </div>
        )}
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenOverview(selection?.date ?? today)}>
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
                onClick={() => selection && clearDate(placement.id, selection.date)}
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
                    <div key={date} className={`px-1 pb-1 text-center text-xs ${date === today ? 'font-semibold text-accent-primary' : 'text-text-secondary'}`}>
                      <div>{weekdayLabel(date)}</div>
                      <div>{dayCaption(date)}</div>
                    </div>
                  ))}
                  {members.map((member) => (
                    <React.Fragment key={member.id}>
                      <div className="sticky left-0 z-10 flex items-center bg-bg-primary pr-2 text-sm font-medium">
                        {memberLabel(member)}
                      </div>
                      {week.map((date) => {
                        const onDay = placements.filter(
                          (placement) => placement.athleteId === member.id && placement.plannedDates.includes(date)
                        );
                        const selected = selection?.athleteId === member.id && selection.date === date;
                        return (
                          <button
                            key={date}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${memberLabel(member)} ${date}`}
                            className={`flex min-h-16 flex-col items-stretch gap-1 rounded-lg border p-1 text-left ${selected ? 'border-accent-primary bg-bg-tertiary' : 'border-border bg-bg-primary hover:border-border-hover'}`}
                            onClick={() => setSelection({ athleteId: member.id, date })}
                          >
                            {onDay.slice(0, 2).map((placement) => (
                              <span key={placement.id} className="truncate rounded bg-bg-secondary px-1 py-0.5 text-[11px] text-text-primary">
                                {placement.sessionName}
                              </span>
                            ))}
                            {onDay.length > 2 && (
                              <span className="text-[11px] text-text-tertiary">+{onDay.length - 2}</span>
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
