'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBookmark, FiExternalLink, FiUsers, FiAward } from 'react-icons/fi';

import { UserAvatar } from '@/components/ui/user-avatar';

const INSTITUTIONS = [
    {
        id: 1,
        name: "Oxford International School",
        type: "School",
        status: "Active Now",
        location: "London, UK",
        members: "120+ Teachers",
        since: "2024",
        color: "from-blue-600 to-indigo-900",
        tag: "Global Partner"
    },
    {
        id: 2,
        name: "Stanford University",
        type: "University",
        status: "Member",
        location: "California, USA",
        members: "450+ Content Creators",
        since: "2023",
        color: "from-red-600 to-rose-900",
        tag: "Innovation Hub"
    },
    {
        id: 3,
        name: "Green Valley Academy",
        type: "High School",
        status: "Just Joined",
        location: "Toronto, Canada",
        members: "45 Teachers",
        since: "2025",
        color: "from-emerald-600 to-teal-900",
        tag: "New Eco-Partner"
    },
    {
        id: 4,
        name: "National Institute of Arts",
        type: "Institute",
        status: "Pro Member",
        location: "Mumbai, India",
        members: "150+ Educators",
        since: "2024",
        color: "from-amber-500 to-orange-700",
        tag: "Creative Collective"
    }
];

export default function NoticeBoard() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isHovered) {
            interval = setInterval(() => {
                if (scrollRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                    if (scrollLeft + clientWidth >= scrollWidth - 10) {
                        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        scrollRef.current.scrollBy({ left: 270, behavior: 'smooth' });
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <section
            className="bg-white rounded-lg p-5 md:p-6 shadow-xl border border-gray-100 overflow-hidden relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <FiBookmark className="text-xl" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 oswald-font tracking-tight capitalize">
                        Institution <span className="text-[var(--color-primary)]">Desk</span>
                    </h2>
                </div>
                <div className='grid grid-cols-2 justify-between items-center gap-2 mb-3'>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest capitalize flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> Live Notices
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button className="flex-grow sm:flex-grow-0 bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white transition-all text-gray-500 text-[10px] font-bold capitalize tracking-widest px-4 py-2 rounded-lg border border-gray-100 flex items-center justify-center gap-2">
                            Register School <FiExternalLink />
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 pb-4 px-1 overflow-x-auto snap-x snap-mandatory custom-scrollbar-thin sidebar-scroll scroll-smooth"
            >
                {INSTITUTIONS.map((inst, idx) => (
                    <motion.div
                        key={inst.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="relative p-5 rounded-lg bg-stone-50 border-white border-2 shadow-sm group/card shrink-0 w-[240px] md:w-[260px] snap-center overflow-hidden"
                    >
                        {/* Compact Poster View */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${inst.color}`} />

                        <div className="flex flex-col gap-2 items-start justify-between mb-4 mt-1">
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    src={undefined}
                                    name={inst.name}
                                    className={`w-10 h-10 rounded-lg shadow-md bg-gradient-to-br ${inst.color}`}
                                    fallbackClassName="text-white text-xs"
                                />
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-800 brcob-font truncate">
                                        {inst.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-medium truncate">{inst.location}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-bold capitalize px-2 py-0.5 rounded-full bg-white text-gray-500 border border-gray-100 whitespace-nowrap">
                                {inst.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-white/60 p-2 rounded-lg border border-white flex flex-col items-center text-center">
                                <FiUsers className="text-[var(--color-primary)] text-xs mb-1" />
                                <span className="text-[9px] font-bold text-gray-700">{inst.members}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg border border-white flex flex-col items-center text-center">
                                <FiAward className="text-[var(--color-secondary)] text-xs mb-1" />
                                <span className="text-[9px] font-bold text-gray-700 truncate w-full">{inst.tag}</span>
                            </div>
                        </div>

                        {/* View Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full mt-4 py-2 bg-white hover:bg-[var(--color-primary)] hover:text-white border border-gray-100 rounded-lg text-[10px] font-bold capitalize tracking-widest text-gray-500 shadow-sm transition-all"
                        >
                            Open Desk
                        </motion.button>
                    </motion.div>
                ))}

                {/* Empty slot for engagement */}
                <div className="w-[240px] md:w-[260px] flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg p-5 shrink-0 hover:border-[var(--color-primary)]/30 transition-colors group/add cursor-pointer snap-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover/add:bg-[var(--color-primary)]/10 group-hover/add:text-[var(--color-primary)] transition-all">
                        <FiUsers className="text-xl" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 text-center group-hover/add:text-[var(--color-primary)] capitalize">Partner with us</p>
                </div>
            </div>
        </section>
    );
}
