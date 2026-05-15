'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle } from 'react-icons/fa';

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1.5 align-middle group">
      <FaInfoCircle 
        className="text-gray-300 hover:text-[var(--color-primary)] cursor-help transition-colors duration-200" 
        size={11}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)} // Mobile support
      />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-[#143c64] text-white text-[10px] rounded-xl shadow-[0_8px_30px_rgba(20,60,100,0.3)] z-[1000] brcob-font leading-relaxed text-center pointer-events-none border border-white/10"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#143c64]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
