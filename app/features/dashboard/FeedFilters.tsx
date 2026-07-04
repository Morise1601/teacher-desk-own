// app/features/dashboard/FeedFilters.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaSortAmountDown } from 'react-icons/fa';

export type FeedFilterType = 'all' | 'network' | 'institutions' | 'resources' | 'polls' | 'saved';
export type FeedSortType = 'latest' | 'most_liked' | 'most_commented';

interface FeedFiltersProps {
    filter: FeedFilterType;
    setFilter: (filter: FeedFilterType) => void;
    sortBy: FeedSortType;
    setSortBy: (sortBy: FeedSortType) => void;
}

export default function FeedFilters({ filter, setFilter, sortBy, setSortBy }: FeedFiltersProps) {
    const filterTabs: { id: FeedFilterType; label: string; emoji: string }[] = [
        { id: 'all',          label: 'All',          emoji: '🌐' },
        { id: 'network',      label: 'Network',      emoji: '🤝' },
        { id: 'institutions', label: 'Institutions', emoji: '🏫' },
        { id: 'resources',    label: 'Resources',    emoji: '📚' },
        { id: 'polls',        label: 'Polls',        emoji: '📊' },
        { id: 'saved',        label: 'Saved',        emoji: '🔖' },
    ];

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e4ecf4',
            boxShadow: '0 4px 20px rgba(20,60,100,0.05)',
            overflow: 'hidden',
        }}>
            {/* Header bar */}
            <div style={{
                background: 'linear-gradient(135deg, #143c64 0%, #1a5296 100%)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
            }}>
                <span style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
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
                            fontSize: '10px', fontWeight: 700, color: '#fff',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        {filterTabs.find(t => t.id === filter)?.emoji}&nbsp;
                        {filterTabs.find(t => t.id === filter)?.label}
                    </motion.span>
                </AnimatePresence>
            </div>

            {/* Filter grid (3-col card grid suited for sidebar space) */}
            <div style={{ padding: '12px 12px 0' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                }}>
                    {filterTabs.map((tab) => {
                        const isActive = filter === tab.id;
                        return (
                            <motion.button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                whileTap={{ scale: 0.94 }}
                                whileHover={{ y: -1 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '10px 4px 8px',
                                    borderRadius: '8px',
                                    border: isActive ? '2px solid #143c64' : '2px solid #edf2f7',
                                    background: isActive ? 'linear-gradient(145deg, #143c64 0%, #1d5fa0 100%)' : '#f8fafc',
                                    color: isActive ? '#fff' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isActive ? '0 4px 10px rgba(20,60,100,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                                }}
                            >
                                <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.emoji}</span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em',
                                    lineHeight: 1,
                                }}>
                                    {tab.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Sort By strip */}
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px', flexWrap: 'wrap',
                padding: '8px 12px 12px',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {([
                        { value: 'latest',         label: '🕐 Latest'         },
                        { value: 'most_liked',     label: '❤️ Liked'          },
                        { value: 'most_commented', label: '💬 Discussed'      },
                    ] as { value: FeedSortType; label: string }[]).map(opt => {
                        const isActive = sortBy === opt.value;
                        return (
                            <motion.button
                                key={opt.value}
                                onClick={() => setSortBy(opt.value)}
                                whileTap={{ scale: 0.94 }}
                                style={{
                                    padding: '3px 8px',
                                    borderRadius: '50px',
                                    border: isActive ? '1.5px solid #143c64' : '1.5px solid #e2e8f0',
                                    background: isActive ? 'linear-gradient(135deg, #143c64, #1d5fa0)' : '#f8fafc',
                                    color: isActive ? '#fff' : '#475569',
                                    fontSize: '9px', fontWeight: isActive ? 700 : 600,
                                    whiteSpace: 'nowrap', cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isActive ? '0 2px 6px rgba(20,60,100,0.15)' : 'none',
                                }}
                            >
                                {opt.label}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
