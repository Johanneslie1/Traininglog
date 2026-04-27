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
import { db } from '@/services/firebase/config';
import { getAuth } from 'firebase/auth';
import { getCoachTeams, getTeamMembers, TeamMember, syncCoachAthleteAccess } from './teamService';
import { startOfDay, endOfDay } from '@/utils/dateUtils';
import { getUserWorkouts } from './firebase/workouts';
import { downloadCSV, exportData, serializeSetForExport, SET_EXPORT_HEADERS } from './exportService';
import { ActivityType } from '@/types/activityTypes';
import { normalizeActivityType } from '@/types/activityLog';

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
  sourceCollection: 'exercises' | 'activities' | 'strengthExercises' | 'exerciseLogs';
  date: string;
  timestamp: Date;
  sets: any[];
  totalSets: number;
  totalVolume?: number;
  notes?: string;
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
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

type CoachExportRowType = 'session' | 'exercise_log' | 'exercise_set';

interface CoachExportRow extends Record<string, string | number | boolean> {
  rowType: CoachExportRowType;
  coachId: string;
  athleteId: string;
  athleteName: string;
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

function toIsoOrEmpty(date?: Date): string {
  if (!date || !isValidDate(date)) {
    return '';
  }

  return date.toISOString();
}

function logCoachExportDebug(message: string, payload?: Record<string, unknown>): void {
  const envDebugEnabled =
    (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env?.VITE_COACH_EXPORT_DEBUG === 'true';

  let localStorageDebugEnabled = false;
  try {
    localStorageDebugEnabled = globalThis.localStorage?.getItem('coach_export_debug') === 'true';
  } catch {
    localStorageDebugEnabled = false;
  }

  if (!envDebugEnabled && !localStorageDebugEnabled) {
    return;
  }

  if (payload) {
    console.info('[coachExport][debug]', message, payload);
    return;
  }

  console.info('[coachExport][debug]', message);
}

function buildCoachAthleteAccessId(coachId: string, athleteId: string): string {
  return `${coachId}_${athleteId}`;
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

function readNumericSetValue(set: Record<string, unknown>, key: string): number {
  const value = set[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mapSourceCollectionToExportCategory(sourceCollection: AthleteExerciseLog['sourceCollection']): string {
  switch (sourceCollection) {
    case 'exercises':
      return 'exercise';
    case 'exerciseLogs':
      return 'exercise';
    case 'activities':
      return 'activity';
    case 'strengthExercises':
      return 'strength';
    default:
      return 'exercise';
  }
}

function toAthleteLog(
  sourceCollection: 'exercises' | 'activities' | 'strengthExercises' | 'exerciseLogs',
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
    notes: typeof data?.notes === 'string' ? data.notes : undefined,
    supersetId: typeof data?.supersetId === 'string' ? data.supersetId : undefined,
    supersetLabel: typeof data?.supersetLabel === 'string' ? data.supersetLabel : undefined,
    supersetName: typeof data?.supersetName === 'string' ? data.supersetName : undefined
  };
}

function buildFallbackSettingsParityExportData(
  athleteId: string,
  exerciseLogs: AthleteExerciseLog[],
  sessions: ExportSessionSnapshot[]
): {
  sessions: Record<string, any>[];
  exerciseLogs: Record<string, any>[];
  sets: Record<string, any>[];
} {
  const logsByDate = new Map<string, AthleteExerciseLog[]>();
  exerciseLogs.forEach((log) => {
    const dateKey = getLocalDateKey(log.timestamp);
    const existing = logsByDate.get(dateKey) || [];
    existing.push(log);
    logsByDate.set(dateKey, existing);
  });

  const sessionRows = sessions.map((session) => {
    const logsForDate = logsByDate.get(session.dateKey) || [];
    const setCount = logsForDate.reduce((sum, log) => sum + log.sets.length, 0);

    return {
      userId: athleteId,
      sessionId: session.id,
      sessionDate: session.date.toISOString(),
      startTime: '',
      endTime: '',
      notes: session.notes || '',
      totalVolume: session.totalVolume || 0,
      sessionRPE: 0,
      exerciseCount: session.exerciseCount || logsForDate.length,
      setCount,
      durationMinutes: 0,
      createdAt: '',
      updatedAt: ''
    };
  });

  const exerciseLogRows = exerciseLogs.map((log) => {
    const normalizedType = normalizeActivityType(log.activityType || ActivityType.OTHER);
    const totalReps = log.sets.reduce((sum, set) => sum + readNumericSetValue(set as Record<string, unknown>, 'reps'), 0);
    const maxWeight = log.sets.length > 0
      ? Math.max(...log.sets.map((set) => readNumericSetValue(set as Record<string, unknown>, 'weight')))
      : 0;
    const totalVolume = log.sets.reduce(
      (sum, set) => sum + (readNumericSetValue(set as Record<string, unknown>, 'reps') * readNumericSetValue(set as Record<string, unknown>, 'weight')),
      0
    );
    const averageRPE = log.sets.length > 0
      ? log.sets.reduce((sum, set) => sum + readNumericSetValue(set as Record<string, unknown>, 'rpe'), 0) / log.sets.length
      : 0;

    const setNotes = log.sets
      .map((set) => {
        const typedSet = set as Record<string, unknown>;
        const comment = typeof typedSet.comment === 'string' ? typedSet.comment : '';
        const notes = typeof typedSet.notes === 'string' ? typedSet.notes : '';
        return comment || notes;
      })
      .filter((value) => value);

    const combinedNotes = [log.notes || '', ...setNotes].filter((value) => value).join('; ');

    return {
      userId: athleteId,
      sessionId: '',
      exerciseLogId: log.id,
      exerciseId: '',
      exerciseName: log.name,
      supersetId: log.supersetId || '',
      supersetLabel: log.supersetLabel || '',
      supersetName: log.supersetName || '',
      category: mapSourceCollectionToExportCategory(log.sourceCollection),
      type: normalizedType,
      setCount: log.sets.length,
      totalReps,
      maxWeight,
      totalVolume,
      averageRPE,
      notes: combinedNotes,
      createdAt: log.timestamp.toISOString()
    };
  });

  const setRows = exerciseLogs.flatMap((log) => {
    const normalizedType = normalizeActivityType(log.activityType || ActivityType.OTHER);
    const collectionType = mapSourceCollectionToExportCategory(log.sourceCollection);

    return log.sets.map((set, index) => serializeSetForExport(
      athleteId,
      {
        id: log.id,
        exerciseName: log.name,
        collectionType,
        activityType: normalizedType,
        timestamp: log.timestamp,
        supersetId: log.supersetId,
        supersetLabel: log.supersetLabel,
        supersetName: log.supersetName
      },
      set,
      index
    ));
  });

  return {
    sessions: sessionRows,
    exerciseLogs: exerciseLogRows,
    sets: setRows
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

  const sourceCollections: Array<'exercises' | 'activities' | 'strengthExercises' | 'exerciseLogs'> = [
    'exercises',
    'activities',
    'strengthExercises',
    'exerciseLogs'
  ];

  logCoachExportDebug('Fetching unified athlete logs', {
    athleteId,
    startDate: toIsoOrEmpty(startDate),
    endDate: toIsoOrEmpty(endDate),
    maxResults: options.maxResults ?? null,
    skipRelationshipCheck: options.skipRelationshipCheck === true
  });

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

            if (snapshot.empty) {
              snapshot = await getDocs(sourceRef);
            }
          } catch {
            snapshot = await getDocs(sourceRef);
          }
        } else {
          snapshot = await getDocs(sourceRef);
        }

        const logs = snapshot.docs
          .map((doc) => toAthleteLog(sourceCollection, doc.id, doc.data()))
          .filter((log): log is AthleteExerciseLog => !!log);

        return {
          sourceCollection,
          logs,
          permissionDenied: false
        };
      } catch (error) {
        if (!isPermissionDenied(error)) {
          throw error;
        }

        return {
          sourceCollection,
          logs: [] as AthleteExerciseLog[],
          permissionDenied: true
        };
      }
    })
  );

  sourceSnapshots.forEach((sourceSnapshot) => {
    logCoachExportDebug('Unified source query result', {
      athleteId,
      sourceCollection: sourceSnapshot.sourceCollection,
      logCount: sourceSnapshot.logs.length,
      permissionDenied: sourceSnapshot.permissionDenied,
      startDate: toIsoOrEmpty(startDate),
      endDate: toIsoOrEmpty(endDate)
    });
  });

  const allLogs = sourceSnapshots
    .flatMap((snapshot) => snapshot.logs)
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

async function buildCoachExportDataForAthlete(
  athlete: CoachAthleteIdentity,
  startDate?: Date,
  endDate?: Date
): Promise<{
  sessions: Record<string, any>[];
  exerciseLogs: Record<string, any>[];
  sets: Record<string, any>[];
}> {
  await ensureCoachAthleteExportAccess(athlete.athleteId);

  const effectiveStartDate = startDate ? startOfDay(startDate) : undefined;
  const effectiveEndDate = endDate ? endOfDay(endDate) : undefined;
  logCoachExportDebug('Building coach export data from exportData', {
    athleteId: athlete.athleteId,
    athleteName: athlete.athleteName,
    inputStartDate: toIsoOrEmpty(startDate),
    inputEndDate: toIsoOrEmpty(endDate),
    effectiveStartDate: toIsoOrEmpty(effectiveStartDate),
    effectiveEndDate: toIsoOrEmpty(effectiveEndDate)
  });

  const exportResult = await exportData(athlete.athleteId, {
    includeSessions: true,
    includeExerciseLogs: true,
    includeSets: true,
    startDate,
    endDate
  });

  logCoachExportDebug('Coach exportData result counts', {
    athleteId: athlete.athleteId,
    sessionsCount: exportResult.sessions.length,
    exerciseLogsCount: exportResult.exerciseLogs.length,
    setsCount: exportResult.sets.length
  });

  if (exportResult.sets.length === 0) {
    logCoachExportDebug('Primary exportData returned zero sets, falling back to direct coach source aggregation', {
      athleteId: athlete.athleteId,
      startDate: toIsoOrEmpty(startDate),
      endDate: toIsoOrEmpty(endDate)
    });

    const [exerciseLogs, sessions] = await Promise.all([
      getAthleteUnifiedLogs(athlete.athleteId, startDate, endDate, {
        skipRelationshipCheck: true,
        maxResults: 5000
      }),
      getAthleteTrainingSessions(athlete.athleteId, startDate, endDate)
    ]);

    const fallbackResult = buildFallbackSettingsParityExportData(
      athlete.athleteId,
      exerciseLogs,
      sessions
    );

    logCoachExportDebug('Fallback export result counts', {
      athleteId: athlete.athleteId,
      sessionsCount: fallbackResult.sessions.length,
      exerciseLogsCount: fallbackResult.exerciseLogs.length,
      setsCount: fallbackResult.sets.length
    });

    return fallbackResult;
  }

  return exportResult;
}

async function ensureCoachAthleteExportAccess(athleteId: string): Promise<{ coachId: string }> {
  const { uid: coachId } = await ensureAuth();
  const hasRelationship = await verifyCoachAthleteRelationship(athleteId);
  if (!hasRelationship) {
    throw new Error('You do not have permission to export this athlete\'s data');
  }

  try {
    await syncCoachAthleteAccess(coachId, athleteId);
  } catch (error) {
    console.error('[coachService] Failed to sync coach-athlete export access:', error);
    throw new Error('Could not verify coach-athlete access for export. Please try again.');
  }

  const accessDocRef = doc(db, 'coachAthleteAccess', buildCoachAthleteAccessId(coachId, athleteId));
  const accessDoc = await getDoc(accessDocRef);

  if (!accessDoc.exists()) {
    throw new Error('Coach-athlete access is not configured for export. Ask the athlete to rejoin the team or refresh team access.');
  }

  logCoachExportDebug('Coach-athlete export access verified', {
    coachId,
    athleteId,
    accessDocumentId: buildCoachAthleteAccessId(coachId, athleteId)
  });

  return { coachId };
}

async function buildCoachExportRowsForAthlete(
  coachId: string,
  athlete: CoachAthleteIdentity,
  startDate?: Date,
  endDate?: Date
): Promise<CoachExportRow[]> {
  const exportResult = await buildCoachExportDataForAthlete(athlete, startDate, endDate);

  const buildBaseRow = (rowType: CoachExportRowType): CoachExportRow => ({
    rowType,
    coachId,
    athleteId: athlete.athleteId,
    athleteName: athlete.athleteName
  });

  const sessionRows: CoachExportRow[] = exportResult.sessions.map((session) => ({
    ...buildBaseRow('session'),
    ...session
  }));

  const exerciseLogRows: CoachExportRow[] = exportResult.exerciseLogs.map((exerciseLog) => ({
    ...buildBaseRow('exercise_log'),
    ...exerciseLog
  }));

  const setRows: CoachExportRow[] = exportResult.sets.map((set) => ({
    ...buildBaseRow('exercise_set'),
    ...set
  }));

  return [...sessionRows, ...exerciseLogRows, ...setRows];
}

function sortCoachExportRows(rows: CoachExportRow[]): CoachExportRow[] {
  const rowTypeOrder: Record<CoachExportRowType, number> = {
    session: 0,
    exercise_log: 1,
    exercise_set: 2
  };

  const getPrimaryTimestamp = (row: CoachExportRow): number => {
    const candidates = [
      row.loggedTimestamp,
      row.createdAt,
      row.sessionDate,
      row.updatedAt
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        const parsed = new Date(candidate).getTime();
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  };

  return rows.sort((a, b) => {
    const timeA = getPrimaryTimestamp(a);
    const timeB = getPrimaryTimestamp(b);
    if (timeA !== timeB) {
      return timeB - timeA;
    }

    if (a.athleteName !== b.athleteName) {
      return a.athleteName.localeCompare(b.athleteName);
    }

    if (a.rowType !== b.rowType) {
      return rowTypeOrder[a.rowType] - rowTypeOrder[b.rowType];
    }

    const exerciseNameA = typeof a.exerciseName === 'string' ? a.exerciseName : '';
    const exerciseNameB = typeof b.exerciseName === 'string' ? b.exerciseName : '';
    return exerciseNameA.localeCompare(exerciseNameB);
  });
}

export const exportAthleteSessionsCsv = async (
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ rowCount: number; athleteName: string }> => {
  try {
    await ensureAuth();
    logCoachExportDebug('Starting single-athlete coach export', {
      athleteId,
      startDate: toIsoOrEmpty(startDate),
      endDate: toIsoOrEmpty(endDate)
    });

    await ensureCoachAthleteExportAccess(athleteId);
    const athlete = await getCoachAthleteIdentity(athleteId);
    const exportResult = await buildCoachExportDataForAthlete(athlete, startDate, endDate);

    const totalRows = exportResult.sets.length;

    logCoachExportDebug('Single-athlete coach export row count', {
      athleteId,
      athleteName: athlete.athleteName,
      totalRows
    });

    if (totalRows === 0) {
      throw new Error('No export data found for this athlete in the selected range');
    }

    downloadCSV(exportResult.sets, [...SET_EXPORT_HEADERS], 'exercise_sets.csv');

    return { rowCount: totalRows, athleteName: athlete.athleteName };
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
        const hasExerciseSetRows = rows.some((row) => row.rowType === 'exercise_set');

        if (hasExerciseSetRows) {
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
    const setRows = sortedRows
      .filter((row) => row.rowType === 'exercise_set')
      .map((row) => {
        const setRow = { ...row } as Record<string, any>;
        delete setRow.rowType;
        delete setRow.coachId;
        delete setRow.athleteId;
        delete setRow.athleteName;
        return setRow;
      });

    if (setRows.length === 0) {
      throw new Error('No athlete export data found in the selected range');
    }

    const filename = `coach_exercise_sets_all_athletes_${formatExportDateStamp()}.csv`;
    downloadCSV(setRows, [...SET_EXPORT_HEADERS], filename);

    return {
      rowCount: setRows.length,
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
