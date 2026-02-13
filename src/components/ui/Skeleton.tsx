import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-bg-tertiary via-bg-secondary to-bg-tertiary bg-[length:200%_100%] animate-shimmer';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-24 rounded-xl',
  };
  
  const style = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : undefined),
  };
  
  const skeletonElement = (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
  
  if (count === 1) {
    return skeletonElement;
  }
  
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{skeletonElement}</React.Fragment>
      ))}
    </div>
  );
};

// Shimmer animation for skeleton
const shimmerStyle = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

// Preset skeleton layouts
export const ExerciseCardSkeleton: React.FC = () => (
  <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton width="60%" height="24px" />
      <Skeleton variant="circular" width="32px" height="32px" />
    </div>
    <div className="space-y-2">
      <Skeleton width="80%" />
      <Skeleton width="60%" />
      <Skeleton width="40%" />
    </div>
  </div>
);

export const ExerciseListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <ExerciseCardSkeleton key={index} />
    ))}
  </div>
);

// Add shimmer styles to global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerStyle;
  document.head.appendChild(style);
}

export default Skeleton;
