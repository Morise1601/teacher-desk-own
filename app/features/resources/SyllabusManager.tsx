'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiFileText, FiEye, FiDownload, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';

const MOCK_SYLLABI = [
    { id: 1, name: "Mathematics_Grade_10_Fall_2025.pdf", size: "1.2 MB", date: "2025-05-12", status: "Approved" },
    { id: 2, name: "Physics_Curriculum_Advance_Physics.pdf", size: "850 KB", date: "2025-06-01", status: "Pending" },
    { id: 3, name: "Chemistry_Lab_Guide_V2.pdf", size: "2.1 MB", date: "2025-06-15", status: "Approved" }
];

export default function SyllabusManager() {
    const [isDragging, setIsDragging] = useState(false);
    const [showUploadPreview, setShowUploadPreview] = useState(false);

    return (
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="bg-white rounded-lg md:rounded-lg p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden relative">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-secondary)]/5 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row gap-10 md:gap-16 relative z-10">
                    {/* Left: Upload Area */}
                    <div className="lg:w-1/3">
                        <h2 className="text-2xl md:text-3xl font-bold oswald-font text-[var(--color-primary)] mb-4 capitalize tracking-tighter">
                            Syllabus Hub
                        </h2>
                        <p className="text-gray-500 mb-8 md:mb-10 brcob-font text-sm md:text-base">
                            Organize and share your teaching blueprints. Upload your latest syllabus for review or student access.
                        </p>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); setShowUploadPreview(true); }}
                            className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${isDragging
                                ? "border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 scale-105"
                                : "border-gray-200 hover:border-[var(--color-primary)] hover:bg-gray-50"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-lg ${isDragging ? "bg-[var(--color-secondary)] text-white" : "bg-[var(--color-primary)] text-white"
                                }`}>
                                <FiUploadCloud className="text-3xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 brcob-font mb-2">
                                Click or drag file to upload
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Support PDF, DOCX (Max 10MB)
                            </p>
                        </div>

                        <AnimatePresence>
                            {showUploadPreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6 bg-gray-50 rounded-lg p-4 flex items-center gap-4 relative"
                                >
                                    <div className="w-10 h-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FiFileText />
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="text-sm font-bold text-gray-700 truncate">MathGrade10_Draft.pdf</p>
                                        <p className="text-[10px] text-gray-400">1.2 MB • Ready to upload</p>
                                    </div>
                                    <button
                                        onClick={() => setShowUploadPreview(false)}
                                        className="w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 hover:shadow-md transition-all flex items-center justify-center"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            className={`w-full mt-6 py-4 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-xl transition-all ${showUploadPreview
                                ? "bg-[var(--color-secondary)] text-white hover:scale-[1.02]"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Confirm Upload
                        </button>
                    </div>

                    {/* Right: View/Manage Area */}
                    <div className="lg:w-2/3">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold oswald-font text-gray-800 capitalize tracking-wide">
                                Your Documents
                            </h3>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-[var(--color-primary)] shadow-sm">
                                    All
                                </button>
                                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400">
                                    Approved
                                </button>
                                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400">
                                    Pending
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {MOCK_SYLLABI.map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-100 rounded-lg hover:shadow-xl hover:border-[var(--color-primary)]/20 transition-all gap-4"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-gray-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors duration-500">
                                            <FiFileText className="text-2xl" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 brcob-font truncate max-w-[200px] md:max-w-md">
                                                {doc.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-400">{doc.size}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="text-xs text-gray-400">{doc.date}</span>
                                                {doc.status === "Approved" ? (
                                                    <span className="ml-2 flex items-center gap-1 text-[10px] capitalize font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full tracking-tighter">
                                                        <FiCheck /> {doc.status}
                                                    </span>
                                                ) : (
                                                    <span className="ml-2 flex items-center gap-1 text-[10px] capitalize font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full tracking-tighter">
                                                        <FiClock /> {doc.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm group/btn tooltip" title="View Syllabus">
                                            <FiEye />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[var(--color-secondary)] hover:text-white transition-all shadow-sm tooltip" title="Download">
                                            <FiDownload />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-all shadow-sm tooltip" title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
