'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/ui/user-avatar';

const topProfiles = [
    { id: 1, name: 'John Doe', role: 'Graphic Designer', avatar: '/images/avatar-top1.jpg' },
    { id: 2, name: 'Jessica William', role: 'Graphic Designer', avatar: '/images/avatar-top2.jpg' },
    { id: 3, name: 'Poonam', role: 'Wordpress Developer', avatar: '/images/avatar-top3.jpg' },
    { id: 4, name: 'Bill Gates', role: 'C & C++ Developer', avatar: '/images/avatar-top4.jpg' },
];

export default function TopProfilesList({ profiles }: { profiles?: any[] }) {
    const list = profiles || topProfiles;
    return (
        <motion.div
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            whileHover={{ boxShadow: "0 0 15px rgba(0,0,0,0.05)" }}
        >
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Top Profiles</h3>
            <div className="grid grid-cols-2 gap-4">
                {list.map(profile => (
                    <motion.div
                        key={profile.id}
                        className="flex flex-col items-center text-center p-3 rounded-md bg-gray-50"
                        whileHover={{ y: -3, boxShadow: "0 5px 10px rgba(0,0,0,0.05)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <UserAvatar 
                            src={profile.avatar} 
                            name={profile.name} 
                            className="w-16 h-16 mb-2 rounded-full border-2 border-white shadow-sm" 
                            fallbackClassName="text-2xl"
                        />
                        <p className="font-medium text-gray-700 text-sm">{profile.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{profile.role}</p>
                        <button className="cursor-pointer text-[var(--color-primary)] text-xs px-2 py-1 rounded-md border border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                            View Profile
                        </button>
                    </motion.div>
                ))}
            </div>
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:underline">
                View More
            </button>
        </motion.div>
    );
}
