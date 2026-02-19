import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { getAuth } from 'firebase/auth';
import { getCoachTeams, getTeamMembers, TeamMember } from './teamService';
import { Exercise } from '@/types/exercise';

export interface AthleteData extends TeamMember {
  lastActive?: string;
  workoutsThisWeek?: number;
  workoutsThisMonth?: number;
  totalVolume?: number;
  programsAssigned?: number;
  programsCompleted?: number;
  sessionsAssigned?: number;
}

export interface AthleteExerciseLog extends Exercise {
  date: string;
  sets: any[];
  totalSets: number;
  totalVolume?: number;
  notes?: string;
}

export interface AthleteSummaryStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
  programsAssigned: number;
  programsCompleted: number;
  sessionsAssigned: number;
  lastActive?: string;
}

interface CoachAccessSnapshot {
  coachId: string;
  teams: { id: string }[];
  membersByTeamId: Map<string, TeamMember[]>;
  athleteIds: Set<string>;
  fetchedAt: number;
}

interface AthleteStatsOptions {
  skipRelationshipCheck?: boolean;
}

const EMPTY_STATS: AthleteSummaryStats = {
  workoutsThisWeek: 0,
  workoutsThisMonth: 0,
  totalVolume: 0,
  programsAssigned: 0,
  programsCompleted: 0,
  sessionsAssigned: 0
};

const ACCESS_CACHE_TTL_MS = 30 * 1000;
const coachAccessCache = new Map<string, CoachAccessSnapshot>();
const coachAccessInFlight = new Map<string, Promise<CoachAccessSnapshot>>();

// Ensure user is authenticated
async function ensureAuth() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('User must be logged in');
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  if (auth.currentUser !== user) {
    throw new Error('Auth state changed unexpectedly');
  }
  return { uid: user.uid };
}

function isPermissionDenied(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const maybeCode = (error as { code?: string }).code;
    if (maybeCode === 'permission-denied') {
      return true;
    }
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes('insufficient permissions');
  }

  return false;
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseExerciseDate(data: any): Date | undefined {
  const dateValue = data?.date;
  const timestampValue = data?.timestamp;

  if (dateValue instanceof Date && isValidDate(dateValue)) {
    return dateValue;
  }

  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (isValidDate(parsed)) {
      return parsed;
    }
  }

  if (dateValue && typeof dateValue === 'object') {
    if (typeof dateValue.toDate === 'function') {
      const parsed = dateValue.toDate();
      if (parsed instanceof Date && isValidDate(parsed)) {
        return parsed;
      }
    }
    if (typeof dateValue.seconds === 'number') {
      const parsed = new Date(dateValue.seconds * 1000);
      if (isValidDate(parsed)) {
        return parsed;
      }
    }
  }

  if (timestampValue instanceof Date && isValidDate(timestampValue)) {
    return timestampValue;
  }

  if (timestampValue && typeof timestampValue === 'object') {
    if (typeof timestampValue.toDate === 'function') {
      const parsed = timestampValue.toDate();
      if (parsed instanceof Date && isValidDate(parsed)) {
        return parsed;
      }
    }
    if (typeof timestampValue.seconds === 'number') {
      const parsed = new Date(timestampValue.seconds * 1000);
      if (isValidDate(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

async function buildCoachAccessSnapshot(coachId: string): Promise<CoachAccessSnapshot> {
  const teams = await getCoachTeams();
  const allMembers = await Promise.all(teams.map((team) => getTeamMembers(team.id)));
  const membersByTeamId = new Map<string, TeamMember[]>();
  const athleteIds = new Set<string>();

  allMembers.forEach((members, index) => {
    membersByTeamId.set(teams[index].id, members);
    members.forEach((member) => athleteIds.add(member.id));
  });

  return {
    coachId,
    teams,
    membersByTeamId,
    athleteIds,
    fetchedAt: Date.now()
  };
}

async function getCoachAccessSnapshot(forceRefresh = false): Promise<CoachAccessSnapshot> {
  const user = await ensureAuth();
  const { uid } = user;
  const cached = coachAccessCache.get(uid);
  const isFresh = cached && Date.now() - cached.fetchedAt < ACCESS_CACHE_TTL_MS;

  if (!forceRefresh && isFresh) {
    return cached;
  }

  if (!forceRefresh) {
    const inFlight = coachAccessInFlight.get(uid);
    if (inFlight) {
      return inFlight;
    }
  }

  const request = buildCoachAccessSnapshot(uid)
    .then((snapshot) => {
      coachAccessCache.set(uid, snapshot);
      return snapshot;
    })
    .finally(() => {
      coachAccessInFlight.delete(uid);
    });

  coachAccessInFlight.set(uid, request);
  return request;
}

/**
 * Verify that the current user (coach) has a relationship with the athlete through a team
 */
export const verifyCoachAthleteRelationship = async (athleteId: string): Promise<boolean> => {
  try {
    const accessSnapshot = await getCoachAccessSnapshot();
    return accessSnapshot.athleteIds.has(athleteId);
  } catch (error) {
    console.error('[coachService] Error verifying coach-athlete relationship:', error);
    return false;
  }
};

/**
 * Get all athletes from all teams coached by the current user
 */
export const getAllAthletes = async (): Promise<AthleteData[]> => {
  try {
    const accessSnapshot = await getCoachAccessSnapshot(true);
    const teams = accessSnapshot.teams;
    
    if (teams.length === 0) {
      return [];
    }
    
    // Get all members from all teams
    const allMembers: AthleteData[] = [];
    const seenAthletes = new Set<string>(); // Prevent duplicates if athlete is in multiple teams
    
    for (const team of teams) {
      const members = accessSnapshot.membersByTeamId.get(team.id) || [];
      
      for (const member of members) {
        if (!seenAthletes.has(member.id)) {
          seenAthletes.add(member.id);

          let stats: AthleteSummaryStats = EMPTY_STATS;
          try {
            stats = await getAthleteSummaryStats(member.id, { skipRelationshipCheck: true });
          } catch (error) {
            if (!isPermissionDenied(error)) {
              throw error;
            }
          }
          
          allMembers.push({
            ...member,
            ...stats
          });
        }
      }
    }
    
    // Sort by last active (most recent first)
    allMembers.sort((a, b) => {
      if (!a.lastActive && !b.lastActive) return 0;
      if (!a.lastActive) return 1;
      if (!b.lastActive) return -1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });

    return allMembers;
  } catch (error) {
    console.error('[coachService] Error fetching athletes:', error);
    throw error;
  }
};

/**
 * Get summary statistics for a single athlete
 */
export const getAthleteSummaryStats = async (
  athleteId: string,
  options: AthleteStatsOptions = {}
): Promise<AthleteSummaryStats> => {
  try {
    const { uid: coachId } = await ensureAuth();

    // Verify relationship (will throw if not allowed)
    const hasAccess = options.skipRelationshipCheck
      ? true
      : await verifyCoachAthleteRelationship(athleteId);

    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let workouts: Array<{ date: Date; volume: number }> = [];

    try {
      const exercisesRef = collection(db, 'users', athleteId, 'exercises');
      const exercisesSnapshot = await getDocs(exercisesRef);

      workouts = exercisesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const parsedDate = parseExerciseDate(data);

          if (!parsedDate) {
            return null;
          }

          return {
            date: parsedDate,
            volume: calculateExerciseVolume(data)
          };
        })
        .filter((workout): workout is { date: Date; volume: number } => !!workout);
    } catch (error) {
      if (!isPermissionDenied(error)) {
        throw error;
      }
    }

    // Calculate stats (valid dates only)
    const workoutsThisWeek = workouts.filter((w) => w.date >= oneWeekAgo).length;
    const workoutsThisMonth = workouts.filter((w) => w.date >= oneMonthAgo).length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.volume, 0);

    // Get last active date
    const mostRecentWorkout = workouts.length > 0
      ? workouts.reduce((latest, current) => (current.date > latest.date ? current : latest))
      : undefined;

    const lastActive = mostRecentWorkout?.date && isValidDate(mostRecentWorkout.date)
      ? mostRecentWorkout.date.toISOString()
      : undefined;
    
    // Get program assignments
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('userId', '==', athleteId),
      where('sharedBy', '==', coachId)
    );
    let programsAssigned = 0;
    let programsCompleted = 0;

    try {
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      programsAssigned = assignmentsSnapshot.docs.filter(
        doc => doc.data().status !== 'archived'
      ).length;

      programsCompleted = assignmentsSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length;
    } catch (error) {
      if (!isPermissionDenied(error)) {
        throw error;
      }
    }
    
    // Get session assignments
    const sessionAssignmentsRef = collection(db, 'sharedSessionAssignments');
    const sessionAssignmentsQuery = query(
      sessionAssignmentsRef,
      where('userId', '==', athleteId),
      where('sharedBy', '==', coachId)
    );
    let sessionsAssigned = 0;

    try {
      const sessionAssignmentsSnapshot = await getDocs(sessionAssignmentsQuery);

      sessionsAssigned = sessionAssignmentsSnapshot.docs.filter(
        doc => doc.data().status !== 'archived'
      ).length;
    } catch (error) {
      if (!isPermissionDenied(error)) {
        throw error;
      }
    }
    
    return {
      workoutsThisWeek,
      workoutsThisMonth,
      totalVolume: Math.round(totalVolume),
      programsAssigned,
      programsCompleted,
      sessionsAssigned,
      lastActive
    };
  } catch (error) {
    console.error('[coachService] Error fetching athlete stats:', error);
    throw error;
  }
};

/**
 * Get exercise logs for an athlete within a date range
 */
export const getAthleteExerciseLogs = async (
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AthleteExerciseLog[]> => {
  try {
    // Verify relationship
    const hasAccess = await verifyCoachAthleteRelationship(athleteId);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }
    
    const exercisesRef = collection(db, 'users', athleteId, 'exercises');
    let q = query(exercisesRef, orderBy('date', 'desc'));
    
    // Note: Firestore doesn't support date range queries directly on string dates
    // We'll filter in memory after fetching
    const snapshot = await getDocs(q);
    
    let logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        totalSets: data.sets?.length || 0,
        totalVolume: calculateExerciseVolume(data)
      } as AthleteExerciseLog;
    });
    
    // Filter by date range if provided
    if (startDate || endDate) {
      logs = logs.filter(log => {
        const logDate = new Date(log.date);
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
      });
    }
    
    return logs;
  } catch (error) {
    console.error('[coachService] Error fetching athlete exercise logs:', error);
    throw error;
  }
};

/**
 * Calculate total volume for an exercise (weight × reps for resistance exercises)
 */
function calculateExerciseVolume(exerciseData: any): number {
  if (!exerciseData.sets || !Array.isArray(exerciseData.sets)) {
    return 0;
  }
  
  return exerciseData.sets.reduce((total: number, set: any) => {
    // For resistance exercises: weight × reps
    if (set.weight && set.reps) {
      return total + (set.weight * set.reps);
    }
    // For other activity types, we might track differently
    // For now, just return 0 for non-resistance
    return total;
  }, 0);
}

/**
 * Get assigned programs for an athlete
 */
export const getAthleteAssignedPrograms = async (athleteId: string): Promise<any[]> => {
  try {
    const { uid: coachId } = await ensureAuth();

    // Verify relationship
    const hasAccess = await verifyCoachAthleteRelationship(athleteId);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }
    
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const q = query(
      assignmentsRef,
      where('userId', '==', athleteId),
      where('sharedBy', '==', coachId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[coachService] Error fetching athlete assigned programs:', error);
    throw error;
  }
};
