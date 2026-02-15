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
  lastActive?: string;
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

/**
 * Verify that the current user (coach) has a relationship with the athlete through a team
 */
export const verifyCoachAthleteRelationship = async (athleteId: string): Promise<boolean> => {
  try {
    await ensureAuth();
    
    // Get all teams coached by this user
    const coachTeams = await getCoachTeams();
    
    // Check if athlete is a member of any of the coach's teams
    for (const team of coachTeams) {
      const members = await getTeamMembers(team.id);
      if (members.some(member => member.id === athleteId)) {
        return true;
      }
    }
    
    return false;
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
    const user = await ensureAuth();
    
    console.log('[coachService] Fetching all athletes for coach:', user.uid);
    
    // Get all teams
    const teams = await getCoachTeams();
    
    if (teams.length === 0) {
      console.log('[coachService] No teams found');
      return [];
    }
    
    // Get all members from all teams
    const allMembers: AthleteData[] = [];
    const seenAthletes = new Set<string>(); // Prevent duplicates if athlete is in multiple teams
    
    for (const team of teams) {
      const members = await getTeamMembers(team.id);
      
      for (const member of members) {
        if (!seenAthletes.has(member.id)) {
          seenAthletes.add(member.id);
          
          // Get athlete stats
          const stats = await getAthleteSummaryStats(member.id);
          
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
    
    console.log('[coachService] Found', allMembers.length, 'athletes');
    return allMembers;
  } catch (error) {
    console.error('[coachService] Error fetching athletes:', error);
    throw error;
  }
};

/**
 * Get summary statistics for a single athlete
 */
export const getAthleteSummaryStats = async (athleteId: string): Promise<AthleteSummaryStats> => {
  try {
    // Verify relationship (will throw if not allowed)
    const hasAccess = await verifyCoachAthleteRelationship(athleteId);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }
    
    console.log('[coachService] Fetching stats for athlete:', athleteId);
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get exercises collection (nested under user)
    const exercisesRef = collection(db, 'users', athleteId, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    
    if (exercisesSnapshot.empty) {
      return {
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
        totalVolume: 0,
        programsAssigned: 0,
        programsCompleted: 0
      };
    }
    
    // Map to get dates and calculate volume
    const workouts = exercisesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: new Date(data.date),
        volume: calculateExerciseVolume(data)
      };
    });
    
    // Calculate stats
    const workoutsThisWeek = workouts.filter(w => w.date >= oneWeekAgo).length;
    const workoutsThisMonth = workouts.filter(w => w.date >= oneMonthAgo).length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.volume, 0);
    
    // Get last active date
    const lastActive = workouts.length > 0 
      ? workouts.sort((a, b) => b.date.getTime() - a.date.getTime())[0].date.toISOString()
      : undefined;
    
    // Get program assignments
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const assignmentsQuery = query(
      assignmentsRef,
      where('userId', '==', athleteId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    const programsAssigned = assignmentsSnapshot.docs.filter(
      doc => doc.data().status !== 'archived'
    ).length;
    
    const programsCompleted = assignmentsSnapshot.docs.filter(
      doc => doc.data().status === 'completed'
    ).length;
    
    return {
      workoutsThisWeek,
      workoutsThisMonth,
      totalVolume: Math.round(totalVolume),
      programsAssigned,
      programsCompleted,
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
    
    console.log('[coachService] Fetching exercise logs for athlete:', athleteId);
    
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
    // Verify relationship
    const hasAccess = await verifyCoachAthleteRelationship(athleteId);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this athlete\'s data');
    }
    
    console.log('[coachService] Fetching assigned programs for athlete:', athleteId);
    
    const assignmentsRef = collection(db, 'sharedProgramAssignments');
    const q = query(
      assignmentsRef,
      where('userId', '==', athleteId)
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
