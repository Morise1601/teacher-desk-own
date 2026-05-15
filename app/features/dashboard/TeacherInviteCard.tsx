'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaEnvelope, FaLink, FaCheck, FaWhatsapp, FaInstagram, FaShareAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { decryptData } from '@/lib/crypto';
import { getTeacherProfileIdAction } from '@/app/actions/teacher';
import { supabase } from '@/lib/supabase';

export default function TeacherInviteCard() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Join me on TeacherDesk: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaInstagram = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.info("Link copied! Share it on your Instagram.");
    window.open('https://www.instagram.com/', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-4 max-w-sm mx-auto overflow-hidden relative group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-[var(--color-primary)]/10"
    >
      {/* Innovative Background Design */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-white shadow-md shadow-[var(--color-primary)]/10">
            <FaUserPlus size={14} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 oswald-font tracking-tight">Invite Teachers</h4>
            <p className="text-[9px] text-gray-400 brcob-font font-medium capitalize tracking-widest">Growth referral active</p>
          </div>
        </div>
        <div className="flex gap-1.5">
           <motion.button 
             whileHover={{ y: -1 }} 
             onClick={shareViaWhatsApp} 
             className="w-7 h-7 rounded-md bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center border border-green-100/50 shadow-sm"
           >
             <FaWhatsapp size={12} />
           </motion.button>
           <motion.button 
             whileHover={{ y: -1 }} 
             onClick={shareViaInstagram} 
             className="w-7 h-7 rounded-md bg-pink-50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center border border-pink-100/50 shadow-sm"
           >
             <FaInstagram size={12} />
           </motion.button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {/* Sleek Input Group */}
        <div className="relative">
          <input
            type="email"
            placeholder="Recipient's email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 rounded-md pl-3 pr-10 py-2 text-xs text-gray-600 focus:outline-none focus:border-[var(--color-primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all brcob-font placeholder:text-gray-300"
          />
          <motion.button
            onClick={async (e) => {
              if (!email) return;
              setIsSending(true);
              setTimeout(() => {
                toast.success("Link sent!");
                setEmail('');
                setIsSending(false);
              }, 800);
            }}
            disabled={isSending}
            whileHover={{ scale: 1.05 }}
            className="absolute right-1 top-1 bottom-1 px-2.5 bg-[var(--color-primary)] text-white rounded-md flex items-center justify-center hover:bg-[#1a147a] transition-all shadow-sm"
          >
            {isSending ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaShareAlt size={10} />
            )}
          </motion.button>
        </div>

        {/* Improved Referral Path */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 p-1 rounded-md group/link transition-all hover:bg-white hover:border-[var(--color-primary)]/20 shadow-sm overflow-hidden">
          <div className="flex-1 min-w-0 flex items-center gap-2 px-1">
             <div className="w-5 h-5 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover/link:text-[var(--color-primary)]">
                <FaLink size={8} />
             </div>
             <span className="text-[10px] font-medium text-gray-400 truncate tracking-tight">{inviteLink}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[9px] font-bold transition-all flex items-center gap-1.5 ${copied ? 'bg-green-500 text-white shadow-green-100' : 'bg-white text-[var(--color-primary)] border border-gray-100 hover:border-[var(--color-primary)]'}`}
          >
            {copied ? <FaCheck size={8} /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Subtle Footer Activity */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            <span className="text-[8px] text-gray-400 brcob-font font-semibold capitalize tracking-widest">Network Secure</span>
         </div>
         <span className="text-[8px] text-gray-300 font-medium">Ready to share</span>
      </div>
    </motion.div>
  );
}
