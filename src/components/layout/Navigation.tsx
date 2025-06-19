import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice';
import { logoutUser } from '@/services/firebase/auth';

const Navigation: React.FC = () => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await logoutUser();
    dispatch(logout());
  };

  return (
    <nav className="bg-black">
      <div className="flex justify-end p-4">
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
