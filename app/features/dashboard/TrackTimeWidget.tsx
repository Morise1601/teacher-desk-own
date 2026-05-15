'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function TrackTimeWidget() {
    return (
        <motion.div
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div className="relative w-16 h-16 mx-auto mb-3">
                <Image src="/images/workwise-logo.png" alt="Workwise Logo" width={64} height={64} /> {/* Dummy logo */}
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Track Time On Workwise</h3>
            <p className="text-sm text-gray-500 mb-4">Pay only for the hours worked</p>
            <button className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-md hover:bg-[var(--color-secondary)] transition-colors font-medium">
                SIGN UP
            </button>
            <p className="text-xs text-blue-600 mt-2 hover:underline cursor-pointer">Learn More</p>
        </motion.div>
    );
}
