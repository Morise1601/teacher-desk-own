'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from "@/app/shared/NavBar";
import Footer from "@/app/shared/Footer";
import Modal from '@/app/shared/Modal';
import ClassroomHeader from '@/app/features/classroom/ClassroomHeader';
import ClassroomTabs from '@/app/features/classroom/ClassroomTabs';
import UpcomingTasks from '@/app/features/classroom/UpcomingTasks';
import PerformanceStats from '@/app/features/classroom/PerformanceStats';
import QuickAIHelp from '@/app/features/classroom/QuickAIHelp';
import StreamContent from '@/app/features/classroom/StreamContent';
import VirtualClassMeetModal from '@/app/features/classroom/VirtualClassMeetModal';
import MeetingGenerator from '@/app/features/classroom/MeetingGenerator';
import ScheduledMeetingsList from '@/app/features/classroom/ScheduledMeetingsList';
import AutoReminder from '@/app/features/classroom/AutoReminder';
import { motion, AnimatePresence } from 'framer-motion';
import { createMeetingAction } from '@/app/actions/meeting';
import { encryptData, decryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

type TabType = 'Stream' | 'Classwork' | 'People' | 'Resources';

function ClassroomContent() {
    const [activeTab, setActiveTab] = useState<TabType>('Stream');
    const [isMeetOpen, setIsMeetOpen] = useState(false);
    const [activeRoom, setActiveRoom] = useState('TeacherDesk-AdvancedMath-A');
    const [isJoinPromptOpen, setIsJoinPromptOpen] = useState(false);
    const [joinMeetId, setJoinMeetId] = useState('');
    const searchParams = useSearchParams();

    // Load meeting state from localStorage on mount
    useEffect(() => {
        const savedRoom = localStorage.getItem('activeMeetRoom');
        const savedIsOpen = localStorage.getItem('isMeetOpen') === 'true';

        if (savedIsOpen && savedRoom) {
            setActiveRoom(savedRoom);
            setIsMeetOpen(true);
        }
    }, []);

    useEffect(() => {
        const room = searchParams.get('room');
        if (room) {
            setActiveRoom(room);
            setIsMeetOpen(true);
            // Persistent storage
            localStorage.setItem('activeMeetRoom', room);
            localStorage.setItem('isMeetOpen', 'true');
        }
    }, [searchParams]);

    const handleJoinMeet = (room?: string) => {
        const finalRoom = room || activeRoom;
        if (room) setActiveRoom(room);
        setIsMeetOpen(true);
        localStorage.setItem('activeMeetRoom', finalRoom);
        localStorage.setItem('isMeetOpen', 'true');
    };

    const handleCloseMeet = () => {
        setIsMeetOpen(false);
        localStorage.removeItem('isMeetOpen');
        // We keep the room name but clear the open status
    };

    const submitJoinPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (joinMeetId.trim()) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Session expired");
                return;
            }

            // Sync with database first
            try {
                const now = new Date();
                const payload = {
                    title: joinMeetId.trim(),
                    subject: 'Ad-hoc Classroom Meet',
                    meeting_date: now.toISOString().split('T')[0],
                    start_time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    meet_link: `Class-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    teacher_id: user.id
                };

                const encryptedRes = await createMeetingAction(encryptData(payload));
                const res = decryptData(encryptedRes);

                if (res.success) {
                    setIsJoinPromptOpen(false);
                    handleJoinMeet(payload.meet_link);
                    toast.success("Meeting recorded and starting");
                }
            } catch (err) {
                console.error("Failed to sync meeting:", err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f3f5]">
            <Navbar />

            {/* Tab Navigation */}
            <ClassroomTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="max-w-7xl mx-auto px-2 md:px-4 pb-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'Stream' && (
                        <motion.div
                            key="stream"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4 }}
                        >
                            <ClassroomHeader
                                classTitle="Advanced Mathematics"
                                section="Section A • Graduate"
                                teacherName="Prof. Sarah Jenkins"
                                onJoinMeet={() => setIsJoinPromptOpen(true)}
                            />

                            {/* Live Activity Bar */}
                            <div className="bg-white/60 backdrop-blur-md rounded-lg border border-white/40 p-2.5 md:p-3 mb-6 md:mb-8 flex items-center justify-between shadow-sm overflow-hidden">
                                <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                                    <span className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-ping"></span>
                                    <p className="text-[10px] md:text-[12px] font-bold text-gray-600 capitalize tracking-widest flex-shrink-0">Live</p>
                                    <div className="h-4 w-[1px] bg-gray-200" />
                                    <p className="text-[11px] md:text-[13px] text-gray-500 font-medium truncate">18 students active</p>
                                </div>
                                <div className="flex -space-x-1.5 md:-space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] md:text-[10px] font-bold">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-gray-600">+14</div>
                                </div>
                            </div>

                            {/* Mobile Stats (Only visible on small/medium screens) */}
                            <div className="lg:hidden mb-6">
                                <PerformanceStats />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                                {/* Sidebar (Desktop) */}
                                <div className="hidden lg:flex col-span-1 flex-col gap-6">
                                    <ScheduledMeetingsList />
                                    <MeetingGenerator onJoin={handleJoinMeet} />
                                    <AutoReminder />
                                    <PerformanceStats />
                                    <UpcomingTasks />
                                    <QuickAIHelp />
                                </div>

                                {/* Main Content */}
                                <div className="col-span-1 lg:col-span-3">
                                    <StreamContent />

                                    {/* Mobile Mobile Widgets (Bottom) */}
                                    <div className="lg:hidden mt-8 flex flex-col gap-6">
                                        <UpcomingTasks />
                                        <QuickAIHelp />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Classwork' && (
                        <motion.div
                            key="classwork"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="py-8"
                        >
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold oswald-font text-[var(--color-primary)]">Classwork</h2>
                                    <button className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                                        + Create
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {[
                                        { title: 'Module 1: Calculus Basics', status: 'Completed', color: 'green' },
                                        { title: 'Module 2: Advanced Integration', status: 'Ongoing', color: 'blue' }
                                    ].map((module, mIdx) => (
                                        <div key={mIdx} className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                                <h3 className="text-lg font-bold text-[var(--color-primary)] brcob-font">
                                                    {module.title}
                                                </h3>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${module.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {module.status}
                                                </span>
                                            </div>
                                            {[1, 2].map((item) => (
                                                <div key={item} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-[var(--color-secondary)]/30 cursor-pointer transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-gray-800 text-[15px]">Assignment {item}: Practice Problems</h4>
                                                                {item === 1 && <span className="text-[10px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded italic">Priority</span>}
                                                            </div>
                                                            <p className="text-sm text-gray-400">Posted Jan {20 + item} • <span className="text-[var(--color-secondary)] font-medium">100 points</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="hidden md:block text-right">
                                                            <p className="text-[11px] text-gray-400 font-bold capitalize">Due</p>
                                                            <p className="text-[13px] text-gray-700 font-medium">Oct {25 + item}</p>
                                                        </div>
                                                        <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-secondary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'People' && (
                        <motion.div
                            key="people"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="py-6 md:py-8 max-w-3xl mx-auto w-full px-2"
                        >
                            <section className="mb-8 md:mb-12">
                                <h2 className="text-xl md:text-3xl font-bold border-b-2 border-[var(--color-primary)] pb-3 md:pb-4 text-[var(--color-primary)] mb-4 md:mb-6 oswald-font capitalize tracking-wide">Teachers</h2>
                                <div className="flex items-center gap-4 p-3 md:p-4 bg-white rounded-lg shadow-sm border border-gray-50">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">S</div>
                                    <span className="text-base md:text-lg font-bold text-gray-800 brcob-font">Prof. Sarah Jenkins</span>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between border-b-2 border-[var(--color-primary)] pb-3 md:pb-4 mb-4 md:mb-6">
                                    <h2 className="text-xl md:text-3xl font-bold text-[var(--color-primary)] oswald-font capitalize tracking-wide">Students</h2>
                                    <span className="text-gray-400 text-xs md:text-sm font-bold capitalize">24 total</span>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    {['Alex Rivera', 'Jordan Smith', 'Maria Garcia', 'Sam Wilson'].map((student, sIdx) => (
                                        <div key={sIdx} className="flex items-center gap-4 p-3 md:p-4 bg-white/50 rounded-lg border border-gray-100 hover:bg-white transition-colors">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm md:text-base">{student.charAt(0)}</div>
                                            <span className="text-gray-700 font-medium md:font-bold text-sm md:text-base brcob-font">{student}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === 'Resources' && (
                        <motion.div
                            key="resources"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="py-8 md:py-12 text-center px-2"
                        >
                            <div className="bg-white p-6 md:p-12 rounded-lg shadow-xl border border-gray-50 max-w-2xl mx-auto">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <svg className="w-8 h-8 md:w-10 md:h-10 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 brcob-font">Resource Library</h2>
                                <p className="text-sm text-gray-500 mb-8 px-4">Shared documents, textbooks, and tutorial videos for this class.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg hover:bg-white hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer transition-all">
                                        <h4 className="font-bold text-[var(--color-primary)] text-[13px] md:text-sm">Course Syllabus.pdf</h4>
                                    </div>
                                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg hover:bg-white hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer transition-all">
                                        <h4 className="font-bold text-[var(--color-primary)] text-[13px] md:text-sm">Textbook Links</h4>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <Footer />

            <VirtualClassMeetModal
                isOpen={isMeetOpen}
                onClose={handleCloseMeet}
                roomName={activeRoom}
                displayName="Prof. Sarah Jenkins"
            />
            {/* Join Meet Modal */}
            <Modal
                isOpen={isJoinPromptOpen}
                onClose={() => setIsJoinPromptOpen(false)}
                title="Join Meeting"
            >
                <form onSubmit={submitJoinPrompt} className="flex flex-col gap-4">
                    <p className="text-gray-600 text-sm">Please enter the Meeting ID provided by your teacher to join.</p>
                    <input
                        type="text"
                        value={joinMeetId}
                        onChange={(e) => setJoinMeetId(e.target.value)}
                        placeholder="e.g. Classroom-A1B2C3D"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-medium"
                        autoFocus
                        required
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsJoinPromptOpen(false)}
                            className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!joinMeetId.trim()}
                            className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-[#0f2c4a] transition-all"
                        >
                            Join Now
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default function ClassroomPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f1f3f5] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div></div>}>
            <ClassroomContent />
        </Suspense>
    );
}
