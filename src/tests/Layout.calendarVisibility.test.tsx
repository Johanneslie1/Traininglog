import React, { useEffect } from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { DateProvider } from '@/context/DateContext';
import { ExerciseLogCalendarProvider, useExerciseLogCalendar } from '@/context/ExerciseLogCalendarContext';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: { auth: { isAuthenticated: boolean } }) => unknown) =>
    selector({ auth: { isAuthenticated: true } }),
}));

jest.mock('@/components/WeeklyCalendarHeader', () => ({
  default: ({ onCalendarIconClick }: { onCalendarIconClick: () => void }) => (
    <button onClick={onCalendarIconClick} aria-label="Open monthly calendar">
      Open monthly calendar
    </button>
  ),
}));

jest.mock('@/components/Calendar', () => ({
  default: () => <div>Monthly calendar content</div>,
}));

jest.mock('@/components/SideMenu', () => ({
  default: () => null,
}));

jest.mock('@/components/ui/AppOverlay', () => ({
  default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (isOpen ? <div>{children}</div> : null),
}));

const CalendarVisibilitySetter: React.FC<{ isMainView: boolean }> = ({ isMainView }) => {
  const { setIsExerciseLogMainView } = useExerciseLogCalendar();

  useEffect(() => {
    setIsExerciseLogMainView(isMainView);
  }, [isMainView, setIsExerciseLogMainView]);

  return null;
};

const renderLayout = (path: string, isMainView: boolean) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DateProvider>
        <ExerciseLogCalendarProvider>
          <CalendarVisibilitySetter isMainView={isMainView} />
          <Layout>
            <div>Body</div>
          </Layout>
        </ExerciseLogCalendarProvider>
      </DateProvider>
    </MemoryRouter>
  );
};

describe('Layout weekly calendar visibility', () => {
  it('shows weekly calendar controls on Exercise Log main route', () => {
    renderLayout('/', true);
    expect(screen.getByLabelText('Open monthly calendar')).not.toBeNull();
  });

  it('hides weekly calendar controls on non-log routes', () => {
    renderLayout('/profile', true);
    expect(screen.queryByLabelText('Open monthly calendar')).toBeNull();
  });

  it('hides weekly calendar controls on Exercise Log subviews', () => {
    renderLayout('/', false);
    expect(screen.queryByLabelText('Open monthly calendar')).toBeNull();
  });

  it('auto-closes monthly calendar when leaving Exercise Log main view', () => {
    const rendered = renderLayout('/', true);

    fireEvent.click(screen.getByLabelText('Open monthly calendar'));
    expect(screen.getByText('Monthly calendar content')).not.toBeNull();

    rendered.rerender(
      <MemoryRouter initialEntries={['/']}>
        <DateProvider>
          <ExerciseLogCalendarProvider>
            <CalendarVisibilitySetter isMainView={false} />
            <Layout>
              <div>Body</div>
            </Layout>
          </ExerciseLogCalendarProvider>
        </DateProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Monthly calendar content')).toBeNull();
  });
});
