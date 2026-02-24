import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase/firebase';
import { getTeamMembers } from './teamService';
import { CoachAnnouncement, CreateCoachAnnouncementInput } from '@/types/announcement';

const ANNOUNCEMENTS_COLLECTION = 'coachAnnouncements';

async function ensureAuth() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error('User must be logged in');
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (auth.currentUser?.uid !== user.uid) {
    throw new Error('Auth state changed unexpectedly');
  }
  return user;
}

type UserRole = 'athlete' | 'coach';

async function getCurrentUserRole(userId: string): Promise<UserRole | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data() as { role?: unknown };
  return data.role === 'coach' || data.role === 'athlete' ? data.role : null;
}

async function ensureCoachRole(userId: string): Promise<void> {
  const role = await getCurrentUserRole(userId);
  if (role !== 'coach') {
    throw new Error('Only coaches can create or review coach announcements');
  }
}

function removeUndefinedFields<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  }

  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned as T;
  }

  return obj;
}

export const createCoachAnnouncement = async (
  input: CreateCoachAnnouncementInput
): Promise<string> => {
  const user = await ensureAuth();
  await ensureCoachRole(user.uid);
  const trimmedMessage = input.message.trim();

  if (!trimmedMessage) {
    throw new Error('Announcement message is required');
  }

  const teamIds = Array.from(new Set((input.targetTeamIds || []).filter(Boolean)));
  const athleteIds = Array.from(new Set((input.targetAthleteIds || []).filter(Boolean)));

  const teamMemberLists = await Promise.all(teamIds.map((teamId) => getTeamMembers(teamId)));
  const teamMemberIds = teamMemberLists.flat().map((member) => member.id);

  const recipientUserIds = Array.from(new Set([...teamMemberIds, ...athleteIds]));

  if (recipientUserIds.length === 0) {
    throw new Error('Select at least one team or athlete');
  }

  const announcementRef = doc(collection(db, ANNOUNCEMENTS_COLLECTION));
  const announcementData = removeUndefinedFields({
    message: trimmedMessage,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    createdByName: user.displayName || user.email || 'Coach',
    targetTeamIds: teamIds.length > 0 ? teamIds : undefined,
    targetAthleteIds: athleteIds.length > 0 ? athleteIds : undefined,
    recipientUserIds
  });

  await setDoc(announcementRef, announcementData);
  return announcementRef.id;
};

export const getCoachAnnouncements = async (): Promise<CoachAnnouncement[]> => {
  const user = await ensureAuth();
  await ensureCoachRole(user.uid);

  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    where('createdBy', '==', user.uid)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as CoachAnnouncement[];
};

export const getAnnouncementsForAthlete = async (): Promise<CoachAnnouncement[]> => {
  const user = await ensureAuth();

  // Athletes are read-only recipients for coach announcements.
  const role = await getCurrentUserRole(user.uid);
  if (role === 'coach') {
    return [];
  }

  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    where('recipientUserIds', 'array-contains', user.uid)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as CoachAnnouncement[];
};
