import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NetworkMode = 'LOCKED' | 'HOME' | 'SCHOOL';

interface NetworkContextType {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// The domain of your deployed proxy
const PROXY_HOSTNAME = "wintonswebsiteproxy.onrender.com";

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state based on where the app is running
  const [mode, setMode] = useState<NetworkMode>(() => {
    // 1. If we are running ON the proxy, we are already "Home/Unlocked"
    if (typeof window !== 'undefined' && window.location.hostname === PROXY_HOSTNAME) {
        return 'HOME';
    }
    // 2. Otherwise default to LOCKED
    return 'LOCKED';
  });

  return (
    <NetworkContext.Provider value={{ mode, setMode }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};