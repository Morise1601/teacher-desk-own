'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaPlus, FaTimes, FaMarker } from 'react-icons/fa';
import { Input } from "@/components/ui/input";

interface InterestsProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function Interests({ profile, onUpdate }: InterestsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [interests, setInterests] = useState<string[]>(profile.interests || []);

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updated = [...interests, newInterest.trim()];
      setInterests(updated);
      setNewInterest('');
    }
  };

  const removeInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleSave = () => {
    onUpdate({ ...profile, interests });
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
          <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50 shadow-sm">
            <FaHeart size={12} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 oswald-font tracking-tight">Interests & Hobbies</h4>
          </div>
        </div>
        
        <div className="flex gap-1.5 opacity-100 transition-opacity">
           <button onClick={() => setIsEditing(!isEditing)} title={isEditing ? "Cancel" : "Edit Section"} className="p-2 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all border border-gray-100 shadow-sm">
             {isEditing ? <FaTimes size={12} /> : <FaMarker size={12} />}
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {isEditing && (
           <form onSubmit={handleAddInterest} className="flex gap-2">
              <Input 
                placeholder="Add an interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                className="h-8 text-[11px] rounded-md border-gray-100 focus:border-[var(--color-primary)]/30 transition-all font-medium"
              />
              <button type="submit" className="p-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[#1a147a] transition-all">
                 <FaPlus size={10} />
              </button>
           </form>
        )}

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {interests.map((item, index) => (
              <motion.span 
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-md text-[10px] font-bold brcob-font tracking-wide hover:border-[var(--color-primary)]/20 transition-all capitalize"
              >
                {item}
                {isEditing && (
                   <button onClick={() => removeInterest(item)} className="text-red-400 hover:text-red-600 transition-colors">
                      <FaTimes size={8} />
                   </button>
                )}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {isEditing && (
           <button onClick={handleSave} className="w-full py-3 bg-green-50 text-green-600 border border-green-100 rounded-md text-[11px] font-bold capitalize tracking-widest transition-all hover:bg-green-500 hover:text-white brcob-font">
              Synchronize Interests
           </button>
        )}
      </div>

      {!interests.length && !isEditing && (
         <p className="text-[10px] text-gray-400 text-center py-4 font-medium italic brcob-font">No interests added.</p>
      )}
    </motion.div>
  );
}
