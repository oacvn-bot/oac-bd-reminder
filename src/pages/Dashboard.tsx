import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Check, Copy, ShieldAlert, CheckCircle2, FileText, Download, Mail, CopyPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { getAccountRotationForDay } from '../lib/warmup-data';

type Checklist = Record<string, boolean>;

export default function Dashboard() {
  const { config } = useAppContext();
  const { user } = useAuth();
  
  let currentDay = 1;
  let currentPhase = 1;
  let isCompleted = false;

  if (config?.startDate) {
    const today = new Date();
    const start = new Date(config.startDate);
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    currentDay = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
    if (currentDay > 28) {
      isCompleted = true;
      currentDay = 28; // Cap for phase display, or keep it
    }
    if (currentDay < 1) currentDay = 1;

    if (currentDay <= 7) currentPhase = 1;
    else if (currentDay <= 14) currentPhase = 2;
    else currentPhase = 3;
  }
  
  const [script, setScript] = useState<{subject: string, bodyHtml: string, campaignEmails?: string, emailsToSend?: string} | null>(null);
  const [chromeProfile, setChromeProfile] = useState<string>('Profile 1');
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<Checklist>({});
  const [actualVolume, setActualVolume] = useState<number>(0);
  const [repliesReceived, setRepliesReceived] = useState<number>(0);
  const [localVolume, setLocalVolume] = useState<string>('0');
  const [localReplies, setLocalReplies] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyEmailsSuccess, setCopyEmailsSuccess] = useState(false);
  
  const [weeklySent, setWeeklySent] = useState(0);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const logId = `${user?.uid}_${todayStr}`;

  // Initialize empty checklist based on config
  useEffect(() => {
    if (config?.checklistItems && Object.keys(checklist).length === 0) {
      const initial: Checklist = {};
      config.checklistItems.forEach(item => initial[item.id] = false);
      setChecklist(initial);
    }
  }, [config?.checklistItems]);

  useEffect(() => {
    // Fetch Script
    const fetchScript = async () => {
      if (!user) return;
      try {
        let scriptData = null;
        // First try to fetch personal script
        const userDocSnap = await getDoc(doc(db, 'user_scripts', `${user.uid}_${currentDay}`));
        
        if (userDocSnap.exists()) {
          scriptData = userDocSnap.data();
        } else {
          // Fallback to global script
          const docSnap = await getDoc(doc(db, 'scripts', currentDay.toString()));
          if (docSnap.exists()) {
            scriptData = docSnap.data();
          }
        }
        
        if (scriptData) {
          setScript({ 
            subject: scriptData.subject, 
            bodyHtml: scriptData.bodyHtml,
            campaignEmails: scriptData.campaignEmails,
            emailsToSend: scriptData.emailsToSend
          });
        } else {
          setScript(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `user_scripts`);
      }
    };

    const fetchWeeklyStats = async () => {
      if (!user) return;
      try {
        const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const q = query(collection(db, 'logs'), 
          where('userId', '==', user.uid),
          where('date', '>=', start),
          where('date', '<=', end)
        );
        const snaps = await getDocs(q);
        let total = 0;
        snaps.forEach(doc => {
          total += (doc.data().actualVolume || 0);
        });
        setWeeklySent(total);
      } catch (err) {
        console.error("Failed to fetch weekly stats", err);
      }
    };

    fetchScript();
    fetchWeeklyStats();
  }, [currentDay, user]);

  useEffect(() => {
    // Fetch team users for rotation
    const fetchUsers = async () => {
      // In a real app, you would fetch all users from a 'users' collection
      // Here we just use a placeholder array for demonstration based on totalAccounts config
      if (config?.totalAccounts) {
         setTeamEmails(Array.from({length: config.totalAccounts}, (_, i) => `account${i+1}@onearw.com`));
      }
    };
    fetchUsers();
  }, [config]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'logs', logId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChecklist(data.checklist);
        setActualVolume(data.actualVolume || 0);
        setRepliesReceived(data.repliesReceived || 0);
        setLocalVolume((data.actualVolume || 0).toString());
        setLocalReplies((data.repliesReceived || 0).toString());
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `logs/${logId}`);
    });
    return unsub;
  }, [logId, user]);

  const updateLog = async (newChecklist: Checklist, volume: number = actualVolume, replies: number = repliesReceived) => {
    if (!user) return;
    setChecklist(newChecklist);
    setActualVolume(volume);
    setRepliesReceived(replies);

    try {
      await setDoc(doc(db, 'logs', logId), {
        userId: user.uid,
        date: todayStr,
        checklist: newChecklist,
        actualVolume: volume,
        repliesReceived: replies,
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `logs/${logId}`);
    }
  };

  const handleCheck = (key: keyof Checklist) => {
    updateLog({ ...checklist, [key]: !checklist[key] });
  };

  const handleCopy = async () => {
    if (!script) return;
    
    // Create a plain text fallback
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = script.bodyHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    try {
      const htmlBlob = new Blob([script.bodyHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      try {
        await navigator.clipboard.writeText(plainText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err2) {
        console.error('Fallback copy failed: ', err2);
      }
    }
  };

  const handleCopyEmails = async () => {
    if (!script?.emailsToSend) return;
    try {
      await navigator.clipboard.writeText(script.emailsToSend);
      setCopyEmailsSuccess(true);
      setTimeout(() => setCopyEmailsSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy emails: ', err);
    }
  };

  const handleOpenGmail = () => {
    if (!script) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = script.bodyHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    let mailtoLink = `mailto:?bcc=${encodeURIComponent(script.emailsToSend || '')}&subject=${encodeURIComponent(script.subject)}&body=${encodeURIComponent(plainText)}`;
    window.open(mailtoLink, '_blank');
  };

  const generateLauncher = () => {
    const batContent = `@echo off\nstart chrome --profile-directory="${chromeProfile}" "${window.location.origin}"\nstart outlook.exe`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OAC_Warmup_Launcher_${chromeProfile.replace(/\s+/g, '')}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTargetVolume = () => {
    if (currentPhase === 1) return config?.phaseTargets?.phase1 || 5;
    if (currentPhase === 2) return config?.phaseTargets?.phase2 || 12;
    return config?.phaseTargets?.phase3 || 30;
  };

  const calculateProgress = () => {
    if (!config?.checklistItems?.length) return 0;
    const total = config.checklistItems.length;
    let completed = 0;
    config.checklistItems.forEach(item => {
      if (checklist[item.id]) completed++;
    });
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();
  const targetVol = getTargetVolume();
  const volumeProgress = Math.min(100, Math.round((actualVolume / targetVol) * 100));
  const allChecked = progress === 100 && volumeProgress === 100;
  
  const weeklyTarget = targetVol * 5;
  const remainingThisWeek = Math.max(0, weeklyTarget - weeklySent);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isCompleted ? "Warm-up Completed 🎉" : `Day ${currentDay} / 28`}
            </h1>
            <p className="text-slate-400 font-medium">
              {isCompleted ? "Congratulations! You have completed the 28-day warm-up plan." : `Phase ${currentPhase} Warm-up`}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-boder">
            <span className="text-xs text-slate-400 font-medium pl-2">Chrome Profile:</span>
            <input 
              type="text" 
              value={chromeProfile}
              onChange={(e) => setChromeProfile(e.target.value)}
              className="bg-background border border-boder rounded-lg px-2 py-1 text-sm text-white w-24 focus:outline-none focus:border-primary"
              placeholder="Profile 1"
            />
            <button
              onClick={generateLauncher}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Get .bat
            </button>
          </div>
        </div>

        {/* Phase Progress Roadmap */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex relative border border-boder">
          <div className="h-full bg-amber-500/80 transition-all duration-1000 relative" style={{ width: `${Math.min(100, (currentDay / 7) * 100)}%`, maxWidth: '25%' }}></div>
          <div className="h-full bg-blue-500/80 transition-all duration-1000 relative" style={{ width: `${Math.min(100, ((currentDay - 7) / 7) * 100)}%`, maxWidth: '25%' }}></div>
          <div className="h-full bg-success/80 transition-all duration-1000 relative" style={{ width: `${Math.min(100, ((currentDay - 14) / 14) * 100)}%`, maxWidth: '50%' }}></div>
          
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-background/50 z-10"></div>
          <div className="absolute top-0 bottom-0 left-2/4 w-px bg-background/50 z-10"></div>
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-wider">
          <span className="w-1/4 text-center">Phase 1 (Days 1-7)</span>
          <span className="w-1/4 text-center">Phase 2 (Days 8-14)</span>
          <span className="w-2/4 text-center">Phase 3 (Days 15-28)</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KPI & Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            {allChecked && <div className="absolute inset-0 bg-success/10" />}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Daily Checklist</h2>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-sm text-slate-400">Target: {targetVol} emails/day</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${volumeProgress}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-400">{actualVolume}/{targetVol}</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" 
                style={{
                  background: `conic-gradient(var(--color-success) ${progress}%, rgba(255,255,255,0.1) 0)`
                }}>
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xs font-bold">
                  {progress}%
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {(config?.checklistItems || []).map(({ id, label }) => (
                <label key={id} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => {
                  e.preventDefault();
                  handleCheck(id);
                }}>
                  <div className={cn(
                    "w-5 h-5 flex items-center justify-center rounded border-2 transition-colors",
                    checklist[id] 
                      ? "border-success bg-success/20 text-success" 
                      : "border-slate-700 text-transparent hover:border-slate-500"
                  )}>
                    <Check className="w-3 h-3" strokeWidth={4} />
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    checklist[id] ? "text-slate-500 line-through" : "text-slate-300 group-hover:text-white"
                  )}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-boder">
              <h3 className="text-sm font-medium text-slate-300 mb-4">Volume Tracking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Sent Today</label>
                  <input 
                    type="number" 
                    value={localVolume}
                    onChange={(e) => setLocalVolume(e.target.value)}
                    onBlur={() => updateLog(checklist, parseInt(localVolume) || 0, repliesReceived)}
                    className="w-full bg-background/50 border border-boder rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Replies</label>
                  <input 
                    type="number" 
                    value={localReplies}
                    onChange={(e) => setLocalReplies(e.target.value)}
                    onBlur={() => updateLog(checklist, actualVolume, parseInt(localReplies) || 0)}
                    className="w-full bg-background/50 border border-boder rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Sprint Widget */}
          <div className="glass rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-primary/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              Weekly Sprint
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">Mon - Fri</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-white">{weeklySent}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Emails Sent</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-300">{remainingThisWeek}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Remaining Target</p>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${Math.min(100, (weeklySent / weeklyTarget) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Account Rotation Tracker */}
          <div className="glass rounded-2xl p-6">
             <h2 className="text-lg font-semibold text-white mb-4">Account Rotation (Today)</h2>
             {teamEmails.length > 0 ? (
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                 {getAccountRotationForDay(teamEmails, currentDay).map((rotation, idx) => {
                   const isMe = user?.email && (rotation.from === user.email || rotation.to === user.email);
                   return (
                     <div key={idx} className={cn(
                       "flex items-center justify-between p-3 rounded-xl border text-sm",
                       isMe ? "bg-primary/10 border-primary/30 glow-blue" : "bg-slate-800/30 border-boder"
                     )}>
                       <span className={isMe && rotation.from === user.email ? "text-white font-bold" : "text-slate-300"}>
                         {rotation.from.split('@')[0]}
                       </span>
                       <span className="text-slate-500 mx-2">→</span>
                       <span className={isMe && rotation.to === user.email ? "text-white font-bold" : "text-slate-300"}>
                         {rotation.to.split('@')[0]}
                       </span>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <p className="text-sm text-slate-400 italic">No account rotation data available. Admin must set Total Accounts in config.</p>
             )}
          </div>
        </div>

        {/* Right Column: Scripts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Today's Script
              </h2>
              <div className="flex items-center gap-2">
                {script?.emailsToSend && (
                  <button
                    onClick={handleCopyEmails}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg",
                      copyEmailsSuccess 
                        ? "bg-success text-white glow-green" 
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {copyEmailsSuccess ? <CheckCircle2 className="w-4 h-4" /> : <CopyPlus className="w-4 h-4" />}
                    {copyEmailsSuccess ? "Copied!" : "Copy Emails"}
                  </button>
                )}
                {script && (
                  <>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg",
                        copySuccess 
                          ? "bg-success text-white glow-green" 
                          : "bg-primary text-white hover:bg-blue-600 glow-blue"
                      )}
                    >
                      {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess ? "Copied HTML!" : "Copy Body"}
                    </button>
                    <button
                      onClick={handleOpenGmail}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg bg-rose-600 text-white hover:bg-rose-500 glow-red"
                    >
                      <Mail className="w-4 h-4" />
                      Draft in Gmail
                    </button>
                  </>
                )}
              </div>
            </div>

            {script ? (
              <div className="flex-1 flex flex-col pt-4">
                <div className="mb-4 space-y-1">
                  <label className="text-[10px] uppercase text-primary font-bold tracking-widest block">Subject Line</label>
                  <p className="text-lg font-semibold text-white bg-slate-800/30 p-3 rounded-lg border border-boder italic">{script.subject}</p>
                </div>

                {script.emailsToSend && (
                  <div className="mb-4 space-y-1">
                    <label className="text-[10px] uppercase text-primary font-bold tracking-widest block">Target Emails</label>
                    <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-boder break-all">{script.emailsToSend}</p>
                  </div>
                )}
                
                <div className="space-y-1 flex-1 flex flex-col mb-4 min-h-0">
                  <label className="text-[10px] uppercase text-primary font-bold tracking-widest block">Body Content</label>
                  <div className="text-sm text-slate-300 bg-slate-800/30 p-4 rounded-lg border border-boder flex-1 overflow-y-auto leading-relaxed prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: script.bodyHtml }} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Format is preserved when pasting directly into Gmail compose window.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 opacity-50" />
                </div>
                <p>No script assigned for Day {currentDay} yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
