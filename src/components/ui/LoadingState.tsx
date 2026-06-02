import React from 'react';
import Skeleton, { ExerciseListSkeleton } from './Skeleton';

interface LoadingStateProps {
  label?: string;
  variant?: 'spinner' | 'skeleton' | 'page' | 'list';
  count?: number;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading...',
  variant = 'spinner',
  count = 3,
  className = '',
}) => {
  if (variant === 'list') {
    return (
      <div className={className} aria-label={label} role="status">
        <ExerciseListSkeleton count={count} />
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`} aria-label={label} role="status">
        <Skeleton variant="rectangular" height="44px" />
        <Skeleton variant="card" count={count} />
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={`min-h-screen bg-bg-primary p-4 text-text-primary ${className}`} aria-label={label} role="status">
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton variant="rectangular" height="92px" className="rounded-2xl" />
          <Skeleton variant="card" count={count} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-3 p-6 text-text-secondary ${className}`} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

export default LoadingState;
