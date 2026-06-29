'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Building2,
  LayoutDashboard,
  LogOut,
  Command,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  User as UserIcon,
  Settings,
  Ban,
  Send,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

const SidebarItem = ({ href, icon, label, active, isCollapsed, isMobile }: any) => {
  if (isMobile) {
    return (
      <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-1.5 p-2 relative group">
        <div className={`p-2 rounded-md transition-all duration-300 ${active ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-400 group-hover:text-[var(--color-primary)] bg-transparent'}`}>
          {React.cloneElement(icon as any, { size: 20 })}
        </div>
        <span className={`text-[10px] font-medium transition-all ${active ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{label}</span>
      </Link>
    );
  }

  return (
    <Link href={href} className="relative group flex items-center px-3 py-1.5 w-full">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`flex items-center gap-3 w-full p-3 rounded-md transition-all duration-300 ${active
            ? 'bg-[var(--color-primary)] text-white shadow-md'
            : 'text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-50'
          } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      >
        <div className={`flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {React.cloneElement(icon as any, { size: 22 })}
        </div>
        {!isCollapsed && (
          <span className="text-sm font-medium capitalize truncate">{label}</span>
        )}
      </motion.div>
    </Link>
  );
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');

  // Handle client-side hydration for theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // document.documentElement.classList.toggle('dark', newTheme === 'dark'); 
    // Uncomment when full dark mode classes are enabled globally.
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const menuItems = [
    { href: '/dashboard/super-admin', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/dashboard/super-admin/teachers', icon: <Users />, label: 'Teachers' },
    { href: '/dashboard/super-admin/institutions', icon: <Building2 />, label: 'Institutions' },
    { href: '/dashboard/super-admin/messages', icon: <Send size={18} />, label: 'Messages' },
    { href: '/dashboard/super-admin/reports', icon: <HiOutlineExclamationCircle />, label: 'Reports' },
    { href: '/dashboard/super-admin/reports/blocked', icon: <Ban size={18} />, label: 'Blocked Users' },
    { href: '/dashboard/super-admin/courses', icon: <Command />, label: 'Courses' },
    { href: '/dashboard/super-admin/pricing', icon: <Tag size={18} />, label: 'Pricing' },
    { href: '/dashboard/super-admin/settings', icon: <Settings />, label: 'Settings' },
  ];

  return (
    <div className={`flex bg-[#f8fafc] text-[var(--color-primary)] min-h-[100dvh] ${theme === 'dark' ? 'dark-mode-simulated' : ''}`}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white z-40 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-64'
          }`}
      >
        <div className="p-4 flex flex-col h-full relative">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 bg-white border border-gray-200 text-gray-400 hover:text-[var(--color-primary)] w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Logo Area */}
          <div className={`flex items-center gap-3 mb-8 px-2 pt-2 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-md flex-shrink-0 flex items-center justify-center text-white shadow-md">
              <Command size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <h1 className="text-base font-semibold tracking-tight capitalize truncate">Admin Panel</h1>
                <span className="text-xs text-emerald-500 font-medium">Online</span>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
            {!isCollapsed && <p className="text-xs font-semibold text-gray-400 capitalize tracking-wider mb-3 ml-4">Menu</p>}
            {menuItems.map((item) => (
              <SidebarItem key={item.href} {...item} active={pathname === item.href} isCollapsed={isCollapsed} />
            ))}
          </nav>

          <div className={`mt-auto pt-6 border-t border-gray-100 ${isCollapsed ? 'px-0' : 'px-3'}`}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-md transition-all w-full text-sm font-medium capitalize group ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              title="Logout"
            >
              <div className="transition-transform group-hover:scale-110">
                <LogOut size={22} />
              </div>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Framework */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        {/* Sleek Minimal Header */}
        <header className="h-20 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-10 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold oswald-font capitalize text-[var(--color-primary)] drop-shadow-sm">
                {menuItems.find(i => i.href === pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Changer */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User Profile Token */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-md bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#f8fafc] pb-24 md:pb-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navbar (App-Like navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center justify-around px-2 pt-2 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
        {menuItems.map((item) => (
          <SidebarItem key={item.href} {...item} active={pathname === item.href} isMobile={true} />
        ))}
      </nav>
    </div>
  );
}
