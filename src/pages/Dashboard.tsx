import React, { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';
import { Check, Copy, ShieldAlert, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Checklist {
  sent: boolean;
  replied: boolean;
  markedImportant: boolean;
  spamCheck: boolean;
}

export default function Dashboard() {
  const { currentDay, currentPhase, config } = useAppContext();
  const { user } = useAuth();
  
  const [script, setScript] = useState<{subject: string, bodyHtml: string} | null>(null);
  const [checklist, setChecklist] = useState<Checklist>({
    sent: false, replied: false, markedImportant: false, spamCheck: false
  });
  const [actualVolume, setActualVolume] = useState<number>(0);
  const [repliesReceived, setRepliesReceived] = useState<number>(0);
  const [localVolume, setLocalVolume] = useState<string>('0');
  const [localReplies, setLocalReplies] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const logId = `${user?.uid}_${todayStr}`;

  useEffect(() => {
    // Fetch Script
    const fetchScript = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'scripts', currentDay.toString()));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setScript({ subject: data.subject, bodyHtml: data.bodyHtml });
        } else {
          setScript(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `scripts/${currentDay}`);
      }
    };
    fetchScript();
  }, [currentDay]);

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
      // Fallback for older browsers
      try {
        await navigator.clipboard.writeText(plainText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err2) {
        console.error('Fallback copy failed: ', err2);
      }
    }
  };

  const getTargetVolume = () => {
    if (currentPhase === 1) return '2-5';
    if (currentPhase === 2) return '6-12';
    return '15-30';
  };

  const calculateProgress = () => {
    const total = 4;
    const completed = Object.values(checklist).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();
  const allChecked = progress === 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Day {currentDay} / 28</h1>
        <p className="text-slate-400 font-medium">Phase {currentPhase} Warm-up</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KPI & Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            {allChecked && <div className="absolute inset-0 bg-success/10" />}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Daily Checklist</h2>
                <p className="text-sm text-slate-400 mt-1">Target: {getTargetVolume()} emails/day</p>
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
              {[
                { key: 'sent', label: 'Emails Sent' },
                { key: 'replied', label: 'Threads Replied' },
                { key: 'markedImportant', label: 'Marked Important' },
                { key: 'spamCheck', label: 'Spam Checked & Pulled' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 flex items-center justify-center rounded border-2 transition-colors",
                    checklist[key as keyof Checklist] 
                      ? "border-success bg-success/20 text-success" 
                      : "border-slate-700 text-transparent hover:border-slate-500"
                  )}>
                    <Check className="w-3 h-3" strokeWidth={4} />
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    checklist[key as keyof Checklist] ? "text-slate-500 line-through" : "text-slate-300 group-hover:text-white"
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
        </div>

        {/* Right Column: Scripts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Today's Script
              </h2>
              {script && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg",
                    copySuccess 
                      ? "bg-success text-white glow-green" 
                      : "bg-primary text-white hover:bg-blue-600 glow-blue"
                  )}
                >
                  {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? "Copied HTML!" : "Copy for Gmail"}
                </button>
              )}
            </div>

            {script ? (
              <div className="flex-1 flex flex-col pt-4">
                <div className="mb-4 space-y-1">
                  <label className="text-[10px] uppercase text-primary font-bold tracking-widest block">Subject Line</label>
                  <p className="text-lg font-semibold text-white bg-slate-800/30 p-3 rounded-lg border border-boder italic">{script.subject}</p>
                </div>
                
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
