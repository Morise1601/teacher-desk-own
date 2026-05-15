'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiBook, FiBriefcase, FiGlobe, FiCpu, FiMonitor, FiDatabase, FiAward, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const categories = [
    { name: 'Artificial Intelligence', icon: <FiCpu />, description: 'Machine learning, neural networks, and AI ethics.' },
    { name: 'Business', icon: <FiBriefcase />, description: 'Management, finance, and entrepreneurship.' },
    { name: 'Data Science', icon: <FiDatabase />, description: 'Data analysis, visualization, and big data.' },
    { name: 'Information Technology', icon: <FiMonitor />, description: 'Cloud computing, cybersecurity, and networking.' },
    { name: 'Personal Development', icon: <FiGlobe />, description: 'Soft skills, leadership, and mindfulness.' },
];

const roles = [
    'Data Analyst', 'Project Manager', 'Cyber Security Analyst', 'Data Scientist', 'UX Designer'
];

const trendingSkills = [
    'Python', 'Machine Learning', 'SQL', 'React', 'Generative AI'
];

const credentialTypes = [
    { name: 'Professional Certificates', link: '/resources/certificates' },
    { name: 'University Degrees', link: '/resources/degrees' },
    { name: 'Mastertrack Certificates', link: '#' },
    { name: 'Guided Projects', link: '#' },
];

export default function ResourceMegaNav() {
    const pathname = usePathname();
    const [isExploreOpen, setIsExploreOpen] = useState(false);

    const audiences = [
        { name: 'Individuals', path: '/resources' },
        { name: 'Businesses', path: '/resources/business' },
        { name: 'Universities', path: '/resources/universities' },
        // { name: 'Governments', path: '#' },
    ];

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-[72px] z-40">
            {/* Top Audience Bar */}
            <div className="bg-gray-50 border-b border-gray-100 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex gap-8 py-2">
                        {audiences.map((aud) => (
                            <Link
                                key={aud.name}
                                href={aud.path}
                                className={`text-[11px] capitalize tracking-widest font-bold transition-all ${(aud.path === '/resources' ? pathname === '/resources' : pathname.startsWith(aud.path))
                                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    } pb-1.5 pt-1`}
                            >
                                For {aud.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Mega Nav Bar */}
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center gap-4 md:gap-8 h-16">
                    {/* Explore Button */}
                    <div
                        className="relative"
                        onMouseLeave={() => setIsExploreOpen(false)}
                    >
                        <button
                            onMouseEnter={() => setIsExploreOpen(true)}
                            onClick={() => setIsExploreOpen(!isExploreOpen)}
                            className="bg-[var(--color-primary)] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-md active:scale-95 text-sm md:text-base"
                        >
                            <span className="hidden sm:inline">Explore</span>
                            <FiChevronDown className={`transition-transform duration-300 ${isExploreOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mega Menu Dropdown */}
                        <AnimatePresence>
                            {isExploreOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 md:left-4 lg:left-0 mt-2 w-[90vw] md:w-[700px] lg:w-[800px] bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col md:flex-row z-50 pointer-events-auto max-h-[80vh] overflow-y-auto"
                                >
                                    {/* Sidebar Categories */}
                                    <div className="w-full md:w-1/3 bg-gray-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100">
                                        <h3 className="text-xs font-bold capitalize tracking-widest text-[var(--color-primary)] mb-6 oswald-font">Categories</h3>
                                        <div className="space-y-1">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.name}
                                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm text-gray-700 hover:text-[var(--color-primary)] transition-all group"
                                                >
                                                    <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                                                    <span className="text-sm font-semibold">{cat.name}</span>
                                                    <FiChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-gray-200">
                                            <Link href="#" className="text-sm font-bold text-[var(--color-secondary)] hover:underline flex items-center gap-1 group">
                                                View all categories <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="w-full md:w-2/3 p-4 md:p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-xs font-bold capitalize tracking-widest text-[var(--color-primary)] mb-4 oswald-font">Degrees & Certificates</h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {credentialTypes.map((type) => (
                                                            <Link key={type.name} href={type.link} className="block group">
                                                                <div className="text-sm font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{type.name}</div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold capitalize tracking-widest text-[var(--color-primary)] mb-4 oswald-font">Explore Roles</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {roles.map((role) => (
                                                            <Link key={role} href="#" className="text-[11px] font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600 hover:bg-[var(--color-primary)] hover:text-white transition-all">
                                                                {role}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg p-6 text-white shadow-lg overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <FiAward className="text-2xl text-yellow-400" />
                                                            <span className="font-bold oswald-font capitalize tracking-widest text-[10px]">Featured Program</span>
                                                        </div>
                                                        <h4 className="text-lg font-bold mb-2 leading-tight">Master of Computer Science</h4>
                                                        <p className="text-xs text-white/80 mb-4 font-light">Join 5,000+ graduates in this top-tier program.</p>
                                                        <button className="w-full bg-white text-[var(--color-primary)] py-2 rounded-lg text-xs font-bold hover:bg-yellow-400 transition-all shadow-md">
                                                            Apply Now
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold capitalize tracking-widest text-[var(--color-primary)] mb-4 oswald-font">Trending Skills</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {trendingSkills.map((skill) => (
                                                            <Link key={skill} href="#" className="text-xs text-gray-600 hover:text-[var(--color-primary)] flex items-center gap-2 group">
                                                                <span className="w-1 h-1 bg-gray-300 rounded-full group-hover:bg-[var(--color-primary)] transition-all" />
                                                                {skill}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Direct Links */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 overflow-x-auto whitespace-nowrap">
                        <Link href="/resources/degrees" className="text-sm font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors">Degrees</Link>
                        <Link href="/resources/certificates" className="text-sm font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors">Certificates</Link>
                        <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />
                        <Link href="/resources/business" className="text-sm font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors hidden md:block">For Business</Link>
                    </div>

                    {/* Search (Simplified for this nav) */}
                    <div className="ml-auto hidden xl:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
                        <FiBook className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="What do you want to learn?"
                            className="bg-transparent outline-none text-xs text-gray-700 w-full font-medium"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}
