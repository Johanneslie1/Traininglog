import React, { useState, useRef, useEffect, useCallback } from 'react';

interface InlineEditableValueProps {
  value: number | string | undefined;
  onSave: (value: number | string) => void;
  type?: 'number' | 'text';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  formatDisplay?: (value: number | string | undefined) => string;
}

/**
 * An inline editable value component that allows tapping to edit values directly.
 * Shows the current value as text, and on tap switches to an input field.
 */
export const InlineEditableValue: React.FC<InlineEditableValueProps> = ({
  value,
  onSave,
  type = 'number',
  min,
  max,
  step = 1,
  unit = '',
  placeholder = '-',
  className = '',
  displayClassName = '',
  inputClassName = '',
  formatDisplay,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the display value
  const getDisplayValue = useCallback(() => {
    if (formatDisplay) {
      return formatDisplay(value);
    }
    if (value === undefined || value === null || value === '') {
      return placeholder;
    }
    if (type === 'number' && typeof value === 'number') {
      return `${value}${unit}`;
    }
    return `${value}${unit}`;
  }, [value, formatDisplay, placeholder, type, unit]);

  // Start editing
  const startEditing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setEditValue(value !== undefined && value !== null ? String(value) : '');
    setIsEditing(true);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle save
  const handleSave = useCallback(() => {
    setIsEditing(false);
    
    if (type === 'number') {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue)) {
        let clampedValue = numValue;
        if (min !== undefined) clampedValue = Math.max(min, clampedValue);
        if (max !== undefined) clampedValue = Math.min(max, clampedValue);
        onSave(clampedValue);
      } else if (editValue === '') {
        onSave(0);
      }
    } else {
      onSave(editValue);
    }
  }, [editValue, type, min, max, onSave]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [handleSave]);

  // Handle blur
  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Handle change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        className={`
          w-full px-2 py-1 bg-bg-tertiary hover:opacity-90 border border-purple-500 rounded 
          text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-purple-500
          ${inputClassName}
        `}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onClick={startEditing}
      className={`
        cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors
        ${displayClassName} ${className}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          startEditing(e as unknown as React.MouseEvent);
        }
      }}
      title="Tap to edit"
    >
      {getDisplayValue()}
    </span>
  );
};

export default InlineEditableValue;
