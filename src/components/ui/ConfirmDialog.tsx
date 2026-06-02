import React from 'react';
import AppOverlay from './AppOverlay';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}) => (
  <AppOverlay
    isOpen={isOpen}
    onClose={onCancel}
    className="z-[80] flex items-center justify-center p-4"
    ariaLabel={title}
    closeOnBackdrop={!isConfirming}
    closeOnEscape={!isConfirming}
  >
    <div className="w-full max-w-md rounded-3xl border border-border-focus bg-bg-secondary p-6 shadow-2xl shadow-accent-primary/20">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-error-text">Please confirm</p>
        <h2 className="mt-2 text-2xl font-bold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </AppOverlay>
);

export default ConfirmDialog;
