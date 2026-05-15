'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Save, X, Edit3 } from 'lucide-react';

interface InstitutionAboutProps {
  institution: any;
  onUpdate: (data: any) => void;
}

export default function InstitutionAbout({ institution, onUpdate }: InstitutionAboutProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    about: institution.about || '',
    founded_year: institution.founded_year || '',
    staff_count: institution.staff_count || '',
    rank: institution.rank || ''
  });

  const handleSave = () => {
    onUpdate({ ...institution, ...formData });
    setIsEditing(false);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-md text-[var(--color-primary)]">
            <Info size={16} />
          </div>
          <h3 className="text-sm font-bold text-[#0d163a] capitalize tracking-wider oswald-font">About Institution</h3>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => {
              setFormData({
                about: institution.about || '',
                founded_year: institution.founded_year || '',
                staff_count: institution.staff_count || '',
                rank: institution.rank || ''
              });
              setIsEditing(true);
            }}
            className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100"
          >
            <Edit3 size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button onClick={() => setIsEditing(false)} className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm border border-gray-100">
              <X size={15} />
            </button>
            <button onClick={handleSave} className="p-2.5 rounded-lg bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm border border-gray-100">
              <Save size={15} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              className="w-full min-h-[150px] p-4 text-[13px] font-medium text-gray-700 bg-gray-50 border-none rounded-md focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all resize-none dm-font"
              placeholder="Tell us about your institution, its mission, and history..."
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                  <label className="text-[10px] capitalize font-bold text-gray-400 ml-1 mb-1 block">Established (Year)</label>
                  <input 
                    type="text" 
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    className="w-full p-2 bg-gray-50 rounded border-none text-[12px] font-bold"
                  />
               </div>
               <div>
                  <label className="text-[10px] capitalize font-bold text-gray-400 ml-1 mb-1 block">Staff Count</label>
                  <input 
                    type="text" 
                    value={formData.staff_count}
                    onChange={(e) => setFormData({ ...formData, staff_count: e.target.value })}
                    className="w-full p-2 bg-gray-50 rounded border-none text-[12px] font-bold"
                  />
               </div>
               <div>
                  <label className="text-[10px] capitalize font-bold text-gray-400 ml-1 mb-1 block">Global Rank</label>
                  <input 
                    type="text" 
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full p-2 bg-gray-50 rounded border-none text-[12px] font-bold"
                  />
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed whitespace-pre-wrap dm-font">
              {institution.about || "No description provided yet. Click the edit icon to add an overview of your institution."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEditing && (
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[120px] bg-gray-50/50 p-3 rounded-md border border-gray-100/50">
            <span className="block text-[9px] font-bold text-gray-400 capitalize tracking-tighter mb-1 font-sans">Established</span>
            <span className="text-[13px] font-bold text-gray-700 font-mono italic">{institution.founded_year || "N/A"}</span>
          </div>
          <div className="flex-1 min-w-[120px] bg-gray-50/50 p-3 rounded-md border border-gray-100/50">
            <span className="block text-[9px] font-bold text-gray-400 capitalize tracking-tighter mb-1 font-sans">Staff Count</span>
            <span className="text-[13px] font-bold text-gray-700 font-mono italic">{institution.staff_count || "50+"}</span>
          </div>
          <div className="flex-1 min-w-[120px] bg-gray-50/50 p-3 rounded-md border border-gray-100/50">
            <span className="block text-[9px] font-bold text-gray-400 capitalize tracking-tighter mb-1 font-sans">Global Rank</span>
            <span className="text-[13px] font-bold text-gray-700 font-mono italic">{institution.rank && institution.rank !== 'N/A' ? `#${institution.rank}` : "Top 100"}</span>
          </div>
        </div>
      )}
    </motion.section>
  );
}
