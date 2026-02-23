import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/services/firebase/auth';
import { logout } from '@/features/auth/authSlice';
import { RootState } from '@/store/store';
import { useIsCoach, useIsAthlete } from '@/hooks/useUserRole';
import { estimateOneRepMaxEpley } from '@/utils/oneRepMax';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToday: () => void;
  onOpenSettings: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToday,
  onOpenSettings
}) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isCoach = useIsCoach();
  const isAthlete = useIsAthlete();
  const [showOneRmCalculator, setShowOneRmCalculator] = useState(false);
  const [calculatorWeight, setCalculatorWeight] = useState<string>('');
  const [calculatorReps, setCalculatorReps] = useState<string>('');

  const estimatedOneRepMax = useMemo(() => {
    const weight = Number(calculatorWeight);
    const reps = Number(calculatorReps);

    if (!Number.isFinite(weight) || !Number.isFinite(reps)) {
      return 0;
    }

    return estimateOneRepMaxEpley(weight, reps);
  }, [calculatorWeight, calculatorReps]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());
      onClose(); // Close the menu after logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary z-50 shadow-xl flex flex-col translate-x-0 transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary text-xl font-medium">GYM KEEPER</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <svg className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          <div className="space-y-1">
            <button onClick={onNavigateToday} className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Exercise Log
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/programs');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Programs
            </button>
          </div>

          {/* Athlete Section - Only show for athletes */}
          {isAthlete && (
            <div className="pt-4 border-t border-[#3E4652] space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Athlete
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/teams');
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Teams
              </button>
            </div>
          )}

          {/* Coach Section - Only show for coaches */}
          {isCoach && (
            <div className="pt-4 border-t border-[#3E4652] space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Coach Tools
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/coach');
                }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Coach Hub
              </button>
            </div>
          )}

          {/* Settings Section */}
          <div className="pt-4 border-t border-border space-y-3 px-4">
            <button
              onClick={() => setShowOneRmCalculator((current) => !current)}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="Toggle 1RM Calculator"
            >
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                1RM Calculator
              </span>
              <svg className={`w-4 h-4 text-text-secondary transition-transform ${showOneRmCalculator ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOneRmCalculator && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-text-secondary flex flex-col gap-1">
                    Weight (kg)
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={calculatorWeight}
                      onChange={(event) => setCalculatorWeight(event.target.value)}
                      className="w-full rounded-md bg-bg-tertiary border border-border px-2 py-1.5 text-text-primary"
                    />
                  </label>
                  <label className="text-xs text-text-secondary flex flex-col gap-1">
                    Reps
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={calculatorReps}
                      onChange={(event) => setCalculatorReps(event.target.value)}
                      className="w-full rounded-md bg-bg-tertiary border border-border px-2 py-1.5 text-text-primary"
                    />
                  </label>
                </div>

                <div className="rounded-md border border-border bg-bg-tertiary px-3 py-2">
                  <div className="text-xs text-text-tertiary">Estimated 1RM</div>
                  <div className="text-sm font-semibold text-text-primary">
                    {estimatedOneRepMax > 0 ? `${estimatedOneRepMax.toFixed(1)} kg` : 'Enter weight and reps'}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-[#3E4652] space-y-1">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Profile Section */}
          {isAuthenticated && user && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-bg-tertiary rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-text-secondary text-xs">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Auth Section for non-authenticated users */}
          {!isAuthenticated && (
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/register');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SideMenu;
