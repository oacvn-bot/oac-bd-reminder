import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { differenceInDays, startOfDay } from 'date-fns';

interface AppConfig {
  startDate: string; // ISO string
  totalAccounts: number;
  checklistItems?: { id: string; label: string }[];
  phaseTargets?: { phase1: number; phase2: number; phase3: number };
  contactLists?: { id: string; name: string; emails: string }[];
}

interface AppContextType {
  config: AppConfig | null;
  currentDay: number;
  currentPhase: number;
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
          startDate: data.startDate?.toDate().toISOString() || new Date().toISOString(),
          totalAccounts: data.totalAccounts || 10,
          checklistItems: data.checklistItems || [
            { id: 'sent', label: 'Emails Sent' },
            { id: 'replied', label: 'Threads Replied' },
            { id: 'markedImportant', label: 'Marked Important' },
            { id: 'spamCheck', label: 'Spam Checked & Pulled' }
          ],
          phaseTargets: data.phaseTargets || { phase1: 5, phase2: 12, phase3: 30 },
          contactLists: data.contactLists || [
            { id: '1', name: 'Tech Startups', emails: 'tech1@example.com, tech2@example.com' }
          ]
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

  if (config?.startDate) {
    const start = startOfDay(new Date(config.startDate));
    const today = startOfDay(new Date());
    currentDay = differenceInDays(today, start) + 1;
    // Cap at 28 days
    if (currentDay > 28) currentDay = 28;
    if (currentDay < 1) currentDay = 1;

    if (currentDay <= 7) currentPhase = 1;
    else if (currentDay <= 14) currentPhase = 2;
    else currentPhase = 3;
  }

  return (
    <AppContext.Provider value={{ config, currentDay, currentPhase, loading }}>
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
