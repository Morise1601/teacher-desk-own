'use client';
import LoadingScreen from '@/components/ui/loading-screen';
import { IoIosHome } from 'react-icons/io';
import React, { useEffect, useState } from 'react';
import Navbar from "@/app/shared/NavBar"; // Adjust path as needed
import Footer from "@/app/shared/Footer";
import { motion, AnimatePresence } from 'framer-motion';

// Import the specific components for this dashboard layout based on your file structure
import UserProfileCard from '@/app/features/dashboard/UserProfileCard'; //
import PostJobCreator from '@/app/features/dashboard/PostJobCreator'; //
import UserFeed from '@/app/features/dashboard/UserFeed'; //
import TopProfilesList from '@/app/features/dashboard/TopProfilesList'; //
import TopJobsList from '@/app/features/dashboard/TopJobsList'; //
import FeedFilters, { FeedFilterType, FeedSortType } from '@/app/features/dashboard/FeedFilters';
import CalendarSchedulerWidget from '@/app/features/dashboard/CalendarSchedulerWidget'; //
import NoticeBoard from '@/app/features/dashboard/NoticeBoard'; //
import TeacherInviteCard from '@/app/features/dashboard/TeacherInviteCard';
import { getUserRoleAction } from '@/app/actions/auth';
import { getDashboardWidgetsAction } from '@/app/actions/dashboard';
import { checkNewUserAction, markUserAsOldAction } from '@/app/actions/userStatus';
import { decryptData, encryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import WelcomePopup from '@/app/features/dashboard/WelcomePopup';
import { UserAvatar } from '@/components/ui/user-avatar';

// Icons
import { FiBookmark, FiExternalLink, FiUsers, FiMessageSquare, FiFolder } from 'react-icons/fi';
import { FaGraduationCap, FaNewspaper, FaVideo } from 'react-icons/fa';

import { useRouter } from 'next/navigation';

const DashboardPage = () => {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [userData, setUserData] = useState<{ id: string; role: string } | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [mobileTab, setMobileTab] = useState<'feed' | 'desk' | 'activity'>('feed');
    const [feedFilter, setFeedFilter] = useState<FeedFilterType>('all');
    const [feedSort, setFeedSort] = useState<FeedSortType>('latest');

    useEffect(() => {
        let isSubscribed = true;
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (isSubscribed) {
                    router.push('/');
                }
                return;
            }
            if (!isSubscribed) return;

            let finalRole = user.user_metadata?.role;

            if (!finalRole || (finalRole !== 'teacher' && finalRole !== 'institution_admin' && finalRole !== 'super_admin' && finalRole !== 'admin')) {
                const encryptedResponse = await getUserRoleAction(user.id);
                const response = decryptData(encryptedResponse);
                if (response && response.success) {
                    finalRole = response.role;
                }
            }

            if (finalRole === 'super_admin' || finalRole === 'admin') {
                router.push('/dashboard/super-admin');
                return;
            }

            if (isSubscribed) {
                setUserRole(finalRole);

                // Fetch dashboard widgets data dynamically
                try {
                    const resEncrypted = await getDashboardWidgetsAction(encryptData({ userId: user.id }));
                    const res = decryptData(resEncrypted);
                    if (res && res.success && isSubscribed) {
                        setDashboardData(res.data);
                    }
                } catch (err) {
                    console.error("Error loading dashboard widgets:", err);
                }

                // --- Welcome Popup Logic ---
                if (finalRole === 'teacher' || finalRole === 'institution_admin') {
                    const encryptedNewUser = await checkNewUserAction(user.id, finalRole);
                    const newUserResponse = decryptData(encryptedNewUser);
                    if (newUserResponse?.success && newUserResponse.isNew) {
                        setUserData({ id: user.id, role: finalRole });
                        setShowWelcome(true);
                    }
                }
                setLoading(false);
            }
        };
        checkUser();
        return () => { isSubscribed = false; };
    }, [router]);

    const handleWelcomeClose = async () => {
        if (userData) {
            await markUserAsOldAction(userData.id, userData.role);
        }
        setShowWelcome(false);
    };

    if (loading) {
        return <LoadingScreen message="Loading Workspace..." icon={<IoIosHome className="text-white w-8 h-8" />} />;
    }

    return (
        <div className="bg-[#f8f9fa] min-h-screen">
            {/* Navbar area */}
            <Navbar />

            {/* Mobile Tab Navigation */}
            <div className="flex md:hidden bg-white border-b border-gray-100 sticky top-16 z-30 justify-around text-xs font-bold text-gray-500 shadow-xs">
                <button
                    onClick={() => setMobileTab('feed')}
                    className={`py-3.5 px-4 border-b-2 transition-all ${mobileTab === 'feed' ? 'border-[var(--color-primary)] text-[var(--color-primary)] scale-105' : 'border-transparent hover:text-gray-700'}`}
                >
                    Feed
                </button>
                <button
                    onClick={() => setMobileTab('desk')}
                    className={`py-3.5 px-4 border-b-2 transition-all ${mobileTab === 'desk' ? 'border-[var(--color-primary)] text-[var(--color-primary)] scale-105' : 'border-transparent hover:text-gray-700'}`}
                >
                    Desk
                </button>
                <button
                    onClick={() => setMobileTab('activity')}
                    className={`py-3.5 px-4 border-b-2 transition-all ${mobileTab === 'activity' ? 'border-[var(--color-primary)] text-[var(--color-primary)] scale-105' : 'border-transparent hover:text-gray-700'}`}
                >
                    Activity
                </button>
            </div>

            {/* main area */}
            <section className="max-w-7xl mx-auto p-3">

                {/* --- MOBILE VIEW CONTAINER (Stacked under Tabs) --- */}
                <div className="block md:hidden py-4 space-y-6">
                    {mobileTab === 'feed' && (
                        <div className="space-y-6">
                            <PostJobCreator />
                            <UserFeed />
                            <TopJobsList jobs={dashboardData?.topJobs} />
                            <TopProfilesList profiles={dashboardData?.topProfiles} />
                        </div>
                    )}

                    {mobileTab === 'desk' && (
                        <div className="space-y-6">
                            <UserProfileCard />
                            <NoticeBoard institutions={dashboardData?.institutions} />

                            {/* Institution News */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" /> Institution News
                                </h4>
                                {dashboardData?.institutionNews && dashboardData.institutionNews.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.institutionNews.map((item: any) => (
                                            <li key={item.id} className="text-xs text-gray-600 font-medium leading-relaxed pb-2 border-b border-gray-50 last:border-b-0">
                                                <span className="font-bold text-gray-800">{item.title}</span> {item.news}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-400 font-medium">No recent updates.</p>
                                )}
                            </div>

                            {/* Headlines */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><FaNewspaper className="text-xs" /></span> Headlines
                                </h4>
                                {dashboardData?.headlines && dashboardData.headlines.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.headlines.map((hl: any, idx: number) => (
                                            <li key={idx} className="text-xs text-gray-600 font-medium hover:text-blue-600 transition-colors leading-snug">
                                                <a href={hl.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5">
                                                    <span className="text-blue-400">•</span>
                                                    <span>{hl.title}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-400 font-medium">No education news available.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {mobileTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="w-full">
                                <CalendarSchedulerWidget />
                            </div>

                            {/* Schedule a class */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center"><FaVideo className="text-xs" /></span> Scheduled Classes
                                </h4>
                                {dashboardData?.scheduledClasses && dashboardData.scheduledClasses.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.scheduledClasses.map((cls: any) => (
                                            <li key={cls.id} className="text-xs text-gray-600 font-medium hover:bg-slate-50 p-2 rounded-lg transition-colors border border-gray-50">
                                                <div className="font-bold text-gray-800 mb-0.5 truncate">{cls.title}</div>
                                                <div className="flex justify-between text-[10px] text-gray-400">
                                                    <span className="font-bold text-[var(--color-primary)]">{cls.subject}</span>
                                                    <span>{cls.dateTime}</span>
                                                </div>
                                            </li>
                                        ))}
                                        <button
                                            onClick={() => router.push('/classroom')}
                                            className="w-full text-center text-xs font-bold text-[var(--color-primary)] hover:underline mt-2 pt-2 border-t border-slate-50"
                                        >
                                            Manage Classes
                                        </button>
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-2">No upcoming live classes.</p>
                                        <button
                                            onClick={() => router.push('/classroom')}
                                            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                        >
                                            Host Live Session
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Messaging */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-purple-50 text-purple-600 rounded flex items-center justify-center"><FiMessageSquare className="text-xs" /></span> Messaging
                                </h4>
                                {dashboardData?.messaging && dashboardData.messaging.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.messaging.map((msg: any) => (
                                            <li
                                                key={msg.id}
                                                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-gray-50/50"
                                                onClick={() => router.push('/messages')}
                                            >
                                                <UserAvatar src={msg.avatar} name={msg.name} className="w-9 h-9 rounded-full border border-gray-100" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="font-semibold text-xs text-gray-800 truncate">{msg.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-medium">{msg.time}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 truncate">{msg.lastMessage}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-2">No recent conversations.</p>
                                        <button
                                            onClick={() => router.push('/messages')}
                                            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                        >
                                            Start a Chat
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Saved Items */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-amber-50 text-amber-600 rounded flex items-center justify-center"><FiBookmark className="text-xs" /></span> Saved Items
                                </h4>
                                {dashboardData?.savedItems && dashboardData.savedItems.length > 0 ? (
                                    <ul className="space-y-2">
                                        {dashboardData.savedItems.map((item: any) => (
                                            <li
                                                key={item.id}
                                                className="text-xs text-gray-600 font-medium hover:text-[var(--color-primary)] cursor-pointer truncate p-1.5 hover:bg-gray-50 rounded"
                                                onClick={() => router.push(`/dashboard?post=${item.id}`)}
                                            >
                                                📌 {item.title}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-1">Your library is empty.</p>
                                        <p className="text-[10px] text-gray-400">Bookmark posts to save them here.</p>
                                    </div>
                                )}
                            </div>

                            {/* Groups */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-teal-50 text-teal-600 rounded flex items-center justify-center"><FiFolder className="text-xs" /></span> Groups
                                </h4>
                                {dashboardData?.groups && dashboardData.groups.length > 0 ? (
                                    <ul className="space-y-2">
                                        {dashboardData.groups.map((group: any) => (
                                            <li
                                                key={group.id}
                                                className="flex justify-between items-center text-xs text-gray-600 font-medium hover:text-[var(--color-primary)] cursor-pointer p-1.5 hover:bg-gray-50 rounded"
                                                onClick={() => router.push('/classroom')}
                                            >
                                                <span>👥 {group.name}</span>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{group.tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-2">No active classroom groups.</p>
                                        <button
                                            onClick={() => router.push('/classroom')}
                                            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                        >
                                            Explore Classrooms
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- DESKTOP / TABLET GRID VIEW --- */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 py-4 md:py-6 lg:py-8">

                    {/* --- LEFT SECTION --- */}
                    <motion.div
                        className="col-span-1 flex flex-col gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                        }}
                    >
                        <UserProfileCard />
                        <div className="w-full">
                            <NoticeBoard institutions={dashboardData?.institutions} />
                        </div>

                        {/* Institution News */}
                        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" /> Institution News
                            </h4>
                            {dashboardData?.institutionNews && dashboardData.institutionNews.length > 0 ? (
                                <ul className="space-y-3">
                                    {dashboardData.institutionNews.map((item: any) => (
                                        <li key={item.id} className="text-xs text-gray-600 font-medium leading-relaxed pb-2 border-b border-gray-50 last:border-b-0">
                                            <span className="font-bold text-gray-800">{item.title}</span> {item.news}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 font-medium">No recent updates.</p>
                            )}
                        </div>

                        {/* Messaging (Recent Conversations) */}
                        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-50 text-purple-600 rounded flex items-center justify-center"><FiMessageSquare className="text-xs" /></span> Messaging
                            </h4>
                            {dashboardData?.messaging && dashboardData.messaging.length > 0 ? (
                                <ul className="space-y-3">
                                    {dashboardData.messaging.map((msg: any) => (
                                        <li
                                            key={msg.id}
                                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-gray-50/50"
                                            onClick={() => router.push('/messages')}
                                        >
                                            <UserAvatar src={msg.avatar} name={msg.name} className="w-9 h-9 rounded-full border border-gray-100" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="font-semibold text-xs text-gray-800 truncate">{msg.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-medium">{msg.time}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate">{msg.lastMessage}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-xs text-gray-400 font-medium mb-2">No recent conversations.</p>
                                    <button
                                        onClick={() => router.push('/messages')}
                                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                    >
                                        Start a Chat
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Desktop Only Sidebars */}
                        <div className="hidden md:block space-y-6">
                            {/* Saved Items */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-amber-50 text-amber-600 rounded flex items-center justify-center"><FiBookmark className="text-xs" /></span> Saved Items
                                </h4>
                                {dashboardData?.savedItems && dashboardData.savedItems.length > 0 ? (
                                    <ul className="space-y-2">
                                        {dashboardData.savedItems.map((item: any) => (
                                            <li
                                                key={item.id}
                                                className="text-xs text-gray-600 font-medium hover:text-[var(--color-primary)] cursor-pointer truncate p-1.5 hover:bg-gray-50 rounded"
                                                onClick={() => router.push(`/dashboard?post=${item.id}`)}
                                            >
                                                📌 {item.title}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-1">Your library is empty.</p>
                                        <p className="text-[10px] text-gray-400">Bookmark posts to save them here.</p>
                                    </div>
                                )}
                            </div>

                            {/* Groups */}
                            <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                    <span className="w-6 h-6 bg-teal-50 text-teal-600 rounded flex items-center justify-center"><FiFolder className="text-xs" /></span> Groups
                                </h4>
                                {dashboardData?.groups && dashboardData.groups.length > 0 ? (
                                    <ul className="space-y-2">
                                        {dashboardData.groups.map((group: any) => (
                                            <li
                                                key={group.id}
                                                className="flex justify-between items-center text-xs text-gray-600 font-medium hover:text-[var(--color-primary)] cursor-pointer p-1.5 hover:bg-gray-50 rounded"
                                                onClick={() => router.push('/classroom')}
                                            >
                                                <span>👥 {group.name}</span>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{group.tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-gray-400 font-medium mb-2">No active classroom groups.</p>
                                        <button
                                            onClick={() => router.push('/classroom')}
                                            className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                        >
                                            Explore Classrooms
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* --- MIDDLE SECTION --- */}
                    <motion.div
                        className="md:col-span-2 lg:col-span-2 flex flex-col gap-8"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, scale: 0.98 },
                            visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
                        }}
                        transition={{ delay: 0.1 }}
                    >
                        <PostJobCreator />
                        <div className="block md:hidden">
                            <FeedFilters filter={feedFilter} setFilter={setFeedFilter} sortBy={feedSort} setSortBy={setFeedSort} />
                        </div>
                        <UserFeed filter={feedFilter} sortBy={feedSort} />
                    </motion.div>

                    {/* --- RIGHT SECTION (Responsive: Grids dynamically on Tablets, spans list on Desktops) --- */}
                    <motion.div
                        className="md:col-span-full lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                        }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="hidden md:block w-full">
                            <FeedFilters filter={feedFilter} setFilter={setFeedFilter} sortBy={feedSort} setSortBy={setFeedSort} />
                        </div>

                        {/* Invite card for all verified roles */}
                        {userRole === 'teacher' && (
                            <div className="w-full md:col-span-2 lg:col-span-1">
                                <TeacherInviteCard />
                            </div>
                        )}

                        <div className="w-full">
                            <CalendarSchedulerWidget />
                        </div>
                        <TopJobsList jobs={dashboardData?.topJobs} />
                        <TopProfilesList profiles={dashboardData?.topProfiles} />

                        {/* Schedule a class */}
                        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center"><FaVideo className="text-xs" /></span> Scheduled Classes
                            </h4>
                            {dashboardData?.scheduledClasses && dashboardData.scheduledClasses.length > 0 ? (
                                <ul className="space-y-3">
                                    {dashboardData.scheduledClasses.map((cls: any) => (
                                        <li key={cls.id} className="text-xs text-gray-600 font-medium hover:bg-slate-50 p-2 rounded-lg transition-colors border border-gray-50">
                                            <div className="font-bold text-gray-800 mb-0.5 truncate">{cls.title}</div>
                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                <span className="font-bold text-[var(--color-primary)]">{cls.subject}</span>
                                                <span>{cls.dateTime}</span>
                                            </div>
                                        </li>
                                    ))}
                                    <button
                                        onClick={() => router.push('/classroom')}
                                        className="w-full text-center text-xs font-bold text-[var(--color-primary)] hover:underline mt-2 pt-2 border-t border-slate-50"
                                    >
                                        Manage Classes
                                    </button>
                                </ul>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-xs text-gray-400 font-medium mb-2">No upcoming live classes.</p>
                                    <button
                                        onClick={() => router.push('/classroom')}
                                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                                    >
                                        Host Live Session
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Headlines */}
                        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <h4 className="font-bold text-md text-gray-800 mb-3 oswald-font capitalize tracking-tighter flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><FaNewspaper className="text-xs" /></span> Headlines
                            </h4>
                            {dashboardData?.headlines && dashboardData.headlines.length > 0 ? (
                                <ul className="space-y-3">
                                    {dashboardData.headlines.map((hl: any, idx: number) => (
                                        <li key={idx} className="text-xs text-gray-600 font-medium hover:text-blue-600 transition-colors leading-snug">
                                            <a href={hl.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5">
                                                <span className="text-blue-400">•</span>
                                                <span>{hl.title}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 font-medium">No education news available.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
            <Footer />

            {/* Welcome Popup for New Users */}
            {showWelcome && userData && (
                <WelcomePopup
                    role={userData.role}
                    onClose={handleWelcomeClose}
                />
            )}
        </div>
    );
};

export default DashboardPage;
