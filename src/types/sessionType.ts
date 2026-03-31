export type SessionType = 'main' | 'warmup';

export const DEFAULT_SESSION_TYPE: SessionType = 'main';

export const normalizeSessionType = (value: unknown): SessionType => {
  return value === 'warmup' ? 'warmup' : 'main';
};

export const getSessionTypeLabel = (sessionType: SessionType): string => {
  return sessionType === 'warmup' ? 'Warm-up' : 'Session';
};