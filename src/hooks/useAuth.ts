import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setUser, setLoading } from '@/features/auth/authSlice';
import { getCurrentUser, User } from '@/services/firebase/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isLoading, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        dispatch(setUser(user));
      } catch (error) {
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    initAuth();
  }, [dispatch]);

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated,
  };
};

export default useAuth;
