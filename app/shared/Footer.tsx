'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 pt-10 pb-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/dashboard">
                            <h2 className="text-xl oswald-font font-bold mb-4">
                                <span className="text-[var(--color-primary)]">Teacher</span>
                                <span className="text-[var(--color-secondary)]">Desk</span>
                            </h2>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                            Empowering educators with the tools and resources they need to excel in the modern classroom.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 rounded-full bg-gray-100 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300">
                                <FaFacebookF size={14} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-gray-100 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300">
                                <FaTwitter size={14} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-gray-100 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300">
                                <FaLinkedinIn size={14} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-gray-100 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300">
                                <FaInstagram size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[var(--color-primary)] font-bold text-sm capitalize tracking-wider mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/dashboard" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Home</Link></li>
                            <li><Link href="/connections" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Connections</Link></li>
                            <li><Link href="/classroom" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">My Classroom</Link></li>
                            <li><Link href="/jobs" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Jobs</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-[var(--color-primary)] font-bold text-sm capitalize tracking-wider mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/resources" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Teaching Materials</Link></li>
                            <li><Link href="/resources" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Lesson Plans</Link></li>
                            <li><Link href="/resources" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Worksheets</Link></li>
                            <li><Link href="/resources" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">E-books</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-[var(--color-primary)] font-bold text-sm capitalize tracking-wider mb-4">Support</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Help Center</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-xs">
                        © {currentYear} TeacherDesk. All rights reserved. Made with ❤️ for educators.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-400">
                        <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Terms</a>
                        <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
