'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe, FaTimes, FaUserPlus, FaLink, FaCheck, FaShareAlt, FaWhatsapp, FaInstagram, FaRocket, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { decryptData } from '@/lib/crypto';
import { getTeacherProfileIdAction } from '@/app/actions/teacher';
import confetti from 'canvas-confetti';

type WelcomePopupProps = {
  role: string;
  onClose: () => void;
};

export default function WelcomePopup({ role, onClose }: WelcomePopupProps) {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#143c64', '#4ade80']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#143c64', '#4ade80']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    if (role === 'teacher') {
      const fetchUser = async () => {
        const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
        if (user) {
          const encryptedResponse = await getTeacherProfileIdAction(user.id);
          const response = decryptData(encryptedResponse);
          if (response && response.success) {
            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/authentication?type=teacher&ref=${response.teacherId}`);
          }
        }
      };
      fetchUser();
    }
  }, [role]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 500);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Join me on TeacherDesk: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.3)] overflow-hidden relative"
          >
            {/* Header / Banner Area - Sleek and Compact */}
            <div className="relative h-28 bg-[var(--color-primary)] overflow-hidden">
              <div className="absolute inset-0 bg-[url('/images/pattern.png')] bg-cover opacity-5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="absolute inset-0 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg rotate-3">
                    <FaGlobe className="text-[var(--color-primary)]" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white oswald-font capitalize tracking-tight">
                      Welcome to <span className="text-green-400 block sm:inline">Teacher Desk</span>
                    </h2>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Content Area - Streamlined */}
            <div className="px-6 py-8 sm:px-8 flex flex-col items-center">
              <p className="text-center text-gray-500 font-medium brcob-font text-[13px] leading-relaxed mb-6 px-2">
                Your ultimate workspace for collaborative excellence. We're honored to have you join our global network.
              </p>

              {role === 'teacher' && (
                <div className="w-full bg-gray-50 rounded-xl border border-gray-100 p-5 mb-2">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
                      <FaUserPlus size={11} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 oswald-font capitalize tracking-tight">Grow Your Network</span>
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-100 px-3 py-2 rounded-lg shadow-sm overflow-hidden group/link focus-within:border-[var(--color-primary)]/30 transition-all">
                      <span className="flex-1 text-[10px] font-medium text-gray-400 truncate select-all">{inviteLink || "Generating link..."}</span>
                      <button
                        onClick={handleCopy}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all flex items-center gap-1.5 ${copied ? 'bg-green-500 text-white' : 'bg-[var(--color-primary)] text-white hover:bg-[#1a147a]'}`}
                      >
                        {copied ? <FaCheck size={9} /> : <FaShareAlt size={9} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    
                    <button 
                      onClick={shareViaWhatsApp}
                      className="w-10 h-10 rounded-lg bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center border border-green-100/50 flex-shrink-0"
                    >
                      <FaWhatsapp size={16} />
                    </button>
                  </div>
                </div>
              )}

              {role === 'institution_admin' && (
                <div className="w-full bg-blue-50/50 rounded-xl border border-blue-100/30 p-5 text-center mb-2">
                  <h4 className="text-[11px] font-bold text-[var(--color-primary)] oswald-font capitalize tracking-wider mb-1.5">Institutional Portal Active</h4>
                  <p className="text-[10px] text-gray-500 brcob-font leading-relaxed">
                    Scale your campus impact and empower your faculty with our specialized tools.
                  </p>
                </div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="mt-6 w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-[11px] capitalize tracking-widest oswald-font shadow-lg shadow-[var(--color-primary)]/15 hover:bg-[#1a147a] transition-all"
              >
                Enter Dashboard
              </motion.button>
              
              <p className="mt-4 text-[9px] text-gray-400 font-medium capitalize tracking-[0.2em]">Network Secure & Accredited</p>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-[var(--color-primary)]" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
