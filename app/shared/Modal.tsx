'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { IoIosCloseCircle } from "react-icons/io";

interface ModalProps {
    /** Controls the visibility of the modal. */
    isOpen: boolean;
    /** Function to call when the modal should be closed. */
    onClose: () => void;
    /** The title of the modal, displayed at the top. */
    title?: string;
    /** The content of the modal body. */
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // Prevent body scrolling when the modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Keyboard event listener for closing the modal with the 'Escape' key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const backdropVariants: Variants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const modalVariants: Variants = {
        visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.2 } },
        hidden: { y: 20, opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Backdrop for click-to-close functionality */}
                    <div
                        className="absolute inset-0 bg-[#1e29398c] bg-opacity-70"
                        onClick={onClose}
                    />

                    {/* The actual modal content container */}
                    <motion.div
                        className="relative bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg transform z-[101]"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
                    >
                        {/* Modal Header with Title and Close Button */}
                        <div className="flex items-center justify-between border-b border-b-[#f1f2f4] pb-3 mb-4">
                            {title && (
                                <h3 className="text-xl font-bold text-[var(--color-primary)]">{title}</h3>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                                aria-label="Close modal"
                            >
                                <IoIosCloseCircle className="text-2xl text-[var(--color-primary)] transition-all duration-100 cursor-pointer hover:scale-[1.3]" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="text-gray-700 dark:text-gray-300 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
