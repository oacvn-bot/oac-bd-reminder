import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, getDocs, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BarChart as BarC, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Users, Mail, Reply, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAppContext } from '../contexts/AppContext';

export default function TeamStats() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { currentDay, currentPhase } = useAppContext();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'member'));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(fetchedUsers);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Listen to today's logs
    const q = query(collection(db, 'logs'), where('date', '==', todayStr));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const fetchedLogs = querySnapshot.docs.map(doc => doc.data());
      setLogs(fetchedLogs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'logs');
      setLoading(false);
    });

    return unsub;
  }, [todayStr]);

  const generateLauncher = () => {
    const batContent = `@echo off\nstart chrome --profile-directory="Profile 1" "${window.location.origin}"`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "OAC_Warmup_Launcher.bat";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Process data for charts
  let totalSent = 0;
  let totalReplies = 0;
  
  const chartData = users.map(user => {
    const userLog = logs.find(log => log.userId === user.id);
    const sent = userLog?.actualVolume || 0;
    const replies = userLog?.repliesReceived || 0;
    
    totalSent += sent;
    totalReplies += replies;

    return {
      name: user.email.split('@')[0],
      Sent: sent,
      Replies: replies,
      hasLog: !!userLog,
      checklist: userLog?.checklist || { sent: false, replied: false, markedImportant: false, spamCheck: false }
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Monitor</h1>
          <p className="text-slate-400 font-medium">Day {currentDay} • {todayStr}</p>
        </div>
        <button
          onClick={generateLauncher}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors shadow-lg border border-boder"
        >
          <Download className="w-4 h-4" />
          Get .bat Launcher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Users className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Active Team</span>
          </div>
          <span className="text-3xl font-bold text-white">{users.length}</span>
        </div>
        <div className="glass rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Mail className="w-16 h-16" /></div>
          <div className="flex items-center gap-3 mb-2 text-primary">
            <Mail className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Total Sent Today</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalSent}</span>
        </div>
        <div className="glass rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Reply className="w-16 h-16" /></div>
          <div className="flex items-center gap-3 mb-2 text-success">
            <Reply className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Replies Received</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalReplies}</span>
        </div>
        <div className="glass rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-16 h-16" /></div>
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Checklists Done</span>
          </div>
          <span className="text-3xl font-bold text-white">
            {chartData.filter(d => 
              d.hasLog && d.checklist.sent && d.checklist.replied && d.checklist.markedImportant && d.checklist.spamCheck
            ).length} / {users.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Volume Chart</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarC data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0B0E14', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="Sent" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Replies" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarC>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Team Checklist Status</h2>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-boder text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-2 font-medium">User</th>
                  <th className="pb-3 px-2 font-medium">Sent</th>
                  <th className="pb-3 px-2 font-medium">Replied</th>
                  <th className="pb-3 px-2 font-medium">Important</th>
                  <th className="pb-3 px-2 font-medium">Spam Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boder text-sm">
                {chartData.map((user, i) => (
                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 px-2 font-medium text-slate-200">
                      {user.name}
                      {!user.hasLog && <AlertCircle className="inline-block ml-2 w-3 h-3 text-rose-500" />}
                    </td>
                    <td className="py-4 px-2">
                      <div className={`w-2 h-2 rounded-full ${user.checklist.sent ? 'bg-success glow-green' : 'bg-slate-600'}`} />
                    </td>
                    <td className="py-4 px-2">
                      <div className={`w-2 h-2 rounded-full ${user.checklist.replied ? 'bg-success glow-green' : 'bg-slate-600'}`} />
                    </td>
                    <td className="py-4 px-2">
                      <div className={`w-2 h-2 rounded-full ${user.checklist.markedImportant ? 'bg-success glow-green' : 'bg-slate-600'}`} />
                    </td>
                    <td className="py-4 px-2">
                      <div className={`w-2 h-2 rounded-full ${user.checklist.spamCheck ? 'bg-success glow-green' : 'bg-slate-600'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500">No team members found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
