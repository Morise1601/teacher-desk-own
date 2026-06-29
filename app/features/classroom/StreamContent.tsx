// src/app/features/classroom/StreamContent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCircle, FaPaperclip, FaImage, FaTrash, FaClock, FaPoll, FaTimes } from 'react-icons/fa';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';
import { createPostAction, getFeedAction, getClassroomsAction } from '@/app/actions/posts';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { decryptData, encryptData } from '@/lib/crypto';
import UserFeedPost from '../dashboard/UserFeedPost';
import { UserAvatar } from '@/components/ui/user-avatar';

const StreamContent = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [classroomId, setClassroomId] = useState<string | null>(null);

    // Feed state
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form inputs
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<{ base64: string; name: string }[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Poll in classroom state
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    const [pollExpiresAt, setPollExpiresAt] = useState('');
    const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

    const [isPosting, setIsPosting] = useState(false);

    // 1. Authenticate user and initialize classroom
    useEffect(() => {
        const initializeClass = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch profile
            const profRes = decryptData(await getProfileByUserIdAction(user.id));
            if (profRes.success) setProfile(profRes.profile || profRes.data);

            // Fetch classroom
            try {
                const classRes = decryptData(await getClassroomsAction(user.id));
                if (classRes.success && classRes.classrooms && classRes.classrooms.length > 0) {
                    setClassroomId(classRes.classrooms[0].id);
                } else {
                    // Create a default classroom if none exists to support validation
                    const { data: newClass, error: newClassErr } = await supabase
                        .from('classrooms')
                        .insert([{
                            name: 'Advanced Mathematics',
                            teacher_id: user.id
                        }])
                        .select()
                        .single();

                    if (!newClassErr && newClass) {
                        // Insert teacher membership
                        await supabase.from('classroom_members').insert([{
                            classroom_id: newClass.id,
                            user_id: user.id,
                            role: 'teacher'
                        }]);
                        setClassroomId(newClass.id);
                    }
                }
            } catch (err) {
                console.error("Error setting up classroom", err);
            }
        };

        initializeClass();
    }, []);

    // Set default poll expiry
    useEffect(() => {
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 7);
        setPollExpiresAt(defaultExpiry.toISOString().slice(0, 16));
    }, []);

    // 2. Fetch classroom posts
    const loadClassroomFeed = async () => {
        if (!userId || !classroomId) return;
        setIsLoading(true);
        try {
            const payload = encryptData({
                userId,
                filter: 'all',
                sortBy: 'latest',
                cursor: null,
                limit: 20,
                classroomId
            });
            const res = decryptData(await getFeedAction(payload));
            if (res.success && res.data) {
                setAnnouncements(res.data);
            }
        } catch (err) {
            console.error("Failed to load classroom stream", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId && classroomId) {
            loadClassroomFeed();

            // Real-time listener for this classroom
            const channel = supabase
                .channel('realtime_classroom_feed')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                    loadClassroomFeed();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId, classroomId]);

    // Handle posting announcement
    const handlePostAnnouncement = async () => {
        if (!userId || !classroomId) return;

        let postType: 'text' | 'image' | 'poll' = 'text';
        if (selectedImages.length > 0) {
            postType = 'image';
        } else if (showPollCreator) {
            postType = 'poll';
        }

        if (postType === 'text' && !content.trim()) {
            toast.error("Announcement content cannot be empty.");
            return;
        }

        if (postType === 'poll') {
            if (!pollQuestion.trim()) {
                toast.error("Please provide a poll question.");
                return;
            }
            if (pollOptions.filter(o => o.trim() !== '').length < 2) {
                toast.error("Please enter at least 2 options.");
                return;
            }
        }

        setIsPosting(true);
        try {
            const payload = encryptData({
                userId,
                postType,
                content: content.trim(),
                visibility: 'classroom',
                classroomId,
                files: postType === 'image' ? selectedImages : [],
                poll: postType === 'poll' ? {
                    question: pollQuestion.trim(),
                    options: pollOptions.filter(o => o.trim() !== ''),
                    expiresAt: new Date(pollExpiresAt).toISOString(),
                    allowMultiple: pollAllowMultiple
                } : null
            });

            const res = decryptData(await createPostAction(payload));
            if (res.success) {
                toast.success("Announcement posted!");
                setContent('');
                setSelectedImages([]);
                setImagePreviews([]);
                setShowPollCreator(false);
                setPollQuestion('');
                setPollOptions(['', '']);
                loadClassroomFeed();
            } else {
                toast.error(res.message || "Failed to publish announcement.");
            }
        } catch (err) {
            toast.error("Error occurred while posting.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size exceeds 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImages(prev => [...prev, { base64: reader.result as string, name: file.name }]);
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (idx: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Post Announcement Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                    <UserAvatar 
                        src={profile?.profile_pic_url} 
                        name={profile?.fullName || "Teacher"} 
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-grow">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Announce something to your class..."
                            className="w-full text-gray-700 text-[14px] md:text-base cursor-text py-2 outline-none border-none resize-none bg-transparent placeholder-gray-400 focus-visible:ring-0 h-auto min-h-[50px]"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((p, i) => (
                            <div key={i} className="relative w-16 h-16 border rounded overflow-hidden">
                                <img src={p} alt="preview" className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                                    <FaTimes className="text-[8px]" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Classroom Poll Creator */}
                {showPollCreator && (
                    <div className="p-4 bg-purple-50/20 border border-purple-100 rounded-xl flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs font-bold text-purple-700">
                            <span>Classroom Poll Discussion</span>
                            <button onClick={() => setShowPollCreator(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                        </div>
                        <Input 
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder="Question"
                            className="bg-white text-xs"
                        />
                        <div className="flex flex-col gap-2">
                            {pollOptions.map((opt, i) => (
                                <Input 
                                    key={i}
                                    value={opt}
                                    onChange={(e) => {
                                        const copy = [...pollOptions];
                                        copy[i] = e.target.value;
                                        setPollOptions(copy);
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className="bg-white text-xs"
                                />
                            ))}
                        </div>
                        {pollOptions.length < 5 && (
                            <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[11px] font-bold text-purple-600 self-start">+ Add option</button>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => imageInputRef.current?.click()}
                            title="Attach Image" 
                            className="p-2.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <FaImage />
                        </button>
                        <input 
                            type="file"
                            ref={imageInputRef}
                            onChange={handleImageSelect}
                            multiple
                            accept="image/*"
                            className="hidden"
                        />
                        <button 
                            onClick={() => setShowPollCreator(true)}
                            title="Create Poll" 
                            className="px-3 py-1.5 text-gray-400 hover:text-[var(--color-secondary)] hover:bg-gray-100 rounded-lg transition-all text-[12px] font-bold border border-gray-100"
                        >
                            + Poll
                        </button>
                    </div>
                    <button 
                        disabled={isPosting}
                        onClick={handlePostAnnouncement}
                        className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-45 transition-all shadow-sm"
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Classroom Feed List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
                    </div>
                ) : announcements.length > 0 ? (
                    announcements.map((post) => (
                        <UserFeedPost 
                            key={post.id}
                            {...post}
                            currentUserId={userId || ''}
                        />
                    ))
                ) : (
                    <div className="py-12 text-center bg-white border border-gray-100 rounded-lg">
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">No announcements posted</p>
                        <p className="text-gray-300 text-[11px] mt-1">Share an update with your students to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamContent;
