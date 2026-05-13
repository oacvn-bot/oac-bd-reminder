import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, signIn, error } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass p-10 rounded-3xl max-w-md w-full relative z-10 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center glow-blue">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-100 mb-2">OAC BD Warm-Up Hub</h1>
        <p className="text-slate-400 mb-8">Sign in with your @onearw.com email to access the email warm-up dashboard.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 text-left text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={signIn}
          className="w-full py-4 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 glow-blue flex items-center justify-center gap-2"
        >
          Sign In with Google
        </button>
      </motion.div>
    </div>
  );
}
