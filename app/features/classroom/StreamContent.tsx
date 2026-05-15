'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaUserCircle, FaPaperclip, FaImage, FaEllipsisV } from 'react-icons/fa';
import { Textarea } from "@/components/ui/textarea";

const announcements = [
    {
        id: 1,
        author: 'Prof. Sarah Jenkins',
        role: 'Teacher',
        date: 'Jan 24',
        content: "Welcome to the Advanced Mathematics course! I've uploaded the syllabus in the Resources tab. Please make sure to read it before our first lecture.",
        attachments: 0,
        comments: 2,
        likes: 12,
        tags: ['Announcement', 'Syllabus'],
        type: 'post'
    },
    {
        id: 3,
        author: 'Class Bot',
        role: 'Automated',
        date: 'Jan 23',
        content: "Which topic are you most excited to learn?",
        poll: {
            options: [
                { text: 'Complex Variables', votes: 15 },
                { text: 'Differential Equations', votes: 24 },
                { text: 'Matrix Algebra', votes: 8 },
            ],
            totalVotes: 47
        },
        tags: ['Poll'],
        type: 'poll'
    },
    {
        id: 2,
        author: 'Prof. Sarah Jenkins',
        role: 'Teacher',
        date: 'Jan 22',
        content: "Reminder: The introductory quiz will be open from tomorrow morning. It's a short assessment of your previous knowledge.",
        attachments: 1,
        comments: 5,
        likes: 8,
        tags: ['Reminder', 'Assessment'],
        type: 'post'
    },
];

const StreamContent = () => {
    return (
        <div className="flex flex-col gap-6">
            {/* Post Announcement Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                    <FaUserCircle className="text-4xl text-gray-200 flex-shrink-0" />
                    <div className="flex-grow">
                        <Textarea
                            placeholder="Announce something to your class..."
                            className="w-full text-gray-700 text-[14px] md:text-base cursor-text py-2 outline-none border-none resize-none bg-transparent placeholder-gray-400 focus-visible:ring-0 h-auto"
                            rows={2}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                        <button title="Attach File" className="p-2.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-all">
                            <FaPaperclip />
                        </button>
                        <button title="Attach Image" className="p-2.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-all">
                            <FaImage />
                        </button>
                        <button title="Create Poll" className="px-3 py-1.5 text-gray-400 hover:text-[var(--color-secondary)] hover:bg-gray-100 rounded-lg transition-all text-[12px] font-bold border border-gray-100">
                            + Poll
                        </button>
                    </div>
                    <button className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-sm">
                        Post
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-6">
                {announcements.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group/card"
                    >
                        <div className="p-5 md:p-6">
                            {/* Post Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-inner ${post.role === 'Teacher' ? 'bg-[var(--color-primary)]' : 'bg-gray-400'}`}>
                                            {post.author.charAt(0)}
                                        </div>
                                        {post.role === 'Teacher' && (
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[15px] font-bold text-gray-800">{post.author}</h4>
                                            {post.role === 'Teacher' && (
                                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded capitalize">Teacher</span>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-gray-400">{post.date}</p>
                                    </div>
                                </div>
                                <button className="text-gray-300 hover:text-gray-600 p-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <FaEllipsisV />
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] md:text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 italic">#{tag}</span>
                                ))}
                            </div>

                            {/* Post Content */}
                            <div className="text-[14px] md:text-[15px] text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                                {post.content}
                            </div>

                            {/* Poll Content */}
                            {post.type === 'poll' && post.poll && (
                                <div className="space-y-3 mb-6">
                                    {post.poll.options.map((opt, i) => {
                                        const percent = Math.round((opt.votes / post.poll!.totalVotes) * 100);
                                        return (
                                            <div key={i} className="relative cursor-pointer group/poll">
                                                <div className="absolute inset-0 bg-blue-50 rounded-lg transition-all" style={{ width: `${percent}%` }} />
                                                <div className="relative flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                                                    <span className="text-[13px] font-medium text-gray-700">{opt.text}</span>
                                                    <span className="text-[12px] font-bold text-gray-400">{percent}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <p className="text-[11px] text-gray-400 font-medium">{post.poll.totalVotes} votes</p>
                                </div>
                            )}

                            {/* Interactions */}
                            <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
                                <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors">
                                    <span>👍</span> {post.likes || 0}
                                </button>
                                <button className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors">
                                    <span>💬</span> {post.comments} comments
                                </button>
                                <button className="ml-auto text-[13px] font-bold text-[var(--color-secondary)] hover:underline">
                                    View full discussion →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default StreamContent;
