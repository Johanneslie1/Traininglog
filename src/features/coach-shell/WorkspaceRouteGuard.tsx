import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isPathAllowed } from '@/config/workspaces';
import { useWorkspace } from '@/features/coach-shell/useWorkspace';

/** Sends a workspace back to Today when the address is outside its allowlist. */
const WorkspaceRouteGuard: React.FC = () => {
  const workspace = useWorkspace();
  const location = useLocation();

  if (!isPathAllowed(workspace, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return null;
};

export default WorkspaceRouteGuard;
