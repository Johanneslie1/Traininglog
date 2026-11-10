import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/services/firebase/config';
import { shareSession } from '@/services/sessionService';
import type { Program, ProgramSession } from '@/types/program';
import {
  programPlacementDates,
  sessionsInProgramOrder,
  toCoachPlacement,
  type CoachPlacement,
} from '@/features/coach-shell/deskPlan';
import type { BulkPlaceTarget } from '@/features/coach-shell/calendarSelection';

export type { CoachPlacement };

function requireCoachUid(): string {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return uid;
}

export async function listCoachPlacements(coachId = requireCoachUid()): Promise<CoachPlacement[]> {
  const snap = await getDocs(
    query(collection(db, 'sharedSessionAssignments'), where('sharedBy', '==', coachId))
  );
  return snap.docs
    .map((item) => toCoachPlacement(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is CoachPlacement => item !== null);
}

export async function placeSessionOnDate(input: {
  session: ProgramSession;
  athleteId: string;
  date: string;
  assignmentId?: string;
  programId?: string;
  programName?: string;
  coachMessage?: string;
}): Promise<void> {
  const note = input.coachMessage?.trim() || undefined;

  if (input.assignmentId) {
    await updateDoc(
      doc(db, 'sharedSessionAssignments', input.assignmentId),
      note
        ? { plannedDates: arrayUnion(input.date), coachMessage: note }
        : { plannedDates: arrayUnion(input.date) }
    );
    return;
  }

  const sharedSessionId = await shareSession(
    input.session,
    [input.athleteId],
    note,
    input.programId,
    input.programName,
    [input.date]
  );

  // Prefer the assignment written in the share batch (already has plannedDates).
  // Fall back only if the query cannot find it yet.
  const snap = await getDocs(
    query(collection(db, 'sharedSessionAssignments'), where('sharedSessionId', '==', sharedSessionId))
  );
  const assignment = snap.docs.find((item) => item.data().userId === input.athleteId);
  if (!assignment) return;
  const planned = Array.isArray(assignment.data().plannedDates) ? assignment.data().plannedDates : [];
  if (planned.includes(input.date)) return;
  await updateDoc(assignment.ref, { plannedDates: arrayUnion(input.date) });
}

/**
 * Place one session onto many athlete/day cells.
 * Groups by athlete so multi-day bulk place creates/updates one assignment per athlete
 * (not one shareSession call per cell).
 */
export async function placeSessionOnDates(input: {
  session: ProgramSession;
  targets: BulkPlaceTarget[];
  programId?: string;
  programName?: string;
  coachMessage?: string;
}): Promise<number> {
  const byAthlete = new Map<string, { dates: string[]; assignmentId?: string }>();
  for (const target of input.targets) {
    const group = byAthlete.get(target.athleteId) ?? {
      dates: [],
      assignmentId: target.assignmentId,
    };
    if (!group.dates.includes(target.date)) group.dates.push(target.date);
    if (target.assignmentId) group.assignmentId = target.assignmentId;
    byAthlete.set(target.athleteId, group);
  }

  const note = input.coachMessage?.trim() || undefined;
  let placed = 0;

  for (const [athleteId, group] of byAthlete) {
    if (group.assignmentId) {
      await updateDoc(
        doc(db, 'sharedSessionAssignments', group.assignmentId),
        note
          ? { plannedDates: arrayUnion(...group.dates), coachMessage: note }
          : { plannedDates: arrayUnion(...group.dates) }
      );
      placed += group.dates.length;
      continue;
    }

    const sharedSessionId = await shareSession(
      input.session,
      [athleteId],
      note,
      input.programId,
      input.programName,
      group.dates
    );

    const snap = await getDocs(
      query(collection(db, 'sharedSessionAssignments'), where('sharedSessionId', '==', sharedSessionId))
    );
    const assignment = snap.docs.find((item) => item.data().userId === athleteId);
    if (assignment) {
      const planned = Array.isArray(assignment.data().plannedDates) ? assignment.data().plannedDates : [];
      const missing = group.dates.filter((date) => !planned.includes(date));
      if (missing.length > 0) {
        await updateDoc(assignment.ref, { plannedDates: arrayUnion(...missing) });
      }
    }
    placed += group.dates.length;
  }

  return placed;
}

export async function placeProgramFromDate(input: {
  program: Program;
  athleteId: string;
  startDate: string;
  existingBySessionId: Map<string, string>;
  coachMessage?: string;
}): Promise<void> {
  const sessions = sessionsInProgramOrder(input.program.sessions ?? []);
  const dates = programPlacementDates(input.startDate, sessions.length);
  for (let index = 0; index < sessions.length; index += 1) {
    const session = sessions[index];
    await placeSessionOnDate({
      session,
      athleteId: input.athleteId,
      date: dates[index],
      assignmentId: input.existingBySessionId.get(session.id),
      programId: input.program.id,
      programName: input.program.name,
      coachMessage: input.coachMessage,
    });
  }
}

export async function clearPlannedDate(assignmentId: string, date: string): Promise<void> {
  await updateDoc(doc(db, 'sharedSessionAssignments', assignmentId), {
    plannedDates: arrayRemove(date),
  });
}
