'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiDotsHorizontal } from 'react-icons/hi';
import { FaEnvelope, FaPen } from 'react-icons/fa';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { decryptData } from '@/lib/crypto';
import { getChatContactsAction } from '@/app/actions/messages';

const mockMessages = [
    {
        id: 1,
        sender: 'AI Teacher Assistant',
        avatar: 'AI',
        text: 'Your lesson plan for tomorrow is ready for review.',
        time: '10:42 AM',
        unread: 1,
        color: 'bg-blue-100 text-blue-600'
    },
    {
        id: 2,
        sender: 'Sarah Jenkins',
        avatar: 'SJ',
        text: 'Can we reschedule our meeting to 3 PM? Thanks!',
        time: 'Yesterday',
        unread: 0,
        color: 'bg-green-100 text-green-600'
    },
    {
        id: 3,
        sender: 'Principal Smith',
        avatar: 'PS',
        text: 'Please remember to submit the weekly attendance report.',
        time: 'Mon',
        unread: 0,
        color: 'bg-purple-100 text-purple-600'
    },
    {
        id: 4,
        sender: 'Math Dept Group',
        avatar: 'MD',
        text: 'John: The new textbooks just arrived in the admin office.',
        time: 'Last Week',
        unread: 3,
        color: 'bg-orange-100 text-orange-600'
    }
];

export default function MessageMenu({ active }: { active?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                fetchUnreadCount(authUser.id);
                fetchPreviewMessages(authUser.id);
            }
        };
        init();
    }, []);

    // Realtime listener for message badge
    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel('navbar_messages').on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages' 
        }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new;
                if (newMsg.receiver_id === user.id) {
                    setUnreadCount(prev => prev + 1);
                    fetchPreviewMessages(user.id);
                }
            } else if (payload.eventType === 'UPDATE') {
                fetchUnreadCount(user.id);
                fetchPreviewMessages(user.id);
            }
        }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const fetchUnreadCount = async (userId: string) => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
        
        if (!error) setUnreadCount(count || 0);
    };

    const fetchPreviewMessages = async (userId: string) => {
        try {
            const res = decryptData(await getChatContactsAction(userId));
            if (res.success) {
                setMessages(res.data.slice(0, 5)); // Show top 5 recent chats
            }
        } catch (err) {
            console.error("Menu Fetch Error:", err);
        }
    };

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

    return (
        <div className="relative group flex items-center h-full" ref={menuRef}>
            {/* Desktop Action Item */}
            <Link
                href="/messages"
                className="relative cursor-pointer group flex flex-col items-center gap-0.5 pb-1 transition-colors"
                title="Messages"
            >
                <div className="relative">
                    <span className={`transition-colors text-xl ${active || isOpen ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] group-hover:text-[var(--color-secondary)]'}`}>
                        <FaEnvelope />
                    </span>
                    {/* Notification Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <span className={`lg:hidden xl:block text-[13px] font-medium leading-none transition-colors ${active || isOpen ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] group-hover:text-[var(--color-secondary)]'}`}>
                    Messages
                </span>

                <motion.div
                    className="absolute left-0 bottom-0 h-[2px] rounded-full bg-[var(--color-secondary)]"
                    initial={false}
                    animate={{ width: active ? '100%' : '0%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
            </Link>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-12 right-0 md:-right-24 xl:right-0 w-[360px] bg-white rounded-lg shadow-2xl border border-gray-100 z-[100] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-4 flex items-center justify-between">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                Message Center
                            </h3>
                            <div className="flex gap-2">
                                <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm">
                                    <FaPen className="text-sm" />
                                </button>
                                <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm">
                                    <HiDotsHorizontal />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 bg-gray-50 border-b border-gray-100">
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    className="w-full bg-white border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/50 transition-all font-medium text-gray-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex px-4 pt-2 pb-0 gap-4 text-sm font-semibold border-b border-gray-100">
                            <button className="text-[var(--color-secondary)] border-b-2 border-[var(--color-secondary)] pb-2 px-1">All Messages</button>
                            <button className="text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors">Unread ({unreadCount})</button>
                        </div>

                        {/* Messages List */}
                        <div className="max-h-[320px] overflow-y-auto sidebar-scroll">
                            {messages.filter(m => m.sender.toLowerCase().includes(searchQuery.toLowerCase())).map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={`/messages?userId=${msg.id}`}
                                    className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${msg.unread > 0 ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {msg.avatar ? (
                                            <img 
                                                src={msg.avatar} 
                                                className="w-12 h-12 rounded-full object-cover shadow-sm" 
                                                alt="" 
                                                onError={(e) => {
                                                    (e.target as any).style.display = 'none';
                                                    (e.target as any).nextElementSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm"
                                            style={{ display: msg.avatar ? 'none' : 'flex' }}
                                        >
                                            {msg.sender.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h4 className={`text-sm truncate mb-0.5 ${msg.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                            {msg.sender}
                                        </h4>
                                        <p className={`text-xs truncate ${msg.unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                                            {msg.lastMessage}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-[10px] font-medium whitespace-nowrap ${msg.unread > 0 ? 'font-semibold text-[var(--color-secondary)]' : 'text-gray-400'}`}>
                                            {msg.time}
                                        </span>
                                        {msg.unread > 0 && (
                                            <span className="bg-[var(--color-secondary)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                                {msg.unread}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {messages.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs font-bold capitalize tracking-widest oswald-font opacity-40">
                                    No conversations yet
                                </div>
                            )}
                        </div>

                        {/* Footer Link */}
                        <div className="p-0 border-t border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <Link href="/messages" className="block text-center py-3 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
                                View Full Message Center
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
