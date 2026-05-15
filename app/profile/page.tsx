'use client';

import React, { useState, useEffect } from 'react';
import ProfileHeader from '../features/profile/profileHeader';
import AboutSection from '../features/profile/about';
import SpecializationsSection from '../features/profile/specialization';
import ExperienceSection from '../features/profile/experience';
import EducationSection from '../features/profile/education';
import VolunteeringSection from '../features/profile/volunteering';
import LanguagesSection from '../features/profile/language';
import Interests from '../features/profile/Interests';
import Skills from '../features/profile/Skills';
import Navbar from '../shared/NavBar';
import Footer from '../shared/Footer';
import { supabase } from '@/lib/supabase';
import { getProfileByUserIdAction, updateProfileAction } from '@/app/actions/profile';
import { getInstitutionProfileAction, updateInstitutionProfileAction } from '@/app/actions/institution';
import { decryptData, encryptData } from '@/lib/crypto';
import InstitutionHeader from '../features/profile/institution/institutionHeader';
import InstitutionAbout from '../features/profile/institution/institutionAbout';
import InstitutionDetails from '../features/profile/institution/institutionDetails';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isSubscribed = true;
        const fetchProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user && isSubscribed) {
                const role = user.user_metadata?.role || 'teacher';
                
                if (role === 'institution_admin' || role === 'institution') {
                    const encryptedResponse = await getInstitutionProfileAction(user.id);
                    const response = decryptData(encryptedResponse);
                    if (response?.success && isSubscribed) {
                        setProfile({ ...response.data, role: 'institution' });
                    } else if (isSubscribed) {
                        const encryptedGeneric = await getProfileByUserIdAction(user.id);
                        const genericResponse = decryptData(encryptedGeneric);
                        if (genericResponse?.success) setProfile(genericResponse.profile);
                    }
                } else if (isSubscribed) {
                    const encryptedResponse = await getProfileByUserIdAction(user.id);
                    const response = decryptData(encryptedResponse);
                    if (response?.success) {
                        setProfile(response.profile);
                    } else {
                        toast.error(response?.message || "failed to load profile.");
                    }
                }
            }
            if (isSubscribed) setLoading(false);
        };
        fetchProfile();
        return () => { isSubscribed = false; };
    }, []);

    const handleSave = async (updatedData: any) => {
        setLoading(true);
        try {
            const securePayload = encryptData(updatedData);
            let encryptedResponse;
            
            if (profile.role === 'institution' || profile.role === 'institution_admin') {
                encryptedResponse = await updateInstitutionProfileAction(securePayload);
            } else {
                encryptedResponse = await updateProfileAction(securePayload);
            }

            const response = decryptData(encryptedResponse);
            if (response && response.success) {
                toast.success("profile saved.");
                setProfile(updatedData);
                setIsEditing(false);
            } else {
                toast.error(response?.message || "save failed.");
            }
        } catch (error) {
            toast.error("network failure.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) {
        return (
            <div className="bg-[#fbfcff] min-h-screen">
                <Navbar />
                <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-white shadow-sm overflow-hidden">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 15, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fbfcff] min-h-screen">
            <Navbar />
            
            <main className="mx-auto max-w-7xl px-4 md:px-0 py-6 relative">
                <AnimatePresence>
                    {loading && (
                       <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }} 
                         exit={{ opacity: 0 }}
                         className="fixed top-0 left-0 w-full h-1 z-[1000] bg-blue-50/50"
                       >
                          <motion.div 
                            className="h-full bg-[var(--color-primary)]/40" 
                            animate={{ x: ["-100%", "100%"] }} 
                            transition={{ repeat: Infinity, duration: 2 }} 
                          />
                       </motion.div>
                    )}
                </AnimatePresence>

                {profile && (
                    <div className="flex flex-col gap-6">
                        {/* CONDITIONAL RENDERING BASED ON ROLE */}
                        {profile.role === 'institution' || profile.role === 'institution_admin' ? (
                            <>
                                <InstitutionHeader
                                    institution={profile}
                                    onUpdate={handleSave}
                                    isEditing={isEditing}
                                    setEditing={setIsEditing}
                                />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <InstitutionAbout 
                                            institution={profile}
                                            onUpdate={handleSave}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <InstitutionDetails 
                                            institution={profile}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <ProfileHeader
                                    profile={profile}
                                    onUpdate={handleSave}
                                    isEditing={isEditing}
                                    setEditing={setIsEditing}
                                />
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Primary Context */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <AboutSection profile={profile} onUpdate={handleSave} />
                                        <ExperienceSection profile={profile} onUpdate={handleSave} />
                                        <EducationSection profile={profile} onUpdate={handleSave} />
                                        <SpecializationsSection profile={profile} onUpdate={handleSave} />
                                        <VolunteeringSection profile={profile} onUpdate={handleSave} />
                                    </div>

                                    {/* Sidebar Context */}
                                    <div className="space-y-6">
                                        <Skills profile={profile} onUpdate={handleSave} />
                                        <LanguagesSection profile={profile} onUpdate={handleSave} />
                                        <Interests profile={profile} onUpdate={handleSave} />
                                        
                                        {/* Sleek Metrics Tool */}
                                        <div className="bg-white rounded-md p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-shadow hover:shadow-md">
                                            <h4 className="text-xs font-semibold text-gray-400 mb-5 tracking-tight capitalize">Engagement insights</h4>
                                            <div className="space-y-5">
                                               <div className="flex justify-between items-center">
                                                  <span className="text-xs text-gray-400 font-medium capitalize">Profile status</span>
                                                  <span className="text-xs font-semibold text-[var(--color-primary)]">Verified</span>
                                               </div>
                                               <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                                                  <div className="h-full bg-[var(--color-primary)]/20 w-full transition-all" />
                                               </div>
                                               <p className="text-xs text-gray-400 font-medium leading-normal italic">Your presence is synchronized with the global database.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
