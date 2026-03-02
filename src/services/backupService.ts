import { db } from './firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ExerciseLog } from '@/types/exercise';
import { Program } from '@/types/program';
import { AppSettings } from '@/context/SettingsContext';
import { getAggregatedExportLogs } from '@/services/logAggregationService';

export interface BackupData {
  metadata: {
    version: string;
    schemaVersion: string;
    exportDate: string;
    userId: string;
    appVersion: string;
  };
  exercises: ExerciseLog[];
  programs: Program[];
  settings: AppSettings;
}

// Current schema version for migration compatibility
const SCHEMA_VERSION = '1.0.0';
const APP_VERSION = '1.0.0';

/**
 * Ensure user is authenticated and return user ID
 */
async function ensureAuth(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('User must be logged in to export backup');
  }
  return user.uid;
}

/**
 * Export complete user data for backup
 */
export async function exportFullBackup(userId?: string): Promise<BackupData> {
  const uid = userId || await ensureAuth();

  try {
    const allTimeStart = new Date('1970-01-01T00:00:00.000Z');
    const now = new Date();
    const aggregatedLogs = await getAggregatedExportLogs(uid, allTimeStart, now);

    const exercises: ExerciseLog[] = aggregatedLogs.map((log) => ({
      id: log.id,
      exerciseName: log.exerciseName || '',
      sets: log.sets || [],
      timestamp: log.timestamp,
      deviceId: '',
      userId: log.userId || uid,
      exerciseType: log.collectionType,
      activityType: log.activityType || ''
    }));

    // Export programs
    const programsRef = collection(db, 'programs');
    const programsQuery = query(programsRef, where('userId', '==', uid));
    const programsSnapshot = await getDocs(programsQuery);

    const programs: Program[] = [];
    for (const doc of programsSnapshot.docs) {
      const programData = doc.data();
      const program: Program = {
        id: doc.id,
        name: programData.name || '',
        description: programData.description || '',
        createdBy: programData.createdBy || uid,
        userId: programData.userId || uid,
        createdAt: programData.createdAt || new Date().toISOString(),
        updatedAt: programData.updatedAt || new Date().toISOString(),
        sessions: [],
        isPublic: programData.isPublic || false,
        tags: programData.tags || []
      };

      // Fetch program sessions (subcollection)
      const sessionsRef = collection(db, 'programs', doc.id, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);

      program.sessions = sessionsSnapshot.docs.map(sessionDoc => {
        const sessionData = sessionDoc.data();
        return {
          id: sessionDoc.id,
          name: sessionData.name || '',
          exercises: sessionData.exercises || [],
          notes: sessionData.notes || '',
          order: sessionData.order || 0,
          userId: sessionData.userId || uid
        };
      });

      programs.push(program);
    }

    // Export settings from localStorage
    const settings: AppSettings = {
      defaultWeightIncrements: 2.5,
      defaultUnits: 'kg',
      useProgressiveOverload: false
    };

    // Try to get settings from localStorage
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        settings.defaultWeightIncrements = parsedSettings.defaultWeightIncrements ?? 2.5;
        settings.defaultUnits = parsedSettings.defaultUnits ?? 'kg';
      }
    } catch (error) {
      console.warn('Could not load settings from localStorage:', error);
    }

    const backupData: BackupData = {
      metadata: {
        version: APP_VERSION,
        schemaVersion: SCHEMA_VERSION,
        exportDate: new Date().toISOString(),
        userId: uid,
        appVersion: APP_VERSION
      },
      exercises,
      programs,
      settings
    };

    return backupData;
  } catch (error) {
    console.error('Backup export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to export backup: ${errorMessage}`);
  }
}

/**
 * Download backup data as JSON file
 */
export function downloadBackupJson(data: BackupData): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const shouldCompress = jsonString.length > 1024 * 1024; // 1MB

    let content: string;
    let filename: string;
    let mimeType: string;

    if (shouldCompress) {
      // Note: For production, you might want to use a compression library like pako
      // For now, we'll just add a note about compression
      console.warn('Backup data exceeds 1MB. Consider implementing compression.');
      content = jsonString;
      filename = `traininglog-backup-${data.metadata.exportDate.split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      content = jsonString;
      filename = `traininglog-backup-${data.metadata.exportDate.split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download backup file');
  }
}