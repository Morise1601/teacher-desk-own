'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaSmile, FaSearch, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Curated list of popular emojis divided into categories
const EMOJI_CATEGORIES = [
    {
        name: 'Smileys',
        icon: '😀',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', 
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', 
            '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', 
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', 
            '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', 
            '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', 
            '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', 
            '🥴', '🤢', '🤮', '🤧', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'
        ]
    },
    {
        name: 'Gestures',
        icon: '👍',
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', 
            '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', 
            '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', 
            '✍️', '💅', '🤳', '💪', '🧠', '👀', '👁️', '👂', '👃', '👅', 
            '👄', '❤️', '💖', '🔥', '✨'
        ]
    },
    {
        name: 'Education',
        icon: '📚',
        emojis: [
            '📝', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '📓', '📕', '📗', '📘', 
            '📙', '📚', '📖', '🎓', '🏫', '🎒', '📐', '📏', '📎', '📌', 
            '💻', '🖥️', '🖨️', '📊', '📈', '📉', '📅', '📆', '🗓️', '💡', 
            '📢', '🔔', '🎯', '🏆', '🥇', '🥈', '🥉'
        ]
    }
];

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    align?: 'left' | 'right';
    buttonClassName?: string;
}

export function EmojiPicker({ onEmojiSelect, align = 'left', buttonClassName = '' }: EmojiPickerProps) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Smileys');
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Set mounted state
    useEffect(() => {
        setMounted(true);
    }, []);

    // Toggle popover
    const togglePicker = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    // Calculate coordinate placement relative to the viewport/document
    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const popupWidth = 288;
            const popupHeight = 310;
            
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            
            let top = 0;
            let left = 0;
            
            // Choose top or bottom position based on available viewport space
            if (spaceAbove > popupHeight || spaceAbove > spaceBelow) {
                // Open upwards
                top = rect.top + window.scrollY - popupHeight - 8;
            } else {
                // Open downwards
                top = rect.bottom + window.scrollY + 8;
            }
            
            // Align horizontally
            if (align === 'right') {
                left = rect.right + window.scrollX - popupWidth;
            } else {
                left = rect.left + window.scrollX;
            }
            
            // Prevent horizontal boundary overflow
            if (left < 10) left = 10;
            if (left + popupWidth > window.innerWidth - 10) {
                left = window.innerWidth - popupWidth - 10;
            }
            
            setCoords({ top, left });
        }
    };

    // Recalculate coordinates on scroll, resize or open
    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [isOpen, align]);

    // Close when clicking outside button/container and outside the portal content
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                (!popupRef.current || !popupRef.current.contains(target))
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle emoji click
    const handleEmojiClick = (emoji: string, e: React.MouseEvent) => {
        e.preventDefault();
        onEmojiSelect(emoji);
    };

    // Filter emojis based on search query
    const filteredCategories = EMOJI_CATEGORIES.map(category => {
        if (!searchQuery.trim()) return category;

        const query = searchQuery.toLowerCase();
        const matchesCategory = category.name.toLowerCase().includes(query);

        if (matchesCategory) return category;

        const matchesDirectEmoji = category.emojis.filter(e => e === query || query.includes(e));
        if (matchesDirectEmoji.length > 0) {
            return { ...category, emojis: matchesDirectEmoji };
        }

        return { ...category, emojis: [] };
    }).filter(c => c.emojis.length > 0);

    const hasSearchResults = filteredCategories.length > 0 && filteredCategories.some(c => c.emojis.length > 0);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={togglePicker}
                className={`p-1.5 text-gray-500 hover:text-yellow-500 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-center ${buttonClassName}`}
                title="Add Emoji"
            >
                <FaSmile className="text-lg" />
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={popupRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={{
                                position: 'absolute',
                                top: `${coords.top}px`,
                                left: `${coords.left}px`,
                            }}
                            className="z-[9999] w-72 rounded-2xl bg-white border border-gray-150 shadow-2xl overflow-hidden flex flex-col text-left"
                        >
                            {/* Search bar */}
                            <div className="p-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                                <div className="relative flex-1">
                                    <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                    <input
                                        type="text"
                                        ref={searchInputRef}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Fuzzy emoji search..."
                                        className="w-full pl-7 pr-7 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <FaTimes className="text-[10px]" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category selector */}
                            {!searchQuery && (
                                <div className="flex border-b border-gray-100 bg-gray-50/20 px-2 py-1.5 gap-1">
                                    {EMOJI_CATEGORIES.map(category => (
                                        <button
                                            key={category.name}
                                            onClick={() => setActiveCategory(category.name)}
                                            className={`flex-1 py-1 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                                activeCategory === category.name
                                                    ? 'bg-yellow-50 text-yellow-600 shadow-sm border border-yellow-100/50'
                                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                            }`}
                                        >
                                            <span>{category.icon}</span>
                                            <span className="hidden sm:inline text-[10px]">{category.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Emojis list */}
                            <div className="max-h-48 overflow-y-auto p-2">
                                {searchQuery ? (
                                    hasSearchResults ? (
                                        filteredCategories.map(category => (
                                            <div key={category.name} className="mb-3">
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1 px-1">
                                                    {category.name}
                                                </div>
                                                <div className="grid grid-cols-8 gap-1">
                                                    {category.emojis.map((emoji, index) => (
                                                        <button
                                                            key={`${emoji}-${index}`}
                                                            onClick={(e) => handleEmojiClick(emoji, e)}
                                                            className="w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-yellow-100 hover:scale-115 active:scale-95 transition-all"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-xs text-gray-400 font-semibold">
                                            No emojis matched "{searchQuery}"
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        {EMOJI_CATEGORIES.filter(c => c.name === activeCategory).map(category => (
                                            <div key={category.name} className="grid grid-cols-8 gap-1.5">
                                                {category.emojis.map((emoji, index) => (
                                                    <button
                                                        key={`${emoji}-${index}`}
                                                        onClick={(e) => handleEmojiClick(emoji, e)}
                                                        className="w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-yellow-100 hover:scale-115 active:scale-95 transition-all"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
