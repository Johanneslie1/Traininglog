import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from './config';
import {
  isStartOfLocalDay,
  localDayBounds,
  nextOrderIndex,
  orderedTimestampForIndex,
  parseStoredDate,
} from '@/utils/exerciseOrderTimestamps';

export type LogTimestampCollection = 'exercises' | 'activities';

const readCollectionTimestamps = async (
  userId: string,
  collectionName: LogTimestampCollection,
  start: Date,
  end: Date
): Promise<Date[]> => {
  try {
    const logsRef = collection(db, 'users', userId, collectionName);
    const logsQuery = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end)),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(logsQuery);
    if (!snapshot?.docs) {
      return [];
    }

    return snapshot.docs.flatMap((logDoc) => {
      const timestamp = parseStoredDate(logDoc.data()?.timestamp);
      return timestamp ? [timestamp] : [];
    });
  } catch (error) {
    console.warn(`⚠️ Could not read ${collectionName} timestamps for ordering:`, error);
    return [];
  }
};

export const listLogTimestampsForDate = async (userId: string, day: Date): Promise<Date[]> => {
  const { start, end } = localDayBounds(day);
  const [exerciseTimestamps, activityTimestamps] = await Promise.all([
    readCollectionTimestamps(userId, 'exercises', start, end),
    readCollectionTimestamps(userId, 'activities', start, end),
  ]);
  return [...exerciseTimestamps, ...activityTimestamps];
};

const readExistingLogTimes = async (
  userId: string,
  collectionName: LogTimestampCollection,
  existingId: string
): Promise<{ timestamp?: Date; createdAt?: Date } | null> => {
  try {
    const logRef = doc(db, 'users', userId, collectionName, existingId);
    const snapshot = await getDoc(logRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    return {
      timestamp: parseStoredDate(data?.timestamp),
      createdAt: parseStoredDate(data?.createdAt),
    };
  } catch (error) {
    console.warn('⚠️ Could not read existing log timestamp:', error);
    return null;
  }
};

/**
 * Midnight creates append after logs already stored that day.
 * Midnight updates keep the stored timestamp.
 * An explicit non-midnight time (reorder or program import) is kept.
 */
export const resolveLogTimestamp = async (
  userId: string,
  selectedDate: Date | undefined,
  existingId: string | undefined,
  collectionName: LogTimestampCollection
): Promise<{ timestamp: Date; createdAt?: Date }> => {
  const effectiveDate = selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  const existing = existingId ? await readExistingLogTimes(userId, collectionName, existingId) : null;

  if (existingId && isStartOfLocalDay(effectiveDate) && existing?.timestamp) {
    return { timestamp: existing.timestamp, createdAt: existing.createdAt };
  }

  if (!isStartOfLocalDay(effectiveDate)) {
    return { timestamp: effectiveDate, createdAt: existing?.createdAt };
  }

  const existingTimestamps = await listLogTimestampsForDate(userId, effectiveDate);
  const index = nextOrderIndex(effectiveDate, existingTimestamps);
  return {
    timestamp: orderedTimestampForIndex(effectiveDate, index),
    createdAt: existing?.createdAt,
  };
};
