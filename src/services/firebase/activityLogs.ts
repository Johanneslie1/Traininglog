import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { ActivityLog, ActivityLogInput, normalizeActivityType, mapExerciseTypeToActivityType } from '@/types/activityLog';

// Helper function to clean undefined values from objects
const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (
    obj &&
    typeof obj === 'object' &&
    (
      typeof obj.toDate === 'function' ||
      ('seconds' in obj && 'nanoseconds' in obj)
    )
  ) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)).filter(item => item !== undefined && item !== null);
  }
  
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== undefined && cleanedValue !== null) {
          cleaned[key] = cleanedValue;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

export const addActivityLog = async (
  logData: ActivityLogInput,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  try {
    console.log('🏃 addActivityLog called with:', { logData, selectedDate, existingId });
    
    // Debug authentication state
    const auth = getAuth();
    const currentUser = auth.currentUser;
    console.log('🔐 Auth debug:', {
      currentUser: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous
      } : null,
      providedUserId: logData.userId,
      userIdMatch: currentUser?.uid === logData.userId
    });
    
    if (!logData.userId) {
      throw new Error('userId is required to save activity log');
    }
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const effectiveUserId = currentUser.uid;
    if (logData.userId && logData.userId !== effectiveUserId) {
      console.warn('⚠️ addActivityLog userId mismatch, using auth uid instead:', {
        providedUserId: logData.userId,
        authUid: effectiveUserId,
      });
    }

    const normalizedActivityType = normalizeActivityType(logData.activityType);

    const activityData = cleanObject({
      ...logData,
      timestamp: Timestamp.fromDate(selectedDate || new Date()),
      deviceId: window.navigator.userAgent,
      userId: effectiveUserId,
      sets: Array.isArray(logData.sets) ? logData.sets.map(set => cleanObject(set)).filter(set => set && Object.keys(set).length > 0) : [],
      activityType: normalizedActivityType,
      supersetId: logData.supersetId,
      supersetLabel: logData.supersetLabel,
      supersetName: logData.supersetName,
      categories: logData.categories || []
    });

    console.log('🏃 Prepared activity data:', activityData);

    let docRef;
    let docId;

    if (existingId) {
      // Update existing document
      docRef = doc(db, 'users', effectiveUserId, 'activities', existingId);
      docId = existingId;
      console.log('🏃 Updating existing activity:', docId);
    } else {
      // Create new document
      docRef = doc(collection(db, 'users', effectiveUserId, 'activities'));
      docId = docRef.id;
      console.log('🏃 Creating new activity with ID:', docId);
    }

    // Save the document
    await setDoc(docRef, activityData);
    console.log('✅ Activity saved successfully with ID:', docId);
    return docId;
    
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ Error adding activity log:', {
      error,
      code: firebaseError.code,
      message: firebaseError.message,
      userId: logData.userId,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Log the exact path being written to
    console.error('📍 Attempted write path:', `users/${logData.userId}/activities/${existingId || 'new-doc'}`);
    
    if (firebaseError.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication.');
    }
    throw new Error('Failed to add activity log: ' + (firebaseError.message || 'Unknown error'));
  }
};

export const getActivityLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ActivityLog[]> => {
  try {
    console.log('📖 getActivityLogs called with:', { 
      userId, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    if (!userId) {
      throw new Error('userId is required to fetch activity logs');
    }

    // Query from the user's activities subcollection
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const q = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    console.log('📖 Activity query returned', querySnapshot.docs.length, 'documents');
    
    const activities = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const normalizedActivityType = normalizeActivityType(data.activityType);
      console.log('📖 Processing activity document:', doc.id, {
        activityName: data.activityName,
        activityType: normalizedActivityType,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        categories: data.categories
      });
      
      return {
        id: doc.id,
        activityName: data.activityName,
        sets: data.sets,
        timestamp: data.timestamp.toDate(),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: normalizedActivityType,
        supersetId: data.supersetId,
        supersetLabel: data.supersetLabel,
        supersetName: data.supersetName,
        categories: data.categories || [],
        notes: data.notes
      } as ActivityLog;
    });

    console.log('📖 Retrieved activities:', activities.length);
    return activities;
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Permission denied for activities collection. Returning empty activity list.');
      return [];
    }
    console.error('❌ Error fetching activity logs:', error);
    throw new Error('Failed to fetch activities');
  }
};

export const deleteActivityLog = async (logId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ deleteActivityLog called with:', { logId, userId });
    
    if (!userId) {
      throw new Error('userId is required to delete activity log');
    }

    if (!logId) {
      throw new Error('logId is required to delete activity log');
    }

    const activityRef = doc(db, 'users', userId, 'activities', logId);
    await deleteDoc(activityRef);
    
    console.log('✅ Activity deleted successfully:', logId);
  } catch (error) {
    console.error('❌ Error deleting activity log:', error);
    throw error instanceof Error ? error : new Error('Failed to delete activity log');
  }
};

// Batch operation to migrate existing exercises to activities
export const migrateExercisesToActivities = async (userId: string, exerciseIds: string[]): Promise<void> => {
  try {
    console.log('🔄 Starting migration for user:', userId, 'exercises:', exerciseIds);
    
    const batch = writeBatch(db);
    
    for (const exerciseId of exerciseIds) {
      // Read from old location
      const oldExerciseRef = doc(db, 'users', userId, 'exercises', exerciseId);
      const oldExerciseDoc = await getDoc(oldExerciseRef);
      
      if (oldExerciseDoc.exists()) {
        const data = oldExerciseDoc.data();
        
        // Only migrate non-strength exercises
        if (data.exerciseType && data.exerciseType !== 'strength' && data.exerciseType !== 'plyometric') {
          const normalizedActivityType = mapExerciseTypeToActivityType(data.exerciseType);

          // Create new activity document
          const newActivityRef = doc(db, 'users', userId, 'activities', exerciseId);
          const activityData = {
            ...data,
            activityName: data.exerciseName,
            activityType: normalizedActivityType
          };
          // Remove old field names
          delete (activityData as any).exerciseName;
          delete (activityData as any).exerciseType;
          
          batch.set(newActivityRef, activityData);
          batch.delete(oldExerciseRef);
        }
      }
    }
    
    await batch.commit();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw new Error('Failed to migrate exercises to activities');
  }
};
