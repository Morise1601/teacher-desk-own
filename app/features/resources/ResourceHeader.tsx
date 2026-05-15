'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';

export default function ResourceHeader() {
    return (
        <section className="relative min-h-[450px] md:h-[500px] flex items-center justify-center overflow-hidden bg-[var(--color-primary)]">
            {/* Animated background patterns */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-secondary)_0%,_transparent_70%)] opacity-50" />
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[var(--color-secondary)] rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 relative z-10 text-center py-16 md:py-0">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold oswald-font text-white mb-6 capitalize tracking-wider leading-tight"
                >
                    Learn Without <span className="text-[var(--color-secondary)] brightness-150">Limits</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-200 text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light brcob-font px-2"
                >
                    Expand your teaching horizons with our curated resource hub. Master new tools and methodologies today.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center bg-white rounded-lg sm:rounded-full p-1.5 sm:p-2 shadow-2xl space-y-2 sm:space-y-0"
                >
                    <div className="flex-grow flex items-center px-4 w-full">
                        <FiSearch className="text-gray-400 mr-2 text-xl" />
                        <input
                            type="text"
                            placeholder="What do you want to learn today?"
                            className="w-full bg-transparent outline-none py-3 text-gray-700 brcob-font text-sm sm:text-base"
                        />
                    </div>
                    <button className="bg-[var(--color-primary)] text-white w-full sm:w-auto px-10 py-3.5 rounded-lg sm:rounded-full font-bold hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg shadow-[var(--color-primary)]/20 active:scale-95">
                        Search
                    </button>
                </motion.div>

                <div className="mt-10 flex flex-wrap justify-center gap-2 md:gap-4">
                    {['Pedagogy', 'Digital Tools', 'Assessment', 'Leadership', 'Well-being'].map((tag, i) => (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            key={tag}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all hover:scale-105 active:scale-95"
                        >
                            {tag}
                        </motion.button>
                    ))}
                </div>
            </div>
        </section>
    );
}
