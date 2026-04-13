import React from 'react';
import { useNavigate } from 'react-router-dom';
import Settings from '@/components/Settings';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return <Settings isOpen={true} onClose={() => navigate(-1)} />;
};

export default SettingsPage;
