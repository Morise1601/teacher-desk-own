'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCalendar, HiVideoCamera, HiChevronRight } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import { getTeacherMeetingsAction } from '@/app/actions/meeting';
import { decryptData } from '@/lib/crypto';
import Link from 'next/link';
import ScheduleMeetingModal from './ScheduleMeetingModal';

const ScheduledMeetingsList = ({ className }: { className?: string }) => {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchMeetings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const encrypted = await getTeacherMeetingsAction(user.id);
            const res = decryptData(encrypted);
            if (res.success) {
                const today = new Date().toISOString().split('T')[0];
                setMeetings(res.data.filter((m: any) => m.meeting_date >= today).sort((a: any, b: any) => a.meeting_date.localeCompare(b.meeting_date)).slice(0, 3));
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMeetings();
    }, [refreshKey]);

    if (loading) return <div className="h-24 animate-pulse bg-white rounded-lg border border-gray-100 mb-6"></div>;

    return (
        <div className={`bg-white/80 backdrop-blur-xl rounded-lg border border-white p-6 shadow-xl shadow-gray-200/50 ${className}`}>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                        <HiCalendar className="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 oswald-font tracking-tight leading-tight">Upcoming</h3>
                        <p className="text-xs font-bold text-gray-400 capitalize tracking-widest">Scheduled classes</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 border border-indigo-400" 
                    title="Schedule New Class"
                >
                    <HiVideoCamera size={12} />
                </button>
            </div>

            <div className="space-y-3">
                {meetings.length > 0 ? (
                    meetings.map((meet) => (
                        <div key={meet.id} className="group p-3 bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-xl transition-all cursor-pointer">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-bold text-gray-800 truncate leading-tight">{meet.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded capitalize tracking-tighter">
                                            {meet.meeting_date.split('-').slice(1).join('/')}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400">@ {meet.start_time.substring(0, 5)}</span>
                                    </div>
                                </div>
                                <Link 
                                    href={`/classroom/${meet.meet_link}`}
                                    className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                                >
                                    <HiVideoCamera size={14} />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 text-center border-2 border-dashed border-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-300 capitalize tracking-widest">No scheduled classes</p>
                    </div>
                )}
                
                <Link href="/dashboard" className="flex items-center justify-center gap-1.5 py-2 mt-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors capitalize tracking-widest border-t border-gray-50 pt-4">
                    View full schedule <HiChevronRight className="text-xs" />
                </Link>
            </div>

            <ScheduleMeetingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => setRefreshKey(k => k + 1)}
            />
        </div>
    );
};
export default ScheduledMeetingsList;
