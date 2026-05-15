'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLanguage, FaPlus, FaTimes, FaMarker, FaTrash } from 'react-icons/fa';
import { Input } from "@/components/ui/input";

interface Language {
  language: string;
  proficiency: string;
}

interface LanguagesSectionProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function LanguagesSection({ profile, onUpdate }: LanguagesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<Language[]>(profile.languages || []);

  const handleAddItem = () => {
    setItems([...items, { language: '', proficiency: '' }]);
    setIsEditing(true);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: keyof Language, value: string) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleSave = () => {
    onUpdate({ ...profile, languages: items });
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 group transition-all"
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50 shadow-sm">
            <FaLanguage size={14} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 oswald-font tracking-tight">Languages</h4>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => setIsEditing(!isEditing)} title={isEditing ? "Cancel" : "Edit Section"} className="p-2 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all border border-gray-100 shadow-sm">
             {isEditing ? <FaTimes size={12} /> : <FaMarker size={12} />}
           </button>
           {!isEditing && (
              <button onClick={handleAddItem} title="Add Language" className="p-2 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all border border-gray-100 shadow-sm">
                 <FaPlus size={12} />
              </button>
           )}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div 
              key={idx} 
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`pb-4 last:pb-0 ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              {isEditing ? (
                <div className="space-y-2 mt-2">
                   <Input 
                      placeholder="Language" 
                      value={item.language} 
                      onChange={(e) => handleChange(idx, 'language', e.target.value)}
                      className="rounded-md border-gray-100 text-[11px] focus:border-[var(--color-primary)]/30 h-8 font-medium"
                   />
                   <Input 
                      placeholder="Proficiency (e.g., Native, Full professional)" 
                      value={item.proficiency} 
                      onChange={(e) => handleChange(idx, 'proficiency', e.target.value)}
                      className="rounded-md border-gray-100 text-[11px] focus:border-[var(--color-primary)]/30 h-8 font-medium"
                   />
                   <button onClick={() => removeItem(idx)} className="text-[9px] text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold brcob-font capitalize tracking-widest mt-1">
                      <FaTrash size={8} /> Remove
                   </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-700">{item.language || "Unknown Language"}</span>
                  <span className="text-[10px] text-gray-400 font-medium brcob-font tracking-wide mt-0.5">{item.proficiency}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isEditing && (
           <button onClick={handleSave} className="w-full py-3 bg-green-50 text-green-600 border border-green-100 rounded-md text-[11px] font-bold capitalize tracking-widest transition-all hover:bg-green-500 hover:text-white brcob-font">
              Sync Languages
           </button>
        )}
      </div>

      {!items.length && !isEditing && (
         <p className="text-[10px] text-gray-400 text-center py-4 font-medium italic brcob-font">No languages added.</p>
      )}
    </motion.div>
  );
}
