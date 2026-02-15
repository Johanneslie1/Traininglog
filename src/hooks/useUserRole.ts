import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export type UserRole = 'athlete' | 'coach' | null;

/**
 * Custom hook to access the current user's role
 * @returns The user's role ('athlete' | 'coach' | null)
 */
export const useUserRole = (): UserRole => {
  const user = useSelector((state: RootState) => state.auth.user);
  return user?.role || null;
};

/**
 * Check if the current user is a coach
 * @returns true if user is a coach, false otherwise
 */
export const useIsCoach = (): boolean => {
  const role = useUserRole();
  return role === 'coach';
};

/**
 * Check if the current user is an athlete
 * @returns true if user is an athlete, false otherwise
 */
export const useIsAthlete = (): boolean => {
  const role = useUserRole();
  return role === 'athlete';
};
