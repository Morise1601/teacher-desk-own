'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';


export default function DegreeHero() {
    return (
        <section className="relative bg-[#0a192f] py-20 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-primary)] to-transparent" />
                <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-t from-[var(--color-secondary)] to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-7xl font-bold text-white oswald-font mb-6 leading-tight capitalize">
                            Your <span className="text-yellow-400">Future</span>, <br />
                            Accelerated.
                        </h1>
                        <p className="text-xl text-gray-300 mb-10 font-light brcob-font leading-relaxed max-w-lg">
                            Earn a world-class degree from top-ranked universities. 100% online, flexible, and career-focused.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white px-8 py-4 rounded-lg font-bold transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group">
                                Explore Degrees <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-lg font-bold transition-all">
                                How it Works
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="relative hidden md:block"
                    >
                        <div className="relative rounded-lg overflow-hidden border-8 border-white/10 shadow-2xl aspect-video">
                            <Image 
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000" 
                                alt="Students" 
                                fill
                                className="object-cover grayscale-20 opacity-80"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent" />
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-lg shadow-2xl max-w-[200px]">
                            <FiCheckCircle className="text-4xl text-green-500 mb-3" />
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                Accepted by 95% of Global Employers
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
