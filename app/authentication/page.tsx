'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import SignInForm from '@/app/forms/auth/signInForm';
import SignUpForm from '../forms/auth/SignUpForm';
import InstitutionSignUpForm from '../forms/auth/InstitutionSignUpForm';
import TeacherSignUpForm from '../forms/auth/TeacherSignUpForm';
import OtpForm from '../forms/auth/otpForm';
import ResetForm from '../forms/auth/resetPwdForm';
import ProfessionalForm from '../forms/auth/professionForm';
import { FaQuoteLeft, FaUser } from 'react-icons/fa';
import { AuthFormType } from '@/app/types/auth';
import { useSearchParams } from 'next/navigation';

const AuthContent = () => {
    const searchParams = useSearchParams();
    const [activeForm, setActiveForm] = useState<AuthFormType>("login");
    const [referralId, setReferralId] = useState<string | null>(null);

    React.useEffect(() => {
        const type = searchParams.get('type');
        const ref = searchParams.get('ref');
        
        if (type === 'teacher') {
            setActiveForm('teacher_signup');
        } else if (type === 'institution') {
            setActiveForm('institution_signup');
        }
        
        if (ref) {
            setReferralId(ref);
        }
    }, [searchParams]);

    const isReverse = activeForm === 'teacher_signup' || activeForm === 'institution_signup';

    return (
        <div className="min-h-[100dvh] md:h-screen w-full bg-white relative overflow-hidden flex">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[#17116114] transform skew-x-12 origin-bottom-left z-1 hidden md:block" />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`w-full h-full relative z-2 flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white overflow-hidden transition-all duration-500`}
            >
                {/* Left/Side Panel - Illustration or Banner */}
                <motion.div className={`${activeForm === 'login' ? 'md:w-[45%]' : 'md:w-1/2'} h-full bg-[#f3f7ff] hidden md:flex flex-col relative overflow-hidden transition-all duration-500`} >
                    {activeForm === 'teacher_signup' ? (
                        <div className='relative h-full w-full'>
                            <img src="/images/teacher_signup_banner.png" className="absolute inset-0 w-full h-full object-cover" alt="Teacher Signup" />
                            <div className="absolute inset-0 bg-[var(--color-primary)]/85 flex flex-col justify-center p-12 text-white">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className='mb-8 text-green-400'
                                >
                                    <FaQuoteLeft size={44} />
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className='text-2xl font-light italic mb-10 leading-relaxed brcob-font'
                                >
                                    "TeacherDesk has completely transformed how I manage my research and teaching. It's the ultimate digital workspace for modern educators."
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className='flex items-center gap-4'
                                >
                                    <div className='w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-green-400'>
                                        <FaUser size={30} className='translate-y-2 text-gray-200' />
                                    </div>
                                    <div className="text-left">
                                        <h4 className='text-lg font-bold oswald-font tracking-tight'>Dr. Elias Rodriguez</h4>
                                        <p className='text-green-400/80 text-[10px] brcob-font font-medium'>Senior Fellow, Global Education Council</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    ) : activeForm === 'institution_signup' ? (
                        <div className='relative h-full w-full'>
                            <img src="/images/institution_signup_banner.png" className="absolute inset-0 w-full h-full object-cover" alt="Institution Signup" />
                            <div className="absolute inset-0 bg-[var(--color-primary)]/85 flex flex-col justify-center p-12 text-white">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-8"
                                >
                                    <h2 className='text-5xl oswald-font font-bold mb-4 tracking-tighter leading-none'>Scale your <span className='text-green-400'>impact</span></h2>
                                    <p className='brcob-font font-light text-lg text-gray-200'>Join the elite network of globally accredited institutions.</p>
                                </motion.div>
                                <div className="space-y-4">
                                    {[
                                        "Enterprise-grade security infrastructure",
                                        "Automated faculty & staff management",
                                        "Global research & grant collaboration",
                                        "Seamless multi-campus synchronization"
                                    ].map((text, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.1) }}
                                            className="flex items-center gap-3 text-xs font-medium text-gray-100"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                            {text}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='relative h-full w-full bg-[var(--color-primary)] flex flex-col'>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-secondary)]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                            
                            <div className='p-12 text-left relative z-10'>
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <h2 className='text-6xl oswald-font font-bold text-white tracking-tighter leading-none'>
                                        Teacher<span className='text-green-400'>Desk</span>
                                    </h2>
                                    <p className='brcob-font font-light mt-4 text-xl text-gray-300 max-w-xs leading-relaxed'>
                                        The global engine for modern education and academic research.
                                    </p>
                                </motion.div>
                            </div>

                            <div className="flex-grow relative flex items-end justify-center px-8 overflow-hidden">
                                <motion.div 
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    className="w-full h-4/5 bg-[url('/images/teacher.png')] bg-contain bg-bottom bg-no-repeat relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[var(--color-primary)] to-transparent z-20" />
                            </div>

                            <div className="p-8 flex items-center justify-between gap-6 relative z-10 border-t border-white/5">
                                <div className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-white text-[10px] font-bold oswald-font border border-white/10 group-hover:bg-green-400 group-hover:text-[var(--color-primary)] transition-all duration-500">ISO</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-white oswald-font tracking-widest transition-colors group-hover:text-green-400">Certified Security</p>
                                        <p className="text-[8px] text-gray-400 brcob-font">ISO 27001 Infrastructure</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center text-white text-[10px] font-bold oswald-font border border-white/10 group-hover:bg-green-400 group-hover:text-[var(--color-primary)] transition-all duration-500">GA</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-white oswald-font tracking-widest transition-colors group-hover:text-green-400">Global Partner</p>
                                        <p className="text-[8px] text-gray-400 brcob-font">Accredited Network</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Right Panel - Form */}
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`${activeForm === 'login' ? 'md:w-[55%]' : 'md:w-1/2'} w-full h-full flex flex-col bg-white justify-center overflow-y-auto py-8 md:py-0`}
                >
                    {activeForm === "login" && <SignInForm onSwitch={setActiveForm} />}
                    {activeForm === "signup" && <SignUpForm onSwitch={setActiveForm} />}
                    {activeForm === "institution_signup" && <InstitutionSignUpForm onSwitch={setActiveForm} />}
                    {activeForm === "teacher_signup" && <TeacherSignUpForm onSwitch={setActiveForm} referralId={referralId} />}
                    {activeForm === "otp" && <OtpForm onSwitch={setActiveForm} />}
                    {activeForm === "reset" && <ResetForm onSwitch={setActiveForm} />}
                    {activeForm === "professional" && <ProfessionalForm onSwitch={setActiveForm} />}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
