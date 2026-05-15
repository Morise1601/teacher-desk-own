'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HiVideoCamera, HiCalendar } from 'react-icons/hi';

interface ClassroomHeaderProps {
    className?: string;
    classTitle: string;
    section: string;
    teacherName: string;
    onJoinMeet?: () => void;
}

const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
    classTitle,
    section,
    teacherName,
    onJoinMeet
}) => {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full h-[200px] md:h-[300px] rounded-lg overflow-hidden shadow-lg group mb-6"
        >
            {/* Banner Image */}
            <Image
                src="/images/classroom_banner.png"
                alt="Classroom Banner"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Class Info */}
            <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-white">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-4xl font-bold oswald-font leading-tight mb-0.5 md:mb-1"
                    >
                        {classTitle}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm md:text-xl opacity-90 brcob-font"
                    >
                        {section}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-[11px] md:text-base opacity-75 mt-0.5"
                    >
                        Teacher: <span className="font-semibold">{teacherName}</span>
                    </motion.p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 md:gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/classroom/calendar')}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/20 transition-all text-[12px] md:text-sm font-bold"
                    >
                        <HiCalendar className="text-lg" />
                        Schedule
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onJoinMeet}
                        className="flex items-center gap-2 bg-white text-[var(--color-primary)] hover:bg-gray-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all text-[12px] md:text-sm font-bold shadow-lg"
                    >
                        <HiVideoCamera className="text-lg" />
                        Join Meet
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default ClassroomHeader;
