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
    flat: 'bg-bg-secondary border border-border rounded-lg',
    raised: 'bg-bg-secondary rounded-xl shadow-md',
    elevated: 'bg-bg-tertiary rounded-xl shadow-xl',
  };
  
  const interactiveStyles = interactive || onClick
    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
    : '';
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      onClick={onClick}
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
  <div className={`p-4 border-b border-border ${className}`}>
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
  <div className={`p-4 border-t border-border ${className}`}>
    {children}
  </div>
);

export default Card;
