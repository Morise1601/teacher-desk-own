'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Trash, Check, Pencil } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";

interface Education {
  degree: string;
  institution: string;
  duration: string;
}

interface EducationSectionProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function EducationSection({ profile, onUpdate }: EducationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Education[]>(profile.education || []);
  const [draft, setDraft] = useState<Education[]>(profile.education || []);

  const openSheet = () => {
    setDraft(JSON.parse(JSON.stringify(items)));
    setIsOpen(true);
  };

  const addEntry = () => {
    setDraft([...draft, { degree: '', institution: '', duration: '' }]);
  };

  const removeEntry = (idx: number) => {
    setDraft(draft.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: keyof Education, value: string) => {
    const next = [...draft];
    next[idx][field] = value;
    setDraft(next);
  };

  const handleSave = () => {
    setItems(draft);
    onUpdate({ ...profile, education: draft });
    setIsOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-md shadow-[0_1px_5px_rgba(0,0,0,0.01)] border border-gray-100 p-6 md:p-7 relative group"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-green-50 text-green-500 flex items-center justify-center border border-green-100 shadow-sm">
              <GraduationCap size={14} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none capitalize">academic path</h2>
              <p className="text-[10px] text-gray-400 font-medium tracking-tight mt-1 capitalize">education history</p>
            </div>
          </div>
          <button
            onClick={openSheet}
            className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {items.length ? items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 bg-gray-50/10 rounded-md border border-gray-50 hover:border-gray-100 transition-all"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-gray-800 tracking-tight mb-1 capitalize">{item.degree || "untitled"}</h3>
                <span className="text-[12px] font-semibold text-[var(--color-primary)] capitalize">{item.institution}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 lowercase flex-shrink-0">{item.duration}</span>
            </motion.div>
          )) : (
            <p className="text-[10px] text-gray-400 text-center py-8 italic">no education records. click edit to add.</p>
          )}
        </div>
      </motion.div>

      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="edit education" description="academic background">
        <div className="space-y-4 pb-20">
          <button onClick={addEntry} className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:bg-blue-50/50 px-4 py-2 rounded-lg transition-all w-fit">
            <Plus size={14} /> Add New Entry
          </button>

          <AnimatePresence mode="popLayout">
            {draft.map((item, idx) => (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5 p-4 border border-gray-100 rounded-md bg-gray-50/20 relative"
              >
                <button onClick={() => removeEntry(idx)} className="absolute top-3 right-3 p-2 rounded-lg bg-white text-gray-400 hover:text-red-500 hover:border-red-100 border border-transparent hover:border-gray-100 transition-all shadow-sm">
                  <Trash size={12} />
                </button>
                <p className="text-[10px] font-semibold text-gray-400 capitalize">entry {idx + 1}</p>
                <Input placeholder="Degree / Certificate" value={item.degree} onChange={e => handleChange(idx, 'degree', e.target.value)} className="h-8 text-[11px] rounded-md border-gray-100 bg-white" />
                <Input placeholder="School / University" value={item.institution} onChange={e => handleChange(idx, 'institution', e.target.value)} className="h-8 text-[11px] rounded-md border-gray-100 bg-white" />
                <Input placeholder="Duration (e.g. 2019 – 2023)" value={item.duration} onChange={e => handleChange(idx, 'duration', e.target.value)} className="h-8 text-[11px] rounded-md border-gray-100 bg-white" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-gray-100 bg-white flex gap-3 justify-end z-[100002]">
          <button onClick={() => setIsOpen(false)} className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Check size={14} /> save changes
          </button>
        </div>
      </Sheet>
    </>
  );
}
