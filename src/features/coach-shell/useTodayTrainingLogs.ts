import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { DayTrainingLog, logMatchesDate, toDayTrainingLog } from '@/features/coach-shell/monitorLines';
import type { SportsLoadSession } from '@/types/srpe';

const LOG_COLLECTIONS = ['exercises', 'activities'] as const;

type ListenerSlot = 'pending' | 'ok' | 'error';

interface AthleteListeners {
  exercises: ListenerSlot;
  activities: ListenerSlot;
  sports: ListenerSlot;
}

function toSportsLoadSession(id: string, data: Record<string, unknown>): SportsLoadSession | null {
  if (typeof data.date !== 'string' || !data.date) return null;
  const rpe = typeof data.rpe === 'number' && Number.isFinite(data.rpe) ? data.rpe : 0;
  const durationMinutes = typeof data.durationMinutes === 'number' && Number.isFinite(data.durationMinutes)
    ? data.durationMinutes
    : 0;
  const sportName = typeof data.sportName === 'string' && data.sportName.trim() ? data.sportName.trim() : 'Football';
  const sessionName = typeof data.sessionName === 'string' && data.sessionName.trim()
    ? data.sessionName.trim()
    : sportName;
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    date: data.date,
    dateEpochDay: typeof data.dateEpochDay === 'number' ? data.dateEpochDay : 0,
    timestamp: (data.timestamp ?? new Date()) as SportsLoadSession['timestamp'],
    rpe,
    durationMinutes,
    sessionLoad: typeof data.sessionLoad === 'number' && Number.isFinite(data.sessionLoad)
      ? data.sessionLoad
      : rpe * durationMinutes,
    sportType: typeof data.sportType === 'string' && data.sportType.trim() ? data.sportType : 'football',
    sportName,
    sessionName,
  };
}

export function useTodayTrainingLogs(athleteIds: string[], dateKey: string): {
  logsByAthlete: Record<string, DayTrainingLog[]>;
  sportsLoadByAthlete: Record<string, SportsLoadSession[]>;
  failedAthleteIds: string[];
  live: boolean;
  settled: boolean;
} {
  const athleteKey = [...athleteIds].sort().join('|');
  const [logsByAthlete, setLogsByAthlete] = useState<Record<string, DayTrainingLog[]>>({});
  const [sportsLoadByAthlete, setSportsLoadByAthlete] = useState<Record<string, SportsLoadSession[]>>({});
  const [failedAthleteIds, setFailedAthleteIds] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [settled, setSettled] = useState(athleteIds.length === 0);

  useEffect(() => {
    const ids = athleteKey ? athleteKey.split('|') : [];
    setLogsByAthlete({});
    setSportsLoadByAthlete({});
    setFailedAthleteIds([]);
    setLive(false);
    setSettled(ids.length === 0);
    if (ids.length === 0) return;

    const buckets = new Map<string, Map<string, DayTrainingLog[]>>();
    const listeners = new Map<string, AthleteListeners>();
    ids.forEach((athleteId) => {
      buckets.set(athleteId, new Map());
      listeners.set(athleteId, { exercises: 'pending', activities: 'pending', sports: 'pending' });
    });

    const syncListeners = () => {
      const rows = [...listeners.values()];
      const failed = ids.filter((athleteId) => {
        const row = listeners.get(athleteId);
        return row?.exercises === 'error' || row?.activities === 'error' || row?.sports === 'error';
      });
      setFailedAthleteIds(failed);
      setLive(rows.some((row) => row.exercises === 'ok' || row.activities === 'ok' || row.sports === 'ok'));
      setSettled(rows.every((row) => (
        row.exercises !== 'pending' && row.activities !== 'pending' && row.sports !== 'pending'
      )));
    };

    const publish = (athleteId: string) => {
      const merged = [...(buckets.get(athleteId)?.values() ?? [])].flat();
      setLogsByAthlete((current) => ({ ...current, [athleteId]: merged }));
    };

    const unsubs = ids.flatMap((athleteId) => {
      const logUnsubs = LOG_COLLECTIONS.map((collectionName) => onSnapshot(
        collection(db, 'users', athleteId, collectionName),
        (snapshot) => {
          const logs = snapshot.docs.flatMap((logDoc) => {
            const data = logDoc.data() as Record<string, unknown>;
            if (!logMatchesDate(data, dateKey)) return [];
            const log = toDayTrainingLog(`${collectionName}-${logDoc.id}`, data);
            return log ? [log] : [];
          });
          buckets.get(athleteId)?.set(collectionName, logs);
          const row = listeners.get(athleteId);
          if (row) row[collectionName] = 'ok';
          publish(athleteId);
          syncListeners();
        },
        () => {
          const row = listeners.get(athleteId);
          if (row) row[collectionName] = 'error';
          syncListeners();
        }
      ));

      const sportsUnsub = onSnapshot(
        query(collection(db, 'users', athleteId, 'sportsLoadSessions'), where('date', '==', dateKey)),
        (snapshot) => {
          const sessions = snapshot.docs.flatMap((sessionDoc) => {
            const session = toSportsLoadSession(sessionDoc.id, sessionDoc.data() as Record<string, unknown>);
            return session ? [session] : [];
          });
          setSportsLoadByAthlete((current) => ({ ...current, [athleteId]: sessions }));
          const row = listeners.get(athleteId);
          if (row) row.sports = 'ok';
          syncListeners();
        },
        () => {
          setSportsLoadByAthlete((current) => ({ ...current, [athleteId]: [] }));
          const row = listeners.get(athleteId);
          if (row) row.sports = 'error';
          syncListeners();
        }
      );

      return [...logUnsubs, sportsUnsub];
    });

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [athleteKey, dateKey]);

  return { logsByAthlete, sportsLoadByAthlete, failedAthleteIds, live, settled };
}
