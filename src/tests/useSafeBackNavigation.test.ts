import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSafeBackNavigation } from '@/hooks/useSafeBackNavigation';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, null, children);

describe('useSafeBackNavigation', () => {
  const originalHistory = window.history;

  beforeEach(() => {
    mockNavigate.mockReset();
  });

  afterEach(() => {
    // Restore original window.history after each test to avoid cross-test pollution
    Object.defineProperty(window, 'history', {
      value: originalHistory,
      configurable: true,
      writable: true,
    });
  });

  const setHistoryState = (state: object | null, length: number) => {
    Object.defineProperty(window, 'history', {
      value: { state, length },
      configurable: true,
      writable: true,
    });
  };

  it('calls navigate(-1) when history.state.idx > 0 (normal navigation)', () => {
    setHistoryState({ idx: 2 }, 3);

    const { result } = renderHook(() => useSafeBackNavigation('/'), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigate).not.toHaveBeenCalledWith('/', expect.any(Object));
  });

  it('navigates to fallback when history.state.idx === 0 (direct entry)', () => {
    setHistoryState({ idx: 0 }, 1);

    const { result } = renderHook(() => useSafeBackNavigation('/'), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
  });

  it('navigates to fallback when history.state is null and length is 1', () => {
    setHistoryState(null, 1);

    const { result } = renderHook(() => useSafeBackNavigation('/'), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('calls navigate(-1) when history.state has no idx but length > 1', () => {
    // No idx field → falls back to length check
    setHistoryState({}, 3);

    const { result } = renderHook(() => useSafeBackNavigation('/'), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('uses the custom fallback path when provided', () => {
    setHistoryState({ idx: 0 }, 1);

    const { result } = renderHook(() => useSafeBackNavigation('/programs'), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith('/programs', { replace: true });
  });

  it('defaults fallback to "/" when no argument given', () => {
    setHistoryState({ idx: 0 }, 1);

    const { result } = renderHook(() => useSafeBackNavigation(), { wrapper });
    result.current();

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('returns a stable callback reference across re-renders with the same fallback', () => {
    setHistoryState({ idx: 1 }, 2);

    const { result, rerender } = renderHook(() => useSafeBackNavigation('/'), { wrapper });
    const firstRef = result.current;

    rerender();

    expect(result.current).toBe(firstRef);
  });
});
