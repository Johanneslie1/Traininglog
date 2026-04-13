/**
 * Custom hook for persisting form state across page refreshes
 * Usage: const [value, setValue, clearValue] = usePersistedState('formId', initialValue);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { StatePersistence } from '@/utils/statePersistence';

export function usePersistedFormState<T>(
  formId: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  // Initialize state with restored value if available
  const [value, setValueInternal] = useState<T>(() => {
    const restored = StatePersistence.restoreFormData(formId);
    if (restored && Object.keys(restored).length > 0) {
      console.log(`[usePersistedFormState] Restored form data for ${formId}`);
      return restored as T;
    }
    return initialValue;
  });

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage with debouncing (500ms delay)
  useEffect(() => {
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer to save after 500ms of inactivity
    saveTimerRef.current = setTimeout(() => {
      if (value !== initialValue || Object.keys(value as any).length > 0) {
        StatePersistence.saveFormData(formId, value as Record<string, any>);
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [value, formId, initialValue]);

  // Wrapper for setValue that also saves to localStorage
  const setValue = useCallback((newValue: T) => {
    setValueInternal(newValue);
  }, []);

  // Clear function to reset form data
  const clearValue = useCallback(() => {
    StatePersistence.clearFormData(formId);
    setValueInternal(initialValue);
  }, [formId, initialValue]);

  return [value, setValue, clearValue];
}

/**
 * Hook for individual form fields with automatic persistence
 */
export function usePersistedField<T>(
  formId: string,
  fieldName: string,
  initialValue: T
): [T, (value: T) => void] {
  const [formData, setFormData] = usePersistedFormState(
    formId,
    { [fieldName]: initialValue }
  );

  const value = (formData[fieldName] as T) ?? initialValue;

  const setValue = useCallback(
    (newValue: T) => {
      setFormData({ ...formData, [fieldName]: newValue });
    },
    [formData, fieldName, setFormData]
  );

  return [value, setValue];
}
