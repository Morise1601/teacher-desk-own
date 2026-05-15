'use client';

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import Navbar from "@/app/shared/NavBar";
import Footer from "@/app/shared/Footer";
import VirtualClassMeetModal from '@/app/features/classroom/VirtualClassMeetModal';
import { motion } from 'framer-motion';
import { HiCalendar, HiClock, HiLocationMarker, HiVideoCamera, HiChevronLeft, HiCheckCircle, HiXCircle, HiLockClosed, HiTrash, HiPencil } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import 'react-calendar/dist/Calendar.css';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { deleteMeetingAction, updateMeetingAction, getTeacherMeetingsAction } from "@/app/actions/meeting";
import Modal from "@/app/shared/Modal";
import Sheet from "@/app/shared/Sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

interface Event {
    id: string;
    title: string;
    startTime: string; 
    endTime: string;   
    location: string;
    date: Date;
    status: 'pending' | 'accepted' | 'declined';
    meetLink?: string;
    subject?: string;
}

export default function CalendarPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMeetOpen, setIsMeetOpen] = useState(false);
    const [activeRoom, setActiveRoom] = useState('');
    const [loading, setLoading] = useState(true);

    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [eventToRemoveId, setEventToRemoveId] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchMeetings(user.id);
            }
        };
        init();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchMeetings = async (uid: string) => {
        setLoading(true);
        try {
            const encryptedData = await getTeacherMeetingsAction(uid);
            const response = decryptData(encryptedData);
            if (response.success && response.data) {
                const mappedEvents: Event[] = response.data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    startTime: m.start_time.substring(0, 5),
                    endTime: m.start_time, 
                    location: m.classroom_id || 'Virtual Class',
                    date: new Date(m.meeting_date),
                    status: 'accepted',
                    meetLink: m.meet_link,
                    subject: m.subject
                }));
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Failed to load meetings:", error);
        } finally {
            setLoading(false);
        }
    };

    const eventsForDate = events.filter(
        event => event.date.toDateString() === selectedDate.toDateString()
    );

    const checkJoinEligibility = (event: Event) => {
        const now = currentTime;
        const [hours, minutes] = event.startTime.split(':').map(Number);
        const eventStart = new Date(event.date);
        eventStart.setHours(hours, minutes, 0, 0);
        const diffInMinutes = (eventStart.getTime() - now.getTime()) / 60000;
        // Visible only BEFORE the start time (up to 15 mins before)
        return diffInMinutes <= 15 && diffInMinutes >= 0; 
    };

    const handleJoinMeet = (event: Event) => {
        const room = event.meetLink || `TeacherDesk-${event.id}`;
        setActiveRoom(room);
        setIsMeetOpen(true);
    };

    const formatTo12Hour = (time24: string) => {
        if (!time24) return "";
        const [hoursStr, minutesStr] = time24.split(":");
        let hours = parseInt(hoursStr, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setIsEditSheetOpen(true);
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEvent && userId) {
            setDataLoading(true);
            try {
                const payload = {
                    id: editingEvent.id,
                    title: editingEvent.title,
                    subject: editingEvent.subject,
                    meeting_date: editingEvent.date.toISOString().split('T')[0],
                    start_time: editingEvent.startTime
                };
                const encryptedRes = await updateMeetingAction(encryptData(payload));
                const res = decryptData(encryptedRes);
                if (res.success) {
                    toast.success("Meeting updated!");
                    setIsEditSheetOpen(false);
                    fetchMeetings(userId);
                }
            } catch (err) {
                toast.error("Update failed");
            } finally {
                setDataLoading(false);
            }
        }
    };

    const handleRemoveEvent = (id: string) => {
        setEventToRemoveId(id);
        setIsConfirmationModalOpen(true);
    };

    const confirmRemoveEvent = async () => {
        if (eventToRemoveId && userId) {
            setDataLoading(true);
            try {
                const encryptedRes = await deleteMeetingAction(eventToRemoveId);
                const res = decryptData(encryptedRes);
                if (res.success) {
                    toast.success("Meeting removed");
                    fetchMeetings(userId);
                }
            } catch (err) {
                toast.error("Deletion failed");
            } finally {
                setDataLoading(false);
                setIsConfirmationModalOpen(false);
            }
        }
    };

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const hasEvent = events.some(
                event => event.date.toDateString() === date.toDateString()
            );
            if (hasEvent) return 'has-events';
        }
        return null;
    };

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const dayEvents = events.filter(
                event => event.date.toDateString() === date.toDateString()
            );
            if (dayEvents.length > 0) {
                return (
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <div className="w-2.5 h-2.5 bg-[var(--color-secondary)] rounded-full shadow-lg border-2 border-white" />
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 mb-12">
                {/* Back Navigation & Breadcrumb */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/classroom')}
                        className="group flex items-center gap-2 text-gray-400 hover:text-[var(--color-primary)] transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                            <HiChevronLeft className="text-lg" />
                        </div>
                        <span className="font-bold oswald-font capitalize tracking-widest text-xs">Back to classroom</span>
                    </button>

                    <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-gray-600 brcob-font">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • IST
                        </span>
                    </div>
                </div>

                {/* Main Content Card - Responsive Layout */}
                <div className="bg-white rounded-lg shadow-xl border border-white/40 overflow-hidden flex flex-col lg:flex-row min-h-[500px] md:min-h-[600px]">

                    {/* Left: Balanced Calendar Panel */}
                    <div className="flex-1 p-5 md:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-50 flex flex-col overflow-hidden">
                        <div className="flex items-center gap-4 mb-6 md:mb-8">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-900/20">
                                <HiCalendar className="text-xl md:text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold oswald-font text-[var(--color-primary)] capitalize tracking-tight">
                                    Planning <span className="text-[var(--color-secondary)]">Center</span>
                                </h1>
                                <p className="text-gray-400 font-bold capitalize tracking-[0.2em] text-xs mt-0.5">Manage academic sessions</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col pt-2 md:pt-4 overflow-hidden">
                            <div className="w-full h-full">
                                <Calendar
                                    onChange={(val) => setSelectedDate(val as Date)}
                                    value={selectedDate}
                                    tileContent={tileContent}
                                    tileClassName={tileClassName}
                                    className="full-page-calendar border-none shadow-none w-full"
                                    prev2Label={null}
                                    next2Label={null}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Agenda Panel - Optimized for Screen Fit */}
                    <div className="w-full lg:w-[350px] xl:w-[400px] bg-gray-50/50 p-5 md:p-8 lg:p-10 flex flex-col shrink-0">
                        <div className="mb-6 md:mb-8">
                            <span className="text-xs font-bold text-gray-300 capitalize tracking-[0.3em] mb-2 block">Selected timeline</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 brcob-font flex items-baseline gap-2">
                                {selectedDate.getDate()}
                                <span className="text-base md:text-lg text-[var(--color-secondary)] opacity-60">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                            </h2>
                            <p className="text-sm md:text-base text-[var(--color-secondary)] font-medium italic">
                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[400px] lg:max-h-none">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-gray-400 capitalize tracking-widest">Syncing schedule...</p>
                                </div>
                            ) : eventsForDate.length > 0 ? (
                                eventsForDate.map(event => {
                                    const isEligible = checkJoinEligibility(event);
                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-white p-5 md:p-6 rounded-lg shadow-sm border border-transparent hover:border-[var(--color-secondary)]/20 hover:shadow-xl transition-all relative group"
                                        >
                                            <div className="absolute top-5 right-5 flex items-center gap-2">
                                                 <button 
                                                     onClick={() => handleEditEvent(event)}
                                                     className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-blue-50 rounded-lg transition-all"
                                                     title="Edit Meeting"
                                                 >
                                                     <HiPencil size={14} />
                                                 </button>
                                                 <button 
                                                     onClick={() => handleRemoveEvent(event.id)}
                                                     className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                     title="Remove Meeting"
                                                 >
                                                     <HiTrash size={14} />
                                                 </button>
                                             </div>

                                             <h4 className="text-base md:text-lg font-bold text-gray-800 mb-4 group-hover:text-[var(--color-secondary)] transition-colors pr-16 leading-tight">
                                                 {event.title}
                                             </h4>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3 text-[12px] md:text-[13px] text-gray-500 font-medium">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                                        <HiClock className="text-base" />
                                                    </div>
                                                    <span>{formatTo12Hour(event.startTime)} IST</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[12px] md:text-[13px] text-gray-500 font-medium">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <HiLocationMarker className="text-base" />
                                                    </div>
                                                    <span>{event.location}</span>
                                                </div>
                                            </div>

                                            {isEligible ? (
                                                <button
                                                    onClick={() => handleJoinMeet(event)}
                                                    className="w-full py-3 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold oswald-font capitalize tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[var(--color-secondary)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                                >
                                                    <HiVideoCamera className="text-lg" />
                                                    Join Meeting
                                                </button>
                                            ) : (
                                                <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold oswald-font capitalize tracking-[0.2em] flex items-center justify-center gap-2 cursor-not-allowed">
                                                    <HiLockClosed className="text-lg" />
                                                    Locked
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="py-12 lg:h-full flex flex-col items-center justify-center text-center p-8 bg-white/40 rounded-lg border-2 border-dashed border-gray-100">
                                    <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-100 mb-6 border border-gray-50">
                                        <HiCalendar className="text-3xl" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-400 oswald-font capitalize tracking-widest">No classes scheduled</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <VirtualClassMeetModal
                isOpen={isMeetOpen}
                onClose={() => setIsMeetOpen(false)}
                roomName={activeRoom}
                displayName="Teacher Name"
            />

            {/* Edit Meeting Sheet */}
            <Sheet 
                isOpen={isEditSheetOpen} 
                onClose={() => setIsEditSheetOpen(false)} 
                title="Edit Class Meeting"
            >
                {editingEvent && (
                    <form onSubmit={handleUpdateEvent} className="flex flex-col h-full">
                        <div className="flex-1 space-y-8 py-4">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] block ml-1">General information</Label>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-700 ml-1">Meeting Title</Label>
                                    <Input
                                        value={editingEvent.title}
                                        onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                                        className="bg-gray-50/50 border-gray-100 h-12 text-sm font-medium focus:ring-[var(--color-primary)] rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-700 ml-1">Category / Subject</Label>
                                    <Input
                                        value={editingEvent.subject || ''}
                                        onChange={(e) => setEditingEvent({...editingEvent, subject: e.target.value})}
                                        className="bg-gray-50/50 border-gray-100 h-12 text-sm font-medium focus:ring-[var(--color-primary)] rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] block ml-1">Timing & schedule</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700 ml-1">Date</Label>
                                        <Input
                                            type="date"
                                            value={editingEvent.date.toISOString().split('T')[0]}
                                            onChange={(e) => setEditingEvent({...editingEvent, date: new Date(e.target.value)})}
                                            className="bg-gray-50/50 border-gray-100 h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-700 ml-1">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={editingEvent.startTime}
                                            onChange={(e) => setEditingEvent({...editingEvent, startTime: e.target.value})}
                                            className="bg-gray-50/50 border-gray-100 h-12 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 bg-white sticky bottom-0">
                            <button
                                type="submit"
                                disabled={dataLoading}
                                className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-xs capitalize tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:opacity-95 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {dataLoading ? 'Processing...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                )}
            </Sheet>

            {/* Delete Confirmation Modal */}
            <Modal 
                isOpen={isConfirmationModalOpen} 
                onClose={() => setIsConfirmationModalOpen(false)} 
                title="Confirm Deletion"
            >
                <div className="py-2">
                    <p className="text-gray-700 text-sm font-medium">Are you sure you want to remove this scheduled meeting? This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button 
                        onClick={() => setIsConfirmationModalOpen(false)} 
                        className="px-5 py-2 text-xs font-bold capitalize tracking-widest text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmRemoveEvent}
                        disabled={dataLoading}
                        className="px-5 py-2 text-xs font-bold capitalize tracking-widest text-white bg-red-500 rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                        {dataLoading ? 'Deleting...' : 'Remove meeting'}
                    </button>
                </div>
            </Modal>

            <style jsx global>{`
                /* Professional Calendar Overrides */
                .react-calendar {
                    width: 100% !important;
                    background: transparent !important;
                    border: none !important;
                    font-family: inherit !important;
                    padding: 0;
                }

                /* Navigation Styling */
                .react-calendar__navigation {
                    margin-bottom: 2rem !important;
                    height: 50px !important;
                }
                .react-calendar__navigation button {
                    min-width: 44px;
                    background: white !important;
                    border-radius: 0.75rem !important; 
                    margin: 0 4px;
                    border: 1px solid #e2e8f0 !important;
                    color: var(--color-primary) !important;
                    font-weight: 800 !important;
                    text-transform: capitalize;
                    font-size: 0.75rem;
                    letter-spacing: 0.1em;
                    transition: all 0.2s;
                }
                .react-calendar__navigation button:hover:enabled {
                    background: #f8fafc !important;
                    border-color: var(--color-primary) !important;
                    transform: translateY(-1px);
                }

                /* Weekday Abbreviations */
                .react-calendar__month-view__weekdays {
                    font-weight: 800 !important;
                    text-transform: capitalize !important;
                    font-size: 0.7rem !important;
                    letter-spacing: 0.15em !important;
                    color: #94a3b8 !important;
                    padding-bottom: 1rem !important;
                }

                /* Date Tiles - Square Design */
                .react-calendar__tile {
                    aspect-ratio: 1 / 1 !important;
                    background: white !important;
                    border: 1px solid #f1f5f9 !important;
                    border-radius: 12px !important; 
                    font-weight: 800 !important;
                    font-size: 1rem !important;
                    color: #1e293b !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex !important;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center !important;
                    position: relative;
                    padding: 0 !important;
                    height: auto !important;
                    min-height: 0 !important;
                }

                .react-calendar__tile:hover:enabled {
                    background: #f8fafc !important;
                    border-color: var(--color-primary) !important;
                    color: var(--color-primary) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                    z-index: 5;
                }

                .react-calendar__tile.has-events {
                    background: rgba(20, 60, 100, 0.04) !important;
                    border-color: rgba(20, 60, 100, 0.1) !important;
                    color: #1e293b !important;
                }
                
                .react-calendar__tile.has-events:hover {
                    background: rgba(20, 60, 100, 0.08) !important;
                    color: var(--color-primary) !important;
                }

                .react-calendar__tile--active {
                    background: var(--color-primary) !important;
                    color: white !important;
                    box-shadow: 0 10px 20px -5px rgba(20, 60, 100, 0.3) !important;
                    border-color: var(--color-primary) !important;
                    border-radius: 12px !important;
                    z-index: 10;
                }

                .react-calendar__tile--now {
                    background: #f0fff4 !important;
                    color: var(--color-secondary) !important;
                    border: 2px solid #bdf0cc !important;
                }

                .react-calendar__month-view__days__day--neighboringMonth {
                    opacity: 0.2;
                }

                .react-calendar__month-view__days__day--weekend {
                    color: #f43f5e !important;
                }
                .react-calendar__tile--active.react-calendar__month-view__days__day--weekend {
                    color: white !important;
                }
            `}</style>
        </div>
    );
}
