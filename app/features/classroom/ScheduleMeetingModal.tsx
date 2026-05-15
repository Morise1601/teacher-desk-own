'use client';

import React, { useState, useEffect } from 'react';
import Sheet from '@/app/shared/Sheet';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'react-toastify';
import { supabase } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";
import { createMeetingAction } from "@/app/actions/meeting";

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('General');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');

    const subjects = ['Math', 'Science', 'English', 'History', 'Computer', 'General'];

    useEffect(() => {
        const getUid = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUid();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Please login to schedule meetings.");
            return;
        }

        if (title && date && time) {
            setLoading(true);
            try {
                const meetId = `TeacherDesk-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                const payload = {
                    title,
                    subject,
                    meeting_date: date,
                    start_time: time,
                    meet_link: meetId,
                    teacher_id: userId
                };

                const encryptedRes = await createMeetingAction(encryptData(payload));
                const res = decryptData(encryptedRes);

                if (res.success) {
                    toast.success("Meeting Scheduled Successfully!");
                    setTitle('');
                    setTime('');
                    onClose();
                    if (onSuccess) onSuccess();
                } else {
                    throw new Error(res.message);
                }
            } catch (error: any) {
                toast.error(`Error: ${error.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            toast.error("Please fill in all required fields.");
        }
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} title="Schedule New Class">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Body Content */}
                <div className="flex-1 space-y-8 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] block ml-1">Class information</Label>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 ml-1">Title</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Introduction to Calculus..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-12 text-sm font-medium focus:ring-[var(--color-primary)] rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 ml-1">Category / Subject</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Mathematics, History..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-12 text-sm font-medium focus:ring-[var(--color-primary)] rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-400 capitalize tracking-[0.2em] block ml-1">Timeline & date</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 ml-1">Meeting Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="bg-gray-50/50 border-gray-100 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 ml-1">Starting Time</Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="pt-6 border-t border-gray-100 bg-white sticky bottom-0">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-xs capitalize tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:opacity-95 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Schedule class'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3 font-semibold capitalize tracking-widest">The meeting will be added to your schedule calendar</p>
                </div>
            </form>
        </Sheet>
    );
};

export default ScheduleMeetingModal;

