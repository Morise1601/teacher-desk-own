// src/app/features/dashboard/UserFeed.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import UserFeedPost from './UserFeedPost';
import { getFeedAction, getPostAction } from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSortAmountDown, FaCircleNotch, FaCompass } from 'react-icons/fa';

import { FeedFilterType, FeedSortType } from './FeedFilters';

interface UserFeedProps {
    filter?: FeedFilterType;
    sortBy?: FeedSortType;
    highlightPostId?: string | null;
}

export default function UserFeed({ filter = 'all', sortBy = 'latest', highlightPostId = null }: UserFeedProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Pagination & loading states
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);

    const observerTargetRef = useRef<HTMLDivElement>(null);

    // Fetch user on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };
        fetchUser();
    }, []);

    // Load initial feed
    const loadFeed = useCallback(async (isInitial = true, currentFilter = filter, currentSort = sortBy) => {
        if (!userId) return;

        if (isInitial) {
            setIsLoading(true);
            setCursor(null);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const payload = encryptData({
                userId,
                filter: currentFilter,
                sortBy: currentSort,
                cursor: isInitial ? null : cursor,
                limit: 10
            });

            const res = decryptData(await getFeedAction(payload));

            if (res.success && res.data) {
                let fetchedPosts = res.data;

                // If a specific post needs to be highlighted and is not in the current feed segment, fetch and prepend it
                if (isInitial && highlightPostId && !fetchedPosts.some((p: any) => p.id === highlightPostId)) {
                    try {
                        const postRes = decryptData(await getPostAction(encryptData({ postId: highlightPostId })));
                        if (postRes.success && postRes.data) {
                            fetchedPosts = [postRes.data, ...fetchedPosts];
                        }
                    } catch (err) {
                        console.error("Error loading highlighted post:", err);
                    }
                }

                if (isInitial) {
                    setPosts(fetchedPosts);
                } else {
                    setPosts(prev => [...prev, ...fetchedPosts]);
                }

                if (fetchedPosts.length < 10) {
                    setHasMore(false);
                } else {
                    const lastPost = fetchedPosts[fetchedPosts.length - 1];
                    setCursor(lastPost.created_at);
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error loading social feed:", err);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [userId, cursor, filter, sortBy, highlightPostId]);

    // Reload feed when user changes filters, sorting, or highlightPostId
    useEffect(() => {
        if (userId) {
            loadFeed(true, filter, sortBy);
        }
    }, [userId, filter, sortBy, highlightPostId]);

    // Handle reload event (e.g. from PostJobCreator on new post)
    useEffect(() => {
        const handleReload = () => {
            if (userId) {
                loadFeed(true, filter, sortBy);
            }
        };

        window.addEventListener('feed:reload', handleReload);
        return () => window.removeEventListener('feed:reload', handleReload);
    }, [userId, filter, sortBy, loadFeed]);

    // Real-time Supabase subscriptions for posts, likes, comments, and polls
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('realtime_feed_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_polls' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reposts' }, () => {
                loadFeed(true, filter, sortBy);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, filter, sortBy, loadFeed]);

    // Infinite scroll trigger via IntersectionObserver
    useEffect(() => {
        if (!hasMore || loadingMore || isLoading || !posts.length) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadFeed(false, filter, sortBy);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTargetRef.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loadingMore, isLoading, posts.length, filter, sortBy, loadFeed]);

    // Render skeleton post loader
    const renderSkeleton = () => (
        <div className="flex flex-col gap-5">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col gap-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="h-32 bg-gray-100 rounded-lg"></div>
                    <div className="flex justify-between pt-2">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const filterTabs: { id: typeof filter; label: string; emoji: string }[] = [
        { id: 'all',          label: 'All',          emoji: '🌐' },
        { id: 'network',      label: 'Network',      emoji: '🤝' },
        { id: 'institutions', label: 'Institutions', emoji: '🏫' },
        { id: 'resources',    label: 'Resources',    emoji: '📚' },
        { id: 'polls',        label: 'Polls',        emoji: '📊' },
        { id: 'saved',        label: 'Saved',        emoji: '🔖' },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* ── Main Feed Content Area ────────────────────────────────── */}
            {isLoading ? (
                renderSkeleton()
            ) : posts.length > 0 ? (
                <div className="flex flex-col gap-5">
                    <AnimatePresence mode="popLayout">
                        {posts.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <UserFeedPost
                                    {...post}
                                    currentUserId={userId || ''}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {hasMore && (
                        <div ref={observerTargetRef} className="py-4 flex justify-center items-center">
                            {loadingMore && (
                                <FaCircleNotch className="animate-spin text-gray-400 text-lg" />
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        padding: '56px 24px',
                        textAlign: 'center',
                        background: 'white',
                        border: '1px solid #e8edf3',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: '0 2px 12px rgba(20,60,100,0.05)',
                    }}
                >
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, #eef4fb 0%, #dde8f5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '16px', border: '1px solid #ccdcee',
                    }}>
                        <FaCompass style={{ fontSize: '24px', color: '#143c64', opacity: 0.7 }} className="animate-pulse" />
                    </div>
                    <h3 className="oswald-font" style={{
                        fontSize: '13px', fontWeight: 700, color: '#1e3a5f',
                        letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
                    }}>
                        No updates found
                    </h3>
                    <p style={{
                        fontSize: '12px', color: '#94a3b8',
                        marginTop: '8px', maxWidth: '280px', lineHeight: 1.6, fontWeight: 500,
                    }}>
                        Nothing here yet. Try a different filter, change the sort order, or write a post to start the conversation!
                    </p>
                </motion.div>
            )}
        </div>
    );
}
