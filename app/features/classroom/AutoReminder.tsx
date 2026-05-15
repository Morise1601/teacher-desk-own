'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBell, HiClock, HiOutlineThumbUp } from 'react-icons/hi';

const AutoReminder = () => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            setShowNotification(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-lg p-5 shadow-lg border border-white/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center text-xl">
                        <HiClock />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 brcob-font">Next Class</h3>
                        <p className="text-[10px] text-gray-400 font-bold capitalize tracking-wider">Advanced Physics</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-[var(--color-primary)] oswald-font">{formatTime(timeLeft)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Starting in</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-bold transition-all ${isSubscribed
                        ? 'bg-green-50 text-green-600 border border-green-100'
                        : 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-sm'}`}
                >
                    <HiBell className={isSubscribed ? 'animate-bounce' : ''} />
                    {isSubscribed ? 'Reminder Set' : 'Auto Remind Me'}
                </button>
            </div>

            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-4 text-center"
                    >
                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-2xl mb-2">
                            <HiOutlineThumbUp />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800">Class has started!</h4>
                        <button
                            onClick={() => setShowNotification(false)}
                            className="mt-3 text-[11px] font-bold text-[var(--color-secondary)] capitalize hover:underline"
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background design */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-100/30 rounded-full blur-2xl" />
        </div>
    );
};

export default AutoReminder;
