import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import SideMenu from '@/components/SideMenu';
import { User } from '@/services/firebase/auth';

interface AuthTestState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const createUser = (role: 'athlete' | 'coach'): User => ({
  id: `test-${role}`,
  email: `${role}@example.com`,
  firstName: 'Test',
  lastName: role,
  role,
  createdAt: new Date(),
  updatedAt: new Date()
});

const renderSideMenu = (role: 'athlete' | 'coach') => {
  const authState: AuthTestState = {
    user: createUser(role),
    isAuthenticated: true,
    isLoading: false,
    error: null
  };

  const store = configureStore({
    reducer: {
      auth: (state = authState) => state
    }
  });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <SideMenu
          isOpen
          onClose={() => {}}
          onNavigateToday={() => {}}
          onOpenProfile={() => {}}
        />
      </MemoryRouter>
    </Provider>
  );
};

describe('SideMenu role visibility', () => {
  it('shows Programs navigation entry but not Assigned Programs', () => {
    renderSideMenu('athlete');

    expect(screen.getByText(/^Programs$/i)).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText(/Assigned Programs/i)).not.toBeInTheDocument();
  });

  it('shows athlete hub entry for athletes', () => {
    renderSideMenu('athlete');

    const athleteSection = screen.getByText('Athlete').parentElement as HTMLElement;
    expect(within(athleteSection).getByText('Stats')).toBeInTheDocument();
    expect(within(athleteSection).getByText('Analytics')).toBeInTheDocument();
    expect(within(athleteSection).getByText('Teams')).toBeInTheDocument();
    expect(screen.queryByText('Coach Hub')).not.toBeInTheDocument();
  });

  it('shows regular athlete navigation plus coach hub for coaches', () => {
    renderSideMenu('coach');

    const athleteSection = screen.getByText('Athlete').parentElement as HTMLElement;
    expect(within(athleteSection).getByText('Stats')).toBeInTheDocument();
    expect(within(athleteSection).getByText('Analytics')).toBeInTheDocument();
    expect(within(athleteSection).getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Coach Hub')).toBeInTheDocument();
  });

});
