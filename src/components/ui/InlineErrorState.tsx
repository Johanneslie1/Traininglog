import React from 'react';

interface InlineErrorStateProps {
  title?: string;
  message: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const InlineErrorState: React.FC<InlineErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  className = '',
  action,
}) => (
  <div className={`rounded-xl border border-error-border bg-error-bg p-4 text-error-text ${className}`} role="alert">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-error-border text-sm font-bold">
        !
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-5 opacity-90">{message}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  </div>
);

export default InlineErrorState;
