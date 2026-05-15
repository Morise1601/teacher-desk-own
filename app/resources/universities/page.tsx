'use client';

import React from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import ResourceMegaNav from '@/app/features/resources/ResourceMegaNav';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiTrendingUp, FiArrowRight, FiCheck } from 'react-icons/fi';

export default function UniversitiesPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <ResourceMegaNav />

            <main>
                {/* Hero Section */}
                <section className="relative py-24 bg-gradient-to-br from-[#0c1b33] to-[var(--color-primary)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-secondary)]/10 rounded-full -mr-96 -mt-96 blur-3xl animate-pulse" />

                    <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl mx-auto"
                        >
                            <span className="text-yellow-400 text-sm font-bold capitalize tracking-[0.3em] oswald-font mb-4 block">TeacherDesk for Campus</span>
                            <h1 className="text-4xl md:text-7xl font-bold text-white oswald-font mb-8 capitalize leading-[0.9]">
                                Empower Your <span className="text-white/40">Institution</span> with World-Class Learning
                            </h1>
                            <p className="text-xl text-gray-300 mb-12 font-light brcob-font leading-relaxed">
                                Join 4,000+ universities worldwide. Provide your students with a digital campus and job-ready skills through our integrated platform.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <button className="w-full sm:w-auto bg-white text-[var(--color-primary)] px-12 py-5 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-2xl hover:bg-yellow-400 transition-all active:scale-95 group">
                                    Contact Sales
                                    <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                                <button className="w-full sm:w-auto bg-transparent border-2 border-white/20 text-white px-12 py-5 rounded-lg font-bold oswald-font capitalize tracking-widest hover:bg-white/10 transition-all">
                                    View Products
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Logo Cloud / Trust Section */}
                <section className="py-16 border-b border-gray-100 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <p className="text-center text-xs font-bold text-gray-400 capitalize tracking-widest mb-10">Trusted by leading academic institutions</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
                            <span className="text-2xl font-bold oswald-font text-gray-800">University A</span>
                            <span className="text-2xl font-bold oswald-font text-gray-800">College B</span>
                            <span className="text-2xl font-bold oswald-font text-gray-800">Institute C</span>
                            <span className="text-2xl font-bold oswald-font text-gray-800">Academy D</span>
                            <span className="text-2xl font-bold oswald-font text-gray-800">Polytech E</span>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-6">Designed for Every Stakeholder</h2>
                        <div className="w-24 h-1.5 bg-[var(--color-secondary)] mx-auto rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <FiUsers />,
                                title: "For Students",
                                description: "Bridge the skill gap with 5,000+ courses and professional certificates from top industry partners.",
                                points: ["Job-ready skills", "Guided Projects", "Global Credentials"]
                            },
                            {
                                icon: <FiClock />,
                                title: "For Faculty",
                                description: "Scale classroom learning with high-quality content and autograded assessments.",
                                points: ["LMS Integration", "Curriculum Mapping", "Faculty Training"]
                            },
                            {
                                icon: <FiTrendingUp />,
                                title: "For Admin",
                                description: "Gain visibility into student progress and engagement with robust analytics dashboards.",
                                points: ["Advanced Analytics", "SSO Authentication", "Institutional Support"]
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-10 rounded-lg border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all group"
                            >
                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-3xl text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all mb-8">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold oswald-font text-gray-900 mb-4 capitalize tracking-tight">{feature.title}</h3>
                                <p className="text-sm text-gray-500 font-light mb-8 leading-relaxed">
                                    {feature.description}
                                </p>
                                <ul className="space-y-3">
                                    {feature.points.map(p => (
                                        <li key={p} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                            <FiCheck className="text-[var(--color-secondary)]" /> {p}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* LMS Section */}
                <section className="bg-[#f0f4f8] py-24 overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl md:text-5xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-8 leading-tight">Seamlessly Integrated into Your Ecosystem</h2>
                                <p className="text-lg text-gray-600 font-light mb-10 leading-relaxed">
                                    Whether you use Canvas, Blackboard, Moodle, or Brightspace, our platform integrates directly into your existing IT infrastructure.
                                </p>
                                <button className="text-[var(--color-primary)] font-bold oswald-font capitalize tracking-widest flex items-center gap-2 group">
                                    Explore Integrations <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>

                            <div className="relative">
                                <div className="bg-white p-12 rounded-lg shadow-2xl relative z-10">
                                    <div className="grid grid-cols-2 gap-8 items-center justify-center opacity-60">
                                        <div className="h-12 bg-gray-100 rounded-lg" />
                                        <div className="h-12 bg-gray-100 rounded-lg" />
                                        <div className="h-12 bg-gray-100 rounded-lg" />
                                        <div className="h-12 bg-gray-100 rounded-lg" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[var(--color-primary)] font-bold oswald-font text-3xl">Your Lms</span>
                                    </div>
                                </div>
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Hub */}
                <section className="py-24 text-center px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-6xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-8">Ready to Transform?</h2>
                        <p className="text-lg text-gray-500 mb-12 font-light">Join the future of education today. Speak with our institutional experts to find the right solution for your campus.</p>
                        <button className="bg-[var(--color-primary)] text-white px-12 py-5 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-2xl shadow-[var(--color-primary)]/30 hover:bg-yellow-400 hover:text-[var(--color-primary)] transition-all">
                            Get a Demo
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
