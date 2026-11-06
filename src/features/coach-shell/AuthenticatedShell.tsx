import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CoachShell from '@/features/coach-shell/CoachShell';
import { COACH_SHELL_PATH } from '@/features/coach-shell/coachShellPreference';
import { useCoachShellEnabled } from '@/features/coach-shell/useCoachShellEnabled';
import { useIsCoach } from '@/hooks/useUserRole';

interface AuthenticatedShellProps {
  phoneShell: React.ReactNode;
}

const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({ phoneShell }) => {
  const isCoach = useIsCoach();
  const coachShellEnabled = useCoachShellEnabled();
  const showCoachShell = isCoach && coachShellEnabled;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showCoachShell && location.pathname === COACH_SHELL_PATH) {
      navigate('/', { replace: true });
    }
  }, [showCoachShell, location.pathname, navigate]);

  if (showCoachShell) {
    return <CoachShell />;
  }

  return <>{phoneShell}</>;
};

export default AuthenticatedShell;
