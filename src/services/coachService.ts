import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { getAuth } from 'firebase/auth';
import { getCoachTeams, getTeamMembers, TeamMember, syncCoachAthleteAccess } from './teamService';
import { startOfDay, endOfDay } from '@/utils/dateUtils';

export interface AthleteData extends TeamMember {
  lastActive?: string;
  workoutsThisWeek?: number;
  workoutsThisMonth?: number;
  sessionsToday?: number;
  sessionsLast7Days?: number;
  exercisesToday?: number;
  exercisesLast7Days?: number;
  totalVolume?: number;
  programsAssigned?: number;
  programsCompleted?: number;
  sessionsAssigned?: number;
}

export interface AthleteExerciseLog {
  id: string;
  name: string;
  activityType?: string;
  sourceCollection: 'exercises' | 'activities' | 'strengthExercises';
  date: string;
  timestamp: Date;
  sets: any[];
  totalSets: number;
  totalVolume?: number;
  notes?: string;
}

export interface AthleteSessionHistoryItem {
  date: string;
  sessionKey: string;
  totalExercises: number;
  totalVolume: number;
  activityTypes: string[];
}

export interface AthleteSummaryStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  sessionsToday: number;
  sessionsLast7Days: number;
  exercisesToday: number;
  exercisesLast7Days: number;
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

interface AthleteHistoryOptions {
  maxResults?: number;
}

const EMPTY_STATS: AthleteSummaryStats = {
  workoutsThisWeek: 0,
  workoutsThisMonth: 0,
  sessionsToday: 0,
  sessionsLast7Days: 0,
  exercisesToday: 0,
  exercisesLast7Days: 0,
  totalVolume: 0,
  programsAssigned: 0,
  programsCompleted: 0,
  sessionsAssigned: 0
};

const ACCESS_CACHE_TTL_MS = 30 * 1000;
const coachAccessCache = new Map<string, CoachAccessSnapshot>();
const coachAccessInFlight = new Map<string, Promise<CoachAccessSnapshot>>();

export function invalidateCoachAccessCache(coachId?: string): void {
  if (coachId) {
    coachAccessCache.delete(coachId);
    coachAccessInFlight.delete(coachId);
    return;
  }

  coachAccessCache.clear();
  coachAccessInFlight.clear();
}

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

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveLogName(data: any): string {
  if (typeof data?.exerciseName === 'string' && data.exerciseName.trim()) {
    return data.exerciseName.trim();
  }

  if (typeof data?.activityName === 'string' && data.activityName.trim()) {
    return data.activityName.trim();
  }

  if (typeof data?.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }

  return 'Unknown activity';
}

function normalizeSets(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function toAthleteLog(
  sourceCollection: 'exercises' | 'activities' | 'strengthExercises',
  id: string,
  data: any
): AthleteExerciseLog | null {
  const parsedDate = parseExerciseDate(data);
  if (!parsedDate) {
    return null;
  }

  const sets = normalizeSets(data?.sets);

  return {
    id,
    name: resolveLogName(data),
    activityType: typeof data?.activityType === 'string' ? data.activityType : undefined,
    sourceCollection,
    date: parsedDate.toISOString(),
    timestamp: parsedDate,
    sets,
    totalSets: sets.length,
    totalVolume: calculateExerciseVolume(data),
    notes: typeof data?.notes === 'string' ? data.notes : undefined
  };
}

async function getAthleteUnifiedLogs(
  athleteId: string,
  startDate?: Date,
  endDate?: Date,
  options: AthleteStatsOptions & AthleteHistoryOptions = {}
): Promise<AthleteExerciseLog[]> {
  const hasAccess = options.skipRelationshipCheck
    ? true
    : await verifyCoachAthleteRelationship(athleteId);

  if (!hasAccess) {
    throw new Error('You do not have permission to view this athlete\'s data');
  }

  const sourceCollections: Array<'exercises' | 'activities' | 'strengthExercises'> = [
    'exercises',
    'activities',
    'strengthExercises'
  ];

  const sourceSnapshots = await Promise.all(
    sourceCollections.map(async (sourceCollection) => {
      try {
        const sourceRef = collection(db, 'users', athleteId, sourceCollection);
        const maxResults = options.maxResults ?? 250;
        let snapshot;

        if (startDate && endDate) {
          try {
            const rangedQuery = query(
              sourceRef,
              where('timestamp', '>=', Timestamp.fromDate(startDate)),
              where('timestamp', '<=', Timestamp.fromDate(endDate)),
              orderBy('timestamp', 'desc'),
              limit(maxResults)
            );
            snapshot = await getDocs(rangedQuery);
          } catch {
            snapshot = await getDocs(sourceRef);
          }
        } else {
          snapshot = await getDocs(sourceRef);
        }

        return snapshot.docs
          .map((doc) => toAthleteLog(sourceCollection, doc.id, doc.data()))
          .filter((log): log is AthleteExerciseLog => !!log);
      } catch (error) {
        if (!isPermissionDenied(error)) {
          throw error;
        }

        return [];
      }
    })
  );

  const allLogs = sourceSnapshots
    .flat()
    .filter((log) => {
      if (startDate && log.timestamp < startDate) {
        return false;
      }

      if (endDate && log.timestamp > endDate) {
        return false;
      }

      return true;
    });

  const deduped = new Map<string, AthleteExerciseLog>();
  allLogs.forEach((log) => {
    const dedupeKey = `${log.id}|${log.name.toLowerCase()}|${log.timestamp.getTime()}`;
    const existing = deduped.get(dedupeKey);

    if (!existing || (log.totalVolume || 0) > (existing.totalVolume || 0)) {
      deduped.set(dedupeKey, log);
    }
  });

  const sorted = Array.from(deduped.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  if (options.maxResults && options.maxResults > 0) {
    return sorted.slice(0, options.maxResults);
  }

  return sorted;
}

function buildSessionHistory(logs: AthleteExerciseLog[]): AthleteSessionHistoryItem[] {
  const bySession = new Map<string, {
    date: string;
    totalExercises: number;
    totalVolume: number;
    activityTypes: Set<string>;
  }>();

  logs.forEach((log) => {
    const sessionKey = getLocalDateKey(log.timestamp);
    const existing = bySession.get(sessionKey);

    if (existing) {
      existing.totalExercises += 1;
      existing.totalVolume += log.totalVolume || 0;
      if (log.activityType) {
        existing.activityTypes.add(log.activityType);
      }
      return;
    }

    bySession.set(sessionKey, {
      date: log.date,
      totalExercises: 1,
      totalVolume: log.totalVolume || 0,
      activityTypes: new Set(log.activityType ? [log.activityType] : [])
    });
  });

  return Array.from(bySession.entries())
    .map(([sessionKey, value]) => ({
      date: value.date,
      sessionKey,
      totalExercises: value.totalExercises,
      totalVolume: Math.round(value.totalVolume),
      activityTypes: Array.from(value.activityTypes)
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const { uid: coachId } = await ensureAuth();
    const accessSnapshot = await getCoachAccessSnapshot();
    if (accessSnapshot.athleteIds.has(athleteId)) {
      try {
        await syncCoachAthleteAccess(coachId, athleteId);
      } catch (syncError) {
        console.warn('[coachService] Could not sync coach-athlete access:', syncError);
      }
      return true;
    }

    const refreshedSnapshot = await getCoachAccessSnapshot(true);
    const hasRelationship = refreshedSnapshot.athleteIds.has(athleteId);

    if (hasRelationship) {
      try {
        await syncCoachAthleteAccess(coachId, athleteId);
      } catch (syncError) {
        console.warn('[coachService] Could not sync coach-athlete access after refresh:', syncError);
      }
    }

    return hasRelationship;
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

    try {
      await syncCoachAthleteAccess(coachId, athleteId);
    } catch (syncError) {
      console.warn('[coachService] Could not sync coach-athlete access during summary fetch:', syncError);
    }
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const oneWeekAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const oneMonthAgo = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

    const athleteLogs = await getAthleteUnifiedLogs(athleteId, undefined, undefined, {
      skipRelationshipCheck: true
    });

    const sessionHistory = buildSessionHistory(athleteLogs);
    const workoutsThisWeek = sessionHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneWeekAgo;
    }).length;
    const workoutsThisMonth = sessionHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneMonthAgo;
    }).length;
    const totalVolume = athleteLogs.reduce((sum, log) => sum + (log.totalVolume || 0), 0);

    const sessionsToday = sessionHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= todayStart && sessionDate <= todayEnd;
    }).length;

    const sessionsLast7Days = workoutsThisWeek;

    const exercisesToday = athleteLogs.filter((log) => log.timestamp >= todayStart && log.timestamp <= todayEnd).length;
    const exercisesLast7Days = athleteLogs.filter((log) => log.timestamp >= oneWeekAgo).length;

    const mostRecentLog = athleteLogs.length > 0 ? athleteLogs[0] : undefined;
    const lastActive = mostRecentLog?.timestamp && isValidDate(mostRecentLog.timestamp)
      ? mostRecentLog.timestamp.toISOString()
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
      sessionsToday,
      sessionsLast7Days,
      exercisesToday,
      exercisesLast7Days,
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
  endDate?: Date,
  options: AthleteHistoryOptions = {}
): Promise<AthleteExerciseLog[]> => {
  try {
    return getAthleteUnifiedLogs(athleteId, startDate, endDate, options);
  } catch (error) {
    console.error('[coachService] Error fetching athlete exercise logs:', error);
    throw error;
  }
};

export const getAthleteSessionHistory = async (
  athleteId: string,
  startDate?: Date,
  endDate?: Date,
  options: AthleteHistoryOptions = {}
): Promise<AthleteSessionHistoryItem[]> => {
  try {
    const logs = await getAthleteUnifiedLogs(athleteId, startDate, endDate, options);
    return buildSessionHistory(logs);
  } catch (error) {
    console.error('[coachService] Error fetching athlete session history:', error);
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

/**
 * Get assigned sessions for an athlete
 */
export const getAthleteAssignedSessions = async (athleteId: string): Promise<any[]> => {
  try {
    const { uid: coachId } = await ensureAuth();

    const hasAccess = await verifyCoachAthleteRelationship(athleteId);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }

    const assignmentsRef = collection(db, 'sharedSessionAssignments');
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
    console.error('[coachService] Error fetching athlete assigned sessions:', error);
    throw error;
  }
};
