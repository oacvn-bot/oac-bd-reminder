import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { differenceInDays, startOfDay } from 'date-fns';

interface AppConfig {
  startDate: string; // ISO string
  totalAccounts: number;
}

interface AppContextType {
  config: AppConfig | null;
  currentDay: number;
  currentPhase: number;
  isCompleted: boolean;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to /config/app
    const unsub = onSnapshot(doc(db, 'config', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({
          startDate: data.startDate.toDate().toISOString(),
          totalAccounts: data.totalAccounts || 10,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Config fetch error:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  let currentDay = 1;
  let currentPhase = 1;
  let isCompleted = false;

  if (config?.startDate) {
    const start = startOfDay(new Date(config.startDate));
    const today = startOfDay(new Date());
    currentDay = differenceInDays(today, start) + 1;

    if (currentDay > 28) {
      isCompleted = true;
    }

    if (currentDay < 1) currentDay = 1;

    const displayDay = currentDay > 28 ? 28 : currentDay;

    if (displayDay <= 7) currentPhase = 1;
    else if (displayDay <= 14) currentPhase = 2;
    else currentPhase = 3;
  }

  return (
    <AppContext.Provider value={{ config, currentDay, currentPhase, isCompleted, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
