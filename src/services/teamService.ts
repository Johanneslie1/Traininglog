import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import { getAuth } from 'firebase/auth';

export interface Team {
  id: string;
  name: string;
  description: string;
  coachId: string; // Team owner
  coachName: string;
  inviteCode: string; // Unique code for joining
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface TeamMember {
  id: string; // userId
  teamId: string;
  email: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  status: 'active' | 'inactive';
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

// Generate a unique 6-character invite code
function generateInviteCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Remove undefined fields from objects
function removeUndefinedFields<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields) as unknown as T;
  } else if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned;
  }
  return obj;
}

/**
 * Create a new team
 */
export const createTeam = async (name: string, description: string): Promise<Team> => {
  try {
    console.log('[teamService] Starting team creation...');
    const user = await ensureAuth();
    const auth = getAuth();
    
    console.log('[teamService] Auth state:', {
      uid: user.uid,
      email: auth.currentUser?.email,
      isAuthenticated: !!auth.currentUser
    });
    
    // Get user's name from Firestore with fallback to auth email
    let coachName = 'Coach';
    try {
      console.log('[teamService] Attempting to fetch user document...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('[teamService] User document exists:', userDoc.exists());
      const userData = userDoc.data();
      if (userData && userData.firstName && userData.lastName) {
        coachName = `${userData.firstName} ${userData.lastName}`;
      } else if (auth.currentUser?.displayName) {
        coachName = auth.currentUser.displayName;
      } else if (auth.currentUser?.email) {
        coachName = auth.currentUser.email.split('@')[0];
      }
    } catch (userError) {
      console.warn('[teamService] Could not fetch user document, using fallback name:', userError);
      // Use auth fallbacks
      if (auth.currentUser?.displayName) {
        coachName = auth.currentUser.displayName;
      } else if (auth.currentUser?.email) {
        coachName = auth.currentUser.email.split('@')[0];
      }
    }
    
    console.log('[teamService] Using coach name:', coachName);
    
    // Generate invite code (6 chars from 32 options = 1B+ combinations, collision extremely unlikely)
    const inviteCode = generateInviteCode();
    console.log('[teamService] Generated invite code:', inviteCode);
    
    const teamRef = doc(collection(db, 'teams'));
    console.log('[teamService] Generated team document reference:', teamRef.id);
    
    const teamData = removeUndefinedFields({
      name: name.trim(),
      description: description.trim(),
      coachId: user.uid,
      coachName,
      inviteCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    });
    
    console.log('[teamService] Team data to write:', {
      ...teamData,
      teamId: teamRef.id,
      path: teamRef.path
    });
    
    console.log('[teamService] Attempting to write team document...');
    await setDoc(teamRef, teamData);
    
    console.log('[teamService] Team created successfully:', teamRef.id);
    
    return {
     id: teamRef.id,
      ...teamData
    };
  } catch (error) {
    console.error('[teamService] Error creating team:', error);
    if (error instanceof Error) {
      console.error('[teamService] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

/**
 * Get all teams coached by the current user
 */
export const getCoachTeams = async (): Promise<Team[]> => {
  try {
    const user = await ensureAuth();
    
    const teamsRef = collection(db, 'teams');
    const q = query(
      teamsRef, 
      where('coachId', '==', user.uid),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
  } catch (error) {
    console.error('[teamService] Error fetching coach teams:', error);
    throw error;
  }
};

/**
 * Get a team by ID
 */
export const getTeam = async (teamId: string): Promise<Team | null> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      return null;
    }
    
    return {
      id: teamSnap.id,
      ...teamSnap.data()
    } as Team;
  } catch (error) {
    console.error('[teamService] Error fetching team:', error);
    throw error;
  }
};

/**
 * Get a team by invite code
 */
export const getTeamByInviteCode = async (inviteCode: string): Promise<Team | null> => {
  try {
    const teamsRef = collection(db, 'teams');
    const q = query(
      teamsRef, 
      where('inviteCode', '==', inviteCode.toUpperCase()),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const teamDoc = snapshot.docs[0];
    return {
      id: teamDoc.id,
      ...teamDoc.data()
    } as Team;
  } catch (error) {
    console.error('[teamService] Error fetching team by invite code:', error);
    throw error;
  }
};

/**
 * Update team information
 */
export const updateTeam = async (
  teamId: string, 
  updates: Partial<Pick<Team, 'name' | 'description'>>
): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    // Verify user owns the team
    const team = await getTeam(teamId);
    if (!team || team.coachId !== user.uid) {
      throw new Error('You can only update teams you own');
    }
    
    const teamRef = doc(db, 'teams', teamId);
    const updateData = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    await updateDoc(teamRef, updateData);
    
    console.log('[teamService] Team updated successfully');
  } catch (error) {
    console.error('[teamService] Error updating team:', error);
    throw error;
  }
};

/**
 * Delete (deactivate) a team
 */
export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    // Verify user owns the team
    const team = await getTeam(teamId);
    if (!team || team.coachId !== user.uid) {
      throw new Error('You can only delete teams you own');
    }
    
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    console.log('[teamService] Team deactivated successfully');
  } catch (error) {
    console.error('[teamService] Error deleting team:', error);
    throw error;
  }
};

/**
 * Get all members of a team
 */
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    const membersRef = collection(db, 'teams', teamId, 'members');
    const snapshot = await getDocs(membersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
  } catch (error) {
    console.error('[teamService] Error fetching team members:', error);
    throw error;
  }
};

/**
 * Add a member to a team
 */
export const addTeamMember = async (teamId: string, userId: string): Promise<void> => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    const memberRef = doc(db, 'teams', teamId, 'members', userId);
    const memberData = removeUndefinedFields({
      teamId,
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      joinedAt: new Date().toISOString(),
      status: 'active' as const
    });
    
    await setDoc(memberRef, memberData);
    
    console.log('[teamService] Team member added successfully');
  } catch (error) {
    console.error('[teamService] Error adding team member:', error);
    throw error;
  }
};

/**
 * Remove a member from a team
 */
export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
  try {
    const user = await ensureAuth();
    
    // Verify user owns the team
    const team = await getTeam(teamId);
    if (!team || team.coachId !== user.uid) {
      throw new Error('You can only remove members from teams you own');
    }
    
    const memberRef = doc(db, 'teams', teamId, 'members', userId);
    await deleteDoc(memberRef);
    
    console.log('[teamService] Team member removed successfully');
  } catch (error) {
    console.error('[teamService] Error removing team member:', error);
    throw error;
  }
};

/**
 * Join a team using an invite code
 */
export const joinTeam = async (inviteCode: string): Promise<string> => {
  try {
    const user = await ensureAuth();
    
    // Find team by invite code
    const team = await getTeamByInviteCode(inviteCode);
    if (!team) {
      throw new Error('Invalid invite code');
    }
    
    // Check if user is already a member
    const memberRef = doc(db, 'teams', team.id, 'members', user.uid);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      throw new Error('You are already a member of this team');
    }
    
    // Add user as member
    await addTeamMember(team.id, user.uid);
    
    console.log('[teamService] Successfully joined team');
    return team.id;
  } catch (error) {
    console.error('[teamService] Error joining team:', error);
    throw error;
  }
};

/**
 * Get teams the current user is a member of (as an athlete)
 */
export const getAthleteTeams = async (): Promise<Team[]> => {
  try {
    const user = await ensureAuth();
    
    // Query all teams
    const teamsRef = collection(db, 'teams');
    const teamsSnapshot = await getDocs(query(teamsRef, where('isActive', '==', true)));
    
    // Filter teams where user is a member
    const userTeams: Team[] = [];
    
    for (const teamDoc of teamsSnapshot.docs) {
      const memberRef = doc(db, 'teams', teamDoc.id, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        userTeams.push({
          id: teamDoc.id,
          ...teamDoc.data()
        } as Team);
      }
    }
    
    return userTeams;
  } catch (error) {
    console.error('[teamService] Error fetching athlete teams:', error);
    throw error;
  }
};
