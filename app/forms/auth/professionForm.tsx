'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation'; // Correct importimport React from 'react'
import { useRouter } from 'next/navigation';
import { AuthFormType } from '@/app/types/auth';
import { toast, ToastContainer } from 'react-toastify';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


type Props = {
    onSwitch: (form: AuthFormType) => void;
};

const professionRoles = [
    'Teacher',
    'Professor/Lecturer',
    'Corporate Trainer',
    'Educational Consultant',
    'Researcher',
    'Other (please specify)',
];

export default function ProfessionalForm({ onSwitch }: Props) {

    const router = useRouter(); // Initialize useRouter

    // Profession Confirmation state
    const [isEducationProfessional, setIsEducationProfessional] = useState<boolean | null>(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [otherRole, setOtherRole] = useState('');

    const handleProfessionConfirm = () => {
        if (isEducationProfessional === true) {
            if (selectedRole) {
                if (selectedRole === 'Other (please specify)' && !otherRole.trim()) {
                    toast.warning("Please specify your role.");
                    return;
                }
                console.log("Profession confirmed:", selectedRole, otherRole);
                // Redirect to dashboard or next step
                router.push('/dashboard'); // Replace with your actual dashboard route
            } else {
                toast.warning("Please select your professional role.");
            }
        } else if (isEducationProfessional === false) {
            console.log("Not an education professional. Redirecting to login.");
            // Change the view back to 'login'
            // Optionally, you might want to clear any signup data or show a message
            // setSignupData({ /* reset to initial state */ });
            onSwitch("signup")
        } else {
            toast.warning("Please select whether you are an education professional.");
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
                        key="professionConfirm"
                        variants={formVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex flex-col gap-4 w-full text-center authForms"
                    >
                        <div className="text-left mb-2">
                            <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight">Account verification</h2>
                            <p className="text-gray-400 brcob-font text-xs mt-1">Please confirm your professional status to proceed.</p>
                        </div>

                        <div className="bg-gray-50/50 rounded-md p-4 border border-gray-100">
                            <p className="text-[var(--color-primary)] text-base font-semibold brcob-font min-h-[1.5rem] mb-4">
                                <TypeAnimation
                                    sequence={[
                                        'Are you an educator or a learner?',
                                        1000,
                                        'Identify your specialized role',
                                        1000,
                                    ]}
                                    wrapper="span"
                                    cursor={true}
                                    repeat={Infinity}
                                    speed={50}
                                />
                            </p>

                            <div className="flex gap-3">
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex-1 py-1.5 rounded-md font-medium transition-all duration-300 brcob-font text-sm
                                        ${isEducationProfessional === true
                                            ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20'
                                            : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200 hover:text-gray-600'
                                        }`}
                                    onClick={() => setIsEducationProfessional(true)}
                                >
                                    Teacher
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-1.5 rounded-md font-medium transition-all duration-300 brcob-font text-sm bg-white text-gray-400 border border-gray-100 hover:border-red-100 hover:text-red-500"
                                    onClick={() => onSwitch("signup")}
                                >
                                    Learner
                                </motion.button>
                            </div>
                        </div>

                        {isEducationProfessional === true && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-2 mt-1 text-left"
                            >
                                <label className="text-[11px] font-medium text-gray-500 brcob-font ml-0.5">
                                    Specify your professional role
                                </label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(value) => {
                                        setSelectedRole(value);
                                        setOtherRole('');
                                    }}
                                >
                                    <SelectTrigger className="w-full h-10 rounded-md bg-gray-50/50 border-gray-100 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm">
                                        <SelectValue placeholder="Select a professional category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professionRoles.map((role) => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedRole === 'Other (please specify)' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-2"
                                    >
                                        <Input
                                            type="text"
                                            placeholder="Enter your specific role title"
                                            value={otherRole}
                                            onChange={(e) => setOtherRole(e.target.value)}
                                            className="w-full h-10 rounded-md px-4 bg-gray-50/50 border-gray-100 border focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-[var(--color-primary)] text-sm placeholder-gray-300"
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full h-10 rounded-md bg-[var(--color-primary)] text-white font-medium text-sm brcob-font shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300"
                                onClick={handleProfessionConfirm}
                            >
                                Finalize account setup
                            </motion.button>
                            
                            <button
                                type="button"
                                className="text-xs text-gray-400 hover:text-[var(--color-primary)] font-medium brcob-font transition-colors"
                                onClick={() => onSwitch("signup")}
                            >
                                Return to account type
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
