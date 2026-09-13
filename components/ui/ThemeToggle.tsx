'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'switch' | 'icon';
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'switch',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const isDark = isMounted ? theme === 'dark' : false;

  // Single button icon mode (used in compact bars like super-admin)
  if (variant === 'icon') {
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
    const buttonDimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';

    return (
      <motion.button
        type="button"
        onClick={toggleTheme}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`relative flex items-center justify-center rounded-lg border transition-all duration-300 ${buttonDimensions} ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700/80 shadow-sm'
            : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-100 shadow-sm'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon-icon"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={iconSize} className="text-amber-400 fill-amber-400/20" />
            </motion.div>
          ) : (
            <motion.div
              key="sun-icon"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={iconSize} className="text-amber-500 fill-amber-500/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  // Pill Switch mode (with sliding sun/moon knob)
  const sizeMap = {
    sm: {
      icon: 14,
      pill: 'w-13 h-7 p-0.5',
      knob: 'w-5 h-5',
    },
    md: {
      icon: 16,
      pill: 'w-16 h-8 p-1',
      knob: 'w-6 h-6',
    },
    lg: {
      icon: 18,
      pill: 'w-18 h-9 p-1',
      knob: 'w-7 h-7',
    },
  };

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-amber-400 focus-visible:ring-slate-500 shadow-inner'
          : 'bg-slate-200/90 border-slate-300/80 text-slate-700 focus-visible:ring-amber-400 shadow-inner'
      } ${sizeMap[size].pill} ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Track icons (subtle indicators behind knob) */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none select-none">
        <Sun
          size={sizeMap[size].icon - 2}
          className={`transition-opacity duration-300 ${
            isDark ? 'opacity-40 text-amber-400' : 'opacity-0'
          }`}
        />
        <Moon
          size={sizeMap[size].icon - 2}
          className={`transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-40 text-slate-500'
          }`}
        />
      </div>

      {/* Sliding Knob with Animated Sun / Moon */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 600,
          damping: 35,
        }}
        className={`relative z-10 flex items-center justify-center rounded-full shadow-md ${
          sizeMap[size].knob
        } ${
          isDark
            ? 'ml-auto bg-slate-800 text-amber-300 border border-slate-600'
            : 'mr-auto bg-white text-amber-500 border border-slate-200'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Moon size={sizeMap[size].icon} className="fill-amber-300/30 text-amber-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.2, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Sun size={sizeMap[size].icon} className="fill-amber-500/30 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showLabel && (
        <span className="ml-2 text-xs font-medium capitalize select-none">
          {theme}
        </span>
      )}
    </motion.button>
  );
}
