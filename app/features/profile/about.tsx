'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Pencil } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "@/components/ui/sheet";

interface AboutSectionProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function AboutSection({ profile, onUpdate }: AboutSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [about, setAbout] = useState(profile.about || '');

  const handleSave = () => {
    onUpdate({ ...profile, about });
    setIsOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-md shadow-[0_1px_5px_rgba(0,0,0,0.01)] border border-gray-100 p-6 md:p-7 relative group"
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shadow-sm">
              <User size={14} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none capitalize">about profile</h2>
              <p className="text-[10px] text-gray-400 font-medium tracking-tight mt-1 capitalize">professional summary</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
        </div>

        <p className="text-gray-600 leading-relaxed text-[13px] whitespace-pre-line font-medium tracking-tight">
          {profile.about || "No summary yet. Click edit to add one."}
        </p>
      </motion.div>

      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="edit summary" description="professional bio">
        <Textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Describe your professional journey..."
          className="min-h-[200px] rounded-md border-gray-100 text-[12px] leading-relaxed p-4 bg-gray-50/10 text-gray-800"
        />
        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-gray-100 bg-white flex gap-3 justify-end z-[100002]">
          <button onClick={() => setIsOpen(false)} className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all uppercase tracking-widest">save changes</button>
        </div>
      </Sheet>
    </>
  );
}
