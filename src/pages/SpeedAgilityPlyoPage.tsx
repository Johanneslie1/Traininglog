import React from 'react';
import SpeedAgilityPlyoBrowser from '@/components/exercises/SpeedAgilityPlyoBrowser';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';

// Page wrapper so we can route to /speed-agility
const SpeedAgilityPlyoPage: React.FC = () => {
  const handleBack = useSafeBackNavigation('/');

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <button
        onClick={handleBack}
        className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
        aria-label="Back"
      >
        Back
      </button>
      <SpeedAgilityPlyoBrowser />
    </div>
  );
};

export default SpeedAgilityPlyoPage;
