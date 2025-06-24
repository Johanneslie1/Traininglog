import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import ProgramManager from './ProgramManager';
import { ProgramsProvider } from '@/context/ProgramsContext';
import { Program } from '@/types/program';
import { Exercise } from '@/types/exercise';
import { act } from 'react-dom/test-utils';

// Import the Firebase service functions to access the mock functions
import { createProgram, updateProgram, deleteProgram, getUserPrograms } from '@/services/firebase/programs';
import { getExerciseSuggestions } from '@/services/firebase/exercises';

// Mock the Firebase service functions
vi.mock('@/services/firebase/programs');
vi.mock('@/services/firebase/exercises');

// Mock exercise data
const mockExercise: Exercise = {
  id: 'exercise1',
  name: 'Bench Press',
  description: 'Barbell bench press',
  type: 'strength',
  category: 'compound',
  primaryMuscles: ['chest', 'shoulders', 'triceps'],
  secondaryMuscles: ['core'],
  instructions: ['Lie on bench', 'Lower bar to chest', 'Press up'],
  defaultUnit: 'kg',
  metrics: {
    trackWeight: true,
    trackReps: true
  }
};

// Mock program data
const mockProgram: Program = {
  id: 'program1',
  name: 'Test Program',
  description: 'A test program',
  exercises: [
    {
      exerciseId: 'exercise1',
      exercise: mockExercise,
      sets: 3,
      reps: 10,
      weight: 60,
      order: 0,
      notes: 'Test note'
    }
  ],
  userId: 'user1',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Create a mock store
const mockStore = configureStore({
  reducer: {
    auth: () => ({ user: { id: 'user1' } })
  }
});

// Test suite wrapper component
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <ProgramsProvider>
        {ui}
      </ProgramsProvider>
    </Provider>
  );
};

describe('ProgramManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock implementations
    vi.mocked(getUserPrograms).mockResolvedValue([]);
    vi.mocked(getExerciseSuggestions).mockResolvedValue([]);
    vi.mocked(createProgram).mockImplementation((input) => Promise.resolve({
      id: 'new-program-id',
      userId: 'user1',
      name: input.name,
      description: input.description,
      exercises: (input.exercises || []).map(e => ({
        ...e,
        exercise: mockExercise
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    vi.mocked(updateProgram).mockResolvedValue(undefined);
    vi.mocked(deleteProgram).mockResolvedValue(undefined);
  });

  it('renders loading state', async () => {
    vi.mocked(getUserPrograms).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders(<ProgramManager />);
    expect(screen.getByText('Loading programs...')).toBeInTheDocument();
  });

  it('renders program list', async () => {
    vi.mocked(getUserPrograms).mockResolvedValue([mockProgram]);
    renderWithProviders(<ProgramManager />);

    await waitFor(() => {
      expect(screen.queryByText('Loading programs...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: mockProgram.name })).toBeInTheDocument();
    expect(screen.getByText(mockProgram.description!)).toBeInTheDocument();
  });

  it('creates a new program', async () => {
    renderWithProviders(<ProgramManager />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading programs...')).not.toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create program/i });
    await act(async () => {
      fireEvent.click(createButton);
    });

    // Fill form
    const nameInput = screen.getByLabelText(/program name/i);
    const descInput = screen.getByLabelText(/description/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Program' } });
      fireEvent.change(descInput, { target: { value: 'New program description' } });
    });

    // Add exercise
    const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
    await act(async () => {
      fireEvent.click(addExerciseButton);
    });

    // Mock exercise search
    vi.mocked(getExerciseSuggestions).mockResolvedValue([mockExercise]);

    // Search for exercise
    const searchInput = screen.getByPlaceholderText(/search exercises/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'bench' } });
    });

    // Wait for exercise to appear
    await waitFor(() => {
      expect(screen.getByText(mockExercise.name)).toBeInTheDocument();
    });

    // Select exercise
    const exerciseButton = screen.getByRole('button', { name: new RegExp(mockExercise.name, 'i') });
    await act(async () => {
      fireEvent.click(exerciseButton);
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save program/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(createProgram).toHaveBeenCalledWith({
      name: 'New Program',
      description: 'New program description',
      exercises: [{
        exerciseId: mockExercise.id,
        sets: 3,
        reps: 10,
        weight: 0,
        order: 0,
        notes: ''
      }]
    });
  });

  it('edits an existing program', async () => {
    vi.mocked(getUserPrograms).mockResolvedValue([mockProgram]);
    renderWithProviders(<ProgramManager />);

    // Wait for program to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockProgram.name })).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await act(async () => {
      fireEvent.click(editButton);
    });

    // Change name
    const nameInput = screen.getByLabelText(/program name/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Updated Program' } });
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update program/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(updateProgram).toHaveBeenCalledWith({
      id: mockProgram.id,
      name: 'Updated Program',
      description: mockProgram.description,
      exercises: mockProgram.exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        notes: e.notes,
        order: e.order
      }))
    });
  });

  it('deletes a program', async () => {
    vi.mocked(getUserPrograms).mockResolvedValue([mockProgram]);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderWithProviders(<ProgramManager />);

    // Wait for program to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockProgram.name })).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(deleteProgram).toHaveBeenCalledWith(mockProgram.id);
  });

  it('validates form before submission', async () => {
    renderWithProviders(<ProgramManager />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading programs...')).not.toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByRole('button', { name: /create program/i });
    await act(async () => {
      fireEvent.click(createButton);
    });

    // Try to submit without name
    const submitButton = screen.getByRole('button', { name: /save program/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Program name is required')).toBeInTheDocument();

    // Fill name but try to submit without exercises
    const nameInput = screen.getByLabelText(/program name/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Program' } });
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Add at least one exercise')).toBeInTheDocument();
  });
});
