'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa'; // Example icons

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'Home', href: '/dashboard' },
        { name: 'Connections', href: '/dashboard/connections' },
        { name: 'My Classroom', href: '/dashboard/classroom' },
        { name: 'Resources', href: '/dashboard/resources' },
        { name: 'Desk', href: '/dashboard/desk' },
        { name: 'Jobs', href: '/dashboard/jobs' },
        { name: 'Notifications', href: '/dashboard/notifications' },
        { name: 'My Profile', href: '/dashboard/profile' },
    ];

    return (
        <header className="bg-white shadow-md p-4 sticky top-0 z-50">
            <nav className="flex items-center justify-between">
                <div className="text-xl font-bold text-[var(--color-primary)]">TeacherDesk</div>
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-[var(--color-primary)] focus:outline-none">
                        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
                <ul className={`md:flex md:gap-6 ${isOpen ? 'flex flex-col absolute top-full left-0 w-full bg-white shadow-lg p-4' : 'hidden'}`}>
                    {navLinks.map((link) => (
                        <li key={link.name} className="py-2 md:py-0">
                            <Link href={link.href} className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium">
                                {link.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
