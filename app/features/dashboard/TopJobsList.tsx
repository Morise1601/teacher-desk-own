'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaBriefcase, FaArrowRight } from 'react-icons/fa';
import { MdTrendingUp } from 'react-icons/md';

const fallbackJobs = [
    { id: 'j1', title: 'Senior Mathematics Teacher', rate: '₹45k - ₹65k', description: 'Delhi Public School is looking for a Math teacher.' },
    { id: 'j2', title: 'Physics Teacher (PGT)', rate: '₹40k - ₹55k', description: 'Ryan International School requires a PGT Physics.' },
    { id: 'j3', title: 'English Language Teacher', rate: '₹30k - ₹45k', description: 'Kendriya Vidyalaya is hiring English Teachers.' },
    { id: 'j4', title: 'Computer Science Teacher', rate: '₹35k - ₹50k', description: 'The Heritage School requires CS PGT.' }
];

export default function TopJobsList({ jobs }: { jobs?: any[] }) {
    const list = jobs && jobs.length > 0 ? jobs : fallbackJobs;

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                <h4 className="font-bold text-md text-gray-800 oswald-font capitalize tracking-tighter flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-50 text-red-600 rounded flex items-center justify-center">
                        <MdTrendingUp className="text-sm animate-pulse" />
                    </span> 
                    Top Vacancies
                </h4>
                <Link
                    href="/jobs"
                    className="text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)] hover:underline flex items-center gap-1 transition-colors group"
                >
                    View All 
                    <FaArrowRight className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* List */}
            <ul className="space-y-3">
                {list.map((job) => (
                    <motion.li
                        key={job.id}
                        whileHover={{ x: 2 }}
                        className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5 transition-colors cursor-pointer group"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-xs text-gray-800 leading-snug group-hover:text-[var(--color-primary)] transition-colors truncate">
                                {job.title}
                            </span>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                {job.rate}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                            {job.description}
                        </p>
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}
