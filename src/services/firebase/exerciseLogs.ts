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
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './config';
import { ExerciseLog } from '@/types/exercise';
import { ExerciseSet } from '@/types/sets';
import { Prescription } from '@/types/program';
import { ExercisePrescriptionAssistantData } from '@/types/exercise';
import { ActivityType } from '@/types/activityTypes';
import { resolveActivityTypeFromExerciseLike } from '@/utils/activityTypeResolver';
import { SupersetGroup } from '@/types/session';
import { buildSupersetLabels } from '@/utils/supersetUtils';
import { addActivityLog } from './activityLogs';
import { ensureSessionContextForLog } from './sessionTrackingService';
import { normalizeSessionType, SessionType } from '@/types/sessionType';

const LOCAL_EXERCISE_LOGS_KEY = 'exercise_logs';

const upsertLocalExerciseLog = (entry: ExerciseLog): void => {
  try {
    const existingRaw = localStorage.getItem(LOCAL_EXERCISE_LOGS_KEY);
    const existing: ExerciseLog[] = existingRaw ? JSON.parse(existingRaw) : [];

    const normalizedEntry = {
      ...entry,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : new Date(entry.timestamp).toISOString()
    } as unknown as ExerciseLog;

    const existingIndex = existing.findIndex((log) => log.id === entry.id);
    const updated = existingIndex >= 0
      ? [...existing.slice(0, existingIndex), normalizedEntry, ...existing.slice(existingIndex + 1)]
      : [...existing, normalizedEntry];

    localStorage.setItem(LOCAL_EXERCISE_LOGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('⚠️ Failed to upsert local exercise backup:', error);
  }
};

const parseTimestamp = (value: unknown): Date => {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>) && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = value ? new Date(value as string | number | Date) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const removeUndefinedFields = <T>(obj: T): T => {
  if (obj instanceof Date) {
    return obj;
  }

  if (
    obj &&
    typeof obj === 'object' &&
    (
      ('toDate' in (obj as Record<string, unknown>) &&
        typeof (obj as { toDate?: unknown }).toDate === 'function') ||
      ('seconds' in (obj as Record<string, unknown>) &&
        'nanoseconds' in (obj as Record<string, unknown>))
    )
  ) {
    return obj;
  }

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
};

type ExerciseLogInput = {
  exerciseName: string;
  userId: string;
  sets: ExerciseSet[];
  activityType?: string; // Add activity type to the input type
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
  isWarmup?: boolean;
  prescription?: Prescription;
  instructionMode?: 'structured' | 'freeform';
  instructions?: string;
  prescriptionAssistant?: ExercisePrescriptionAssistantData;
  sharedSessionAssignmentId?: string;
  sharedSessionId?: string;
  sharedSessionExerciseId?: string;
  sharedSessionDateKey?: string;
  sharedSessionExerciseCompleted?: boolean;
  sessionId?: string;
  sessionType?: SessionType;
  sessionDateKey?: string;
  sessionWeekKey?: string;
  sessionNumberInDay?: number;
  sessionNumberInWeek?: number;
  startNewSession?: boolean;
};

export const addExerciseLog = async (
  logData: ExerciseLogInput,
  selectedDate: Date,
  existingId?: string
): Promise<string> => {
  try {
    console.log('📝 addExerciseLog called with:', { logData, selectedDate, existingId });
    
    if (!logData.userId) {
      throw new Error('userId is required to save exercise log');
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const effectiveUserId = currentUser.uid;
    if (logData.userId && logData.userId !== effectiveUserId) {
      console.warn('⚠️ addExerciseLog userId mismatch, using auth uid instead:', {
        providedUserId: logData.userId,
        authUid: effectiveUserId,
      });
    }

    const resolvedActivityType = resolveActivityTypeFromExerciseLike(
      {
        activityType: logData.activityType,
        sets: (Array.isArray(logData.sets) ? logData.sets : []) as unknown as Array<Record<string, unknown>>,
      },
      {
        fallback: ActivityType.RESISTANCE,
        // Keep explicit type from UI payload authoritative for non-resistance logs.
        preferHintOverOther: false,
      }
    );

    const requestedSessionType = normalizeSessionType(logData.sessionType);
    if (!logData.sessionId && requestedSessionType === 'warmup') {
      throw new Error('Create a warm-up session with +W before logging warm-up exercises.');
    }

    const effectiveDate = selectedDate || new Date();
    const sessionContext = await ensureSessionContextForLog(effectiveUserId, effectiveDate, {
      requestedSessionId: logData.sessionId,
      requestedSessionType: requestedSessionType,
      forceNewSession: logData.startNewSession === true,
    });

    if (resolvedActivityType !== ActivityType.RESISTANCE) {
      return await addActivityLog(
        {
          activityName: logData.exerciseName,
          userId: effectiveUserId,
          sets: Array.isArray(logData.sets) ? logData.sets : [],
          activityType: resolvedActivityType,
          supersetId: logData.supersetId,
          supersetLabel: logData.supersetLabel,
          supersetName: logData.supersetName,
          sessionId: sessionContext.sessionId,
          sessionType: sessionContext.sessionType,
          sessionDateKey: sessionContext.sessionDateKey,
          sessionWeekKey: sessionContext.sessionWeekKey,
          sessionNumberInDay: sessionContext.sessionNumberInDay,
          sessionNumberInWeek: sessionContext.sessionNumberInWeek,
        },
        effectiveDate,
        existingId
      );
    }

    const exerciseData = removeUndefinedFields({
      ...logData,
      timestamp: Timestamp.fromDate(selectedDate || new Date()),
      createdAt: existingId ? undefined : Timestamp.now(),
      deviceId: window.navigator.userAgent,
      userId: effectiveUserId,
      sets: Array.isArray(logData.sets) ? logData.sets : [], // Ensure sets is always an array
      activityType: resolvedActivityType,
      ...(logData.supersetId && { supersetId: logData.supersetId }),
      ...(logData.supersetLabel && { supersetLabel: logData.supersetLabel }),
      ...(logData.supersetName && { supersetName: logData.supersetName }),
      ...(typeof logData.isWarmup === 'boolean' && { isWarmup: logData.isWarmup }),
      ...(logData.sharedSessionAssignmentId && { sharedSessionAssignmentId: logData.sharedSessionAssignmentId }),
      ...(logData.sharedSessionId && { sharedSessionId: logData.sharedSessionId }),
      ...(logData.sharedSessionExerciseId && { sharedSessionExerciseId: logData.sharedSessionExerciseId }),
      ...(logData.sharedSessionDateKey && { sharedSessionDateKey: logData.sharedSessionDateKey }),
      ...(typeof logData.sharedSessionExerciseCompleted === 'boolean' && {
        sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted
      }),
      sessionId: sessionContext.sessionId,
      sessionType: sessionContext.sessionType,
      sessionDateKey: sessionContext.sessionDateKey,
      sessionWeekKey: sessionContext.sessionWeekKey,
      sessionNumberInDay: sessionContext.sessionNumberInDay,
      sessionNumberInWeek: sessionContext.sessionNumberInWeek,
      ...(logData.prescription && { prescription: logData.prescription }),
      ...(logData.instructionMode && { instructionMode: logData.instructionMode }),
      ...(logData.instructions && { instructions: logData.instructions }),
      ...(logData.prescriptionAssistant && { prescriptionAssistant: logData.prescriptionAssistant })
    });

    console.log('📝 Prepared exercise data:', exerciseData);

    let docRef;
    let docId;

    // Simplified ID management - always use the new subcollection structure
    if (existingId) {
      // Update existing document
      docRef = doc(db, 'users', effectiveUserId, 'exercises', existingId);
      docId = existingId;
      console.log('📝 Updating existing document:', docId);
      
      // Clean up any old location document if it exists
      try {
        const oldRef = doc(db, 'exerciseLogs', existingId);
        const oldDoc = await getDoc(oldRef);
        if (oldDoc.exists()) {
          await deleteDoc(oldRef);
          console.log('✅ Cleaned up old location document:', existingId);
        }
      } catch (error) {
        console.warn('⚠️ Could not clean up old location:', error);
      }
    } else {
      // Create new document
      docRef = doc(collection(db, 'users', effectiveUserId, 'exercises'));
      docId = docRef.id;
      console.log('📝 Creating new document with ID:', docId);
    }

    // Save the document
    await setDoc(docRef, exerciseData);

    upsertLocalExerciseLog({
      id: docId,
      exerciseName: logData.exerciseName,
      sets: logData.sets,
      timestamp: selectedDate || new Date(),
      deviceId: window.navigator.userAgent,
      userId: effectiveUserId,
      activityType: resolvedActivityType,
      supersetId: logData.supersetId,
      supersetLabel: logData.supersetLabel,
      supersetName: logData.supersetName,
      isWarmup: logData.isWarmup,
      sharedSessionAssignmentId: logData.sharedSessionAssignmentId,
      sharedSessionId: logData.sharedSessionId,
      sharedSessionExerciseId: logData.sharedSessionExerciseId,
      sharedSessionDateKey: logData.sharedSessionDateKey,
      sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted,
      sessionId: sessionContext.sessionId,
      sessionType: sessionContext.sessionType,
      sessionDateKey: sessionContext.sessionDateKey,
      sessionWeekKey: sessionContext.sessionWeekKey,
      sessionNumberInDay: sessionContext.sessionNumberInDay,
      sessionNumberInWeek: sessionContext.sessionNumberInWeek,
      prescription: logData.prescription,
      instructionMode: logData.instructionMode,
      instructions: logData.instructions,
      prescriptionAssistant: logData.prescriptionAssistant
    });

    console.log('✅ Exercise saved successfully with ID:', docId);
    return docId;
    
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ Error adding exercise log:', {
      error,
      code: firebaseError.code,
      message: firebaseError.message,
      userId: logData.userId
    });
    
    if (firebaseError.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication.');
    }

    upsertLocalExerciseLog({
      id: existingId || `local-${Date.now()}`,
      exerciseName: logData.exerciseName,
      sets: Array.isArray(logData.sets) ? logData.sets : [],
      timestamp: selectedDate || new Date(),
      deviceId: window.navigator.userAgent,
      userId: getAuth().currentUser?.uid || logData.userId,
      activityType: resolveActivityTypeFromExerciseLike(
        {
          activityType: logData.activityType,
          sets: (Array.isArray(logData.sets) ? logData.sets : []) as unknown as Array<Record<string, unknown>>,
        },
        {
          fallback: ActivityType.RESISTANCE,
          preferHintOverOther: true,
        }
      ),
      supersetId: logData.supersetId,
      supersetLabel: logData.supersetLabel,
      supersetName: logData.supersetName,
      isWarmup: logData.isWarmup,
      sharedSessionAssignmentId: logData.sharedSessionAssignmentId,
      sharedSessionId: logData.sharedSessionId,
      sharedSessionExerciseId: logData.sharedSessionExerciseId,
      sharedSessionDateKey: logData.sharedSessionDateKey,
      sharedSessionExerciseCompleted: logData.sharedSessionExerciseCompleted,
      sessionId: logData.sessionId,
      sessionType: logData.sessionType,
      sessionDateKey: logData.sessionDateKey,
      sessionWeekKey: logData.sessionWeekKey,
      sessionNumberInDay: logData.sessionNumberInDay,
      sessionNumberInWeek: logData.sessionNumberInWeek,
      prescription: logData.prescription,
      instructionMode: logData.instructionMode,
      instructions: logData.instructions,
      prescriptionAssistant: logData.prescriptionAssistant
    });

    throw new Error('Failed to add exercise log: ' + (firebaseError.message || 'Unknown error'));
  }
};

export const deleteExerciseLog = async (logId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ deleteExerciseLog called with:', { logId, userId });
    
    if (!userId) {
      throw new Error('userId is required to delete exercise log');
    }

    if (!logId) {
      throw new Error('logId is required to delete exercise log');
    }

    // Try both locations - the new subcollection path and the old top-level path
    const exerciseRef = doc(db, 'users', userId, 'exercises', logId);
    const oldExerciseRef = doc(db, 'exerciseLogs', logId);

    // Try to get documents from both locations
    let exerciseDoc = null;
    let oldExerciseDoc = null;

    try {
      exerciseDoc = await getDoc(exerciseRef);
      console.log('📄 New path document check:', {
        exists: exerciseDoc.exists(),
        userId: exerciseDoc.exists() ? exerciseDoc.data()?.userId : null,
      });
    } catch (error) {
      console.warn('⚠️ Error checking new path:', error);
    }

    try {
      oldExerciseDoc = await getDoc(oldExerciseRef);
      console.log('📄 Old path document check:', {
        exists: oldExerciseDoc.exists(),
        userId: oldExerciseDoc.exists() ? oldExerciseDoc.data()?.userId : null,
      });
    } catch (error) {
      console.warn('⚠️ Error checking old path:', error);
    }

    let deleted = false;
    let errors = [];

    // Try to delete from new location first if it exists and belongs to the user
    if (exerciseDoc?.exists()) {
      const data = exerciseDoc.data();
      if (data?.userId === userId) {
        try {
          await deleteDoc(exerciseRef);
          console.log('✅ Exercise deleted from new location successfully');
          deleted = true;
        } catch (error) {
          console.error('❌ Failed to delete from new location:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`New location error: ${errorMessage}`);
        }
      } else if (data?.userId) {
        console.warn('⚠️ Document exists but belongs to different user:', {
          docUserId: data.userId,
          requestUserId: userId
        });
      }
    }

    // If not deleted yet, try old location
    if (!deleted && oldExerciseDoc?.exists()) {
      const data = oldExerciseDoc.data();
      if (data?.userId === userId) {
        try {
          await deleteDoc(oldExerciseRef);
          console.log('✅ Exercise deleted from old location successfully');
          deleted = true;
        } catch (error) {
          console.error('❌ Failed to delete from old location:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Old location error: ${errorMessage}`);
        }
      } else if (data?.userId) {
        console.warn('⚠️ Document exists but belongs to different user:', {
          docUserId: data.userId,
          requestUserId: userId
        });
      }
    }

    if (!deleted) {
      const noDocumentExists = Boolean(exerciseDoc && !exerciseDoc.exists()) && Boolean(oldExerciseDoc && !oldExerciseDoc.exists());

      if (noDocumentExists) {
        console.log('ℹ️ Exercise already removed from Firestore, skipping delete:', logId);
        return;
      }

      const errorMessage = errors.length > 0
        ? `Failed to delete exercise: ${errors.join('; ')}`
        : 'Exercise log not found or you do not have permission to delete it';

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error deleting exercise log:', error);
    throw error instanceof Error ? error : new Error('Failed to delete exercise log');
  }
};

export const getExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    if (!userId) {
      throw new Error('userId is required to fetch exercise logs');
    }

    // Query from the user's exercises subcollection
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const q = query(
      exercisesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const exercises = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: parseTimestamp(data.timestamp),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: data.activityType,
        supersetId: data.supersetId,
        supersetLabel: data.supersetLabel,
        supersetName: data.supersetName,
        isWarmup: data.isWarmup,
        sharedSessionAssignmentId: data.sharedSessionAssignmentId,
        sharedSessionId: data.sharedSessionId,
        sharedSessionExerciseId: data.sharedSessionExerciseId,
        sharedSessionDateKey: data.sharedSessionDateKey,
        sharedSessionExerciseCompleted: data.sharedSessionExerciseCompleted,
        sessionId: data.sessionId,
        sessionType: data.sessionType,
        sessionDateKey: data.sessionDateKey,
        sessionWeekKey: data.sessionWeekKey,
        sessionNumberInDay: data.sessionNumberInDay,
        sessionNumberInWeek: data.sessionNumberInWeek,
        prescription: data.prescription,
        instructionMode: data.instructionMode,
        instructions: data.instructions,
        prescriptionAssistant: data.prescriptionAssistant
      } as ExerciseLog;
    });

    return exercises;
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Permission denied for exercises collection. Returning empty exercise list.');
      return [];
    }

    console.error('❌ Error fetching exercise logs:', error);
    throw new Error('Failed to fetch exercises');
  }
};

export const getLegacyExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    if (!userId) {
      throw new Error('userId is required to fetch legacy exercise logs');
    }

    const logsRef = collection(db, 'users', userId, 'exerciseLogs');
    const logsQuery = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: parseTimestamp(data.timestamp),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: data.activityType,
        exerciseType: data.exerciseType,
        supersetId: data.supersetId,
        supersetLabel: data.supersetLabel,
        supersetName: data.supersetName,
        sessionId: data.sessionId,
        sessionType: data.sessionType,
        sessionDateKey: data.sessionDateKey,
        sessionWeekKey: data.sessionWeekKey,
        sessionNumberInDay: data.sessionNumberInDay,
        sessionNumberInWeek: data.sessionNumberInWeek,
      } as ExerciseLog;
    });
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Permission denied for legacy exerciseLogs collection. Returning empty list.');
      return [];
    }

    console.error('❌ Error fetching legacy exercise logs:', error);
    throw new Error('Failed to fetch legacy exercise logs');
  }
};

export const getTopLevelLegacyExerciseLogs = async (userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> => {
  try {
    if (!userId) {
      throw new Error('userId is required to fetch top-level legacy exercise logs');
    }

    const logsRef = collection(db, 'exerciseLogs');

    const mapSnapshotDoc = (docSnapshot: any): ExerciseLog => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        exerciseName: data.exerciseName,
        sets: data.sets,
        timestamp: parseTimestamp(data.timestamp),
        deviceId: data.deviceId || 'legacy',
        userId: data.userId,
        activityType: data.activityType,
        exerciseType: data.exerciseType,
        supersetId: data.supersetId,
        supersetLabel: data.supersetLabel,
        supersetName: data.supersetName,
      } as ExerciseLog;
    };

    try {
      const logsQuery = query(
        logsRef,
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(logsQuery);
      return snapshot.docs.map(mapSnapshotDoc);
    } catch (queryError) {
      const firebaseQueryError = queryError as { code?: string; message?: string };
      const missingIndex =
        firebaseQueryError.code === 'failed-precondition' ||
        firebaseQueryError.message?.toLowerCase().includes('requires an index');

      if (!missingIndex) {
        throw queryError;
      }

      console.warn('⚠️ Missing index for top-level legacy exerciseLogs ranged query. Falling back to userId-only query.');

      const fallbackQuery = query(logsRef, where('userId', '==', userId));
      const fallbackSnapshot = await getDocs(fallbackQuery);

      return fallbackSnapshot.docs
        .map(mapSnapshotDoc)
        .filter((log) => log.timestamp >= startDate && log.timestamp <= endDate)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  } catch (error) {
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'permission-denied' || firebaseError.message?.includes('Missing or insufficient permissions')) {
      console.warn('⚠️ Permission denied for top-level legacy exerciseLogs collection. Returning empty list.');
      return [];
    }

    if (firebaseError.code === 'failed-precondition' || firebaseError.message?.toLowerCase().includes('requires an index')) {
      console.warn('⚠️ Missing index for top-level legacy exerciseLogs collection. Returning empty list.');
      return [];
    }

    console.error('❌ Error fetching top-level legacy exercise logs:', error);
    throw new Error('Failed to fetch top-level legacy exercise logs');
  }
};

type RepairEntry = {
  id?: string;
  exerciseName?: string;
  sets?: ExerciseSet[];
  activityType?: string;
};

type SupersetRepairEntry = {
  id?: string;
  supersetId?: string;
  supersetLabel?: string;
  supersetName?: string;
};

export const repairExerciseLogActivityTypes = async (
  userId: string,
  entries: RepairEntry[]
): Promise<number> => {
  if (!userId || !Array.isArray(entries) || entries.length === 0) {
    return 0;
  }

  let updatedCount = 0;

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.id) {
        return;
      }

      const resolvedType = resolveActivityTypeFromExerciseLike(
        {
          activityType: entry.activityType,
          sets: (entry.sets || []) as unknown as Array<Record<string, unknown>>,
          type: entry.activityType,
        },
        {
          fallback: ActivityType.RESISTANCE,
          preferHintOverExplicit: true,
        }
      );

      if (resolvedType === entry.activityType) {
        return;
      }

      try {
        await setDoc(
          doc(db, 'users', userId, 'exercises', entry.id),
          { activityType: resolvedType },
          { merge: true }
        );

        updatedCount += 1;
      } catch (error) {
        console.warn('⚠️ Failed to repair activityType for exercise log:', {
          id: entry.id,
          exerciseName: entry.exerciseName,
          error
        });
      }
    })
  );

  return updatedCount;
};

export const backfillExerciseLogSupersetMetadata = async (
  userId: string,
  entries: SupersetRepairEntry[],
  supersets: SupersetGroup[],
  exerciseOrder: string[] = []
): Promise<number> => {
  if (!userId || !Array.isArray(entries) || entries.length === 0 || !Array.isArray(supersets) || supersets.length === 0) {
    return 0;
  }

  const labelsByExerciseId = buildSupersetLabels(supersets, exerciseOrder);
  let updatedCount = 0;

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.id) {
        return;
      }

      const metadata = labelsByExerciseId[entry.id];
      if (!metadata) {
        return;
      }

      const nextSupersetId = entry.supersetId || metadata.supersetId;
      const nextSupersetLabel = entry.supersetLabel || metadata.label;
      const nextSupersetName = entry.supersetName || metadata.supersetName;

      const needsUpdate =
        nextSupersetId !== entry.supersetId ||
        nextSupersetLabel !== entry.supersetLabel ||
        nextSupersetName !== entry.supersetName;

      if (!needsUpdate) {
        return;
      }

      const patch = removeUndefinedFields({
        supersetId: nextSupersetId,
        supersetLabel: nextSupersetLabel,
        supersetName: nextSupersetName,
      });

      try {
        await setDoc(
          doc(db, 'users', userId, 'exercises', entry.id),
          patch,
          { merge: true }
        );

        updatedCount += 1;
      } catch (error) {
        console.warn('⚠️ Failed to backfill superset metadata for exercise log:', {
          id: entry.id,
          error
        });
      }
    })
  );

  return updatedCount;
};

