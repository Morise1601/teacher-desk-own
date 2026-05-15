'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaComment, FaShare, FaEye } from 'react-icons/fa'; // Example icons
import { UserAvatar } from '@/components/ui/user-avatar';

interface UserFeedPostProps {
    id: number;
    userName: string;
    userRole: string;
    timeAgo: string;
    avatar: string;
    content: string;
    skills: string[];
    jobType: string; // e.g., "Full Time"
    likes: number;
    comments: number;
    views: number;
}

export default function UserFeedPost({
    userName,
    userRole,
    timeAgo,
    avatar,
    content,
    skills,
    jobType,
    likes,
    comments,
    views,
}: UserFeedPostProps) {
    return (
        <motion.div
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            whileHover={{ boxShadow: "0 0 20px rgba(0,0,0,0.08)" }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <UserAvatar 
                        src={avatar} 
                        name={userName} 
                        className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" 
                    />
                    <div>
                        <p className="font-semibold text-gray-800">{userName}</p>
                        <p className="text-sm text-gray-500">{userRole}</p>
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                    </div>
                </div>
                <button className="text-green-500 px-3 py-1 rounded-md border border-green-500 hover:bg-green-500 hover:text-white transition-colors text-xs">
                    {jobType}
                </button>
            </div>
            <p className="text-gray-700 text-sm mb-4">
                {content}
                <a href="#" className="text-blue-600 hover:underline ml-1">view more</a>
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {skill}
                    </span>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between text-gray-500 text-sm mt-4 pt-3 border-t border-gray-100 gap-y-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-red-500 transition-colors">
                        <FaHeart className="text-red-500" /> <span>{likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                        <FaComment /> <span>{comments}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors">
                        <FaShare /> <span>Share</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FaEye /> <span>{views} Views</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
