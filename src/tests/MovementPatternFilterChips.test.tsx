import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { CollapsibleMovementPatternFilter } from '@/components/exercises/MovementPatternFilterChips';

describe('CollapsibleMovementPatternFilter', () => {
  it('hides movement pattern chips until Filters is pressed', () => {
    const onSelect = jest.fn();
    render(<CollapsibleMovementPatternFilter selected="" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: 'Filters' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Squat' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('button', { name: 'Hide' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Squat' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'All patterns' })).toBeTruthy();
  });

  it('keeps a compact selected chip when the filter panel is closed', () => {
    const onSelect = jest.fn();
    render(<CollapsibleMovementPatternFilter selected="hinge" onSelect={onSelect} />);

    expect(screen.queryByRole('button', { name: 'Hinge' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear Hinge filter' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear Hinge filter' }));
    expect(onSelect).toHaveBeenCalledWith('');
  });
});
