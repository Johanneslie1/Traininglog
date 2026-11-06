import { useSyncExternalStore } from 'react';
import { readCoachShellEnabled, subscribeCoachShell } from '@/features/coach-shell/coachShellPreference';

export function useCoachShellEnabled(): boolean {
  return useSyncExternalStore(subscribeCoachShell, readCoachShellEnabled, () => false);
}
