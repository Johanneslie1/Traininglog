import React, { useState, useEffect } from 'react';
import { createTestProgram } from '@/services/programService';
import { auth } from '@/services/firebase/config';

export const TestButton: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
      if (user) {
        console.log('[TEST] User is authenticated:', user.uid);
      } else {
        console.log('[TEST] No user is authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const runTest = async () => {
    if (!isAuthenticated) {
      alert('Please log in first!');
      return;
    }

    setIsRunning(true);
    try {
      console.log('[TEST] Starting test...');
      await createTestProgram();
      console.log('[TEST] Test completed successfully');
      alert('Test completed! Check the console for results.');
    } catch (error) {
      console.error('[TEST] Test failed:', error);
      alert('Test failed! Check the console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px',
          background: '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'not-allowed',
          zIndex: 1000
        }}
      >
        Checking Auth...
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        disabled
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'not-allowed',
          zIndex: 1000
        }}
      >
        Please Log In
      </button>
    );
  }

  return (
    <button
      onClick={runTest}
      disabled={isRunning}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        background: isRunning ? '#6c757d' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isRunning ? 'not-allowed' : 'pointer',
        zIndex: 1000
      }}
    >
      {isRunning ? 'Running Test...' : 'Run Test'}
    </button>
  );
};
