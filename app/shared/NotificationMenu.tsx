'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiDotsHorizontal, HiOutlineCheckCircle, HiBell, HiCalendar, HiVideoCamera, HiTrash, HiUserAdd, HiCheckCircle } from 'react-icons/hi';
import { FaBell } from 'react-icons/fa';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { decryptData } from '@/lib/crypto';
import { getUserNotificationsAction, markAsReadAction, markAllAsReadAction } from '@/app/actions/notification';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

export default function NotificationMenu({ active }: { active?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const pullNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let dbNotifs: Notification[] = [];
        const res = decryptData(await getUserNotificationsAction(user.id));
        if (res.success && res.data) {
            dbNotifs = res.data;
        }

        // Pull local storage job notifications
        let localNotifs: Notification[] = [];
        if (typeof window !== 'undefined') {
            const localNotifsRaw = localStorage.getItem('td_notifications_map');
            if (localNotifsRaw) {
                try {
                    const map = JSON.parse(localNotifsRaw);
                    const teacherNotifs = map['teacher-session-123'] || [];
                    const instNotifs = map['institution-session-456'] || [];
                    localNotifs = [...teacherNotifs, ...instNotifs].map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        is_read: n.isRead,
                        created_at: n.createdAt,
                        action_url: '/jobs'
                    }));
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // Combine and sort by date descending
        const combined = [...dbNotifs, ...localNotifs].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotifications(combined);
        setUnreadCount(combined.filter(n => !n.is_read).length);
    };

    useEffect(() => {
        pullNotifications();

        const handleJobsUpdated = () => {
            pullNotifications();
        };
        window.addEventListener('jobs:updated', handleJobsUpdated);

        // Real-time subscription
        const channel = supabase
            .channel('realtime_notifications')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications' 
            }, () => {
                pullNotifications();
            })
            .subscribe();

        return () => {
            window.removeEventListener('jobs:updated', handleJobsUpdated);
            supabase.removeChannel(channel);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        // Check if it's a local storage notification
        if (typeof window !== 'undefined') {
            const localNotifsRaw = localStorage.getItem('td_notifications_map');
            if (localNotifsRaw) {
                try {
                    const map = JSON.parse(localNotifsRaw);
                    let foundLocal = false;
                    for (const userId in map) {
                        const list = map[userId] || [];
                        const idx = list.findIndex((n: any) => n.id === id);
                        if (idx !== -1) {
                            list[idx].isRead = true;
                            map[userId] = list;
                            foundLocal = true;
                        }
                    }
                    if (foundLocal) {
                        localStorage.setItem('td_notifications_map', JSON.stringify(map));
                        window.dispatchEvent(new CustomEvent('jobs:updated'));
                        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // Database notification
        await markAsReadAction(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await markAllAsReadAction(user.id);
        }

        // Mark all local storage notifications as read
        if (typeof window !== 'undefined') {
            const localNotifsRaw = localStorage.getItem('td_notifications_map');
            if (localNotifsRaw) {
                try {
                    const map = JSON.parse(localNotifsRaw);
                    for (const userId in map) {
                        const list = map[userId] || [];
                        list.forEach((n: any) => { n.isRead = true; });
                        map[userId] = list;
                    }
                    localStorage.setItem('td_notifications_map', JSON.stringify(map));
                    window.dispatchEvent(new CustomEvent('jobs:updated'));
                } catch (e) {
                    console.error(e);
                }
            }
        }

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'meeting': return <HiCalendar className="text-blue-500" />;
            case 'live': return <HiVideoCamera className="text-red-500 animate-pulse" />;
            case 'friend_request': return <HiUserAdd className="text-[var(--color-secondary)]" />;
            case 'friend_request_accepted': return <HiCheckCircle className="text-emerald-500" />;
            case 'new_match': return <HiBell className="text-blue-500" />;
            case 'app_viewed': return <HiOutlineCheckCircle className="text-slate-500" />;
            case 'shortlisted': return <HiCheckCircle className="text-emerald-500" />;
            case 'interview_invite': return <HiCalendar className="text-purple-500" />;
            case 'job_closing': return <HiBell className="text-red-500" />;
            case 'new_applicant': return <HiCheckCircle className="text-blue-600" />;
            default: return <HiBell className="text-[var(--color-primary)]" />;
        }
    };

    // Desktop Action Item
    const handleToggleMenu = () => {
        if (!isOpen) {
            pullNotifications();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative group flex items-center h-full" ref={menuRef}>
            {/* Desktop Action Item */}
            <div
                className="relative cursor-pointer group flex flex-col items-center gap-0.5 pb-1 transition-colors"
                onClick={handleToggleMenu}
                title="Notifications"
            >
                <div className="relative">
                    <span className={`transition-colors text-xl ${active || isOpen ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] group-hover:text-[var(--color-secondary)]'}`}>
                        <FaBell />
                    </span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <span className={`lg:hidden xl:block text-[13px] font-medium leading-none transition-colors ${active || isOpen ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] group-hover:text-[var(--color-secondary)]'}`}>
                    Alerts
                </span>

                <motion.div
                    className="absolute left-0 bottom-0 h-[2px] rounded-full bg-[var(--color-secondary)]"
                    initial={false}
                    animate={{ width: active ? '100%' : (isOpen ? '100%' : '0%') }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
            </div>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-12 right-0 md:-right-24 xl:right-0 w-[380px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[#1a4a7a] p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    Notification Hub
                                </h3>
                                <p className="text-blue-100/70 text-xs capitalize tracking-widest font-bold mt-1">Real-time alerts & updates</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-md"
                                    title="Mark all as read"
                                >
                                    <HiOutlineCheckCircle className="text-lg" />
                                </button>
                                <button className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-md">
                                    <HiDotsHorizontal />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-y-auto sidebar-scroll bg-white">
                            {notifications.length > 0 ? (
                                notifications.map((noti) => (
                                    <div
                                        key={noti.id}
                                        onClick={async () => {
                                            await handleMarkAsRead(noti.id);
                                            if (noti.action_url) {
                                                window.location.href = noti.action_url;
                                            }
                                        }}
                                        className={`p-4 flex gap-4 cursor-pointer hover:bg-gray-50/80 transition-all border-b border-gray-50 last:border-0 relative ${!noti.is_read ? 'bg-blue-50/40' : ''}`}
                                    >
                                        {/* Unread Indicator Dot */}
                                        {!noti.is_read && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_10px_rgba(var(--color-secondary-rgb),0.5)]" />
                                        )}

                                        {/* Icon Container */}
                                        <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-lg shadow-sm bg-white border border-gray-100`}>
                                            {getIcon(noti.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-sm truncate pr-2 ${!noti.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                                                    {noti.title}
                                                </h4>
                                                <span className="text-xs whitespace-nowrap text-gray-400 font-bold capitalize">
                                                    {formatDistanceToNow(new Date(noti.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed ${!noti.is_read ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                                                {noti.message}
                                            </p>
                                            
                                            {(noti.action_url || noti.type === 'friend_request' || noti.type === 'friend_request_accepted') && (
                                                <div className="mt-3">
                                                    <Link 
                                                        href={noti.action_url || '/connections'}
                                                        className="text-xs font-bold text-[var(--color-primary)] capitalize tracking-wider h-7 px-3 bg-blue-50 rounded-lg flex items-center w-fit hover:bg-[var(--color-primary)] hover:text-white transition-all border border-blue-100"
                                                    >
                                                        View details
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-200 mb-6">
                                        <HiBell className="text-4xl" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-400 oswald-font capitalize tracking-[0.2em]">All catch up!</h3>
                                    <p className="text-xs text-gray-300 mt-2 max-w-[200px]">You're all settled. No new notifications haven't been seen.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-0 border-t border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <button 
                                onClick={handleMarkAllRead}
                                className="w-full text-center py-4 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-secondary)] capitalize tracking-[0.2em] transition-all"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
