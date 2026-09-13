'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthFormType } from '@/app/types/auth';
import { toast } from 'react-toastify';
import { validateEmail } from '@/app/utils/validation';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/crypto';
import { checkCanResetPasswordAction } from '@/app/actions/auth';
import confetti from 'canvas-confetti';
import {
  Lock,
  Mail,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { MdLanguage, MdSecurity } from 'react-icons/md';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AppLogo from '@/components/ui/AppLogo';

type ResetStep = 'request' | 'email_sent' | 'new_password' | 'success';

interface Props {
  onSwitch?: (form: AuthFormType) => void;
  defaultToNewPasswordOnRecovery?: boolean;
}

// Crisp Brand SVGs
const GmailIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M1.5 6.75v10.5a2.25 2.25 0 002.25 2.25h16.5a2.25 2.25 0 002.25-2.25V6.75l-10.5 7.5L1.5 6.75z" fill="#EA4335" />
    <path d="M22.5 6.75V4.5A2.25 2.25 0 0020.25 2.25H3.75A2.25 2.25 0 001.5 4.5v2.25l10.5 7.5 10.5-7.5z" fill="#4285F4" />
    <path d="M1.5 6.75l10.5 7.5V2.25H3.75A2.25 2.25 0 001.5 4.5v2.25z" fill="#FBBC05" />
    <path d="M22.5 6.75l-10.5 7.5V2.25h8.25A2.25 2.25 0 0122.5 4.5v2.25z" fill="#34A853" />
  </svg>
);

const OutlookIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M2 5.5A2.5 2.5 0 014.5 3h7A2.5 2.5 0 0114 5.5v13a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 012 18.5v-13z" fill="#0078D4" />
    <circle cx="8" cy="12" r="3" fill="#FFFFFF" />
    <path d="M11 6.5A1.5 1.5 0 0112.5 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-7.5A1.5 1.5 0 0111 17.5v-11z" fill="#28A8EA" />
    <path d="M13 8l5 4-5 4V8z" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

export default function ResetForm({ onSwitch, defaultToNewPasswordOnRecovery }: Props) {
  const [step, setStep] = useState<ResetStep>(defaultToNewPasswordOnRecovery ? 'new_password' : 'request');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(48);
  const [canResend, setCanResend] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  // New Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [newPassFocused, setNewPassFocused] = useState(false);
  const [confirmPassFocused, setConfirmPassFocused] = useState(false);

  // Detect Supabase recovery callback from hash or searchParams or auth state change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (
        hash.includes('type=recovery') ||
        params.get('type') === 'recovery' ||
        params.get('step') === 'new_password' ||
        defaultToNewPasswordOnRecovery
      ) {
        setStep('new_password');
      }

      // If PKCE code exists in query params, exchange for session
      const code = params.get('code');
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data?.session) {
            setStep('new_password');
          }
        }).catch(() => {});
      }
    }

    // Subscribe to auth state changes (especially PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('new_password');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [defaultToNewPasswordOnRecovery]);

  // Check if current authenticated recovery user is a Google-only account
  useEffect(() => {
    const checkUserProvider = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || (await supabase.auth.getUser()).data?.user;
        if (user) {
          const providers = user.app_metadata?.providers || [user.app_metadata?.provider];
          if (providers?.includes('google') && !providers?.includes('email')) {
            setIsGoogleAccount(true);
          }
        }
      } catch (e) {}
    };

    if (step === 'new_password') {
      checkUserProvider();
    }
  }, [step]);

  // Resend Countdown Timer for Step 2
  useEffect(() => {
    let timer: any;
    if (step === 'email_sent' && resendCountdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  // Confetti celebration when reaching Step 4 (Success)
  useEffect(() => {
    if (step === 'success') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#047857', '#10B981', '#34D399', '#38BDF8', '#F59E0B'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [step]);

  // Mask email utility (e.g. vi****@gmail.com)
  const maskEmail = (str: string) => {
    if (!str || !str.includes('@')) return 'your email';
    const [name, domain] = str.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(4, name.length - 2))}@${domain}`;
  };

  // Password criteria verification
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const passedCount = Object.values(rules).filter(Boolean).length;

  const getStrengthInfo = () => {
    if (passedCount === 0) return { label: 'None', score: 0, color: 'text-gray-400', barColor: 'bg-gray-200 dark:bg-slate-700' };
    if (passedCount <= 2) return { label: 'Weak', score: 1, color: 'text-red-500', barColor: 'bg-red-500' };
    if (passedCount === 3 || passedCount === 4) return { label: 'Medium', score: 3, color: 'text-amber-500', barColor: 'bg-amber-500' };
    return { label: 'Strong', score: 4, color: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-emerald-600 dark:bg-emerald-400' };
  };

  const strength = getStrengthInfo();

  // Step 1 Action: Send Reset Email
  const handleSendResetEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.warning('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Check if user account was created via Google Sign-In
      const encPayload = encryptData({ email });
      const checkResEnc = await checkCanResetPasswordAction(encPayload);
      const checkRes = decryptData(checkResEnc);

      if (checkRes && checkRes.isGoogleUser) {
        toast.error(checkRes.message || 'This account is registered with Google. Please sign in with Google directly.');
        setLoading(false);
        return;
      }

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.warn('Password reset notice:', error.message);
      }

      toast.success('Password reset link sent! Check your inbox.');
      setResendCountdown(48);
      setCanResend(false);
      setStep('email_sent');
    } catch (err: any) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email handler
  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      toast.success('Reset email resent successfully!');
      setResendCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.info('Reset email resent. Please verify your inbox.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Action: Submit New Password
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.warning('Please enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passedCount < 5) {
      toast.warning('Please meet all password requirements before submitting.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message || 'Failed to update password.');
        setLoading(false);
        return;
      }

      toast.success('Password updated successfully!');
      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const stepVariants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -15, scale: 0.98 },
  };


  return (
    <div className="md:h-full w-full flex flex-col items-center justify-between bg-white dark:bg-[#0b1120] transition-colors duration-200 relative">
      {/* Top Bar with Language Selector and Theme Toggle */}
      <div className="w-full flex justify-between md:justify-end items-center px-6 md:px-10 pt-4 pb-0 z-20">
        <div className="md:hidden flex items-center">
          <AppLogo variant="app" width={32} height={32} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 outfit-font transition-colors"
          >
            <MdLanguage size={15} className="text-gray-400 dark:text-gray-500" />
            <span>English</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-grow flex items-center justify-center px-4 py-6 md:px-10">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[8px] border border-gray-100 dark:border-slate-800 shadow-[0_4px_40px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_40px_rgba(0,0,0,0.35)] p-6 sm:p-8 md:p-10 transition-colors duration-200">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════════
                STEP 1: Forgot Password? (Enter Email)
               ══════════════════════════════════════════════════════════════════ */}
            {step === 'request' && (
              <motion.form
                key="step-request"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onSubmit={handleSendResetEmail}
                className="flex flex-col gap-6 w-full"
                autoComplete="off"
              >
                {/* Header Badge & Title with Exact Lock Image from Screenshot */}
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center justify-center w-24 h-24 sm:w-26 sm:h-26 aspect-square rounded-full mb-3">
                    <img
                      src="/images/auth/lock_circle.webp"
                      alt="Forgot Password Lock"
                      className="w-full h-full object-contain drop-shadow-sm select-none"
                    />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sora-font">
                    Forgot Password?
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 outfit-font text-[13px] mt-1.5 max-w-sm leading-relaxed">
                    Enter your registered email address and we&apos;ll send you instructions to reset your password.
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700 dark:text-gray-200 outfit-font block">
                    Email Address
                  </label>
                  <div
                    className={`flex items-center gap-2.5 h-11 border rounded-[8px] px-3.5 transition-all duration-200 bg-white dark:bg-slate-800/80 ${
                      emailFocused
                        ? 'border-emerald-500 ring-2 ring-emerald-50 dark:ring-emerald-950'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <Mail
                      size={17}
                      className={`shrink-0 transition-colors ${
                        emailFocused ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Enter your registered email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="autofill-transparent flex-1 outline-none text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 outfit-font bg-transparent font-normal"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: '#047857' }}
                  className="w-full h-11 rounded-[8px] text-white text-[14px] outfit-font font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#047857')}
                >
                  <Send className="w-4 h-4 stroke-[2.2]" />
                  <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                </button>

                {/* Back to Login */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => onSwitch('login')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors outfit-font"
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Login</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 2: Check Your Email
               ══════════════════════════════════════════════════════════════════ */}
            {step === 'email_sent' && (
              <motion.div
                key="step-email-sent"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col gap-6 w-full"
              >
                {/* Header Badge & Title with Exact Mail Icon from Screenshot */}
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center justify-center w-24 h-24 sm:w-26 sm:h-26 aspect-square rounded-full mb-3">
                    <img
                      src="/images/auth/mail_circle.webp"
                      alt="Check Your Email"
                      className="w-full h-full object-contain drop-shadow-sm select-none"
                    />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sora-font">
                    Check Your Email
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 outfit-font text-[13px] mt-1.5 max-w-sm leading-relaxed">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {maskEmail(email)}
                    </span>
                  </p>
                </div>

                {/* Instructions Box */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100/90 dark:border-emerald-800/40 rounded-[8px] p-4 sm:p-5 space-y-3">
                  {[
                    'Open your email inbox and look for a message from TeacherDesk.',
                    'Click the Reset Password button in the email.',
                    "If you don't see it, please check your Spam or Junk folder.",
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <p className="text-[12.5px] text-gray-700 dark:text-gray-300 outfit-font leading-relaxed font-normal">
                        {idx === 1 ? (
                          <>
                            Click the{' '}
                            <strong className="font-semibold text-slate-800 dark:text-slate-100">
                              Reset Password
                            </strong>{' '}
                            button in the email.
                          </>
                        ) : (
                          text
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* "What's next?" Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-100 dark:border-slate-800" />
                  <span className="flex-shrink mx-4 text-[12px] text-gray-400 dark:text-gray-500 outfit-font font-medium">
                    What&apos;s next?
                  </span>
                  <div className="flex-grow border-t border-gray-100 dark:border-slate-800" />
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => window.open('https://mail.google.com', '_blank')}
                    className="flex items-center justify-center gap-1.5 h-10 border border-gray-200 dark:border-slate-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 bg-white dark:bg-slate-800/60 text-[12px] font-medium text-gray-700 dark:text-gray-200 outfit-font shadow-sm"
                  >
                    <GmailIcon />
                    <span>Open Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open('https://outlook.live.com', '_blank')}
                    className="flex items-center justify-center gap-1.5 h-10 border border-gray-200 dark:border-slate-700 rounded-[8px] hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 bg-white dark:bg-slate-800/60 text-[12px] font-medium text-gray-700 dark:text-gray-200 outfit-font shadow-sm"
                  >
                    <OutlookIcon />
                    <span>Open Outlook</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className={`flex items-center justify-center gap-1.5 h-10 border rounded-[8px] transition-all duration-200 text-[12px] font-medium outfit-font shadow-sm ${
                      canResend
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 cursor-pointer'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>Resend Email</span>
                  </button>
                </div>

                {/* Resend Countdown */}
                <div className="text-center">
                  <p className="text-[12.5px] text-gray-400 dark:text-gray-500 outfit-font">
                    Didn&apos;t receive the email?{' '}
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        Resend now
                      </button>
                    ) : (
                      <>
                        Resend available in{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {resendCountdown}s
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Bottom Actions: Change Email Address & Back to Login */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors outfit-font"
                  >
                    <Edit3 size={14} />
                    <span>Change Email Address</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitch('login')}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors outfit-font"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Login</span>
                  </button>
                </div>

                {/* Interactive bridge for testing / direct recovery flow */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('new_password')}
                    className="text-[11.5px] text-gray-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors"
                  >
                    Enter new password directly &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 3: Create New Password
               ══════════════════════════════════════════════════════════════════ */}
            {step === 'new_password' && (
              <motion.div
                key="step-new-password"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col gap-5 w-full"
              >
                {/* Header Badge & Title with Exact Plain Lock Icon */}
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-full mb-3">
                    <img
                      src="/images/auth/lock_plain_circle.webp"
                      alt="Create New Password"
                      className="w-full h-full object-contain drop-shadow-sm select-none"
                    />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sora-font">
                    Create New Password
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 outfit-font text-[13px] mt-1.5 font-normal">
                    Please enter your new password.
                  </p>
                </div>

                {isGoogleAccount ? (
                  /* Google User Notice - Do not allow reset password */
                  <div className="py-4 space-y-4 text-center">
                    <div className="p-4 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed outfit-font">
                      <p className="font-semibold text-sm mb-1 text-emerald-800 dark:text-emerald-300">
                        Google Account Detected
                      </p>
                      This account is authenticated with <strong>Google Sign-In</strong>. You do not need to set or reset a password.
                    </div>
                    <button
                      type="button"
                      onClick={() => onSwitch ? onSwitch('login') : (window.location.href = '/authentication')}
                      style={{ backgroundColor: '#16a34a' }}
                      className="w-full h-11 rounded-[8px] text-white text-[14px] outfit-font font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      <span>Sign In with Google</span>
                    </button>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onSwitch ? onSwitch('login') : (window.location.href = '/authentication')}
                        className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors outfit-font"
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Login</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Password Reset Form */
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full" autoComplete="off">
                    {/* New Password Field */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 outfit-font block">
                        New Password
                      </label>
                      <div
                        className={`relative flex items-center border rounded-[8px] px-3.5 h-11 transition-all duration-200 bg-white dark:bg-slate-800/80 ${
                          newPassFocused
                            ? 'border-emerald-500 ring-2 ring-emerald-50 dark:ring-emerald-950'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <Lock
                          size={16}
                          className={`shrink-0 transition-colors mr-2.5 ${
                            newPassFocused ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          onFocus={() => setNewPassFocused(true)}
                          onBlur={() => setNewPassFocused(false)}
                          className="autofill-transparent flex-1 outline-none text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 outfit-font bg-transparent font-normal pr-7"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Password Strength Meter in Single Row */}
                      <div className="flex items-center justify-between text-[12px] pt-1">
                        <div className="flex items-center gap-1.5 outfit-font">
                          <span className="text-gray-500 dark:text-gray-400">Password strength:</span>
                          <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 w-44">
                          {[1, 2, 3, 4].map(seg => (
                            <div
                              key={seg}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                seg <= strength.score ? strength.barColor : 'bg-gray-100 dark:bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Confirm New Password Field */}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 outfit-font block">
                        Confirm New Password
                      </label>
                      <div
                        className={`relative flex items-center border rounded-[8px] px-3.5 h-11 transition-all duration-200 bg-white dark:bg-slate-800/80 ${
                          confirmPassFocused
                            ? 'border-emerald-500 ring-2 ring-emerald-50 dark:ring-emerald-950'
                            : 'border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <Lock
                          size={16}
                          className={`shrink-0 transition-colors mr-2.5 ${
                            confirmPassFocused ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          onFocus={() => setConfirmPassFocused(true)}
                          onBlur={() => setConfirmPassFocused(false)}
                          className="autofill-transparent flex-1 outline-none text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 outfit-font bg-transparent font-normal pr-7"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[11.5px] text-red-500 outfit-font pt-0.5">Passwords do not match</p>
                      )}
                    </div>

                    {/* Password Requirements Checklist in 2 Columns */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
                      {/* Left Column */}
                      <div className="space-y-2">
                        {[
                          { label: 'At least 8 characters', valid: rules.length },
                          { label: 'One lowercase letter', valid: rules.lowercase },
                          { label: 'One number', valid: rules.number },
                        ].map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 shrink-0 ${
                                rule.valid
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-gray-100 dark:bg-slate-800 text-transparent border border-gray-300 dark:border-slate-600'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span
                              className={`text-[12px] outfit-font transition-colors duration-200 ${
                                rule.valid
                                  ? 'text-slate-800 dark:text-slate-100 font-medium'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-2">
                        {[
                          { label: 'One uppercase letter', valid: rules.uppercase },
                          { label: 'One special character', valid: rules.special },
                        ].map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 shrink-0 ${
                                rule.valid
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-gray-100 dark:bg-slate-800 text-transparent border border-gray-300 dark:border-slate-600'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span
                              className={`text-[12px] outfit-font transition-colors duration-200 ${
                                rule.valid
                                  ? 'text-slate-800 dark:text-slate-100 font-medium'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reset Password Button */}
                    <button
                      type="submit"
                      disabled={loading || passedCount < 5 || newPassword !== confirmPassword}
                      style={{ backgroundColor: '#16a34a' }}
                      className="w-full h-11 rounded-[8px] text-white text-[14px] outfit-font font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Lock className="w-4 h-4 stroke-[2.2]" />
                      <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
                    </button>

                    {/* Back to Login Link in Blue */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => onSwitch ? onSwitch('login') : (window.location.href = '/authentication')}
                        className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors outfit-font cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                        <span>Back to Login</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 4: Password Updated Successfully!
               ══════════════════════════════════════════════════════════════════ */}
            {step === 'success' && (
              <motion.div
                key="step-success"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col gap-6 w-full text-center items-center py-2"
              >
                {/* Glowing Shield Icon with Clean Transparent Artwork */}
                <div className="flex items-center justify-center w-36 h-22 mb-1">
                  <img
                    src="/images/auth/shield_circle.webp"
                    alt="Password Updated Successfully"
                    className="w-full h-full object-contain drop-shadow-md select-none"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sora-font">
                    Password Updated Successfully!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 outfit-font text-[13.5px] mt-2 max-w-sm mx-auto leading-relaxed">
                    Your password has been reset successfully. You can now login with your new password.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitch ? onSwitch('login') : (window.location.href = '/authentication')}
                    style={{ backgroundColor: '#16a34a' }}
                    className="w-full h-11 rounded-[8px] text-white text-[14px] outfit-font font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] cursor-pointer"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitch ? onSwitch('login') : (window.location.href = '/authentication')}
                    className="w-full h-11 rounded-[8px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[14px] outfit-font font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-all duration-200 cursor-pointer"
                  >
                    Sign In Now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Security Notice */}
      <div className="w-full text-center px-4 pb-5 space-y-1 z-20">
        <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400">
          <MdSecurity size={15} className="text-emerald-600" />
          <span className="text-[13px] outfit-font">Your data is secure with us</span>
        </div>
        <p className="text-[13px] text-gray-400 dark:text-gray-500 outfit-font font-normal">
          By continuing, you agree to our{' '}
          <a href="#" className="text-emerald-600 hover:underline font-medium">
            Terms of Use
          </a>{' '}
          and{' '}
          <a href="#" className="text-emerald-600 hover:underline font-medium">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
