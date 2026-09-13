'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import ResetForm from '@/app/forms/auth/resetPwdForm';
import { useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] md:h-screen w-full bg-white dark:bg-[#0b1120] relative overflow-hidden flex transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full relative z-2 flex flex-col md:flex-row bg-white dark:bg-[#0b1120] overflow-hidden"
      >
        {/* Left Side Panel - World Network Map with Dark Navy Overlay */}
        <motion.div className="md:w-1/2 h-full hidden md:flex flex-col relative overflow-hidden">
          {/* World Map Background */}
          <img
            src="/images/world_network_map.png"
            alt="Global Educator Network"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark Navy Overlay for Readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, rgba(10,25,55,0.88) 0%, rgba(8,30,55,0.80) 50%, rgba(6,20,45,0.90) 100%)',
            }}
          />

          {/* Subtle Green Bottom Glow */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none" />

          {/* Left Panel Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Branding Logo */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="px-10 pt-10 pb-4"
            >
              <img
                src="/images/logo_dark.webp"
                alt="TeacherDesk"
                className="h-10 w-auto object-contain drop-shadow-md"
              />
            </motion.div>

            {/* Hero Heading */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="px-10 mt-2"
            >
              <h1 className="text-[2.1rem] xl:text-[2.4rem] font-semibold text-white leading-tight tracking-tight sora-font">
                The Global Network
                <br />
                for <span className="text-emerald-400">Educators</span>
              </h1>
              <div className="w-20 h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-400/80 to-transparent mt-4 mb-5 rounded-l-full" />
              <p className="outfit-font text-[13.5px] text-gray-300 leading-relaxed max-w-xs font-normal">
                Connect with teachers, share knowledge, discover opportunities and grow together worldwide.
              </p>
            </motion.div>

            <div className="flex-grow" />

            {/* Bottom 4 Feature Icons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="grid grid-cols-4 gap-3 px-8 pb-8 pt-5"
            >
              {[
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                      />
                    </svg>
                  ),
                  title: 'Connect',
                  desc: 'Build meaningful professional connections',
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                      />
                    </svg>
                  ),
                  title: 'Learn',
                  desc: 'Access resources and learning opportunities',
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  ),
                  title: 'Grow',
                  desc: 'Explore jobs and career advancement',
                },
                {
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                  ),
                  title: 'Inspire',
                  desc: 'Share ideas and inspire educators worldwide',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex flex-col items-center text-center gap-2 px-2 border-r border-white/10 last:border-r-0"
                >
                  <div className="text-emerald-400">{item.icon}</div>
                  <p className="text-white text-[14px] font-semibold sora-font">{item.title}</p>
                  <p className="text-gray-400 text-[13px] outfit-font leading-tight">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side Panel - Password Reset Form */}
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="md:w-1/2 w-full h-full flex flex-col bg-white dark:bg-[#0b1120] justify-center overflow-y-auto py-8 md:py-0 transition-colors duration-200"
        >
          <ResetForm
            onSwitch={() => router.push('/authentication')}
            defaultToNewPasswordOnRecovery={true}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0b1120]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16a34a]"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
