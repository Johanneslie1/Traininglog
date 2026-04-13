import React, { useEffect, useState } from 'react';

export const UpdateNotification: React.FC = () => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowReload(true);
      });
    }
  }, []);

  const reloadPage = () => {
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg flex justify-between items-center z-50">
      <span>New version available!</span>
      <button 
        onClick={reloadPage}
        className="bg-white text-purple-600 px-4 py-2 rounded-md"
      >
        Update
      </button>
    </div>
  );
};
