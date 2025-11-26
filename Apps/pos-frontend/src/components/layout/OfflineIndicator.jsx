// src/components/layout/OfflineIndicator.jsx
import React from 'react';
import { useOffline } from '../../contexts/OfflineContext';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOnline, pendingSync, syncOfflineData } = useOffline();

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        isOnline
          ? 'bg-yellow-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5" />
          <div>
            <p className="font-semibold">Back Online</p>
            <p className="text-sm">
              {pendingSync} item(s) pending sync
            </p>
          </div>
          <button
            onClick={syncOfflineData}
            className="ml-2 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-semibold">Offline Mode</p>
            <p className="text-sm">Changes will sync when online</p>
          </div>
        </>
      )}
    </div>
  );
}

