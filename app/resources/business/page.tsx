'use client';

import React from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import ResourceMegaNav from '@/app/features/resources/ResourceMegaNav';
import { FiTrendingUp, FiTarget, FiBox } from 'react-icons/fi';

export default function BusinessPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <ResourceMegaNav />
            <main>
                <section className="bg-slate-50 py-24">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h1 className="text-5xl md:text-7xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-8">Scale Your <span className="text-[var(--color-secondary)]">Business</span></h1>
                        <p className="text-xl text-gray-500 font-light mb-12 max-w-2xl mx-auto">Up-skill your workforce with the world&apos;s most trusted learning platform. Drive innovation and growth through digital transformation.</p>
                        <button className="bg-[var(--color-primary)] text-white px-12 py-5 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-2xl hover:bg-yellow-400 hover:text-black transition-all">Get Started</button>
                    </div>
                </section>

                <section className="py-24 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold oswald-font text-[var(--color-primary)] capitalize mb-8">Customized Solutions for Teams</h2>
                            <div className="space-y-6">
                                {[
                                    { title: "Skill Insights", icon: <FiTrendingUp />, desc: "Track progress and identify skill gaps automatically." },
                                    { title: "Compliance Training", icon: <FiTarget />, desc: "Ensure your team meets industry standards and regulations." },
                                    { title: "Enterprise Grade", icon: <FiBox />, desc: "SSO, LMS integration, and dedicated success managers." }
                                ].map(item => (
                                    <div key={item.title} className="flex gap-6 p-6 rounded-lg border border-gray-100 hover:shadow-lg transition-all">
                                        <div className="text-3xl text-[var(--color-secondary)]">{item.icon}</div>
                                        <div>
                                            <h4 className="font-bold mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-500 font-light">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-lg aspect-square flex items-center justify-center">
                            <span className="text-white font-bold oswald-font text-5xl opacity-20 capitalize tracking-widest rotate-12">Enterprise</span>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
