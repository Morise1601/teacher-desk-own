// src/app/features/dashboard/MostViewedWidget.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/ui/user-avatar';

const mostViewedItems = [
    { id: 1, title: 'Senior Product Designer', rate: '$25/hr', avatar: '/images/avatar-mv1.jpg' }, // Dummy image
    { id: 2, title: 'UX Designer', rate: '$25/hr', avatar: '/images/avatar-mv2.jpg' }, // Dummy image
];

export default function MostViewedWidget() {
    return (
        <motion.div
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            whileHover={{ boxShadow: "0 0 15px rgba(0,0,0,0.05)" }}
        >
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Most Viewed This Week</h3>
            <ul className="space-y-4">
                {mostViewedItems.map(item => (
                    <motion.li
                        key={item.id}
                        className="flex items-center gap-3"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <UserAvatar 
                            src={item.avatar} 
                            name={item.title} 
                            className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" 
                        />
                        <div>
                            <p className="font-medium text-gray-700">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.rate}</p>
                        </div>
                    </motion.li>
                ))}
            </ul>
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:underline">
                View All
            </button>
        </motion.div>
    );
}
