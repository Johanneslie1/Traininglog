import React from 'react';

interface StickyBottomActionsProps {
  children: React.ReactNode;
  className?: string;
}

const StickyBottomActions: React.FC<StickyBottomActionsProps> = ({ children, className = '' }) => (
  <div className={`sticky bottom-0 z-20 -mx-4 border-t border-border bg-bg-primary/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-2xl backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row">{children}</div>
  </div>
);

export default StickyBottomActions;
