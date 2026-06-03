// components/AuthForm.jsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from "react-icons/fc";
import { SiLinkedin } from "react-icons/si";
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Input } from "@/components/ui/input";
import { AuthFormType } from '@/app/types/auth';
import { toast } from 'react-toastify';
import { validateEmail, validatePassword } from '@/app/utils/validation';
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
  const router = useRouter(); // Initialize useRouter
  const [focus, setFocus] = useState('');
  // Login fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Animation variants
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
      // Login directly on the client to ensure the session is persisted in the browser
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
        console.log("TeacherDesk LOG: Logged in user data:", data);
        // Determine redirect path based on role
        let redirectPath = '/dashboard';
        // SECURE FALLBACK: Get role from server action if metadata is missing
        const encryptedResponse = await getUserRoleAction(data.user.id);
        const response = decryptData(encryptedResponse);

        if (response && response.success) {
          console.log("TeacherDesk LOG: Logged in user role (fetched from database):", response.role);
          if (response.role === 'super_admin' || response.role === 'admin') {
            redirectPath = '/dashboard/super-admin';
          }
        }

        setTimeout(() => {
          router.push(redirectPath);
          // Don't set loading to false here, keep it until navigation completes
        }, 1000);
      }
    } catch (error) {
      toast.error("Authentication security error.");
      setLoading(false);
    }
  }

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
      
      const callbackUrl = settings.google_callback_url || window.location.origin + '/auth/callback';
      
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

  const linkedInSignIn = () => {
    toast.info('LinkedIn SignIn coming soon!');
  }


  return (
    <div className="md:h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">

        <AnimatePresence mode="wait">
          <motion.form
            key="login"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-3.5 w-full authForms"
            autoComplete="off"
          >
            {/* Mobile Branding */}
            <div className='md:hidden mb-4'>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className='text-2xl oswald-font font-bold text-[var(--color-primary)]'>
                  Teacher<span className='text-[var(--color-secondary)]'>Desk</span>
                </h2>
                <p className='brcob-font text-[10px] text-gray-500'>A virtual desk for every educator in the globe</p>
              </motion.div>
            </div>

            <div className="text-left mb-2">
              <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Welcome back</h2>
              <p className="text-gray-400 brcob-font text-xs mt-1">Please enter your details to access your account.</p>
            </div>

            <div className="space-y-4">
              {/* Email or Phone Field */}
              <div className="group space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500 brcob-font ml-0.5 transition-colors group-focus-within:text-[var(--color-primary)]">Email or phone</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g. j.doe@university.edu"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    onFocus={() => setFocus('email')}
                    onBlur={() => setFocus('')}
                    className="w-full h-10 rounded-md px-4 bg-gray-50/50 border-gray-100 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group space-y-1.5">
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-[11px] font-medium text-gray-500 brcob-font transition-colors group-focus-within:text-[var(--color-primary)]">Password</label>
                  <button
                    type="button"
                    onClick={() => onSwitch("reset")}
                    className="text-[11px] text-[var(--color-primary)] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <PasswordInput
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocus('password')}
                    onBlur={() => setFocus('')}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full h-10 rounded-md bg-[var(--color-primary)] text-white font-medium text-sm brcob-font shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 mt-1"
              onClick={loginFn}
              loading={loading}
            >
              Log in to account
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-gray-400 brcob-font">or continue with</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 h-10 border border-gray-100 rounded-md hover:bg-gray-50 transition-all duration-200"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => googleSignIn()}
              >
                <FcGoogle size={18} />
                <span className="text-[11px] font-medium text-gray-600 brcob-font">Google</span>
              </motion.button>

              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 h-10 border border-gray-100 rounded-md hover:bg-gray-50 transition-all duration-200"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => linkedInSignIn()}
              >
                <SiLinkedin size={16} className='text-[#0A66C2]' />
                <span className="text-[11px] font-medium text-gray-600 brcob-font">LinkedIn</span>
              </motion.button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 brcob-font">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitch("signup")}
                  className="text-[var(--color-primary)] font-bold hover:underline"
                >
                  Create account
                </button>
              </p>
            </div>

            <div className="mt-2 text-center">
              <p className="text-[9px] text-gray-400 leading-relaxed max-w-[240px] mx-auto brcob-font">
                By continuing, you agree to our <a href="#" className="text-gray-600 hover:text-[var(--color-primary)] underline">Terms</a> and <a href="#" className="text-gray-600 hover:text-[var(--color-primary)] underline">Privacy Policy</a>.
              </p>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
