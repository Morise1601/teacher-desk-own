'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { IoIosCloseCircle } from "react-icons/io";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Sheet({ isOpen, onClose, title, children, footer }: SheetProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size)';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0';
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    const backdropVariants: Variants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const sheetVariants: Variants = {
        visible: { x: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } },
        hidden: { x: '100%', transition: { type: 'spring', damping: 25, stiffness: 200 } },
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] z-[99999]"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    {/* Sheet Content */}
                    <motion.div
                        className="relative w-full max-w-md bg-white h-full shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-[100000] flex flex-col"
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sheet Header */}
                        <div className="flex items-center justify-between px-8 py-8 border-b border-gray-100 bg-white sticky top-0 z-[100001]">
                            <div>
                                {title && (
                                    <h3 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight leading-tight">{title}</h3>
                                )}
                                <p className="text-xs font-bold text-gray-400 capitalize tracking-[0.25em] mt-1.5 ml-0.5">Management console</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-all hover:scale-110 active:scale-95 p-1"
                                aria-label="Close sheet"
                            >
                                <IoIosCloseCircle className="text-4xl text-[var(--color-primary)]" />
                            </button>
                        </div>

                        {/* Sheet Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar-thin bg-white h-full overscroll-contain">
                            {children}
                        </div>

                        {/* Sheet Footer */}
                        {footer && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 sticky bottom-0 z-[100001]">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
