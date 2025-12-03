
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NetworkMode = 'LOCKED' | 'HOME' | 'SCHOOL';

interface NetworkContextType {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<NetworkMode>('LOCKED');

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
