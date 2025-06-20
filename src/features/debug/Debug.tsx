import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useNavigate } from 'react-router-dom';

const Debug: React.FC = () => {
  const [environment, setEnvironment] = useState<string>('');
  const [errors, setErrors] = useState<any[]>([]);
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // Determine if we're running in production or development
    setEnvironment(import.meta.env.MODE);

    // Set up error monitoring
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')]);
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="bg-white p-4 rounded shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-2">Environment</h2>
        <p>Mode: {environment}</p>
        <p>URL: {window.location.href}</p>
        <p>Origin: {window.location.origin}</p>
        <p>Pathname: {window.location.pathname}</p>
      </div>
      
      <div className="bg-white p-4 rounded shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-2">Authentication</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        {user && (
          <div className="mt-2">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Name: {user.firstName} {user.lastName}</p>
            <p>Role: {user.role}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded shadow-md mb-4">
        <h2 className="text-xl font-semibold mb-2">Recent Errors</h2>
        {errors.length === 0 ? (
          <p>No errors logged</p>
        ) : (
          <div className="bg-gray-100 p-2 rounded">
            {errors.map((error, index) => (
              <div key={index} className="text-red-600 border-b border-gray-200 py-1 text-sm font-mono overflow-x-auto">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button 
          onClick={() => navigate('/login')} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Login
        </button>
        <button 
          onClick={() => navigate('/')} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Go to Home
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default Debug;
