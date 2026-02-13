import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label = 'Add',
  position = 'bottom-right',
  className = '',
}) => {
  const positionStyles = {
    'bottom-right': 'bottom-20 right-6',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-20 left-6',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionStyles[position]} z-50
        w-14 h-14 md:w-16 md:h-16
        bg-accent-primary hover:bg-accent-secondary
        text-white
        rounded-full
        shadow-2xl shadow-accent-primary/50
        hover:shadow-glow-lg
        flex items-center justify-center
        transition-all duration-300
        active:scale-95
        group
        ${className}
      `}
      aria-label={label}
    >
      {icon || (
        <svg 
          className="w-7 h-7 md:w-8 md:h-8 transition-transform group-hover:rotate-90" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      )}
      
      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 group-active:animate-ping"></span>
    </button>
  );
};

export default FloatingActionButton;
