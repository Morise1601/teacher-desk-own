'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'left';
  width?: string;
}

export function Sheet({ open, onClose, title, description, children, footer, side = 'right', width = 'max-w-sm' }: SheetProps) {
  // Lock scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'fixed top-0 bottom-0 z-[201] flex flex-col bg-white shadow-2xl border-l border-gray-100 w-full',
              width,
              side === 'right' ? 'right-0' : 'left-0 border-l-0 border-r border-gray-100'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                {title && <h2 className="text-base font-bold text-gray-800 tracking-tight capitalize">{title}</h2>}
                {description && <p className="text-xs text-gray-400 font-medium tracking-tight mt-0.5 capitalize">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 ml-4 mt-0.5 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {children}
            </div>

            {/* Fixed Footer */}
            {footer && (
              <div className="mt-auto">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Convenience sub-components for slotted usage ── */
export function SheetFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex gap-3', className)}>
      {children}
    </div>
  );
}
