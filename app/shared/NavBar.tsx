'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiMenu, HiX, HiOutlineSearch } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { IoIosHome } from "react-icons/io";
import { SiGoogleclassroom } from "react-icons/si";
import { GrResources } from "react-icons/gr";
import { MdWork } from "react-icons/md";
import { PiNotebookFill } from "react-icons/pi";
import { FaBell, FaUser, FaUsers, FaEnvelope } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { Input } from "@/components/ui/input";
import MessageMenu from './MessageMenu';
import MessagePopup from './MessagePopup';
import NotificationMenu from './NotificationMenu';
import { supabase } from '@/lib/supabase';
import { decryptData } from '@/lib/crypto';
import { getProfileByUserIdAction } from '@/app/actions/profile';
import { getInstitutionProfileAction } from '@/app/actions/institution';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [profileData, setProfileData] = useState<any>(null);
    const pathname = usePathname();

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const role = user.user_metadata?.role;
            let res;
            if (role === 'teacher') {
                res = decryptData(await getProfileByUserIdAction(user.id));
            } else if (role === 'institution' || role === 'institution_admin') {
                res = decryptData(await getInstitutionProfileAction(user.id));
            }

            if (res && res.success) {
                setProfileData(res.profile || res.data);
            }
        };
        fetchProfile();
    }, []);

    const navLinks = [
        { name: 'Home', href: '/dashboard', icon: <IoIosHome className='text-xl' /> },
        { name: 'Connections', href: '/connections', icon: <FaUsers className='text-xl' /> },
        { name: 'My Classroom', href: '/classroom', icon: <SiGoogleclassroom className='text-xl' /> },
        { name: 'Resources', href: '/resources', icon: <GrResources className='text-xl' /> },
        { name: 'Desk', href: '/desk', icon: <PiNotebookFill className='text-xl' /> },
        { name: 'Jobs', href: '/jobs', icon: <MdWork className='text-xl' /> },
        { name: 'Messages', href: '/messages', icon: <FaEnvelope className='text-xl' /> },
        { name: 'Notifications', href: '/notifications', icon: <FaBell className='text-xl' /> },
    ];

    const isActive = (href: string) =>
        href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
            setSearchQuery('');
        }
    };

    return (
        <header className="bg-white p-4 sticky top-0 z-50 shadow-sm">
            <nav className="flex items-center justify-between max-w-7xl mx-auto">

                {/* ── Logo ── */}
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-[var(--color-primary)]">
                        <Link href="/dashboard">
                            <h2 className='text-xl oswald-font font-bold py-1.5 px-2 rounded-md' title='TeacherDesk'>
                                <span className='text-[var(--color-primary)]'>Teacher</span><span className='text-[var(--color-secondary)]'>Desk</span>
                            </h2>
                        </Link>
                    </div>

                    {/* Search Bar — desktop */}
                    <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center border border-gray-300 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all duration-200 w-[200px] lg:w-[150px] xl:w-[250px]">
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-grow h-auto outline-none border-none focus-visible:ring-0 text-sm bg-transparent placeholder-gray-500"
                        />
                        <button type="submit" className="ml-2 text-gray-500 hover:text-blue-500">
                            <HiOutlineSearch className="text-xl" />
                        </button>
                    </form>
                </div>

                {/* ── Desktop Nav Links ── */}
                <ul className="hidden lg:flex lg:gap-15 xl:gap-8 items-center text-[13px] xl:text-[14px]">
                    {navLinks.map((item, index) => {
                        const active = isActive(item.href);

                        if (item.name === 'Messages') {
                            return (
                                <motion.li
                                    key={index}
                                    className="relative cursor-pointer group"
                                    animate={{ color: active ? 'var(--color-secondary)' : 'var(--color-primary)' }}
                                    whileHover={{ color: 'var(--color-secondary)' }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MessageMenu active={active} />
                                </motion.li>
                            );
                        }

                        if (item.name === 'Notifications') {
                            return (
                                <motion.li
                                    key={index}
                                    className="relative cursor-pointer group"
                                    animate={{ color: active ? 'var(--color-secondary)' : 'var(--color-primary)' }}
                                    whileHover={{ color: 'var(--color-secondary)' }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <NotificationMenu active={active} />
                                </motion.li>
                            );
                        }

                        return (
                            <motion.li
                                key={index}
                                className="relative cursor-pointer group"
                                animate={{ color: active ? 'var(--color-secondary)' : 'var(--color-primary)' }}
                                whileHover={{ color: 'var(--color-secondary)' }}
                                transition={{ duration: 0.2 }}
                            >
                                <Link
                                    href={item.href}
                                    className={`flex flex-col items-center gap-0.5 pb-1 transition-colors ${active ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)]'}`}
                                    title={item.name}
                                >
                                    {/* Icon */}
                                    <span className={`transition-colors ${active ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)] group-hover:text-[var(--color-secondary)]'}`}>
                                        {item.icon}
                                    </span>

                                    {/* Label — hidden on lg, shown on xl */}
                                    <span className={`lg:hidden xl:block text-[13px] font-medium leading-none transition-colors ${active ? 'text-[var(--color-secondary)]' : 'group-hover:text-[var(--color-secondary)]'}`}>
                                        {item.name}
                                    </span>
                                </Link>

                                {/* Active underline bar */}
                                <motion.div
                                    className="absolute left-0 bottom-0 h-[2px] rounded-full bg-[var(--color-secondary)]"
                                    initial={false}
                                    animate={{ width: active ? '100%' : '0%' }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                />

                                {/* Hover underline (only when NOT active) */}
                                {!active && (
                                    <motion.div
                                        className="absolute left-0 bottom-0 h-[2px] rounded-full bg-[var(--color-secondary)] origin-left"
                                        initial={{ scaleX: 0 }}
                                        whileHover={{ scaleX: 1 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        style={{ width: '100%' }}
                                    />
                                )}
                            </motion.li>
                        );
                    })}
                </ul>

                {/* ── Desktop Profile & Secondary Actions ── */}
                <div className="hidden lg:flex items-center gap-5 border-l border-slate-100 pl-6 ml-4">
                    <Link href="/profile">
                        <motion.div
                            className="relative group cursor-pointer"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                        >
                            {/* Sophisticated Glow Ring */}
                            <motion.div
                                className="absolute -inset-2 bg-gradient-to-tr from-[var(--color-primary)]/20 via-[var(--color-secondary)]/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 blur-md transition-all duration-700"
                            />

                            {/* Animated soft rotation ring */}
                            <motion.div
                                className="absolute -inset-1 border border-[var(--color-primary)]/10 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            />

                            <div className="relative p-0.5 bg-white rounded-full shadow-[0_4px_12px_-2px_rgba(20,60,100,0.1),0_2px_4px_-1px_rgba(20,60,100,0.06)] group-hover:shadow-[0_20px_25px_-5px_rgba(20,60,100,0.1),0_10px_10px_-5px_rgba(20,60,100,0.04)] transition-shadow duration-500">
                                <UserAvatar
                                    src={profileData?.profile_pic_url}
                                    name={profileData?.fullName || profileData?.name}
                                    className="w-10 h-10 rounded-full border-2 border-white z-10"
                                    fallbackClassName="text-lg"
                                />
                            </div>

                            {/* Status Indicator with soft ping */}
                            <div className="absolute bottom-0 right-0 z-20">
                                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40" />
                                <span className="relative block w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* ── Hamburger (mobile & tablet) ── */}
                <div className="flex lg:hidden z-[60] items-center gap-4">

                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        initial={false}
                        className='cursor-pointer'
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {isOpen ? <HiX className="text-3xl text-blue-800" /> : <HiMenu className="text-3xl text-blue-800" />}
                    </motion.button>
                </div>

                {/* ── Mobile Menu Overlay ── */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 bottom-0 w-[280px] z-50 bg-white shadow-2xl lg:hidden flex flex-col pt-6 overflow-y-auto"
                            >
                                {/* Mobile Header Inside Menu */}
                                <div className='px-6 mb-8 flex items-center justify-between'>
                                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                        <h2 className='text-xl oswald-font font-bold'>
                                            <span className='text-[var(--color-primary)]'>Teacher</span><span className='text-[var(--color-secondary)]'>Desk</span>
                                        </h2>
                                    </Link>
                                    <button onClick={() => setIsOpen(false)} className='p-1 rounded-full hover:bg-gray-100 transition-colors'>
                                        <HiX className="text-2xl text-[var(--color-primary)]" />
                                    </button>
                                </div>

                                {/* Search in Menu */}
                                <div className='px-6 mb-6'>
                                    <form onSubmit={handleSearchSubmit} className="flex items-center w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[var(--color-secondary)]/10 focus-within:border-[var(--color-secondary)]/30">
                                        <HiOutlineSearch className="text-gray-400 text-lg mr-2" />
                                        <input
                                            type="text"
                                            placeholder="Search platform..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-grow bg-transparent border-none outline-none text-sm font-medium"
                                        />
                                    </form>
                                </div>

                                {/* User Profile section in mobile menu */}
                                <div className='px-6 mb-6'>
                                    <Link href="/profile" onClick={() => setIsOpen(false)}>
                                        <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300'>
                                            <UserAvatar
                                                src={profileData?.profile_pic_url}
                                                name={profileData?.fullName || profileData?.name}
                                                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                                            />
                                            <div className='flex-1 min-w-0'>
                                                <p className='text-sm font-bold text-gray-800 truncate'>{profileData?.fullName || profileData?.name || 'My Profile'}</p>
                                                <p className='text-xs text-gray-500 truncate'>View your professional profile</p>
                                            </div>
                                            <div className='w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--color-primary)]'>
                                                <FaUser className='text-xs' />
                                            </div>
                                        </div>
                                    </Link>
                                </div>

                                <div className='px-3 pb-8'>
                                    <h3 className='px-3 text-xs font-bold text-gray-400 capitalize tracking-widest mb-4'>Navigation</h3>
                                    <ul className="space-y-1">
                                        {navLinks.map((link, idx) => {
                                            const active = isActive(link.href);
                                            return (
                                                <motion.li
                                                    key={link.name}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="list-none"
                                                >
                                                    <Link
                                                        href={link.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${active
                                                            ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--color-primary)]'
                                                            }`}
                                                    >
                                                        <span className={`transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-gray-400 group-hover:text-[var(--color-primary)]'}`}>
                                                            {link.icon}
                                                        </span>
                                                        <span className='text-[15px]'>{link.name}</span>
                                                        {active && (
                                                            <div className='ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]' />
                                                        )}
                                                    </Link>
                                                </motion.li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {/* Secondary Links / Footer Area */}
                                <div className='mt-auto p-6 bg-gray-50/50 border-t border-gray-100'>
                                    <div className='flex justify-center gap-4 mb-4'>
                                        <Link href="/settings" onClick={() => setIsOpen(false)} className='text-gray-400 hover:text-[var(--color-primary)] transition-colors'>
                                            <IoSettingsOutline className='text-xl' />
                                        </Link>
                                        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className='text-gray-400 hover:text-red-500 transition-colors'>
                                            <HiX className='text-xl' />
                                        </button>
                                    </div>
                                    <p className='text-xs font-medium text-gray-400 text-center leading-relaxed'>
                                        © 2026 TeacherDesk | Virtual educator environment.
                                    </p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
