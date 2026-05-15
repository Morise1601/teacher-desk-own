'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

export default function MyProgress() {
    return (
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <h2 className="text-2xl md:text-3xl font-bold oswald-font text-[var(--color-primary)] mb-8 flex items-center">
                <span className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-[var(--color-primary)]/20">
                    <FiClock />
                </span>
                My Learning Progress
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Active Course Card 1 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg p-6 shadow-xl border border-gray-100 flex flex-col"
                >
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-xs font-bold px-3 py-1 rounded-full capitalize tracking-tighter">
                            Active
                        </span>
                        <span className="text-gray-400 text-xs flex items-center">
                            <FiClock className="mr-1" /> Expiring in 2 days
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 brcob-font mb-2">Digital Classroom Fundamentals</h3>
                    <p className="text-gray-500 text-sm mb-6 flex-grow">Instructor: Dr. Sarah Johnson</p>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                            <span>PROGRESS</span>
                            <span>65%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "65%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                    <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="participant" width={32} height={32} />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center font-bold">
                                +12
                            </div>
                        </div>
                        <button className="text-[var(--color-primary)] font-bold text-sm hover:underline">
                            Continue Learning →
                        </button>
                    </div>
                </motion.div>

                {/* Active Course Card 2 (Completed) */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg p-6 shadow-xl border border-gray-100 flex flex-col"
                >
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full capitalize tracking-tighter">
                            Completed
                        </span>
                        <FiCheckCircle className="text-green-500 text-xl" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 brcob-font mb-2">Pedagogical Innovation in STEM</h3>
                    <p className="text-gray-500 text-sm mb-6 flex-grow">Instructor: Prof. Mark Chen</p>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-green-600 mb-2">
                            <span>COMPLETED</span>
                            <span>100%</span>
                        </div>
                        <div className="w-full bg-green-50 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-green-500" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                            Download Certificate
                        </button>
                        <button className="text-[var(--color-primary)] font-bold text-sm hover:underline">
                            Review Course
                        </button>
                    </div>
                </motion.div>

                {/* Join New Course Prompt */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg p-6 shadow-2xl flex flex-col items-center justify-center text-center text-white relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                    <h3 className="text-2xl font-bold oswald-font mb-4">Start Something New?</h3>
                    <p className="text-white/80 text-sm mb-6 max-w-[200px]">Unlock more than 50+ premium courses for teachers.</p>
                    <button className="bg-white text-[var(--color-primary)] px-8 py-3 rounded-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
                        Browse All
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
