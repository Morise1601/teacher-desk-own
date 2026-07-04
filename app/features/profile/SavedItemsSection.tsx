// app/features/profile/SavedItemsSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBookmark, FaRegBookmark, FaUser, FaClock, FaArrowRight } from 'react-icons/fa';
import { getFeedAction, savePostAction } from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface SavedItemsSectionProps {
    userId: string;
}

export default function SavedItemsSection({ userId }: SavedItemsSectionProps) {
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!userId) return;
            try {
                const res = decryptData(await getFeedAction(encryptData({
                    userId,
                    filter: 'saved',
                    limit: 10
                })));
                if (res?.success) {
                    setSavedPosts(res.data || []);
                }
            } catch (err) {
                console.error("Error fetching saved posts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, [userId]);

    const handleUnsave = async (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = decryptData(await savePostAction(encryptData({ userId, postId })));
            if (res?.success) {
                toast.success("Bookmark removed");
                setSavedPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                toast.error("Failed to remove bookmark");
            }
        } catch (err) {
            toast.error("An error occurred");
        }
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e4ecf4',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(20,60,100,0.03)',
            marginTop: '24px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px',
            }}>
                <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#1e293b',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(20,60,100,0.05)',
                        color: '#143c64',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <FaBookmark size={12} />
                    </span>
                    Saved Updates & Items
                </h3>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '50px',
                }}>
                    {savedPosts.length} Items
                </span>
            </div>

            {loading ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px border-slate-100 border-t-[var(--color-primary)]',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 8px',
                    }} />
                    Loading saved library...
                </div>
            ) : savedPosts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence mode="popLayout">
                        {savedPosts.map((post) => {
                            const author = post.author_profile || {};
                            return (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        border: '1px solid #f0f4f8',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        background: '#f8fafc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        position: 'relative',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                color: '#334155',
                                            }}>
                                                👤 {author.fullName || author.name || "Member"}
                                            </span>
                                            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <FaClock size={8} /> {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleUnsave(e, post.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '2px',
                                            }}
                                            title="Unsave"
                                        >
                                            <FaBookmark size={12} />
                                        </button>
                                    </div>
                                    <p style={{
                                        fontSize: '11.5px',
                                        color: '#475569',
                                        margin: 0,
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        {post.content}
                                    </p>
                                    <Link
                                        href={`/dashboard?post=${post.id}`}
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            color: '#143c64',
                                            alignSelf: 'flex-end',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        View Full Post <FaArrowRight size={8} />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div style={{
                    padding: '30px 10px',
                    textAlign: 'center',
                    border: '1px dashed #e2e8f0',
                    borderRadius: '12px',
                    background: '#fafafa',
                }}>
                    <FaRegBookmark size={20} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: 0 }}>
                        Your library of saved posts is empty.
                    </p>
                </div>
            )}
        </div>
    );
}
