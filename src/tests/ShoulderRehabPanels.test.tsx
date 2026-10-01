import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Program, ProgramSession } from '@/types/program';
import { RehabRulesNotice, RehabSessionExtras, SymmetryPanel } from '@/features/programs/rehab/ShoulderRehabPanels';

describe('Shoulder rehab panels', () => {
  it('shows rules and stop signs', () => {
    render(
      <RehabRulesNotice
        rules={['Pain up to 3/10 during exercise is OK; it should be back to normal by the next morning.']}
        stopSigns="Stop and contact a doctor if the shoulder slips or clicks, sudden sharp pain, or numbness/weakness."
      />
    );

    expect(screen.getByText(/Pain up to 3\/10/)).toBeTruthy();
    expect(screen.getByText(/Stop and contact a doctor/)).toBeTruthy();
  });

  it('shows the seeded symmetry result and the 90% target', () => {
    render(
      <SymmetryPanel
        tests={[{
          id: 'seed-side-lying-er',
          date: '2026-10-01',
          weightKg: 3,
          healthyReps: 16,
          injuredReps: 10,
          symmetryPercent: 63,
        }]}
        onAdd={jest.fn(async () => undefined)}
      />
    );

    expect(screen.getByText(/3 kg, healthy 16, injured 10 \(63%\)/)).toBeTruthy();
    expect(screen.getByRole('img', { name: /Target line at 90 percent/ })).toBeTruthy();
  });

  it('shows the pain log only on daily shoulder activation', () => {
    const program = {
      rules: ['Pain up to 3/10 during exercise is OK.'],
      stopSigns: 'Stop and contact a doctor.',
    } as Program;
    const daily = {
      id: 'daily',
      name: 'Daily shoulder activation',
      sessionKind: 'daily-activation',
    } as ProgramSession;
    const week = {
      id: 'week-1',
      name: 'Week 1 · Calm and activate',
      sessionKind: 'strength',
      week: 1,
    } as ProgramSession;
    const props = {
      program,
      painLogs: [],
      logging: false,
      onSavePain: jest.fn(async () => undefined),
      onSaveMorning: jest.fn(async () => undefined),
      onLogSession: jest.fn(),
      onOpenLog: jest.fn(),
    };

    const { rerender } = render(<RehabSessionExtras {...props} session={daily} />);
    expect(screen.getByText('Pain before the session')).toBeTruthy();

    rerender(<RehabSessionExtras {...props} session={week} />);
    expect(screen.queryByText('Pain before the session')).toBeNull();
  });
});
