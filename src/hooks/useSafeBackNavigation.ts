import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const hasUsableHistory = (): boolean => {
  const state = window.history.state as { idx?: number } | null;

  if (typeof state?.idx === 'number') {
    return state.idx > 0;
  }

  return window.history.length > 1;
};

export const useSafeBackNavigation = (fallbackPath = '/') => {
  const navigate = useNavigate();

  return useCallback(() => {
    if (hasUsableHistory()) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace: true });
  }, [fallbackPath, navigate]);
};
