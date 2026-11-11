import React, { useEffect, useId, useRef, useState } from 'react';

interface InfoTipProps {
  label: string;
  children: React.ReactNode;
}

const InfoTip: React.FC<InfoTipProps> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-semibold leading-none text-text-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      {open ? (
        <span
          id={tipId}
          role="note"
          className="absolute left-0 top-6 z-30 w-56 rounded-xl border border-border bg-bg-secondary p-3 text-left text-xs font-normal leading-5 text-text-secondary"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
};

export default InfoTip;
