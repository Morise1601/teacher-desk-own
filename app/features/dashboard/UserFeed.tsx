// src/app/features/dashboard/UserFeed.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import UserFeedPost from './UserFeedPost';
import { getFeedAction } from '@/app/actions/posts';
import { decryptData, encryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSortAmountDown, FaCircleNotch, FaCompass } from 'react-icons/fa';

export default function UserFeed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Filters and sorting
    const [filter, setFilter] = useState<'all' | 'network' | 'institutions' | 'resources' | 'polls' | 'saved'>('all');
    const [sortBy, setSortBy] = useState<'latest' | 'most_liked' | 'most_commented'>('latest');

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
                const fetchedPosts = res.data;
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
    }, [userId, cursor, filter, sortBy]);

    // Reload feed when user changes filters or sorting
    useEffect(() => {
        if (userId) {
            loadFeed(true, filter, sortBy);
        }
    }, [userId, filter, sortBy]);

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

            {/* ══════════════════════════════════════════════════════════════
                FEED CONTROL BAR  – always-visible filter grid + sort pills
                Mobile  : 3 × 2 emoji-card grid  (no overflow, no scroll)
                Tablet+ : single-row inline pills
            ══════════════════════════════════════════════════════════════ */}
            <div style={{
                background: 'white',
                borderRadius: '18px',
                border: '1px solid #e4ecf4',
                boxShadow: '0 4px 20px rgba(20,60,100,0.07)',
                overflow: 'hidden',
            }}>

                {/* ── Header bar ─────────────────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(135deg, #143c64 0%, #1a5296 100%)',
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                }}>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                        <FaFilter style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }} />
                        Feed Filters
                    </span>

                    {/* Active filter badge */}
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={filter}
                            initial={{ opacity: 0, y: -6, scale: 0.88 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.88 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: '50px',
                                padding: '3px 10px',
                                fontSize: '11px', fontWeight: 700, color: '#fff',
                                backdropFilter: 'blur(6px)',
                            }}
                        >
                            {filterTabs.find(t => t.id === filter)?.emoji}&nbsp;
                            {filterTabs.find(t => t.id === filter)?.label}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* ── Filter grid (mobile: 3-col card grid, md+: pill row) ── */}
                <div style={{ padding: '12px 12px 0' }}>

                    {/* MOBILE CARD GRID — hidden on md+ via inline style trick using CSS class */}
                    <div className="feed-filter-grid">
                        {filterTabs.map((tab) => {
                            const isActive = filter === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    whileTap={{ scale: 0.91 }}
                                    whileHover={{ y: -2 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '10px 6px 8px',
                                        borderRadius: '14px',
                                        border: isActive
                                            ? '2px solid #143c64'
                                            : '2px solid #edf2f7',
                                        background: isActive
                                            ? 'linear-gradient(145deg, #143c64 0%, #1d5fa0 100%)'
                                            : '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        boxShadow: isActive
                                            ? '0 4px 14px rgba(20,60,100,0.30), inset 0 1px 0 rgba(255,255,255,0.1)'
                                            : '0 1px 4px rgba(0,0,0,0.04)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Active shimmer line at top */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="filter-card-shine"
                                            style={{
                                                position: 'absolute', top: 0, left: 0, right: 0,
                                                height: '2px',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                        />
                                    )}
                                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.emoji}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: isActive ? '#fff' : '#64748b',
                                        letterSpacing: '0.02em',
                                        lineHeight: 1,
                                    }}>
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <span style={{
                                            position: 'absolute', bottom: '5px', right: '5px',
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.55)',
                                        }} />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* DESKTOP PILL ROW — hidden on mobile */}
                    <div className="feed-filter-pills">
                        {filterTabs.map((tab) => {
                            const isActive = filter === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    whileTap={{ scale: 0.94 }}
                                    style={{
                                        position: 'relative',
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '7px 16px',
                                        borderRadius: '50px',
                                        border: isActive ? '2px solid #143c64' : '2px solid transparent',
                                        background: isActive
                                            ? 'linear-gradient(135deg, #143c64 0%, #1e5799 100%)'
                                            : 'transparent',
                                        color: isActive ? '#fff' : '#64748b',
                                        fontSize: '12.5px',
                                        fontWeight: isActive ? 700 : 600,
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        boxShadow: isActive ? '0 4px 12px rgba(20,60,100,0.28)' : 'none',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
                                            (e.currentTarget as HTMLElement).style.color = '#143c64';
                                            (e.currentTarget as HTMLElement).style.border = '2px solid #d4e2ef';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                            (e.currentTarget as HTMLElement).style.color = '#64748b';
                                            (e.currentTarget as HTMLElement).style.border = '2px solid transparent';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '14px', lineHeight: 1 }}>{tab.emoji}</span>
                                    {tab.label}
                                    {isActive && (
                                        <motion.span
                                            layoutId="pill-active-dot"
                                            style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.65)',
                                                display: 'inline-block', marginLeft: '1px',
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Sort By strip ──────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px', flexWrap: 'wrap',
                    padding: '8px 14px 12px',
                    borderTop: '1px solid #f0f5fa',
                    marginTop: '10px',
                }}>
                    <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                        <FaSortAmountDown style={{ fontSize: '9px', color: '#143c64' }} />
                        Sort by
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        {([
                            { value: 'latest',         label: '🕐 Latest'         },
                            { value: 'most_liked',     label: '❤️ Liked'          },
                            { value: 'most_commented', label: '💬 Discussed'      },
                        ] as { value: typeof sortBy; label: string }[]).map(opt => {
                            const isActive = sortBy === opt.value;
                            return (
                                <motion.button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    whileTap={{ scale: 0.93 }}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '50px',
                                        border: isActive ? '1.5px solid #143c64' : '1.5px solid #e2e8f0',
                                        background: isActive
                                            ? 'linear-gradient(135deg, #143c64, #1d5fa0)'
                                            : '#f8fafc',
                                        color: isActive ? '#fff' : '#475569',
                                        fontSize: '11px', fontWeight: isActive ? 700 : 600,
                                        whiteSpace: 'nowrap', cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        boxShadow: isActive ? '0 2px 8px rgba(20,60,100,0.22)' : 'none',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.borderColor = '#143c64';
                                            (e.currentTarget as HTMLElement).style.color = '#143c64';
                                            (e.currentTarget as HTMLElement).style.background = '#eef3f9';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                                            (e.currentTarget as HTMLElement).style.color = '#475569';
                                            (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                                        }
                                    }}
                                >
                                    {opt.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

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
