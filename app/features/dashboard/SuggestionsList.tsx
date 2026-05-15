'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/ui/user-avatar';

const userSuggestions = [
    { id: 1, name: 'Jessica William', role: 'Graphic Designer', avatar: '/images/avatar1.jpg' },
    { id: 2, name: 'Poonam', role: 'Wordpress Developer', avatar: '/images/avatar2.jpg' },
    { id: 3, name: 'Bill Gates', role: 'C & C++ Developer', avatar: '/images/avatar3.jpg' },
    { id: 4, name: 'John Doe', role: 'PHP Developer', avatar: '/images/avatar4.jpg' },
    { id: 5, name: 'Jane Smith', role: 'UX Designer', avatar: '/images/avatar5.jpg' },
];

export default function SuggestionsList() {
    return (
        <motion.div
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            whileHover={{ boxShadow: "0 0 15px rgba(0,0,0,0.05)" }}
        >
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Suggestions</h3>
            <ul className="space-y-3">
                {userSuggestions.map(user => (
                    <motion.li
                        key={user.id}
                        className="flex items-center justify-between"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <div className="flex items-center gap-3">
                            <UserAvatar 
                                src={user.avatar} 
                                name={user.name} 
                                className="w-10 h-10 rounded-full border border-gray-100 shadow-sm" 
                            />
                            <div>
                                <p className="font-medium text-gray-700">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                        </div>
                        <button className="cursor-pointer text-[var(--color-primary)] text-sm px-3 py-1 rounded-md border border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                            Follow
                        </button>
                    </motion.li>
                ))}
            </ul>
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:underline">
                View More
            </button>
        </motion.div>
    );
}
