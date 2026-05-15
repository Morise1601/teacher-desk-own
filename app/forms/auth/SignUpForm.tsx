'use client';

import { motion } from 'framer-motion';
import { FaUserGraduate, FaUniversity, FaChevronRight } from 'react-icons/fa';
import { AuthFormType } from '@/app/types/auth';

type Props = { onSwitch: (form: AuthFormType) => void };

export default function SignUpForm({ onSwitch }: Props) {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const cardVariants = {
    hover: { 
      y: -8, 
      transition: { duration: 0.3 } 
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="md:h-screen w-full flex flex-col items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Join TeacherDesk</h2>
          <p className="text-gray-400 mt-2 text-sm brcob-font max-w-sm mx-auto">Select your specialized path to begin your professional journey with us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teacher Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => onSwitch('teacher_signup')}
            className="group cursor-pointer bg-white/60 backdrop-blur-sm p-6 rounded-md border border-gray-100 hover:border-[var(--color-primary)] hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary)]/10 transition-colors duration-500">
              <FaUserGraduate size={20} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-primary)] oswald-font mb-2">Educator</h3>
            <p className="text-gray-400 text-xs mb-6 brcob-font leading-relaxed">Build your global reputation, manage digital classrooms, and access premium research tools.</p>
            <div className="mt-auto flex items-center gap-2 text-[var(--color-primary)] font-medium text-[11px] group-hover:gap-3 transition-all duration-500 brcob-font">
              Start your desk <FaChevronRight size={8} />
            </div>
          </motion.div>

          {/* Institution Card */}
          <motion.div
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => onSwitch('institution_signup')}
            className="group cursor-pointer bg-white/60 backdrop-blur-sm p-6 rounded-md border border-gray-100 hover:border-[var(--color-primary)] hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary)]/10 transition-colors duration-500">
              <FaUniversity size={20} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-primary)] oswald-font mb-2">Institution</h3>
            <p className="text-gray-400 text-xs mb-6 brcob-font leading-relaxed">Digitize your entire campus, manage staff workflows, and scale your academic impact globally.</p>
            <div className="mt-auto flex items-center gap-2 text-[var(--color-primary)] font-medium text-[11px] group-hover:gap-3 transition-all duration-500 brcob-font">
              Register entity <FaChevronRight size={8} />
            </div>
          </motion.div>
        </div>

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-xs text-gray-400 brcob-font">
            Already have an account?{' '}
            <button
              onClick={() => onSwitch('login')}
              className="text-[var(--color-primary)] font-semibold hover:underline transition-colors ml-1"
            >
              Sign in to access
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

