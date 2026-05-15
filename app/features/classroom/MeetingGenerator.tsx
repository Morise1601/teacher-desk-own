'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiLink, HiCheck, HiRefresh, HiShare } from 'react-icons/hi';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';

interface MeetingGeneratorProps {
    className?: string;
    onJoin: (room: string) => void;
}

const MeetingGenerator: React.FC<MeetingGeneratorProps> = ({ className, onJoin }) => {
    const [roomName, setRoomName] = useState(`Classroom-${Math.random().toString(36).substring(7).toUpperCase()}`);
    const [copied, setCopied] = useState(false);

    const generateNew = () => {
        setRoomName(`Classroom-${Math.random().toString(36).substring(7).toUpperCase()}`);
        setCopied(false);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/classroom?room=${roomName}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const meetingUrl = typeof window !== 'undefined' ? `${window.location.origin}/classroom?room=${roomName}` : '';

    return (
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border border-white p-6 shadow-xl shadow-gray-200/50 ${className}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
                    <HiShare className="text-2xl" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 oswald-font capitalize tracking-tight leading-tight">Instant Meeting</h3>
                    <p className="text-[11px] font-medium text-gray-400 capitalize tracking-widest tracking-widest">Generate & Share Link</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Room Display */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 flex flex-col gap-2 relative group italic">
                    <span className="text-[10px] text-gray-400 font-bold capitalize tracking-widest">Meeting ID</span>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--color-primary)] oswald-font tracking-wide">{roomName}</span>
                        <button
                            onClick={generateNew}
                            className="p-2 text-gray-400 hover:text-[var(--color-secondary)] hover:bg-white rounded-lg transition-all shadow-sm"
                            title="Generate New ID"
                        >
                            <HiRefresh className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Share Actions */}
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copyLink}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all border ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-100 text-gray-700 hover:border-[var(--color-primary)] shadow-sm'}`}
                    >
                        {copied ? <HiCheck /> : <HiLink className="text-blue-400" />}
                        {copied ? 'Copied Link' : 'Copy Link'}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onJoin(roomName)}
                        className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-95 transition-all"
                    >
                        Start Meeting
                    </motion.button>
                </div>

                {/* Social Share (Possibilities implemented) */}
                <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest text-center mb-3">Quick Share</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=Join my Teacher Desk meeting: ${meetingUrl}`, '_blank')}
                            className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                        >
                            <FaWhatsapp className="text-lg" />
                        </button>
                        <button
                            onClick={() => window.open(`mailto:?subject=Classroom Meeting Link&body=Please join the meeting here: ${meetingUrl}`, '_blank')}
                            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        >
                            <FaEnvelope className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingGenerator;
