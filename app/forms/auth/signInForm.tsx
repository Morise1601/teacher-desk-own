// components/SignInForm
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FcGoogle } from "react-icons/fc";
import { MdEmail, MdLock, MdLanguage, MdSecurity } from "react-icons/md";

// Microsoft brand 4-color icon
const MicrosoftColorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="11" height="11" fill="#F35325" />
    <rect x="12" y="0" width="11" height="11" fill="#81BC06" />
    <rect x="0" y="12" width="11" height="11" fill="#05A6F0" />
    <rect x="12" y="12" width="11" height="11" fill="#FFBA08" />
  </svg>
);

import { useRouter } from 'next/navigation';
import { AuthFormType } from '@/app/types/auth';
import { toast } from 'react-toastify';
import { validateEmail } from '@/app/utils/validation';
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/lib/supabase";
import { getUserRoleAction } from '@/app/actions/auth';
import { decryptData } from '@/lib/crypto';
import { Button } from "@/components/ui/button";
import { getGoogleAuthSettingsAction } from '@/app/actions/settings';

type Props = {
  onSwitch: (form: AuthFormType) => void;
};

export default function SignInForm({ onSwitch }: Props) {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const formVariants: Variants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const loginFn = async () => {
    if (!emailOrPhone || !password) {
      toast.warning("Please fill all fields.");
      return;
    }
    if (!validateEmail(emailOrPhone)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password: password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success("Login successful!");
        let redirectPath = '/dashboard';
        const encryptedResponse = await getUserRoleAction(data.user.id);
        const response = decryptData(encryptedResponse);

        if (response && response.success) {
          if (response.role === 'super_admin' || response.role === 'admin') {
            redirectPath = '/dashboard/super-admin';
          }
        }

        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
      }
    } catch (error) {
      toast.error("Authentication security error.");
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const encryptedResponse = await getGoogleAuthSettingsAction();
      const response = decryptData(encryptedResponse);

      if (!response || !response.success) {
        toast.error("Failed to load authentication settings.");
        setLoading(false);
        return;
      }

      const settings = response.settings;
      if (settings.google_signin_enabled !== 'true') {
        toast.error("Google Sign-In is currently disabled by the administrator.");
        setLoading(false);
        return;
      }

      const callbackUrl = window.location.origin + '/auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        toast.error(error.message || "Failed to initialize Google login.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      toast.error("Google single sign-on security error.");
      setLoading(false);
    }
  };

  const microsoftSignIn = () => {
    toast.info('Microsoft SignIn coming soon!');
  };

  return (
    <div className="md:h-full w-full flex flex-col items-center justify-between bg-white relative">

      {/* Top Language Selector */}
      <div className="w-full hidden md:flex justify-end px-8 pt-5 pb-0">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 outfit-font transition-colors"
        >
          <MdLanguage size={15} className="text-gray-400" />
          <span>English</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Form Card */}
      <div className="w-full flex-grow flex items-center justify-center px-4 py-6 md:px-10">
        <div className="w-full max-w-2xl bg-white rounded-[8px] border border-gray-100 shadow-[0_4px_40px_rgba(0,0,0,0.07)] p-7 md:p-10">

          <AnimatePresence mode="wait">
            <motion.form
              key="login"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col gap-5 w-full authForms"
              autoComplete="off"
            >
              {/* Branding */}
              <div className="text-center mb-1">
                {/* Logo — Sora Bold */}
                <h2 className="text-[1.6rem] font-bold tracking-tight sora-font">
                  <span className="text-[var(--color-primary)]">Teacher</span>
                  <span className="text-emerald-600">desk</span>
                </h2>
                {/* Heading — Sora SemiBold */}
                <h3 className="text-xl font-semibold text-[var(--color-primary)] sora-font mt-2 tracking-tight">
                  Welcome Back!
                </h3>
                {/* Body — Outfit Regular */}
                <p className="text-gray-400 outfit-font text-[13px] mt-1 font-normal">
                  Login to your Teacherdesk account
                </p>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700 outfit-font block">Email Address</label>
                <div
                  className={`flex items-center gap-2.5 h-11 border rounded-[8px] px-3.5 transition-all duration-200 bg-white ${emailFocused ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-gray-200'}`}
                >
                  <MdEmail size={16} className={`shrink-0 transition-colors ${emailFocused ? 'text-emerald-600' : 'text-gray-300'}`} />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && loginFn()}
                    className="autofill-transparent flex-1 outline-none text-[13px] text-gray-700 placeholder-gray-300 outfit-font bg-transparent font-normal"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700 outfit-font block">Password</label>
                <div
                  className={`relative flex items-center border rounded-[8px] transition-all duration-200 bg-white ${passwordFocused ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-gray-200'}`}
                >
                  <MdLock
                    size={16}
                    className={`absolute left-3.5 shrink-0 transition-colors z-10 ${passwordFocused ? 'text-emerald-600' : 'text-gray-300'}`}
                  />
                  <PasswordInput
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && loginFn()}
                    className="autofill-transparent w-full pl-9 h-11 text-[13px] text-gray-700 placeholder-gray-300 outfit-font bg-transparent border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:border-0 rounded-[8px] font-normal"
                  />
                </div>
                {/* Forgot Password */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => onSwitch("reset")}
                    className="text-[12px] text-emerald-600 hover:text-emerald-700 hover:underline outfit-font font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login Button — Outfit Medium, #047857 */}
              <Button
                style={{ backgroundColor: '#047857' }}
                className="w-full h-11 rounded-[8px] text-white text-[14px] outfit-font font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1 hover:opacity-90 active:scale-[0.99]"
                onClick={loginFn}
                loading={loading}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#047857')}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Login
              </Button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-100" />
                <span className="flex-shrink mx-4 text-[12px] text-gray-400 outfit-font">or continue with</span>
                <div className="flex-grow border-t border-gray-100" />
              </div>

              {/* Social Buttons — Outfit Medium */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  className="flex items-center justify-center gap-2.5 h-11 border border-gray-200 rounded-[8px] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 bg-white"
                  whileHover={{ y: -1, boxShadow: '0 4px 14px rgba(0,0,0,0.07)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={googleSignIn}
                >
                  <FcGoogle size={19} />
                  <span className="text-[13px] font-medium text-gray-600 outfit-font">Google</span>
                </motion.button>

                <motion.button
                  type="button"
                  className="flex items-center justify-center gap-2.5 h-11 border border-gray-200 rounded-[8px] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 bg-white"
                  whileHover={{ y: -1, boxShadow: '0 4px 14px rgba(0,0,0,0.07)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={microsoftSignIn}
                >
                  <MicrosoftColorIcon />
                  <span className="text-[13px] font-medium text-gray-600 outfit-font">Microsoft</span>
                </motion.button>
              </div>

              {/* Sign Up Link — Outfit Regular */}
              <div className="text-center">
                <p className="text-[13px] text-gray-500 outfit-font font-normal">
                  New to Teacherdesk?{' '}
                  <button
                    type="button"
                    onClick={() => onSwitch("signup")}
                    className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors sora-font"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Security Notice — Outfit Regular */}
      <div className="w-full text-center px-4 pb-5 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-gray-500">
          <MdSecurity size={14} className="text-emerald-500" />
          <span className="text-[13px] outfit-font">Your data is secure with us</span>
        </div>
        <p className="text-[13px] text-gray-400 outfit-font font-normal">
          By continuing, you agree to our{' '}
          <a href="#" className="text-emerald-500 hover:underline font-medium">Terms of Use</a>
          {' '}and{' '}
          <a href="#" className="text-emerald-500 hover:underline font-medium">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
