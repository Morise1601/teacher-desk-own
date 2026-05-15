/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlusCircle, FaTrashAlt, FaEdit, FaLink } from 'react-icons/fa';
import { FiCalendar, FiClock, FiBook, FiList } from 'react-icons/fi';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import Link from "next/link";
import { HiVideoCamera } from 'react-icons/hi';

import Modal from '../../shared/Modal';
import Sheet from '../../shared/Sheet';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { 
    createMeetingAction, 
    getTeacherMeetingsAction, 
    deleteMeetingAction, 
    updateMeetingAction 
} from "@/app/actions/meeting";

import VirtualClassMeetModal from '../classroom/VirtualClassMeetModal';

// Define the precise types that react-calendar's onChange and value props use.
type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

// Define an interface for your event structure
interface CalendarEvent {
    id: string | number;
    date: Date;
    title: string;
    time: string;
    subject: string;   
    meetLink: string;  
}

export default function CalendarSchedulerWidget() {
    const [userId, setUserId] = useState<string | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isManageEventsModalOpen, setIsManageEventsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isMeetOpen, setIsMeetOpen] = useState(false);
    const [activeRoom, setActiveRoom] = useState('');
    const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
    const [instantTitle, setInstantTitle] = useState('');
    const [eventToRemoveId, setEventToRemoveId] = useState<string | number | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Calendar state
    const [value, onChange] = useState<CalendarValue>(new Date());
    const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);

    // Form state
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventDate, setNewEventDate] = useState<Date>(new Date());
    const [newEventSubject, setNewEventSubject] = useState('General');

    const subjects = ['Math', 'Science', 'English', 'History', 'Computer', 'General'];

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
        setDataLoading(true);
        try {
            const encryptedData = await getTeacherMeetingsAction(uid);
            const response = decryptData(encryptedData);
            if (response.success && response.data) {
                const mappedEvents = response.data.map((m: any) => ({
                    id: m.id,
                    date: new Date(m.meeting_date),
                    title: m.title,
                    time: m.start_time.substring(0, 5), // HH:mm
                    subject: m.subject || 'General',
                    meetLink: m.meet_link
                }));
                setCalendarEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Failed to load meetings:", error);
        } finally {
            setDataLoading(false);
        }
    };

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);
    const handleOpenManageEventsModal = () => setIsManageEventsModalOpen(true);
    const handleCloseManageEventsModal = () => setIsManageEventsModalOpen(false);
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingEvent(null);
    };

    const checkJoinEligibility = (event: CalendarEvent) => {
        const now = currentTime;
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventStart = new Date(event.date);
        eventStart.setHours(hours, minutes, 0, 0);
        const diffInMinutes = (eventStart.getTime() - now.getTime()) / 60000;
        // Visible only BEFORE the start time (up to 15 mins before)
        return diffInMinutes <= 15 && diffInMinutes >= 0; 
    };

    const handleJoinMeet = (event: CalendarEvent) => {
        setActiveRoom(event.meetLink);
        setIsMeetOpen(true);
    };

    const handleCopyLink = (meetId: string) => {
        const fullUrl = `https://meet.jit.si/${meetId}`;
        navigator.clipboard.writeText(fullUrl);
        toast.info("Meeting link copied to clipboard!");
    };

    const formatTo12Hour = (time24: string) => {
        if (!time24) return "";
        const [hoursStr, minutesStr] = time24.split(":");
        let hours = parseInt(hoursStr, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutesStr} ${ampm}`;
    };

    const getEventsForDate = (date: Date): CalendarEvent[] => {
        return calendarEvents.filter(event =>
            event.date.getFullYear() === date.getFullYear() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getDate() === date.getDate()
        );
    };

    const getDateFromCalendarValue = (calendarValue: CalendarValue): Date | null => {
        if (calendarValue instanceof Date) return calendarValue;
        if (Array.isArray(calendarValue) && calendarValue.length > 0 && calendarValue[0] instanceof Date) return calendarValue[0];
        return null;
    };

    const handleDateChange = (nextValue: CalendarValue) => {
        onChange(nextValue);
        const dateToProcess = getDateFromCalendarValue(nextValue);
        if (dateToProcess) {
            setSelectedDateEvents(getEventsForDate(dateToProcess));
            setNewEventDate(dateToProcess);
        }
    };

    const handleCreateInstantMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            toast.error("User session not found.");
            return;
        }

        if (!instantTitle.trim()) {
            toast.error("Please provide a title for your instant meeting.");
            return;
        }

        setDataLoading(true);
        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            const meetId = `Instant-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const payload = {
                title: instantTitle,
                subject: 'Quick Meeting',
                meeting_date: dateStr,
                start_time: timeStr,
                meet_link: meetId,
                teacher_id: userId
            };

            const encryptedRes = await createMeetingAction(encryptData(payload));
            const res = decryptData(encryptedRes);

            if (res.success) {
                const newEvent: CalendarEvent = {
                    id: res.data.id,
                    date: now,
                    title: instantTitle,
                    time: timeStr,
                    subject: 'Quick Meeting',
                    meetLink: meetId,
                };

                setCalendarEvents(prev => [...prev, newEvent]);
                setIsInstantModalOpen(false);
                setInstantTitle('');
                
                // Immediately open the meet
                setActiveRoom(meetId);
                setIsMeetOpen(true);
                toast.success("Instant meeting created and started!");
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast.error(`Instant meeting failed: ${error.message}`);
        } finally {
            setDataLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userId) {
            toast.error("User session not found. Please log in again.");
            return;
        }

        if (!newEventTitle.trim() || !newEventTime.trim()) {
            toast.error("Please provide a title and time for the meeting.");
            return;
        }

        setDataLoading(true);
        try {
            const meetId = `TeacherDesk-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            
            // Format date carefully to avoid timezone shifts
            const dateStr = newEventDate.toISOString().split('T')[0];
            
            const payload = {
                title: newEventTitle,
                subject: newEventSubject,
                meeting_date: dateStr,
                start_time: newEventTime,
                meet_link: meetId,
                teacher_id: userId
            };

            const encryptedRes = await createMeetingAction(encryptData(payload));
            const res = decryptData(encryptedRes);

            if (res.success) {
                const newEvent: CalendarEvent = {
                    id: res.data.id,
                    date: new Date(newEventDate),
                    title: newEventTitle,
                    time: newEventTime,
                    subject: newEventSubject,
                    meetLink: meetId,
                };

                setCalendarEvents(prev => [...prev, newEvent]);
                setNewEventTitle('');
                setNewEventTime('');
                handleCloseCreateModal();
                toast.success("Meeting scheduled successfully!");
                // Refresh list for the selected date
                setTimeout(() => {
                    setSelectedDateEvents(getEventsForDate(newEventDate));
                }, 100);
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            console.error("Scheduling Error:", error);
            toast.error(`Scheduling failed: ${error.message}`);
        } finally {
            setDataLoading(false);
        }
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditingEvent(event);
        setIsEditModalOpen(true);
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEvent) {
            setDataLoading(true);
            try {
                const payload = {
                    id: editingEvent.id,
                    title: editingEvent.title,
                    subject: editingEvent.subject,
                    meeting_date: editingEvent.date.toISOString().split('T')[0],
                    start_time: editingEvent.time
                };

                const encryptedRes = await updateMeetingAction(encryptData(payload));
                const res = decryptData(encryptedRes);

                if (res.success) {
                    setCalendarEvents(prevEvents =>
                        prevEvents.map(event =>
                            event.id === editingEvent.id ? { ...editingEvent } : event
                        )
                    );
                    handleCloseEditModal();
                    toast.success("Meeting updated successfully!");
                } else {
                    throw new Error(res.message);
                }
            } catch (error: any) {
                toast.error(`Update failed: ${error.message}`);
            } finally {
                setDataLoading(false);
            }
        }
    };

    const handleRemoveEvent = (eventId: string | number) => {
        setEventToRemoveId(eventId);
        setIsConfirmationModalOpen(true);
    };

    const confirmRemoveEvent = async () => {
        if (eventToRemoveId !== null) {
            setDataLoading(true);
            try {
                const encryptedRes = await deleteMeetingAction(eventToRemoveId.toString());
                const res = decryptData(encryptedRes);
                if (res.success) {
                    setCalendarEvents(prevEvents => prevEvents.filter(event => event.id !== eventToRemoveId));
                    toast.success("Meeting removed from schedule!");
                } else {
                    throw new Error(res.message);
                }
            } catch (error: any) {
                toast.error(`Deletion failed: ${error.message}`);
            } finally {
                setDataLoading(false);
            }
        }
        setIsConfirmationModalOpen(false);
        setEventToRemoveId(null);
    };

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length > 0) {
                return 'has-events';
            }
        }
        return null;
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length > 0) {
                return (
                    <div className="absolute top-1 right-1 flex flex-col gap-[2px]">
                        {dayEvents.slice(0, 1).map((event, index) => (
                            <div key={`${event.title}-${date.toISOString()}-${index}`} className="w-2 h-2 bg-[var(--color-secondary)] border border-white rounded-full shadow-sm" title={event.title}></div>
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    const formatDateForDisplay = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    useEffect(() => {
        const dateToProcess = getDateFromCalendarValue(value);
        if (dateToProcess) {
            setSelectedDateEvents(getEventsForDate(dateToProcess));
        }
    }, [calendarEvents, value]);

    return (
        <motion.div className="bg-white rounded-lg p-4 md:p-5 shadow-xl border border-gray-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)]/5 rounded-full blur-3xl pointer-events-none" />
            <ToastContainer />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <FiCalendar className="text-lg" />
                    </div>
                    <div>
                        <h2 className="text-md font-normal text-gray-800 oswald-font tracking-tight leading-none">
                            My <span className="text-[var(--color-primary)]">Schedule</span>
                        </h2>
                        <p className="text-xs text-gray-400 font-normal tracking-widest capitalize mt-0.5">Timeline & meetings</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                        className="h-8 px-2.5 rounded-lg bg-blue-50 text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm border border-blue-100 group/instant text-xs font-normal capitalize tracking-widest gap-1.5"
                        onClick={() => setIsInstantModalOpen(true)}
                    >
                        <HiVideoCamera size={12} className="group-hover/instant:animate-pulse" />
                        <span className="hidden xs:inline">Instant</span>
                    </button>
                    <button
                        className="w-8 h-8 rounded-lg bg-gray-50 text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm border border-gray-100 group/add"
                        onClick={handleOpenCreateModal}
                        title="Add Schedule"
                    >
                        <FaPlusCircle className='text-sm group-hover/add:rotate-180 transition-all duration-300' />
                    </button>
                </div>
            </div>

            <div className="react-calendar-container mb-3">
                <Calendar
                    onChange={handleDateChange}
                    value={value}
                    calendarType="gregory"
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    className="w-full border-none p-0 rounded-md"
                />
            </div>

            <div className="mt-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs capitalize tracking-widest font-normal text-gray-400 shrink-0">
                        {getDateFromCalendarValue(value) ? formatDateForDisplay(getDateFromCalendarValue(value) as Date) : 'Selected date'}
                    </h4>
                    <div className="h-px flex-1 bg-gray-100 ml-2"></div>
                    {dataLoading && <div className="ml-2 w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar-thin pr-1 sidebar-scroll scroll-smooth pb-1">
                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map((event) => (
                            <div key={event.id} className="group/event relative bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:border-[var(--color-primary)]/30 transition-all">
                                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-secondary)] rounded-l-lg opacity-70 group-hover/event:opacity-100 transition-opacity"></div>
                                <div className="pl-2 flex flex-col gap-1.5">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-normal text-gray-800 brcob-font pr-2 leading-tight max-w-[70%] text-ellipsis overflow-hidden">
                                            {event.title}
                                        </p>
                                        <span className="text-xs font-normal text-[var(--color-primary)] bg-blue-50/80 border border-blue-100 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                            <FiClock className="text-xs" /> {formatTo12Hour(event.time)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-normal text-gray-400 capitalize tracking-widest flex items-center gap-1 mt-0.5">
                                        <FiBook className="text-gray-300" /> {event.subject}
                                    </p>
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        {checkJoinEligibility(event) && (
                                            <>
                                                <button 
                                                    onClick={() => handleJoinMeet(event)}
                                                    className="w-full bg-[var(--color-secondary)] text-white text-xs font-normal py-1.5 rounded-md shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1"
                                                >
                                                    <HiVideoCamera size={10} /> Join now
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => handleCopyLink(event.meetLink)}
                                                        className="flex-1 bg-gray-50 text-[var(--color-primary)] text-xs font-normal py-1.5 rounded-md border border-gray-100 hover:bg-white transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <FaLink size={8} /> Copy link
                                                    </button>
                                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/event:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditEvent(event)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-md border border-transparent hover:border-gray-100"><FaEdit size={10} /></button>
                                                        <button onClick={() => handleRemoveEvent(event.id)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-md border border-transparent hover:border-gray-100"><FaTrashAlt size={10} /></button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg text-center bg-gray-50/50">
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-200 mb-2">
                                <FiCalendar className="text-base" />
                            </div>
                            <p className="text-xs font-normal text-gray-400 capitalize tracking-widest">No events scheduled</p>
                        </div>
                    )}
                </div>
            </div>

            <button
                className="mt-3 w-full text-center text-xs font-normal tracking-widest capitalize text-gray-500 hover:text-[var(--color-primary)] flex items-center justify-center gap-1.5 border border-gray-100 hover:border-[var(--color-primary)]/30 rounded-lg py-2.5 bg-gray-50 hover:bg-[var(--color-primary)]/5 transition-all relative z-10 cursor-pointer"
                onClick={handleOpenManageEventsModal}
            >
                <FiList className="text-xs" /> Manage all events
            </button>

            <Sheet isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Schedule Class Meeting">
                <form onSubmit={handleCreateEvent} className="flex flex-col h-full">
                    <div className="flex-1 space-y-6 py-4">
                        <div className="space-y-4">
                            <Label className="text-xs font-normal text-gray-400 capitalize tracking-[0.2em] block ml-1">General information</Label>
                            <div className="space-y-1.5">
                                <Label htmlFor="eventTitle" className="text-xs font-normal text-gray-700 ml-1">Meeting Title</Label>
                                <Input
                                    type="text"
                                    placeholder="Algebra 101 Introduction..."
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-11 text-sm font-normal focus:ring-[var(--color-primary)] rounded-lg"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-normal text-gray-700 ml-1">Category / Subject</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Mathematics..."
                                    value={newEventSubject}
                                    onChange={(e) => setNewEventSubject(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-11 text-sm font-normal focus:ring-[var(--color-primary)] rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-normal text-gray-400 capitalize tracking-[0.2em] block ml-1">Timing & schedule</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-normal text-gray-700 ml-1">Date</Label>
                                    <Input
                                        type="date"
                                        value={newEventDate.toISOString().split('T')[0]}
                                        onChange={(e) => setNewEventDate(new Date(e.target.value))}
                                        className="bg-gray-50/50 border-gray-100 h-11 rounded-lg font-normal"
                                        min={minDate}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-normal text-gray-700 ml-1">Start Time</Label>
                                    <Input
                                        type="time"
                                        value={newEventTime}
                                        onChange={(e) => setNewEventTime(e.target.value)}
                                        className="bg-gray-50/50 border-gray-100 h-11 rounded-lg font-normal"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 bg-white sticky bottom-0">
                        <button
                            type="submit"
                            disabled={dataLoading}
                            className="w-full bg-[var(--color-primary)] text-white py-4.5 rounded-lg font-normal text-sm capitalize tracking-widest shadow-lg shadow-blue-900/10 hover:opacity-95 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {dataLoading ? 'Saving...' : 'Add to Schedule'}
                        </button>
                    </div>
                </form>
            </Sheet>

            <Sheet isOpen={isManageEventsModalOpen} onClose={handleCloseManageEventsModal} title="Manage All Events">
                <div className="space-y-3 py-4 pr-1">
                    {calendarEvents.length > 0 ? (
                        calendarEvents
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .map((event) => (
                                <div key={event.id} className="group flex items-center justify-between gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:border-[var(--color-primary)]/20 transition-all">
                                    <div className="pl-3 border-l-2 border-[var(--color-primary)]">
                                        <p className="text-[13px] font-normal text-gray-800 brcob-font leading-tight group-hover:text-[var(--color-primary)] transition-colors">{event.title}</p>
                                        <p className="text-xs text-gray-400 font-normal tracking-tight mt-1 capitalize tracking-widest">{formatDateForDisplay(event.date)} • {formatTo12Hour(event.time)}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-20">
                                        {checkJoinEligibility(event) && (
                                            <>
                                                <button 
                                                    onClick={() => handleJoinMeet(event)}
                                                    className="w-full bg-[var(--color-secondary)] text-white text-[11px] font-normal py-2 rounded-lg shadow-sm hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <HiVideoCamera size={12} /> Join
                                                </button>
                                                <button 
                                                    onClick={() => handleCopyLink(event.meetLink)}
                                                    className="w-full bg-white text-[var(--color-primary)] text-[11px] font-normal py-2 rounded-lg border border-blue-50 hover:border-blue-100 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <FaLink size={10} /> Copy
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                            <FiCalendar size={32} className="mb-3" />
                            <p className="text-xs font-normal capitalize tracking-widest text-gray-400">No events found</p>
                        </div>
                    )}
                </div>
            </Sheet>

            <Sheet isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Class Meeting">
                {editingEvent && (
                    <form onSubmit={handleUpdateEvent} className="flex flex-col h-full">
                        <div className="flex-1 space-y-6 py-4">
                            <div className="space-y-4">
                                <Label className="text-xs font-normal text-gray-400 capitalize tracking-[0.2em] block ml-1">General information</Label>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-normal text-gray-700 ml-1">Meeting Title</Label>
                                    <Input
                                        value={editingEvent.title}
                                        onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                                        className="bg-gray-50/50 border-gray-100 h-11 text-sm font-normal focus:ring-[var(--color-primary)] rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-normal text-gray-700 ml-1">Category / Subject</Label>
                                    <Input
                                        value={editingEvent.subject}
                                        onChange={(e) => setEditingEvent({...editingEvent, subject: e.target.value})}
                                        className="bg-gray-50/50 border-gray-100 h-11 text-sm font-normal focus:ring-[var(--color-primary)] rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-normal text-gray-400 capitalize tracking-[0.2em] block ml-1">Timing & schedule</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-normal text-gray-700 ml-1">Date</Label>
                                        <Input
                                            type="date"
                                            value={editingEvent.date.toISOString().split('T')[0]}
                                            onChange={(e) => setEditingEvent({...editingEvent, date: new Date(e.target.value)})}
                                            className="bg-gray-50/50 border-gray-100 h-11 rounded-lg font-normal"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-normal text-gray-700 ml-1">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={editingEvent.time}
                                            onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                                            className="bg-gray-50/50 border-gray-100 h-11 rounded-lg font-normal"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 bg-white sticky bottom-0">
                            <button
                                type="submit"
                                disabled={dataLoading}
                                className="w-full bg-[var(--color-primary)] text-white py-4.5 rounded-lg font-normal text-sm capitalize tracking-widest shadow-lg shadow-blue-900/10 hover:opacity-95 transition-all disabled:opacity-50"
                            >
                                {dataLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </Sheet>

            <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)} title="Confirm Deletion">
                <p className="text-gray-700 text-[13px] font-normal">Are you sure you want to remove this scheduled meeting?</p>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsConfirmationModalOpen(false)} className="px-4 py-1.5 text-xs font-normal capitalize tracking-widest text-gray-500 hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
                    <button onClick={confirmRemoveEvent} className="px-4 py-1.5 text-xs font-normal capitalize tracking-widest text-white bg-red-500 rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Remove</button>
                </div>
            </Modal>

            <Sheet isOpen={isInstantModalOpen} onClose={() => setIsInstantModalOpen(false)} title="Quick Meeting">
                <form onSubmit={handleCreateInstantMeeting} className="flex flex-col h-full">
                    <div className="flex-1 space-y-6 py-4">
                        <div className="space-y-4">
                            <Label className="text-xs font-normal text-gray-400 capitalize tracking-[0.2em] block ml-1">Spontaneous session</Label>
                            <div className="space-y-1.5">
                                <Label htmlFor="instantTitle" className="text-xs font-normal text-gray-700 ml-1">Session title</Label>
                                <Input
                                    id="instantTitle"
                                    placeholder="Quick doubt clearing..."
                                    value={instantTitle}
                                    onChange={(e) => setInstantTitle(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-11 text-sm font-normal focus:ring-[var(--color-primary)] rounded-lg"
                                />
                                <p className="text-xs text-gray-400 italic ml-1 mt-1.5">* Date and time will be set to right now.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 bg-white sticky bottom-0">
                        <button
                            type="submit"
                            disabled={dataLoading}
                            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-normal text-xs capitalize tracking-[0.2em] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {dataLoading ? 'Initializing...' : <><HiVideoCamera size={16} /> Start Now</>}
                        </button>
                    </div>
                </form>
            </Sheet>

            <VirtualClassMeetModal
                isOpen={isMeetOpen}
                onClose={() => setIsMeetOpen(false)}
                roomName={activeRoom}
                displayName="Teacher"
            />

            <style jsx global>{`
                .react-calendar { width: 100% !important; background: transparent !important; border: none !important; font-family: inherit !important; padding: 0; }
                .react-calendar__navigation { margin-bottom: 0.75rem !important; height: 36px !important; }
                .react-calendar__navigation button { min-width: 32px; background: white !important; border-radius: 0.4rem !important; margin: 0 1px; border: 1px solid #edf2f7 !important; color: var(--color-primary) !important; font-weight: 500 !important; font-size: 0.65rem; transition: all 0.2s; }
                .react-calendar__month-view__weekdays { font-weight: 600 !important; font-size: 0.6rem !important; color: #a0aec0 !important; padding-bottom: 0.5rem !important; }
                .react-calendar__month-view__days { gap: 4px !important; display: grid !important; grid-template-columns: repeat(7, 1fr) !important; }
                .react-calendar__tile { 
                    aspect-ratio: 1 / 1 !important; 
                    background: white !important; 
                    border: 1px solid #f1f5f9 !important; 
                    border-radius: 8px !important; 
                    font-weight: 600 !important; 
                    font-size: 0.75rem !important; 
                    color: #1e293b !important; 
                    display: flex !important; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center !important; 
                    position: relative; 
                    transition: all 0.1s ease;
                    height: auto !important;
                    min-height: 0 !important;
                    padding: 0 !important;
                }
                .react-calendar__tile:hover:enabled { 
                    background: #f8fafc !important; 
                    border-color: var(--color-primary) !important;
                    color: var(--color-primary) !important;
                    transform: translateY(-1px); 
                }
                .react-calendar__tile--active { 
                    background: var(--color-primary) !important; 
                    color: white !important; 
                    border-color: var(--color-primary) !important;
                    border-radius: 8px !important;
                }
                .react-calendar__tile--now { 
                    background: #f0fff4 !important; 
                    border: 1.5px solid #bdf0cc !important; 
                    color: var(--color-secondary) !important;
                }
                .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.2; }
                .react-calendar__tile.has-events {
                    background: rgba(20, 60, 100, 0.03) !important;
                    border: 1px solid rgba(20, 60, 100, 0.08) !important;
                }
            `}</style>
        </motion.div>
    );
}
