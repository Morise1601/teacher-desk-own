'use client';

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiCalendar, HiClock, HiLocationMarker, HiVideoCamera } from 'react-icons/hi';

interface Event {
    id: string;
    title: string;
    time: string;
    location: string;
    date: Date;
}

const mockEvents: Event[] = [
    {
        id: '1',
        title: 'Advanced Mathematics Lecture',
        time: '10:00 AM - 11:30 AM',
        location: 'Room 302 / Virtual Class',
        date: new Date(2026, 2, 10), // March 10, 2026
    },
    {
        id: '2',
        title: 'Department Sync',
        time: '02:00 PM - 03:00 PM',
        location: 'Office',
        date: new Date(2026, 2, 10),
    },
    {
        id: '3',
        title: 'Physics Practical',
        time: '09:00 AM - 12:00 PM',
        location: 'Lab A',
        date: new Date(2026, 2, 12),
    },
];

interface ClassroomCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoinMeet: (roomName: string) => void;
}

export default function ClassroomCalendarModal({ isOpen, onClose, onJoinMeet }: ClassroomCalendarModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isMaximized, setIsMaximized] = useState(true);

    const eventsForDate = mockEvents.filter(
        event => event.date.toDateString() === selectedDate.toDateString()
    );

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const hasEvent = mockEvents.some(
                event => event.date.toDateString() === date.toDateString()
            );
            if (hasEvent) {
                return <div className="w-1.5 h-1.5 bg-[var(--color-secondary)] rounded-full mt-1 mx-auto shadow-sm" />;
            }
        }
        return null;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 md:p-8"
                    onClick={onClose}
                >
                    <motion.div
                        layout
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0,
                            width: isMaximized ? '100%' : '90%',
                            height: isMaximized ? '100%' : '85%',
                            maxWidth: isMaximized ? '100%' : '1100px',
                            maxHeight: isMaximized ? '100%' : '750px',
                        }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        className="bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col md:flex-row border border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Sidebar: Calendar Control */}
                        <div className="flex-1 p-6 md:p-10 flex flex-col min-w-0">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                                        <HiCalendar className="text-2xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold oswald-font text-[var(--color-primary)] capitalize tracking-wide leading-none">
                                            Academic Schedule
                                        </h2>
                                        <p className="text-[11px] text-gray-400 font-bold capitalize tracking-widest mt-1">Teacher Desk Planner</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsMaximized(!isMaximized)}
                                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[var(--color-primary)] hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
                                        title={isMaximized ? "Minimize View" : "Full Screen View"}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {isMaximized ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            )}
                                        </svg>
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <HiX className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <Calendar
                                    onChange={(value) => setSelectedDate(value as Date)}
                                    value={selectedDate}
                                    tileContent={tileContent}
                                    className="class-planner-calendar border-none shadow-none w-full scale-110 origin-center"
                                    prev2Label={null}
                                    next2Label={null}
                                />
                            </div>
                        </div>

                        {/* Event Feed */}
                        <div className="w-full md:w-[400px] bg-gray-50 border-l border-gray-100 p-6 md:p-10 flex flex-col">
                            <div className="mb-8">
                                <p className="text-[11px] font-bold text-gray-400 capitalize tracking-[0.2em] mb-2">Selected Date</p>
                                <h3 className="text-2xl font-bold text-gray-800 brcob-font leading-tight">
                                    {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                    <span className="block text-sm text-[var(--color-secondary)] mt-1 font-medium italic">
                                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                {eventsForDate.length > 0 ? (
                                    <div className="space-y-6">
                                        {eventsForDate.map(event => (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="font-bold text-gray-800 text-[15px] group-hover:text-[var(--color-primary)] transition-colors pr-2">
                                                        {event.title}
                                                    </h4>
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                                                        <HiVideoCamera />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                                                            <HiClock className="text-amber-500" />
                                                        </div>
                                                        <span>{event.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                            <HiLocationMarker className="text-blue-500" />
                                                        </div>
                                                        <span>{event.location}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const room = `TeacherDesk-${event.title.replace(/\s+/g, '-')}-${event.id}`;
                                                        onJoinMeet(room);
                                                        onClose();
                                                    }}
                                                    className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold oswald-font capitalize tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[var(--color-secondary)] hover:shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Start Class Now
                                                    <HiVideoCamera className="text-lg" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/40 rounded-3xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-gray-100 mb-6 scale-110">
                                            <HiCalendar className="text-4xl" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-400 oswald-font capitalize tracking-widest leading-relaxed"> No Scheduled Classes for this date </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-10 rounded-full bg-[var(--color-secondary)]" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold capitalize tracking-widest">Next Meeting</p>
                                        <p className="text-xs font-bold text-gray-700">Mathematics • 08:30 AM Tomorrow</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
