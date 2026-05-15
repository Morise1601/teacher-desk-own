'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    icon?: React.ReactNode;
}

export default function LoadingScreen({ 
    message = "Synchronizing Data", 
    icon 
}: LoadingScreenProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white z-[9999]">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                    opacity: [0.4, 1, 0.4],
                    y: 0,
                    scale: [0.98, 1, 0.98]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 flex flex-col items-center"
            >
                <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-2xl shadow-[var(--color-primary)]/20 rotate-3 mb-6">
                    {icon || <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />}
                </div>
                <h1 className="text-4xl oswald-font font-bold text-[var(--color-primary)] tracking-tighter">
                    Teacher<span className="text-green-400">Desk</span>
                </h1>
            </motion.div>
            
            <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-primary)] to-green-400"
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            
            <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] oswald-font">
                {message}
            </p>
        </div>
    );
}
