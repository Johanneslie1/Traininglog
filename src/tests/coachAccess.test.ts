import { isCoachEmail, resolveAppRole } from '@/config/coachAccess';

describe('coach access', () => {
  it('keeps the owner email as the only coach', () => {
    expect(resolveAppRole('johanneslie003@gmail.com')).toBe('coach');
    expect(resolveAppRole('JohannesLie003@gmail.com')).toBe('coach');
    expect(isCoachEmail(' athlete@example.com ')).toBe(false);
    expect(resolveAppRole('athlete@example.com')).toBe('athlete');
    expect(resolveAppRole(null)).toBe('athlete');
  });
});
