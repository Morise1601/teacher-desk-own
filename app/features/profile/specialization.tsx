'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Pencil, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";

interface SpecializationsProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export default function SpecializationsSection({ profile, onUpdate }: SpecializationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(profile.specializations || []);
  const [draft, setDraft] = useState<string[]>(profile.specializations || []);
  const [newTag, setNewTag] = useState('');

  const openSheet = () => {
    setDraft([...tags]);
    setNewTag('');
    setIsOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !draft.includes(newTag.trim())) {
      setDraft([...draft, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => setDraft(draft.filter(t => t !== tag));

  const handleSave = () => {
    setTags(draft);
    onUpdate({ ...profile, specializations: draft });
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
            <div className="w-8 h-8 rounded-md bg-yellow-50 text-yellow-500 flex items-center justify-center border border-yellow-100 shadow-sm">
              <Tag size={14} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none capitalize">specialized niches</h4>
              <p className="text-xs text-gray-400 font-medium tracking-tight mt-1 capitalize">areas of focus</p>
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
          {tags.length ? tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-3 py-1.5 bg-yellow-50/20 border border-yellow-100/50 text-yellow-700/80 rounded-md text-xs font-semibold capitalize shadow-sm">
              {tag}
            </span>
          )) : (
            <p className="text-xs text-gray-400 py-5 italic">no focus areas. hover & click edit to add.</p>
          )}
        </div>
      </motion.div>

      <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="edit specializations" description="focused niches">
        <div className="space-y-5 pb-20">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="add specialization..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              className="h-8 text-xs rounded-md border-gray-100 bg-white flex-1"
            />
            <button type="submit" className="p-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:brightness-110 transition-all flex items-center justify-center shadow-md shadow-blue-900/10">
              <Plus size={14} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {draft.map(tag => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50/20 border border-yellow-100/50 text-yellow-700/80 rounded-md text-xs font-semibold capitalize shadow-sm"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-red-400 hover:text-red-600 transition-colors">
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
