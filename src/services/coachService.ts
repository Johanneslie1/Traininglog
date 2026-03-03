import {
  collection,
  doc,
  getDoc,
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
import { getUserWorkouts } from './firebase/workouts';
import { downloadCSV } from './exportService';

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

type CoachExportRowType = 'exercise' | 'session';

interface CoachExportRow {
  rowType: CoachExportRowType;
  coachId: string;
  athleteId: string;
  athleteName: string;
  sessionDate: string;
  sessionId: string;
  sessionStatus: string;
  sessionNotes: string;
  sessionExerciseCount: number;
  sessionTotalVolume: number;
  exerciseLogId: string;
  exerciseName: string;
  activityType: string;
  sourceCollection: string;
  totalSets: number;
  exerciseVolume: number;
  exerciseNotes: string;
  loggedTimestamp: string;
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
const EXPORT_LOG_MAX_RESULTS = 10000;
const coachAccessCache = new Map<string, CoachAccessSnapshot>();
const coachAccessInFlight = new Map<string, Promise<CoachAccessSnapshot>>();

const COACH_EXPORT_HEADERS: Array<keyof CoachExportRow> = [
  'rowType',
  'coachId',
  'athleteId',
  'athleteName',
  'sessionDate',
  'sessionId',
  'sessionStatus',
  'sessionNotes',
  'sessionExerciseCount',
  'sessionTotalVolume',
  'exerciseLogId',
  'exerciseName',
  'activityType',
  'sourceCollection',
  'totalSets',
  'exerciseVolume',
  'exerciseNotes',
  'loggedTimestamp'
];

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

function parseSessionDate(value: unknown): Date | undefined {
  if (value instanceof Date && isValidDate(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isValidDate(parsed)) {
      return parsed;
    }
  }

  if (value && typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const parsed = maybeTimestamp.toDate();
      if (parsed instanceof Date && isValidDate(parsed)) {
        return parsed;
      }
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      const parsed = new Date(maybeTimestamp.seconds * 1000);
      if (isValidDate(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function getSafeAthleteName(member: Partial<TeamMember> | null, athleteId: string): string {
  const first = typeof member?.firstName === 'string' ? member.firstName.trim() : '';
  const last = typeof member?.lastName === 'string' ? member.lastName.trim() : '';
  const fullName = `${first} ${last}`.trim();
  if (fullName) {
    return fullName;
  }

  if (typeof member?.email === 'string' && member.email.trim()) {
    return member.email.trim();
  }

  return `Athlete ${athleteId.slice(0, 8)}`;
}

function sanitizeFileToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'athlete';
}

function formatExportDateStamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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

interface CoachAthleteIdentity {
  athleteId: string;
  athleteName: string;
}

interface ExportSessionSnapshot {
  id: string;
  date: Date;
  dateKey: string;
  status: string;
  notes: string;
  exerciseCount: number;
  totalVolume: number;
}

async function getCoachAthleteIdentity(athleteId: string): Promise<CoachAthleteIdentity> {
  const hasAccess = await verifyCoachAthleteRelationship(athleteId);
  if (!hasAccess) {
    throw new Error('You do not have permission to export this athlete\'s data');
  }

  const accessSnapshot = await getCoachAccessSnapshot();
  for (const members of accessSnapshot.membersByTeamId.values()) {
    const member = members.find((item) => item.id === athleteId);
    if (member) {
      return {
        athleteId,
        athleteName: getSafeAthleteName(member, athleteId)
      };
    }
  }

  try {
    const userSnapshot = await getDoc(doc(db, 'users', athleteId));
    if (userSnapshot.exists()) {
      const data = userSnapshot.data() as { firstName?: string; lastName?: string; email?: string };
      return {
        athleteId,
        athleteName: getSafeAthleteName(
          {
            firstName: data?.firstName || '',
            lastName: data?.lastName || '',
            email: data?.email || ''
          },
          athleteId
        )
      };
    }
  } catch (error) {
    if (!isPermissionDenied(error)) {
      throw error;
    }
  }

  return {
    athleteId,
    athleteName: getSafeAthleteName(null, athleteId)
  };
}

async function getCoachAthleteIdentities(): Promise<CoachAthleteIdentity[]> {
  const accessSnapshot = await getCoachAccessSnapshot(true);
  const identities = new Map<string, CoachAthleteIdentity>();

  for (const members of accessSnapshot.membersByTeamId.values()) {
    members.forEach((member) => {
      if (!identities.has(member.id)) {
        identities.set(member.id, {
          athleteId: member.id,
          athleteName: getSafeAthleteName(member, member.id)
        });
      }
    });
  }

  return Array.from(identities.values());
}

async function getAthleteTrainingSessions(
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ExportSessionSnapshot[]> {
  const hasAccess = await verifyCoachAthleteRelationship(athleteId);
  if (!hasAccess) {
    throw new Error('You do not have permission to export this athlete\'s sessions');
  }

  const workouts = await getUserWorkouts(athleteId);

  return workouts
    .map((workout) => {
      const parsedDate = parseSessionDate((workout as any).date);
      if (!parsedDate) {
        return null;
      }

      return {
        id: workout.id,
        date: parsedDate,
        dateKey: getLocalDateKey(parsedDate),
        status: typeof (workout as any).status === 'string' ? (workout as any).status : '',
        notes: typeof (workout as any).notes === 'string' ? (workout as any).notes : '',
        exerciseCount: Array.isArray((workout as any).exercises) ? (workout as any).exercises.length : 0,
        totalVolume: typeof (workout as any).totalVolume === 'number' ? (workout as any).totalVolume : 0
      } as ExportSessionSnapshot;
    })
    .filter((session): session is ExportSessionSnapshot => {
      if (!session) {
        return false;
      }

      if (startDate && session.date < startDate) {
        return false;
      }

      if (endDate && session.date > endDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function buildCoachExportRowsForAthlete(
  coachId: string,
  athlete: CoachAthleteIdentity,
  startDate?: Date,
  endDate?: Date
): Promise<CoachExportRow[]> {
  const [exerciseLogs, sessions] = await Promise.all([
    getAthleteUnifiedLogs(athlete.athleteId, startDate, endDate, {
      skipRelationshipCheck: true,
      maxResults: EXPORT_LOG_MAX_RESULTS
    }),
    getAthleteTrainingSessions(athlete.athleteId, startDate, endDate)
  ]);

  const sessionsByDate = new Map<string, ExportSessionSnapshot[]>();
  sessions.forEach((session) => {
    const existing = sessionsByDate.get(session.dateKey) || [];
    existing.push(session);
    sessionsByDate.set(session.dateKey, existing);
  });

  const exerciseRows: CoachExportRow[] = exerciseLogs.map((log) => {
    const dateKey = getLocalDateKey(log.timestamp);
    const matchingSession = (sessionsByDate.get(dateKey) || [])[0];

    return {
      rowType: 'exercise',
      coachId,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      sessionDate: dateKey,
      sessionId: matchingSession?.id || '',
      sessionStatus: matchingSession?.status || '',
      sessionNotes: matchingSession?.notes || '',
      sessionExerciseCount: matchingSession?.exerciseCount || 0,
      sessionTotalVolume: Math.round(matchingSession?.totalVolume || 0),
      exerciseLogId: log.id,
      exerciseName: log.name,
      activityType: log.activityType || '',
      sourceCollection: log.sourceCollection,
      totalSets: log.totalSets,
      exerciseVolume: Math.round(log.totalVolume || 0),
      exerciseNotes: log.notes || '',
      loggedTimestamp: log.timestamp.toISOString()
    };
  });

  const emptySessionRows: CoachExportRow[] = sessions
    .filter((session) => session.exerciseCount === 0)
    .map((session) => ({
      rowType: 'session',
      coachId,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      sessionDate: session.dateKey,
      sessionId: session.id,
      sessionStatus: session.status,
      sessionNotes: session.notes,
      sessionExerciseCount: session.exerciseCount,
      sessionTotalVolume: Math.round(session.totalVolume || 0),
      exerciseLogId: '',
      exerciseName: '',
      activityType: '',
      sourceCollection: '',
      totalSets: 0,
      exerciseVolume: 0,
      exerciseNotes: '',
      loggedTimestamp: session.date.toISOString()
    }));

  return [...exerciseRows, ...emptySessionRows];
}

function sortCoachExportRows(rows: CoachExportRow[]): CoachExportRow[] {
  return rows.sort((a, b) => {
    const timeA = a.loggedTimestamp ? new Date(a.loggedTimestamp).getTime() : 0;
    const timeB = b.loggedTimestamp ? new Date(b.loggedTimestamp).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    if (a.athleteName !== b.athleteName) {
      return a.athleteName.localeCompare(b.athleteName);
    }

    if (a.rowType !== b.rowType) {
      return a.rowType === 'exercise' ? -1 : 1;
    }

    return a.exerciseName.localeCompare(b.exerciseName);
  });
}

export const exportAthleteSessionsCsv = async (
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ rowCount: number; athleteName: string }> => {
  try {
    const { uid: coachId } = await ensureAuth();
    const athlete = await getCoachAthleteIdentity(athleteId);
    const rows = sortCoachExportRows(
      await buildCoachExportRowsForAthlete(coachId, athlete, startDate, endDate)
    );

    if (rows.length === 0) {
      throw new Error('No session data found for this athlete in the selected range');
    }

    const filename = `coach_export_${sanitizeFileToken(athlete.athleteName)}_${formatExportDateStamp()}.csv`;
    downloadCSV(rows, COACH_EXPORT_HEADERS as string[], filename);

    return { rowCount: rows.length, athleteName: athlete.athleteName };
  } catch (error) {
    console.error('[coachService] Error exporting athlete sessions CSV:', error);
    throw error;
  }
};

export const exportAllAthletesSessionsCsv = async (
  startDate?: Date,
  endDate?: Date
): Promise<{ rowCount: number; athleteCount: number }> => {
  try {
    const { uid: coachId } = await ensureAuth();
    const athletes = await getCoachAthleteIdentities();

    if (athletes.length === 0) {
      throw new Error('No athletes found for this coach');
    }

    const allRows: CoachExportRow[] = [];
    const includedAthleteIds = new Set<string>();

    for (const athlete of athletes) {
      try {
        const rows = await buildCoachExportRowsForAthlete(coachId, athlete, startDate, endDate);
        if (rows.length > 0) {
          rows.forEach((row) => allRows.push(row));
          includedAthleteIds.add(athlete.athleteId);
        }
      } catch (error) {
        if (isPermissionDenied(error)) {
          continue;
        }
        throw error;
      }
    }

    const sortedRows = sortCoachExportRows(allRows);

    if (sortedRows.length === 0) {
      throw new Error('No athlete session data found in the selected range');
    }

    const filename = `coach_export_all_athletes_${formatExportDateStamp()}.csv`;
    downloadCSV(sortedRows, COACH_EXPORT_HEADERS as string[], filename);

    return {
      rowCount: sortedRows.length,
      athleteCount: includedAthleteIds.size
    };
  } catch (error) {
    console.error('[coachService] Error exporting all athletes sessions CSV:', error);
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
