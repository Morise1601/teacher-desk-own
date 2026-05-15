import { motion, AnimatePresence } from 'framer-motion';
import React from 'react'
import { FcGoogle } from 'react-icons/fc'
import { SiLinkedin } from 'react-icons/si'

const SocialLogins = () => {

    const triggerGoogle = () => {
        // Replace with your actual Google OAuth URL
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email profile';
    };

    const triggerLinkedIn = () => {
        // Replace with your actual LinkedIn OAuth URL
        window.location.href = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=r_liteprofile%20r_emailaddress';
    };

    return (
        <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-gray-400 text-sm">or sign up with</span>
            <div className="flex gap-6">
                <AnimatePresence>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-red-500 hover:bg-red-50 p-1 rounded-full cursor-pointer transition"
                        aria-label="Sign up with Google"
                        onClick={triggerGoogle}
                    >
                        <FcGoogle size={28} />
                    </motion.button>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-700 hover:bg-blue-50 p-1 rounded-full transition cursor-pointer"
                        aria-label="Sign up with LinkedIn"
                        onClick={triggerLinkedIn}
                    >
                        <SiLinkedin size={28} className='text-[#0A66C2]' />
                    </motion.button>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default SocialLogins
