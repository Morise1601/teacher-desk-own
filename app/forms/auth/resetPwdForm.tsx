// components/AuthForm.jsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthFormType } from '@/app/types/auth';
import { toast, ToastContainer } from 'react-toastify';
import { validateEmail } from '@/app/utils/validation';
import { Input } from "@/components/ui/input";

type Props = {
  onSwitch: (form: AuthFormType) => void;
};

export default function ResetForm({ onSwitch }: Props) {
  const [focus, setFocus] = useState('');
  // Login fields
  const [emailOrPhone, setEmailOrPhone] = useState('');


  // Animation variants
  const formVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const resetPasswordFn = () => {
    if (!emailOrPhone) {
      toast.warning("Please enter your registered email.");
      return;
    } else if (!validateEmail(emailOrPhone)) {
      return;
    } else {
      toast.success("If this email is registered, a reset link has been sent.");
      setTimeout(() => {
        onSwitch("login")
      }, 2000);
    }
  }

  return (
    <div className="md:h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
        <ToastContainer />
        <AnimatePresence mode="wait">
          <motion.form
            key="forgot"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-4 w-full authForms"
            autoComplete="off"
          >
            <div className="text-left mb-2">
              <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Forgot password</h2>
              <p className="text-gray-400 brcob-font text-xs mt-1">No worries, we'll send you reset instructions.</p>
            </div>

            <div className="group space-y-1.5">
              <label className="text-[11px] font-medium text-gray-500 brcob-font ml-0.5 transition-colors group-focus-within:text-[var(--color-primary)]">Email address</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="e.g. jane.doe@example.com"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  onFocus={() => setFocus('forgotEmail')}
                  onBlur={() => setFocus('')}
                  className="w-full h-10 rounded-md px-4 bg-gray-50/50 border-gray-100 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300"
                />
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-10 rounded-md bg-[var(--color-primary)] text-white font-medium text-sm brcob-font shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300"
                onClick={() => resetPasswordFn()}
              >
                Send reset link
              </motion.button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-[var(--color-primary)] font-bold hover:underline text-xs brcob-font transition-colors"
                  onClick={() => {
                    setEmailOrPhone('');
                    onSwitch("login")
                  }}
                >
                  Return to sign in
                </button>
              </div>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
