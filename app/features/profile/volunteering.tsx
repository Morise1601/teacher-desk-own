'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeartbeat, FaPlus, FaTrash, FaCheck, FaTimes, FaMarker } from 'react-icons/fa';
import { Input } from "@/components/ui/input";

interface Volunteering {
  role: string;
  organization: string;
  duration: string;
  description: string;
}

interface VolunteeringSectionProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function VolunteeringSection({ profile, onUpdate }: VolunteeringSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<Volunteering[]>(profile.volunteering || []);

  const handleAddItem = () => {
    setItems([...items, { role: '', organization: '', duration: '', description: '' }]);
    setIsEditing(true);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: keyof Volunteering, value: string) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleSave = () => {
    onUpdate({ ...profile, volunteering: items });
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 relative group mt-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-red-50 text-red-500 flex items-center justify-center border border-red-100/50 shadow-sm">
            <FaHeartbeat size={14} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 oswald-font tracking-tight">Social Contributions</h2>
            <p className="text-[10px] text-gray-400 font-medium brcob-font tracking-wider">Volunteering and service highlights</p>
          </div>
        </div>
        
        <div className="flex gap-2.5">
           {!isEditing ? (
             <>
                <button onClick={handleAddItem} title="Add Entry" className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100">
                  <FaPlus size={13} />
                </button>
                <button onClick={() => setIsEditing(true)} title="Edit Section" className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100">
                  <FaMarker size={13} />
                </button>
             </>
           ) : (
             <div className="flex gap-2.5">
                <button onClick={() => { setIsEditing(false); setItems(profile.volunteering || []); }} title="Cancel" className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm border border-gray-100">
                   <FaTimes size={13} />
                </button>
                <button onClick={handleSave} title="Save Changes" className="p-2.5 rounded-lg bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm border border-gray-100">
                   <FaCheck size={13} />
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
            <motion.div 
              key={idx} 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className={`relative pb-6 last:pb-0 ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                   <Input 
                      placeholder="Role (e.g., Development Volunteer)" 
                      value={item.role} 
                      onChange={(e) => handleChange(idx, 'role', e.target.value)}
                      className="rounded-md border-gray-100 text-sm focus:border-[var(--color-primary)]/40 h-10"
                   />
                   <Input 
                      placeholder="Organization" 
                      value={item.organization} 
                      onChange={(e) => handleChange(idx, 'organization', e.target.value)}
                      className="rounded-md border-gray-100 text-sm focus:border-[var(--color-primary)]/40 h-10"
                   />
                   <Input 
                      placeholder="Duration" 
                      value={item.duration} 
                      onChange={(e) => handleChange(idx, 'duration', e.target.value)}
                      className="rounded-md border-gray-100 text-sm focus:border-[var(--color-primary)]/40 h-10"
                   />
                   <Input 
                      placeholder="Short Description" 
                      value={item.description} 
                      onChange={(e) => handleChange(idx, 'description', e.target.value)}
                      className="rounded-md border-gray-100 text-sm focus:border-[var(--color-primary)]/40 h-10"
                   />
                   <button onClick={() => removeItem(idx)} className="text-[10px] text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 font-bold brcob-font capitalize tracking-widest mt-1">
                      <FaTrash size={8} /> Remove Entry
                   </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="hidden md:block w-7 h-7 rounded bg-gray-50 border border-gray-100 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 tracking-tight">{item.role || "Untitled Contribution"}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[11px] font-medium text-[var(--color-primary)]">{item.organization || "No Organization"}</span>
                       <span className="text-[10px] text-gray-300">•</span>
                       <span className="text-[11px] text-gray-400 font-medium brcob-font">{item.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed tracking-tight">{item.description}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!items.length && !isEditing && (
        <div className="text-center py-6">
           <p className="text-[11px] text-gray-400 font-medium capitalize tracking-[0.2em] brcob-font">No volunteer records found</p>
        </div>
      )}
    </motion.div>
  );
}
