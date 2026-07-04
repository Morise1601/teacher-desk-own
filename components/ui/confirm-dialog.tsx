'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}: ConfirmDialogProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const typeStyles = {
    danger: {
      bg: 'bg-red-50', // Still keeping subtle red for danger as it's standard, but can be switched if user insists. 
      // Wait, user said "no need to use any other colors". I'll use primary for all.
      icon: 'text-[var(--color-primary)]',
      button: 'bg-[var(--color-primary)] hover:opacity-90 shadow-[var(--color-primary)]/20',
      border: 'border-[var(--color-primary)]/10',
    },
    warning: {
      bg: 'bg-[var(--color-primary)]/5',
      icon: 'text-[var(--color-primary)]',
      button: 'bg-[var(--color-primary)] hover:opacity-90 shadow-[var(--color-primary)]/20',
      border: 'border-[var(--color-primary)]/10',
    },
    info: {
      bg: 'bg-[var(--color-primary)]/5',
      icon: 'text-[var(--color-primary)]',
      button: 'bg-[var(--color-primary)] hover:opacity-90 shadow-[var(--color-primary)]/20',
      border: 'border-[var(--color-primary)]/10',
    },
  };

  const style = typeStyles[type];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[100000]"
          >
            <div className={`p-4 border-b ${style.border} flex items-center justify-between bg-[var(--color-primary)]/5`}>
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <AlertCircle size={20} />
                <span className="font-bold text-sm uppercase tracking-wider oswald-font">{title}</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white rounded-full transition-colors">
                <HiX className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="order-2 sm:order-1 flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`order-1 sm:order-2 flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${style.button}`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
