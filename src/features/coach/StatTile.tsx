import React from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  helper?: string;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, helper }) => {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg px-4 py-4">
      <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
      {helper ? <p className="mt-1 text-xs text-text-tertiary">{helper}</p> : null}
    </div>
  );
};

export default StatTile;