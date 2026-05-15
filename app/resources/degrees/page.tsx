'use client';

import React from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import Image from 'next/image';
import ResourceMegaNav from '@/app/features/resources/ResourceMegaNav';
import DegreeHero from '@/app/features/resources/DegreeHero';
import { motion } from 'framer-motion';
import { FiFilter, FiCalendar, FiMapPin, FiAward, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const degrees = [
    {
        title: "Master of Computer Science",
        university: "University of Tech Excellence",
        logo: "https://placehold.co/100x100/143c64/white?text=UTE",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
        duration: "18-24 Months",
        deadline: "Aug 15, 2026",
        category: "Computer Science",
        description: "Advance your technical skills with a master's degree from a world-renowned department."
    },
    {
        title: "MBA in Digital Leadership",
        university: "Global School of Management",
        logo: "https://placehold.co/100x100/12501b/white?text=GSM",
        image: "https://images.unsplash.com/photo-1454165833767-131435bb429f?auto=format&fit=crop&q=80&w=600",
        duration: "12-18 Months",
        deadline: "Sep 1, 2026",
        category: "Business",
        description: "Transform your career with a leadership-focused MBA designed for the digital age."
    },
    {
        title: "MS in Data Science & AI",
        university: "Silicon Valley Institute",
        logo: "https://placehold.co/100x100/f59e0b/white?text=SVI",
        image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=600",
        duration: "24 Months",
        deadline: "Oct 10, 2026",
        category: "Data Science",
        description: "Master the intersection of data science and artificial intelligence for future-ready roles."
    }
];

export default function DegreesPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            <Navbar />
            <ResourceMegaNav />

            <main>
                <DegreeHero />

                {/* Filter Bar */}
                <section className="sticky top-[136px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-all">
                                <FiFilter /> Filter by Level
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-all">
                                Subject Area
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm hidden md:block">Showing {degrees.length} Degrees</p>
                    </div>
                </section>

                {/* Degree Grid */}
                <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
                    <div className="grid md:grid-cols-3 gap-8">
                        {degrees.map((degree, index) => (
                            <motion.div
                                key={degree.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                            >
                                <div className="relative h-48">
                                    <Image 
                                        src={degree.image} 
                                        alt={degree.title} 
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-[var(--color-primary)] capitalize tracking-wider">
                                        {degree.category}
                                    </div>
                                    <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-lg bg-white shadow-lg flex items-center justify-center overflow-hidden border border-gray-50">
                                        <Image 
                                            src={degree.logo} 
                                            alt={degree.university} 
                                            width={40}
                                            height={40}
                                            className="object-contain" 
                                        />
                                    </div>
                                </div>

                                <div className="p-8 pt-10">
                                    <p className="text-xs font-bold text-gray-400 mb-2 capitalize tracking-widest">{degree.university}</p>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                                        {degree.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-light mb-6 line-clamp-2">
                                        {degree.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <FiCalendar className="text-[var(--color-primary)]" />
                                            <span className="text-[10px] font-bold text-gray-600 capitalize">{degree.duration}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 text-right">
                                            <FiAward className="text-yellow-500" />
                                            <span className="text-[10px] font-bold text-gray-600 capitalize">Online Degree</span>
                                        </div>
                                    </div>

                                    <button className="w-full mt-8 bg-gray-50 group-hover:bg-[var(--color-primary)] group-hover:text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                        View Program Details <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Information Section */}
                <section className="bg-gray-50 py-24">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold oswald-font text-[var(--color-primary)] mb-8 capitalize">A Smarter Way to Learn</h2>
                        <p className="text-lg text-gray-600 font-light mb-12">
                            The online degrees on our platform are the same as the on-campus programs. You&apos;ll learn from the same world-class faculty, graduate with the same credential, and join the same global alumni network.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-6">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center mx-auto mb-6 text-[var(--color-secondary)] text-2xl">
                                    <FiCheckCircle />
                                </div>
                                <h4 className="font-bold mb-2">100% Online</h4>
                                <p className="text-xs text-gray-500">Study on your own schedule from anywhere in the world.</p>
                            </div>
                            <div className="p-6">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center mx-auto mb-6 text-[var(--color-secondary)] text-2xl">
                                    <FiAward />
                                </div>
                                <h4 className="font-bold mb-2">Top Universities</h4>
                                <p className="text-xs text-gray-500">Learn from leading institutions with global reputations.</p>
                            </div>
                            <div className="p-6">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center mx-auto mb-6 text-[var(--color-secondary)] text-2xl">
                                    <FiMapPin />
                                </div>
                                <h4 className="font-bold mb-2">Local Support</h4>
                                <p className="text-xs text-gray-500">Access local student hubs and networking events.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
