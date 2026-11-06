import { getAuth } from 'firebase/auth';
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
import type { CoachPlacement } from '@/features/coach-shell/deskPlan';
import { isDateKey, toCoachPlacement } from '@/features/coach-shell/deskPlan';
import { db } from '@/services/firebase/config';
import { shareSession } from '@/services/sessionService';
import type { ProgramSession } from '@/types/program';

export type { CoachPlacement };

export async function listCoachPlacements(coachId: string): Promise<CoachPlacement[]> {
  if (!coachId) return [];
  const snapshot = await getDocs(
    query(collection(db, 'sharedSessionAssignments'), where('sharedBy', '==', coachId))
  );
  return snapshot.docs.flatMap((assignment) => {
    const placement = toCoachPlacement(assignment.id, assignment.data() as Record<string, unknown>);
    return placement ? [placement] : [];
  });
}

export async function placeSessionOnDate(input: {
  session: ProgramSession;
  athleteId: string;
  date: string;
  assignmentId?: string;
  programId?: string;
  programName?: string;
}): Promise<void> {
  if (!input.athleteId) throw new Error('Choose an athlete.');
  if (!isDateKey(input.date)) throw new Error('Choose a valid day.');
  if (!input.session.exercises?.length) {
    throw new Error('Add at least one exercise before assigning this session.');
  }

  if (input.assignmentId) {
    await updateDoc(doc(db, 'sharedSessionAssignments', input.assignmentId), {
      plannedDates: arrayUnion(input.date),
    });
    return;
  }

  const user = getAuth().currentUser;
  if (!user) throw new Error('Sign in again to assign sessions.');

  // The date is stored on the assignment in the same write. A follow-up
  // query by sharedSessionId is rejected by the rules, which only allow
  // a coach to list assignments they shared.
  await shareSession(
    input.session,
    [input.athleteId],
    undefined,
    input.programId,
    input.programName,
    [input.date]
  );
}

export async function clearPlannedDate(assignmentId: string, date: string): Promise<void> {
  if (!assignmentId || !isDateKey(date)) throw new Error('Choose a placement to clear.');
  await updateDoc(doc(db, 'sharedSessionAssignments', assignmentId), {
    plannedDates: arrayRemove(date),
  });
}
