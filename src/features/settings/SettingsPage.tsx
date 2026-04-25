import React from 'react';
import Settings from '@/components/Settings';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';

const SettingsPage: React.FC = () => {
  const handleClose = useSafeBackNavigation('/');

  return <Settings isOpen={true} onClose={handleClose} />;
};

export default SettingsPage;
