import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MonitoringEvent } from '../types';

interface MonitoringContextType {
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  warningsCount: number;
  events: MonitoringEvent[];
  reportViolation: (event: string, severity: 'Low'|'Medium'|'High'|'Critical', impact: number, details: string, isAi?: boolean) => void;
  registerSnapshotProvider: (provider: () => string | null) => void;
  isLocked: boolean;
  setIsFullscreen: (val: boolean) => void;
  unlockExam: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider: React.FC<{ 
  children: ReactNode, 
  onViolation?: (violation: MonitoringEvent) => void 
}> = ({ children, onViolation }) => {
  const [cameraActive, setCameraActive] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const warningsCount = events.length;

  const reportViolation = useCallback((event: string, severity: 'Low'|'Medium'|'High'|'Critical', impact: number, details: string, isAi?: boolean) => {
    void isAi;
    const newEvent: MonitoringEvent = {
      id: Date.now().toString(),
      candidateId: 'test-candidate',
      candidateName: 'Test Candidate',
      timestamp: new Date().toLocaleTimeString(),
      event,
      severity,
      confidenceImpact: impact,
      status: 'Flagged',
      details
    };
    setEvents(prev => [newEvent, ...prev]);
    if (onViolation) onViolation(newEvent);
  }, [onViolation]);

  const registerSnapshotProvider = useCallback(() => {
    // Mock implementation
  }, []);

  return (
    <MonitoringContext.Provider value={{
      cameraActive,
      setCameraActive,
      warningsCount,
      events,
      reportViolation,
      registerSnapshotProvider,
      isLocked,
      setIsFullscreen: () => {},
      unlockExam: () => setIsLocked(false)
    }}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const ctx = useContext(MonitoringContext);
  if (!ctx) throw new Error('useMonitoring must be used within MonitoringProvider');
  return ctx;
};
