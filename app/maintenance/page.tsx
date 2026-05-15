'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Hammer, ShieldCheck, Mail, ArrowRight, Lock, Cog, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#eeeeee] flex items-center justify-center p-6 md:p-12 overflow-hidden relative">
      {/* Subtle brand-aligned background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-primary)] opacity-[0.02] blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] text-center"
        >
          {/* Refined Icon Block */}
          <div className="relative inline-block mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[var(--color-primary)]/5 rounded-full scale-150 blur-sm"
            />
            <div className="relative w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm mx-auto">
              <Cog className="text-[var(--color-primary)] w-8 h-8 animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold oswald-font text-[var(--color-primary)] mb-3 tracking-tight uppercase leading-tight">
            System <span className="text-gray-400">Update</span>
          </h1>
          
          <p className="text-gray-500 brcob-font text-sm mb-10 leading-relaxed font-medium">
            TeacherDesk is currently undergoing essential maintenance to improve our services. We apologize for any inconvenience.
          </p>

          {/* Compact Info Grid */}
          <div className="flex items-center justify-center gap-6 mb-10 border-y border-gray-50 py-6">
            <div className="flex flex-col items-center">
              <ShieldCheck className="text-[var(--color-primary)]/40 w-5 h-5 mb-1.5" />
              <span className="text-[10px] font-bold brcob-font text-gray-400 uppercase tracking-widest">Secure</span>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="flex flex-col items-center">
              <Hammer className="text-[var(--color-primary)]/40 w-5 h-5 mb-1.5" />
              <span className="text-[10px] font-bold brcob-font text-gray-400 uppercase tracking-widest">Optimizing</span>
            </div>
          </div>

          {/* Sleek, Compact Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="mailto:support@teacherdesk.com"
              className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[var(--color-primary)] text-[11px] font-bold transition-all flex items-center justify-center gap-2 tracking-wider"
            >
              <Mail size={14} className="opacity-60" />
              SUPPORT
            </Link>
            
            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 text-[11px] font-bold transition-all flex items-center justify-center gap-2 tracking-wider group"
              >
                <LogOut size={14} />
                LOGOUT
              </button>
            ) : (
              <Link 
                href="/"
                className="flex-1 py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 rounded-lg text-white text-[11px] font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[var(--color-primary)]/10 tracking-wider group"
              >
                <Lock size={14} />
                ADMIN LOGIN
                <ArrowRight size={14} className="ml-0.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Minimal Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="text-gray-400 text-[9px] font-bold tracking-[0.3em] uppercase oswald-font">
            TeacherDesk Official • Premium Education Network
          </div>
        </motion.div>
      </div>
    </div>
  );
}
