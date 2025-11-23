
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

interface EventLogContextType {
  logs: LogEntry[];
  isOpen: boolean;
  addLog: (message: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleEventLog: () => void;
}

const EventLogContext = createContext<EventLogContextType | undefined>(undefined);

export const EventLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'l' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            toggleEventLog();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addLog = useCallback((message: string) => {
    setLogs(prevLogs => {
      const newLog: LogEntry = {
        id: Date.now(),
        timestamp: format(new Date(), 'HH:mm:ss.SSS'),
        message,
      };
      // Keep only the last 100 logs
      return [newLog, ...prevLogs].slice(0, 100);
    });
  }, []);

  const toggleEventLog = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const value = { logs, isOpen, addLog, setIsOpen, toggleEventLog };

  return <EventLogContext.Provider value={value}>{children}</EventLogContext.Provider>;
};

export const useEventLog = (): EventLogContextType => {
  const context = useContext(EventLogContext);
  if (context === undefined) {
    throw new Error('useEventLog must be used within an EventLogProvider');
  }
  return context;
};
