import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { getCurrentUser, User } from '@/services/firebase/auth';
import { logger } from '@/utils/logger';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  
  // Prevent double initialization in React StrictMode
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    logger.debug('[Auth] Initializing auth state...');
    
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          logger.debug('[Auth] User authenticated:', user.id);
        } else {
          logger.debug('[Auth] No authenticated user');
        }
        dispatch(setUser(user));
      } catch (error) {
        logger.error('[Auth] Error during auth initialization:', error);
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    initAuth();
    
    return () => {
      logger.debug('[Auth] Cleaning up auth listener');
    };
  }, [dispatch]);

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated,
  };
};

export default useAuth;
