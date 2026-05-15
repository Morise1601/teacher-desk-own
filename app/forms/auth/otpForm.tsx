
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthFormType } from '@/app/types/auth';
import { toast, ToastContainer } from 'react-toastify';

type Props = {
  onSwitch: (form: AuthFormType) => void;
};



export default function OtpForm({ onSwitch }: Props) {
  const [focus, setFocus] = useState('');


  // OTP state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(60); // 60 seconds for OTP timer
  const [otpSent, setOtpSent] = useState(false); // To control resend OTP visibility


  // Handle OTP input changes
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move focus to next input
      if (value && index < otp.length - 1) {
        otpInputsRef.current[index + 1]?.focus();
      }
    }
  };

  // Handle OTP key down for backspace
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    sendOtp();
  }, []);

  // OTP Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Function to simulate sending OTP
  const sendOtp = () => {
    setOtpSent(true);
    setCountdown(60); // Reset timer
    // In a real app, you'd send an API request here
    console.log("OTP sent!");
  };

  // Simulate OTP submission
  const handleSubmitOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 5 && !isNaN(Number(enteredOtp))) {
      console.log("Submitting OTP:", enteredOtp);
      onSwitch("professional")
      // Simulate successful OTP verification
      setTimeout(() => {
        onSwitch("professional")
        //setView('professionConfirm'); // Move to profession confirmation view
      }, 500);
    } else {
      toast.warning("Please enter a valid 5-digit OTP.");
    }
  };

  // Animation variants
  const formVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <div className="md:h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-5 md:p-6">
        <ToastContainer />
        <AnimatePresence mode="wait">
            <motion.div
              key="otp"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col gap-6 w-full text-center authForms"
            >
              <div className="text-left mb-2">
                <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Verify account</h2>
                <p className="text-gray-400 brcob-font text-xs mt-1">We've sent a 5-digit security code to your email.</p>
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-between gap-2 md:gap-4 my-2">
                {otp.map((digit, index) => (
                  <motion.input
                    key={index}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={() => setFocus(`otp-${index}`)}
                    onBlur={() => setFocus('')}
                    ref={el => {
                      otpInputsRef.current[index] = el;
                    }}
                    className={`flex-1 h-16 text-center text-2xl font-bold rounded-md bg-gray-50/50 outline-none border transition-all duration-300
                                                    ${focus === `otp-${index}` ? 'border-[var(--color-primary)] bg-white ring-4 ring-[var(--color-primary)]/5' : 'border-gray-100'}
                                                    text-[var(--color-primary)] oswald-font`}
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-10 rounded-md bg-[var(--color-primary)] text-white font-medium text-sm brcob-font shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300"
                  onClick={() => {
                    handleSubmitOtp()
                  }}
                >
                  Verify security code
                </motion.button>
                
                {/* Resend OTP */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-[10px] text-gray-400 brcob-font">Didn't receive code? Resend in <span className="font-semibold text-[var(--color-primary)]">{countdown}s</span></p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="text-xs text-[var(--color-primary)] font-semibold hover:underline brcob-font"
                    >
                      Resend new code
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-gray-50">
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-[var(--color-primary)] font-medium brcob-font transition-colors"
                  onClick={() => {
                    setOtp(['', '', '', '', '']);
                    setOtpSent(false);
                    setCountdown(60);
                    onSwitch("signup")
                  }}
                >
                  Incorrect email? Go back
                </button>
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
