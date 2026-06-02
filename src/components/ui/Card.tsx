import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'raised' | 'elevated';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'raised',
  className = '',
  onClick,
  interactive = false,
}) => {
  const baseStyles = 'transition-all duration-200';
  
  const variantStyles = {
    flat: 'bg-bg-secondary border border-border rounded-xl',
    raised: 'bg-bg-secondary rounded-2xl border border-border shadow-md',
    elevated: 'bg-bg-tertiary rounded-2xl border border-border-focus shadow-xl shadow-accent-primary/10',
  };
  
  const interactiveStyles = interactive || onClick
    ? 'cursor-pointer hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-glow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent-primary'
    : '';
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Sub-components for structured cards
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`border-b border-border bg-bg-tertiary/40 p-4 ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`border-t border-border bg-bg-tertiary/30 p-4 ${className}`}>
    {children}
  </div>
);

export default Card;
