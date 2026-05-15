'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaClock, FaCheckCircle } from 'react-icons/fa';

const PerformanceStats = () => {
    const stats = [
        { label: 'Total strength', value: '24', icon: <FaGraduationCap />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Attendance', value: '94%', icon: <FaClock />, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Completion', value: '88%', icon: <FaCheckCircle />, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 w-full mb-6">
            <h3 className="text-[15px] font-bold text-gray-800 mb-4 brcob-font">Your Standing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center text-lg`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[12px] text-gray-400 font-medium capitalize tracking-wider">{stat.label}</p>
                            <h4 className="text-[16px] font-bold text-gray-800">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-6 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-bold text-gray-500 capitalize">Syllabus Progress</span>
                    <span className="text-[12px] font-bold text-[var(--color-secondary)]">72%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '72%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                    />
                </div>
            </div>
        </div>
    );
};

export default PerformanceStats;
