'use client';

import React from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import Image from 'next/image';
import ResourceMegaNav from '@/app/features/resources/ResourceMegaNav';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiTrendingUp, FiBriefcase, FiArrowRight } from 'react-icons/fi';

const certificates = [
    {
        title: "Google Data Analytics",
        provider: "Google",
        image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=600",
        students: "1.2M",
        color: "#4285F4"
    },
    {
        title: "IBM Data Science",
        provider: "IBM",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
        students: "800K",
        color: "#052FAD"
    },
    {
        title: "Meta Marketing Analytics",
        provider: "Meta",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
        students: "500K",
        color: "#0668E1"
    }
];

export default function CertificatesPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            <Navbar />
            <ResourceMegaNav />

            <main>
                {/* Hero */}
                <section className="bg-white py-20 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <h1 className="text-4xl md:text-6xl font-bold oswald-font text-[var(--color-primary)] mb-6 capitalize leading-tight">
                                    Become <span className="text-[var(--color-secondary)]">Job-Ready</span> <br />
                                    in Months
                                </h1 >
                                <p className="text-lg text-gray-500 font-light mb-10 leading-relaxed max-w-lg">
                                    Launch a new career with a Professional Certificate from world-class companies like Google, IBM, and Meta.
                                </p>
                                <div className="flex gap-4">
                                    <button className="bg-[var(--color-primary)] text-white px-10 py-4 rounded-lg font-bold hover:brightness-110 transition-all shadow-xl shadow-[var(--color-primary)]/20">
                                        Browse Certificates
                                    </button>
                                </div>
                            </motion.div>

                            <div className="relative">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 h-40 flex items-center justify-center">
                                            <span className="font-bold text-blue-600 text-2xl capitalize oswald-font">Google</span>
                                        </div>
                                        <div className="bg-black p-6 rounded-lg h-60 flex items-end">
                                            <span className="font-bold text-white text-xl capitalize oswald-font">IBM</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8">
                                        <div className="bg-gray-100 p-6 rounded-lg h-60">
                                            <span className="font-bold text-gray-800 text-xl capitalize oswald-font">Meta</span>
                                        </div>
                                        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 h-40 flex items-center justify-center">
                                            <span className="font-bold text-yellow-600 text-2xl capitalize oswald-font">Salesforce</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl text-blue-500 mb-6">
                                    <FiBriefcase />
                                </div>
                                <h3 className="text-xl font-bold mb-3">No experience needed</h3>
                                <p className="text-sm text-gray-500 font-light">Learn at your own pace whenever and wherever you want.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl text-green-500 mb-6">
                                    <FiTrendingUp />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Career acceleration</h3>
                                <p className="text-sm text-gray-500 font-light">Get noticed by hiring managers from leading employers.</p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl text-indigo-500 mb-6">
                                    <FiCheckCircle />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Applied learning</h3>
                                <p className="text-sm text-gray-500 font-light">Build a professional portfolio through guided projects.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Certificate Listing */}
                <section className="py-24 max-w-7xl mx-auto px-4 md:px-6">
                    <h2 className="text-3xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-12">Popular Certificates</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {certificates.map((cert) => (
                            <motion.div
                                key={cert.title}
                                whileHover={{ y: -10 }}
                                className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all"
                            >
                                <div className="h-48 relative">
                                    <Image 
                                        src={cert.image} 
                                        alt={cert.title} 
                                        fill
                                        className="object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                </div>
                                <div className="p-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cert.color }} />
                                        <span className="text-[10px] font-bold text-gray-400 capitalize tracking-widest">{cert.provider}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 h-14 line-clamp-2">{cert.title}</h3>
                                    <p className="text-sm text-gray-500 mb-8">{cert.students} learners already enrolled</p>
                                    <button className="w-full bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                                        View Certificate <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
