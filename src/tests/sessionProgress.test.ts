import { sessionProgressLabel, sessionProgressStatus } from '@/features/coach-shell/sessionProgress';
import type { DayTrainingLog } from '@/features/coach-shell/monitorLines';

describe('sessionProgressStatus', () => {
  it('returns not-started with no logs', () => {
    expect(sessionProgressStatus([])).toBe('not-started');
    expect(sessionProgressLabel('not-started')).toBe('Not started');
  });

  it('returns started when logs exist without saved numbers', () => {
    const logs: DayTrainingLog[] = [{
      id: 'log-1',
      name: 'Bench',
      sets: [{}],
    }];
    expect(sessionProgressStatus(logs)).toBe('started');
    expect(sessionProgressLabel('started')).toBe('Started');
  });

  it('returns logging when a set has a saved number', () => {
    const logs: DayTrainingLog[] = [{
      id: 'log-1',
      name: 'Bench',
      sets: [{ reps: 5 }],
    }];
    expect(sessionProgressStatus(logs)).toBe('logging');
    expect(sessionProgressLabel('logging')).toBe('Logging');
  });
});
