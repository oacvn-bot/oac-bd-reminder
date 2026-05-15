import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Settings, LogOut, BarChart, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-scripts', label: 'My Scripts', icon: FileText },
    { to: '/guide', label: 'User Guide', icon: BookOpen },
    ...(profile?.role === 'admin' ? [
      { to: '/team-stats', label: 'Team Monitor', icon: BarChart },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-background text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-boder bg-sidebar flex flex-col">
        <div className="p-6 border-b border-boder">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center glow-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </div>
            <span className="font-bold tracking-tight text-white uppercase">OAC WARM-UP</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/10 border border-primary/20 text-primary font-medium" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-boder">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-2 w-full text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <div className="flex flex-col text-left flex-1 min-w-0">
               <span className="text-sm font-medium text-white truncate">{profile?.email?.split('@')[0] || 'User'}</span>
               <span className="text-[10px] uppercase tracking-wider">Sign Out</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 border-b border-boder bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Console</h2>
            <div className="h-4 w-px bg-boder"></div>
            {profile?.role === 'admin' && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Admin Active
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-success/5 rounded-full blur-[100px] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
