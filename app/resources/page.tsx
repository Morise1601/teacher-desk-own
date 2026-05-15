'use client';

import React from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import ResourceMegaNav from '@/app/features/resources/ResourceMegaNav';
import ResourceHeader from '@/app/features/resources/ResourceHeader';
import MyProgress from '@/app/features/resources/MyProgress';
import CourseGrid from '@/app/features/resources/CourseGrid';
import MembershipPlans from '@/app/features/resources/MembershipPlans';
import SyllabusManager from '@/app/features/resources/SyllabusManager';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function ResourcesPage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="min-h-screen bg-[#FDFDFD] selection:bg-[var(--color-primary)] selection:text-white overflow-x-hidden">
            <Navbar />
            <ResourceMegaNav />

            {/* Scroll progress bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] z-[100] origin-left"
                style={{ scaleX }}
            />

            <main className="pb-20">
                {/* Hero / Header Section */}
                <ResourceHeader />

                {/* My Learning / Progress Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <MyProgress />
                </motion.div>

                {/* Main Course Grid / Exploration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <CourseGrid />
                </motion.div>

                {/* Membership / Pricing Section */}
                <div className="bg-[#f0f4f8]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <MembershipPlans />
                    </motion.div>
                </div>

                {/* Syllabus Management Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <SyllabusManager />
                </motion.div>

                {/* Interactive CTA Section */}
                <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
                    <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg md:rounded-lg p-8 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48 blur-3xl" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative z-10"
                        >
                            <h2 className="text-3xl md:text-6xl font-bold oswald-font mb-6 md:mb-8 capitalize tracking-tighter leading-tight text-balance">
                                Become a <span className="text-yellow-400">Certified</span> Expert
                            </h2>
                            <p className="text-white/80 text-base md:text-xl max-w-2xl mx-auto mb-10 font-light brcob-font leading-relaxed px-2">
                                Join our community of 50,000+ educators and take your career to the next level with industry-recognized certifications.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button className="w-full sm:w-auto bg-white text-[var(--color-primary)] px-8 md:px-12 py-4 md:py-5 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-xl hover:bg-yellow-400 hover:text-[var(--color-primary)] transition-all active:scale-95 group">
                                    Get Started Now
                                    <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                                <button className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white px-8 md:px-12 py-4 md:py-5 rounded-lg font-bold oswald-font capitalize tracking-widest hover:bg-white/10 transition-all">
                                    View FAQ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
