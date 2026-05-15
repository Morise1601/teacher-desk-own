'use client';
import LoadingScreen from '@/components/ui/loading-screen';
import { IoIosHome } from 'react-icons/io';
import React, { useEffect, useState } from 'react'
import Navbar from "@/app/shared/NavBar"; // Adjust path as needed
import Footer from "@/app/shared/Footer";
import { motion } from 'framer-motion';

// Import the specific components for this dashboard layout based on your file structure
import UserProfileCard from '@/app/features/dashboard/UserProfileCard'; //
import PostJobCreator from '@/app/features/dashboard/PostJobCreator'; //
import UserFeed from '@/app/features/dashboard/UserFeed'; //
import TopProfilesList from '@/app/features/dashboard/TopProfilesList'; //
import TopJobsList from '@/app/features/dashboard/TopJobsList'; //
import MostViewedWidget from '@/app/features/dashboard/MostViewedWidget'; //
import CalendarSchedulerWidget from '@/app/features/dashboard/CalendarSchedulerWidget'; //
import NoticeBoard from '@/app/features/dashboard/NoticeBoard'; //
import TeacherInviteCard from '@/app/features/dashboard/TeacherInviteCard';
import { getUserRoleAction } from '@/app/actions/auth';
import { checkNewUserAction, markUserAsOldAction } from '@/app/actions/userStatus';
import { decryptData, encryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import WelcomePopup from '@/app/features/dashboard/WelcomePopup';

import { useRouter } from 'next/navigation';

const DashboardPage = () => {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [userData, setUserData] = useState<{ id: string; role: string } | null>(null);

    useEffect(() => {
        let isSubscribed = true;
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isSubscribed) return;

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
            {/* main area */}
            <section className='max-w-7xl mx-auto p-3'>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto py-4 md:py-6 lg:py-8">

                    {/* --- LEFT SECTION (1/3 width on MD, 1/4 width on LG) --- */}
                    {/* Contains: User Profile, My Calendar, Suggestions, Saved Items, Groups, Newsletters, Events */}
                    <motion.div
                        // Mobile: col-span-1 (full width)
                        // MD: col-span-1 (1/3 width of md:grid-cols-3)
                        // LG: col-span-1 (1/4 width of lg:grid-cols-4)
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
                            <NoticeBoard />
                        </div>

                        {/* Moved from right to left to balance lengths */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 my-2 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Institution News</h4>
                            <p className="text-xs text-gray-500 font-medium brcob-font">Updates from Oxford, Stanford and more.</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 my-2 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Messaging</h4>
                            <p className="text-xs text-gray-500 font-medium brcob-font">Your recent conversations.</p>
                        </div>

                        {/* Placeholders for other items that should appear in this left column (from image_ecfe46.png) */}
                        <div className='hidden md:block transition-all'>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 my-2 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Saved Items</h4>
                                <p className="text-xs text-gray-500 font-medium brcob-font">Manage your library and bookmarks.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 my-2 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Groups</h4>
                                <p className="text-xs text-gray-500 font-medium brcob-font">Discover innovative teacher communities.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- MIDDLE SECTION (Combined with Right section to be 2/3 width on MD, 2/4 width on LG) --- */}
                    {/* Contains: Notice Board, Post a Project/Job, User Feed (and posts) */}
                    <motion.div
                        // Mobile: col-span-1 (full width)
                        // MD: col-span-2 (2/3 width of md:grid-cols-3) - This is the key change for 768px-1023px
                        // LG: col-span-2 (2/4 or 1/2 width of lg:grid-cols-4)
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
                        <UserFeed /> {/* This component will render multiple UserFeedPost items */}
                    </motion.div>

                    {/* --- RIGHT SECTION (Moves to bottom on MD, 1/4 width on LG) --- */}
                    {/* Contains: Track Time, Top Jobs, Most Viewed, Top Profiles, Schedule & Class, Headlines, News, Messaging */}
                    <motion.div
                        // Mobile: col-span-1 (full width)
                        // MD: col-span-full (spans all 3 columns, moves below Left and Middle sections)
                        // LG: col-span-1 (1/4 width of lg:grid-cols-4)
                        className="md:col-span-full lg:col-span-1 flex flex-col gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                        }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Invite card for all verified roles */}
                        {userRole === 'teacher' && (
                            <div className="w-full mb-2">
                                <TeacherInviteCard />
                            </div>
                        )}

                        {/* <TrackTimeWidget /> */}

                        <div className="w-full">
                            <CalendarSchedulerWidget />
                        </div>
                        <TopJobsList />
                        <MostViewedWidget />
                        <TopProfilesList />

                        {/* Placeholders for other components seen in image_ecdc9d.png and image_ecf747.jpg */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Schedule a class</h4>
                            <p className="text-xs text-gray-500 font-medium brcob-font">Join or host a live session.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-md text-gray-800 mb-2 oswald-font capitalize tracking-tighter">Headlines</h4>
                            <p className="text-xs text-gray-500 font-medium brcob-font">Top stories in global education.</p>
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
    )
}

export default DashboardPage;
