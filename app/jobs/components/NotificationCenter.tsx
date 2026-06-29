// app/jobs/components/NotificationCenter.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaTimes, FaBell, FaCheckCircle, FaCalendarAlt, 
    FaExclamationCircle, FaUserCheck, FaEnvelopeOpen, FaCheckDouble 
} from 'react-icons/fa';
import { JobNotification } from '../types';
import { jobsRepository } from '../jobsRepository';

interface NotificationCenterProps {
    isOpen: boolean;
    userId: string;
    onClose: () => void;
    unreadCountChange?: (count: number) => void;
}

export default function NotificationCenter({ isOpen, userId, onClose, unreadCountChange }: NotificationCenterProps) {
    const [notifs, setNotifs] = useState<JobNotification[]>([]);

    const loadNotifications = async () => {
        try {
            const data = await jobsRepository.getNotifications(userId);
            setNotifs(data);
            if (unreadCountChange) {
                const unread = data.filter(n => !n.isRead).length;
                unreadCountChange(unread);
            }
        } catch (err) {
            console.error('Failed to load notifications', err);
        }
    };

    useEffect(() => {
        if (isOpen || userId) {
            loadNotifications();
        }

        // Poll every 8 seconds for simulation demo freshness
        const interval = setInterval(() => {
            loadNotifications();
        }, 8000);

        return () => clearInterval(interval);
    }, [isOpen, userId]);

    const handleMarkAllRead = async () => {
        try {
            await jobsRepository.markNotificationsRead(userId);
            await loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: JobNotification['type']) => {
        switch (type) {
            case 'new_match':
                return <FaBell className="text-blue-500" />;
            case 'app_viewed':
                return <FaEnvelopeOpen className="text-slate-500" />;
            case 'shortlisted':
                return <FaUserCheck className="text-emerald-500" />;
            case 'interview_invite':
                return <FaCalendarAlt className="text-purple-500" />;
            case 'job_closing':
                return <FaExclamationCircle className="text-red-500" />;
            case 'new_applicant':
                return <FaCheckCircle className="text-blue-600" />;
            default:
                return <FaBell className="text-gray-400" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/35 backdrop-blur-2xs"
                    />

                    {/* Drawer panel */}
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-white shadow-2xl flex flex-col border-l border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                <FaBell className="text-[var(--color-primary)]" /> Jobs Activity Alerts
                            </h3>
                            <div className="flex items-center gap-3">
                                {notifs.some(n => !n.isRead) && (
                                    <button 
                                        onClick={handleMarkAllRead}
                                        className="text-[10px] text-[var(--color-primary)] hover:underline font-bold flex items-center gap-1"
                                        title="Mark all as read"
                                    >
                                        <FaCheckDouble /> Read All
                                    </button>
                                )}
                                <button 
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-slate-50 transition"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                            {notifs.map(n => (
                                <div 
                                    key={n.id}
                                    className={`p-3 rounded-xl border transition-all duration-200 flex gap-3 relative ${
                                        n.isRead 
                                            ? 'bg-white border-slate-100 opacity-75' 
                                            : 'bg-blue-50/30 border-blue-100/50 shadow-2xs'
                                    }`}
                                >
                                    {!n.isRead && (
                                        <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                                    )}
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs flex-shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="text-xs font-bold text-gray-800 leading-tight truncate">
                                            {n.title}
                                        </h4>
                                        <p className="text-2xs text-gray-500 mt-0.5 leading-relaxed leading-normal">
                                            {n.message}
                                        </p>
                                        <span className="text-[9px] text-gray-400 mt-1 block">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {notifs.length === 0 && (
                                <div className="text-center py-16">
                                    <FaBell className="mx-auto text-4xl text-slate-100 mb-3" />
                                    <h4 className="text-xs font-bold text-slate-400">Quiet for now</h4>
                                    <p className="text-[10px] text-slate-300 mt-1 max-w-[200px] mx-auto">Notifications regarding applications, listings, and matching alerts will arrive here.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
