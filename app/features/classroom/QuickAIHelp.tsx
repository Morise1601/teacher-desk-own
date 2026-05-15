'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes } from 'react-icons/fa';

const QuickAIHelp = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 w-full mb-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full flex items-center justify-center text-white shadow-lg">
                        <FaRobot className="text-xl animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-800 brcob-font">Classroom AI Assistant</h3>
                        <p className="text-[12px] text-gray-400">Ask about calculus or syllabus</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full text-left py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors border border-gray-100"
                    >
                        &quot;Explain the derivative rule...&quot;
                    </button>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full text-left py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors border border-gray-100"
                    >
                        &quot;When is the next assignment due?&quot;
                    </button>
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
                    >
                        Chat with Tutor
                    </button>
                </div>
            </div>

            {/* Mini Chat Overlay (Simple version) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-[350px] bg-white rounded-lg shadow-2xl border border-gray-200 z-[100] overflow-hidden"
                    >
                        <div className="bg-[var(--color-primary)] p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaRobot className="text-xl" />
                                <span className="font-bold brcob-font">Classroom AI Agent</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="h-80 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                            <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-100 text-sm text-gray-700 shadow-sm max-w-[85%]">
                                Hello! I&apos;m your dedicated AI assistant for <b>Advanced Mathematics</b>. How can I help you today?
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type your question..."
                                    className="w-full py-2.5 pl-4 pr-12 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button className="absolute right-2 top-1.5 p-2 bg-[var(--color-secondary)] text-white rounded-full hover:opacity-90 transition-opacity">
                                    <FaPaperPlane size={12} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickAIHelp;
