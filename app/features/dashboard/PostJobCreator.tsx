// src/app/features/dashboard/PostJobCreator.tsx
'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { supabase } from '@/lib/supabase';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { getInstitutionProfileAction } from '@/app/actions/institution';
import { decryptData } from '@/lib/crypto';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { FaPaperclip, FaImage, FaVideo, FaLink } from 'react-icons/fa';

export default function PostJobCreator() {
    const [activeTab, setActiveTab] = useState<'project' | 'job'>('project');
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const role = user.user_metadata?.role;
            let res;
            if (role === 'teacher') res = decryptData(await getProfileByUserIdAction(user.id));
            else if (role === 'institution' || role === 'institution_admin') res = decryptData(await getInstitutionProfileAction(user.id));
            
            if (res?.success) setProfile(res.profile || res.data);
        };
        fetchProfile();
    }, []);

    const name = profile?.fullName || profile?.name || "Member";

    return (
        <motion.div
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            whileHover={{ boxShadow: "0 0 15px rgba(0,0,0,0.05)" }}
        >
            <div className="relative flex gap-2 mb-4 p-1 bg-gray-100 rounded-md overflow-hidden">
                {/* Animated Indicator */}
                {activeTab === 'project' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute top-1 bottom-1 left-1 bg-[var(--color-primary)] rounded-md"
                        style={{ width: 'calc(50% - 4px)' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                {activeTab === 'job' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute top-1 bottom-1 right-1 bg-[var(--color-primary)] rounded-md"
                        style={{ width: 'calc(50% - 4px)' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}

                <button
                    className={`relative z-10 flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'project' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('project')}
                >
                    Post a Project
                </button>
                <button
                    className={`relative z-10 flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'job' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    onClick={() => setActiveTab('job')}
                >
                    Post a Job
                </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <UserAvatar 
                    src={profile?.profile_pic_url} 
                    name={name}
                    className="w-10 h-10 rounded-full border border-gray-100 shadow-sm"
                />
                <Input
                    type="text"
                    placeholder={`What's on your mind, ${name.split(' ')[0]}?`}
                    className="flex-1 h-auto p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-gray-500 text-[13px] md:text-sm">
                <button className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                    <FaImage className="text-blue-500" /> <span className="hidden sm:inline">Photo</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                    <FaVideo className="text-purple-500" /> <span className="hidden sm:inline">Video</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                    <FaLink className="text-emerald-500" /> <span className="hidden sm:inline">Link</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                    <FaPaperclip className="text-orange-500" /> <span className="hidden sm:inline">Attachment</span>
                </button>
                <div className="flex-1 min-w-[10px]" />
                <button className="bg-[var(--color-primary)] text-white px-5 py-1.5 rounded-md hover:opacity-90 transition-all font-bold capitalize text-[11px] tracking-widest shadow-sm">
                    Post
                </button>
            </div>
            <div className='flex items-start'>
            </div>
        </motion.div>
    );
}
