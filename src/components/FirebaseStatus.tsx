import React, { useState, useEffect } from 'react';
import { checkConnection } from '../services/firebaseService';

const FirebaseStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const connected = await checkConnection();
      setIsConnected(connected);
      if (!connected) setShowStatus(true);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s

    // Listen for online/offline events
    const handleOnline = () => {
      setIsConnected(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isConnected !== false) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      {isConnected === false ? (
        <div className="bg-yellow-100 dark:bg-yellow-900/80 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Offline Mode - Changes will sync when online</span>
        </div>
      ) : isConnected === true ? (
        <div className="bg-green-100 dark:bg-green-900/80 border border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-medium">Connected to Firebase</span>
        </div>
      ) : null}
    </div>
  );
};

export default FirebaseStatus;
