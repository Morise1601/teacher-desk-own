'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import AppLogo from '@/components/ui/AppLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Home', href: '/dashboard' },
        { name: 'Connections', href: '/connections' },
        { name: 'My Classroom', href: '/classroom' },
        { name: 'Resources', href: '/resources' },
        { name: 'Desk', href: '/desk' },
        { name: 'Jobs', href: '/jobs' },
        { name: 'Notifications', href: '/notifications' },
        { name: 'My Profile', href: '/profile' },
    ];

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm p-4 sticky top-0 z-50 transition-colors duration-200">
            <nav className="flex items-center justify-between max-w-7xl mx-auto">
                <Link href="/dashboard" className="flex items-center">
                    <AppLogo variant="full" width={150} height={32} className="h-8 w-auto" />
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle size="sm" />
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-gray-200 focus:outline-none p-1">
                            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                    </div>
                </div>
                <ul className={`md:flex md:gap-6 ${isOpen ? 'flex flex-col absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-lg p-4 border-b border-gray-100 dark:border-slate-800' : 'hidden'}`}>
                    {navLinks.map((link) => (
                        <li key={link.name} className="py-2 md:py-0">
                            <Link href={link.href} className="text-gray-700 dark:text-gray-200 hover:text-[var(--color-primary)] dark:hover:text-emerald-400 font-medium text-sm transition-colors">
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
