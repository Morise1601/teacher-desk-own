'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleGoogleLoginAction } from '@/app/actions/auth';
import { decryptData, encryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const processAuthCallback = async () => {
      // 1. Check for errors in the URL query string (from Google or Supabase)
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error || errorDescription) {
        if (active) {
          setStatus('error');
          setErrorMessage(errorDescription || error || 'Authentication failed.');
          toast.error(errorDescription || error || 'Google authentication failed.');
          setTimeout(() => router.push('/'), 4000);
        }
        return;
      }

      try {
        // 2. Fetch authenticated Supabase user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session || !session.user) {
          // If no active session yet, give a brief delay as Supabase client auto-parses hashes
          await new Promise(resolve => setTimeout(resolve, 1500));
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            if (active) {
              setStatus('error');
              setErrorMessage('No active user session was discovered.');
              toast.error('Session not found. Please try again.');
              router.push('/');
            }
            return;
          }
        }

        const user = session?.user || (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error("Could not retrieve Google profile.");

        // 3. Format and encrypt the Google metadata
        const payload = {
          email: user.email,
          authId: user.id,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
          profilePic: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          googleId: user.user_metadata?.sub || ''
        };

        const securePayload = encryptData(payload);

        // 4. Invoke Server Action to match database records
        const encRes = await handleGoogleLoginAction(securePayload);
        const response = decryptData(encRes);

        if (!active) return;

        if (response && response.success) {
          if (response.exists) {
            // Existing user - Set role metadata client-side and redirect
            setStatus('success');
            
            // Add custom role metadata to Supabase user if not present to support Navbar
            if (user.user_metadata?.role !== response.role) {
              await supabase.auth.updateUser({
                data: { role: response.role }
              });
            }

            toast.success("Authentication successful! Welcome back.");
            setTimeout(() => {
              router.push(response.redirectPath || '/dashboard');
            }, 1500);
          } else {
            // New user - Redirect to Google Role Selection registration form
            setStatus('success');
            toast.info("Welcome to TeacherDesk! Please complete your profile selection.");
            
            setTimeout(() => {
              router.push('/authentication/google-signup');
            }, 1500);
          }
        } else {
          setStatus('error');
          setErrorMessage(response?.message || 'Server database verification failed.');
          toast.error(response?.message || 'Failed to sync with local user database.');
          setTimeout(() => router.push('/'), 4000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        if (active) {
          setStatus('error');
          setErrorMessage(err.message || 'An unexpected security event occurred.');
          toast.error(err.message || 'Single Sign-On error.');
          setTimeout(() => router.push('/'), 4000);
        }
      }
    };

    processAuthCallback();

    return () => {
      active = false;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-[#17116114] transform skew-x-12 origin-bottom-left z-1 hidden md:block" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-md border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-8 text-center relative z-10"
      >
        <div className="mb-6 flex justify-center">
          <h2 className="text-2xl oswald-font font-bold">
            <span className="text-[var(--color-primary)]">Teacher</span>
            <span className="text-[var(--color-secondary)]">Desk</span>
          </h2>
        </div>

        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 oswald-font tracking-tight">Verifying Single Sign-On</h3>
              <p className="text-xs text-gray-400 mt-2 brcob-font leading-relaxed max-w-xs mx-auto">
                Securing your authentication credentials and aligning your dashboard parameters.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center text-emerald-500">
              <ShieldCheck className="w-14 h-14" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-600 oswald-font tracking-tight">Access Verified</h3>
              <p className="text-xs text-gray-400 mt-2 brcob-font leading-relaxed">
                Your credentials are secure. Preparing your professional environment...
              </p>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center text-red-500">
              <AlertCircle className="w-14 h-14" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600 oswald-font tracking-tight">Verification Exception</h3>
              <p className="text-xs text-red-500 mt-2 font-medium brcob-font leading-relaxed max-w-xs mx-auto">
                {errorMessage}
              </p>
              <p className="text-[10px] text-gray-400 mt-4 brcob-font">
                Redirecting back to login portal...
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
