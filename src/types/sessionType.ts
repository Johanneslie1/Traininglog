export type SessionType = 'main' | 'warmup' | 'srpe';

export const DEFAULT_SESSION_TYPE: SessionType = 'main';

export const normalizeSessionType = (value: unknown): SessionType => {
  if (value === 'warmup') return 'warmup';
  if (value === 'srpe') return 'srpe';
  return 'main';
};

export const getSessionTypeLabel = (sessionType: SessionType): string => {
  if (sessionType === 'warmup') return 'Warm-up';
  if (sessionType === 'srpe') return 'sRPE';
  return 'Session';
};