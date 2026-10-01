import { useCallback, useEffect, useRef, useState } from 'react';
import { getRehabProgress, saveRehabProgress } from '@/services/rehabProgressService';
import { RehabPainLogInput, RehabProgress, SymmetryTestInput } from '@/types/rehabProgress';
import {
  withNextMorningPain,
  withPainLog,
  withSymmetryTest,
} from '@/utils/shoulderRehab';

export const useRehabProgress = (programId: string | null, enabled: boolean) => {
  const [progress, setProgress] = useState<RehabProgress | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<RehabProgress | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!enabled || !programId) {
      setProgress(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRehabProgress(programId)
      .then((next) => {
        if (!cancelled) {
          progressRef.current = next;
          setProgress(next);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load rehab progress');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, programId]);

  const persist = useCallback((updater: (current: RehabProgress) => RehabProgress) => {
    const run = queueRef.current.then(async () => {
      const current = progressRef.current;
      if (!current) return;
      const next = updater(current);
      progressRef.current = next;
      setProgress(next);
      try {
        await saveRehabProgress(next);
      } catch (err) {
        progressRef.current = current;
        setProgress(current);
        throw err;
      }
    });
    queueRef.current = run.then(() => undefined, () => undefined);
    return run;
  }, []);

  const addPainLog = useCallback(async (input: RehabPainLogInput) => {
    await persist((current) => withPainLog(current, input));
  }, [persist]);

  const setNextMorningPain = useCallback(async (logId: string, painNextMorning: number) => {
    await persist((current) => withNextMorningPain(current, logId, painNextMorning));
  }, [persist]);

  const addSymmetryTest = useCallback(async (input: SymmetryTestInput) => {
    await persist((current) => withSymmetryTest(current, input));
  }, [persist]);

  return {
    progress,
    loading,
    error,
    addPainLog,
    setNextMorningPain,
    addSymmetryTest,
  };
};
