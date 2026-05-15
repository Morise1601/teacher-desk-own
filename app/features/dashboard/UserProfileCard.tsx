'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { getInstitutionProfileAction } from '@/app/actions/institution';
import { decryptData } from '@/lib/crypto';
import Link from 'next/link';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function UserProfileCard() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const role = user.user_metadata?.role;
            let res;
            if (role === 'teacher') {
                res = decryptData(await getProfileByUserIdAction(user.id));
            } else if (role === 'institution' || role === 'institution_admin') {
                res = decryptData(await getInstitutionProfileAction(user.id));
            }

            if (res?.success) {
                setProfile(res.profile || res.data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 h-[280px] flex items-center justify-center animate-pulse border border-gray-100">
                <div className="w-12 h-12 border-2 border-gray-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    const name = profile.fullName || profile.name || "Member";
    const avatar = profile.profile_pic_url || "https://placehold.co/400x400/f0f4f8/1e3a5f?text=P";
    const headline = profile.headline || profile.type || (profile.role === 'teacher' ? 'Educator' : 'Institution');
    const isOpenToWork = profile.role === 'teacher' && profile.work_status === false;
    const isHiring = (profile.role === 'institution' || profile.role === 'institution_admin') && profile.hire_status === true;

    return (
        <motion.div
            className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col items-center border border-gray-100/50 relative overflow-hidden group hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)] transition-all duration-500 w-full"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Sleek Banner */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-[var(--color-primary)] via-[#1a3a5f] to-[#12501b] z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            </div>

            <div className="relative pt-6 flex flex-col items-center w-full z-10 px-4">
                {/* Compact Profile Icon Area */}
                <div className="relative group/avatar cursor-pointer">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full blur-[2px] opacity-20 group-hover/avatar:opacity-50 transition duration-500"></div>
                    
                    {/* Rotating dashed ring */}
                    <motion.div 
                        className="absolute -inset-1.5 border-2 border-dashed border-white/30 rounded-full sm:block hidden"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative">
                        <UserAvatar 
                            src={profile.profile_pic_url} 
                            name={name}
                            className="w-20 h-20 border-3 border-white shadow-xl z-20 rounded-full transition-transform duration-500 group-hover/avatar:scale-[1.03]"
                            fallbackClassName="text-3xl"
                        />
                        
                        {/* Status Indicator */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md z-30">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                    </div>
                </div>

                <div className="text-center w-full mt-3 mb-1">
                    <h3 className="font-bold text-lg text-slate-800 tracking-tight oswald-font capitalize leading-tight">
                        {name}
                    </h3>
                    
                    {/* Role / Headline */}
                    <div className="flex flex-col items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-[var(--color-primary)]/70 capitalize tracking-[0.15em] brcob-font bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            {headline}
                        </span>

                        <div className="flex gap-1.5">
                            {isOpenToWork && (
                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-100 capitalize flex items-center gap-1 shadow-sm">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    Open to Work
                                </span>
                            )}
                            {isHiring && (
                                <span className="bg-sky-50 text-sky-600 text-[8px] font-bold px-2 py-0.5 rounded border border-sky-100 capitalize flex items-center gap-1 shadow-sm">
                                    <div className="w-1 h-1 rounded-full bg-sky-500" />
                                    Hiring
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Metrics Section */}
            <div className="grid grid-cols-2 w-full mt-4 py-3 border-t border-slate-50 bg-slate-50/20">
                <div className="text-center border-r border-slate-100">
                    <p className="text-sm font-bold text-slate-800 oswald-font leading-none">124</p>
                    <p className="text-[9px] capitalize font-bold text-slate-400 tracking-widest mt-0.5">Following</p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 oswald-font leading-none">8.4K</p>
                    <p className="text-[9px] capitalize font-bold text-slate-400 tracking-widest mt-0.5">Followers</p>
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 w-full bg-white">
                <Link href="/profile" className="block w-full">
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[#1a3a5f] text-white py-2.5 rounded-xl transition-all text-[10px] font-bold capitalize tracking-[0.1em] shadow-sm hover:shadow-md active:shadow-inner"
                    >
                        View Profile →
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );

}
