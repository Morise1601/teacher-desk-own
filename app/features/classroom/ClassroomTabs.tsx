'use client';

import React from 'react';
import { motion } from 'framer-motion';

type TabType = 'Stream' | 'Classwork' | 'People' | 'Resources';

interface ClassroomTabsProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

const ClassroomTabs: React.FC<ClassroomTabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs: TabType[] = ['Stream', 'Classwork', 'People', 'Resources'];

    return (
        <div className="w-full border-b border-gray-200 bg-white sticky top-[72px] z-40 mb-4 md:mb-6">
            <div className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-hide px-2 md:px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative py-3 md:py-4 px-4 md:px-6 text-[13px] md:text-sm font-bold transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'text-[var(--color-secondary)]' : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-secondary)] rounded-t-full"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClassroomTabs;
