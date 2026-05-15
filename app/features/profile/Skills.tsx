'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, X, Pencil, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";

interface SkillsProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function Skills({ profile, onUpdate }: SkillsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [draft, setDraft] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const openSheet = () => {
    setDraft([...skills]);
    setNewSkill('');
    setIsOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !draft.includes(newSkill.trim())) {
      setDraft([...draft, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => setDraft(draft.filter(s => s !== skill));

  const handleSave = () => {
    setSkills(draft);
    onUpdate({ ...profile, skills: draft });
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
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 shadow-sm">
              <Layers size={14} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none capitalize">skills & expertise</h2>
              <p className="text-xs text-gray-400 font-medium tracking-tight mt-1 capitalize">core competencies</p>
            </div>
          </div>
          <button
            onClick={openSheet}
            className="p-2.5 rounded-lg bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.length ? skills.map(skill => (
            <span key={skill} className="inline-flex items-center px-3 py-1.5 bg-gray-50/30 border border-gray-100 text-gray-700 rounded-md text-xs font-semibold capitalize shadow-sm">
              {skill}
            </span>
          )) : (
            <p className="text-xs text-gray-400 py-5 italic">no skills yet. hover & click edit to add.</p>
          )}
        </div>
      </motion.div>

      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="edit skills" description="core competencies">
        <div className="space-y-5 pb-20">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="add skill..."
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              className="h-8 text-xs rounded-md border-gray-100 bg-white flex-1"
            />
            <button type="submit" className="p-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:brightness-110 transition-all flex items-center justify-center shadow-md shadow-blue-900/10">
              <Plus size={14} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {draft.map(skill => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50/30 border border-gray-100 text-gray-700 rounded-md text-xs font-semibold capitalize shadow-sm"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X size={10} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-gray-100 bg-white flex gap-3 justify-end z-[100002]">
          <button onClick={() => setIsOpen(false)} className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors capitalize tracking-widest">cancel</button>
          <button onClick={handleSave} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all flex items-center gap-2 capitalize tracking-widest">
            <Check size={14} /> save changes
          </button>
        </div>
      </Sheet>
    </>
  );
}
