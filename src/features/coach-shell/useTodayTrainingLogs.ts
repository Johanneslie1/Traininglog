import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { DayTrainingLog, logMatchesDate, toDayTrainingLog } from '@/features/coach-shell/monitorLines';
import { getSportsLoadSessionsByDate } from '@/services/srpeService';
import type { SportsLoadSession } from '@/types/srpe';

const LOG_COLLECTIONS = ['exercises', 'activities'] as const;

export function useTodayTrainingLogs(athleteIds: string[], dateKey: string): {
  logsByAthlete: Record<string, DayTrainingLog[]>;
  sportsLoadByAthlete: Record<string, SportsLoadSession[]>;
  failedAthleteIds: string[];
  live: boolean;
} {
  const athleteKey = [...athleteIds].sort().join('|');
  const [logsByAthlete, setLogsByAthlete] = useState<Record<string, DayTrainingLog[]>>({});
  const [sportsLoadByAthlete, setSportsLoadByAthlete] = useState<Record<string, SportsLoadSession[]>>({});
  const [failedAthleteIds, setFailedAthleteIds] = useState<string[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const ids = athleteKey ? athleteKey.split('|') : [];
    setLogsByAthlete({});
    setSportsLoadByAthlete({});
    setFailedAthleteIds([]);
    setLive(false);
    if (ids.length === 0) return;

    const buckets = new Map<string, Map<string, DayTrainingLog[]>>();
    const unsubs: Array<() => void> = [];
    ids.forEach((athleteId) => buckets.set(athleteId, new Map()));

    const publish = (athleteId: string) => {
      const merged = [...(buckets.get(athleteId)?.values() ?? [])].flat();
      setLogsByAthlete((current) => ({ ...current, [athleteId]: merged }));
      setLive(true);
    };

    ids.forEach((athleteId) => {
      LOG_COLLECTIONS.forEach((collectionName) => {
        const unsubscribe = onSnapshot(
          collection(db, 'users', athleteId, collectionName),
          (snapshot) => {
            const logs = snapshot.docs.flatMap((logDoc) => {
              const data = logDoc.data() as Record<string, unknown>;
              if (!logMatchesDate(data, dateKey)) return [];
              const log = toDayTrainingLog(`${collectionName}-${logDoc.id}`, data);
              return log ? [log] : [];
            });
            buckets.get(athleteId)?.set(collectionName, logs);
            setFailedAthleteIds((current) => current.filter((id) => id !== athleteId));
            publish(athleteId);
          },
          () => {
            setFailedAthleteIds((current) => (current.includes(athleteId) ? current : [...current, athleteId]));
          }
        );
        unsubs.push(unsubscribe);
      });
    });

    let cancelled = false;
    void Promise.all(
      ids.map(async (athleteId) => {
        try {
          const sessions = await getSportsLoadSessionsByDate(athleteId, dateKey);
          if (cancelled) return;
          setSportsLoadByAthlete((current) => ({ ...current, [athleteId]: sessions }));
        } catch {
          if (cancelled) return;
          setSportsLoadByAthlete((current) => ({ ...current, [athleteId]: [] }));
        }
      })
    );

    return () => {
      cancelled = true;
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [athleteKey, dateKey]);

  return { logsByAthlete, sportsLoadByAthlete, failedAthleteIds, live };
}
