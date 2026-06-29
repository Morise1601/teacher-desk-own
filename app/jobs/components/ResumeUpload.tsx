// app/jobs/components/ResumeUpload.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaCloudUploadAlt, FaFilePdf, FaFileWord, FaTrashAlt, 
    FaDownload, FaEye, FaRedo, FaInfoCircle, FaCheckCircle, 
    FaExclamationTriangle 
} from 'react-icons/fa';
import { Resume } from '../types';
import { jobsRepository } from '../jobsRepository';
import { toast } from 'react-toastify';

interface ResumeUploadProps {
    teacherId: string;
    onResumeChange: () => void;
}

export default function ResumeUpload({ teacherId, onResumeChange }: ResumeUploadProps) {
    const [resume, setResume] = useState<Resume | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadResume = async () => {
        try {
            const data = await jobsRepository.getResume(teacherId);
            setResume(data);
        } catch (err) {
            console.error('Failed to load resume', err);
        }
    };

    useEffect(() => {
        loadResume();
    }, [teacherId]);

    // Handle Drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    // Handle Drop events
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    // Validate size and format
    const validateAndProcessFile = (file: File) => {
        const allowedExtensions = ['pdf', 'docx'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            toast.error('Only PDF and DOCX file formats are allowed.');
            return;
        }

        const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSizeInBytes) {
            toast.error('File size exceeds the 10 MB limit.');
            return;
        }

        // Process file: Simulate Upload Progress & Convert to Base64
        setUploadProgress(0);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        let progressVal = 0;
        const interval = setInterval(() => {
            progressVal += 15;
            if (progressVal >= 100) {
                progressVal = 100;
                clearInterval(interval);
                
                reader.onloadend = async () => {
                    try {
                        const base64 = reader.result as string;
                        await jobsRepository.saveResume(teacherId, {
                            fileName: file.name,
                            fileSize: file.size,
                            base64
                        });
                        toast.success('Resume uploaded successfully!');
                        window.dispatchEvent(new CustomEvent('jobs:updated'));
                        onResumeChange();
                        await loadResume();
                        setUploadProgress(null);
                    } catch (err: any) {
                        toast.error(err.message || 'Failed to save resume.');
                        setUploadProgress(null);
                    }
                };
            } else {
                setUploadProgress(progressVal);
            }
        }, 120);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete your uploaded resume?')) {
            try {
                await jobsRepository.deleteResume(teacherId);
                toast.success('Resume deleted.');
                setResume(null);
                setShowPreview(false);
                window.dispatchEvent(new CustomEvent('jobs:updated'));
                onResumeChange();
            } catch (err) {
                toast.error('Failed to delete resume.');
            }
        }
    };

    // Format file size
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Calculate freshness status
    const getFreshness = () => {
        if (!resume) return null;
        const updatedDate = new Date(resume.lastUpdated);
        const diffTime = Math.abs(Date.now() - updatedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let label = '';
        let isStale = false;
        if (diffDays === 0) {
            label = 'Today';
        } else if (diffDays === 1) {
            label = 'Yesterday';
        } else {
            label = `${diffDays} days ago`;
        }

        if (diffDays > 90) {
            isStale = true;
        }

        return { label, isStale, days: diffDays };
    };

    const freshness = getFreshness();

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                <FaCloudUploadAlt className="text-lg text-[var(--color-secondary)]" /> Professional Resume
            </h3>

            {uploadProgress !== null ? (
                // Uploading progress UI
                <div className="py-6 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[var(--color-primary)] animate-spin mb-4" />
                    <p className="text-xs font-semibold text-gray-600">Uploading file... {uploadProgress}%</p>
                    <div className="w-full max-w-[240px] bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="bg-[var(--color-primary)] h-1.5 transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            ) : resume ? (
                // Resume Display Card
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded flex items-center justify-center text-xl flex-shrink-0">
                            {resume.fileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileWord className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 truncate" title={resume.fileName}>
                                {resume.fileName}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatBytes(resume.fileSize)}</p>
                        </div>
                    </div>

                    {/* Freshness, Strength meters */}
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3.5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Strength Score</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-sm font-black ${
                                    resume.strengthScore >= 80 ? 'text-green-600' : resume.strengthScore >= 60 ? 'text-amber-600' : 'text-red-500'
                                }`}>
                                    {resume.strengthScore}%
                                </span>
                                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-2 rounded-full ${
                                            resume.strengthScore >= 80 ? 'bg-green-500' : resume.strengthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${resume.strengthScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Updated</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                {freshness?.isStale ? (
                                    <FaExclamationTriangle className="text-red-500 text-xs flex-shrink-0" />
                                ) : (
                                    <FaCheckCircle className="text-green-500 text-xs flex-shrink-0" />
                                )}
                                <span className={`text-xs font-bold ${freshness?.isStale ? 'text-red-600' : 'text-gray-700'}`}>
                                    {freshness?.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stale Suggestion Warning */}
                    {freshness?.isStale && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 text-[11px] font-medium text-red-700 leading-relaxed">
                            <FaInfoCircle className="text-sm flex-shrink-0 mt-0.5" />
                            <p>Your resume is older than 90 days. We recommend uploading a fresh copy to attract top recruiters.</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2.5">
                        <button 
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-[var(--color-primary)]/20 hover:bg-slate-50 text-[var(--color-primary)] text-xs font-bold py-2 rounded-lg transition"
                        >
                            <FaEye className="text-xs" /> {showPreview ? 'Hide Preview' : 'Preview'}
                        </button>
                        
                        <a 
                            href={resume.fileUrl} 
                            download={resume.fileName}
                            className="flex items-center justify-center w-10 h-10 border border-slate-200 hover:bg-slate-50 rounded-lg text-gray-600 hover:text-[var(--color-primary)] transition"
                            title="Download Resume"
                        >
                            <FaDownload className="text-xs" />
                        </a>

                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center w-10 h-10 border border-slate-200 hover:bg-slate-50 rounded-lg text-gray-600 hover:text-[var(--color-primary)] transition"
                            title="Replace Resume"
                        >
                            <FaRedo className="text-xs" />
                        </button>

                        <button 
                            onClick={handleDelete}
                            className="flex items-center justify-center w-10 h-10 border border-red-100 hover:bg-red-50 rounded-lg text-red-500 transition"
                            title="Delete Resume"
                        >
                            <FaTrashAlt className="text-xs" />
                        </button>
                    </div>

                    {/* PDF Viewer Block */}
                    <AnimatePresence>
                        {showPreview && resume.fileUrl && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 350 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden border border-gray-200 rounded-lg mt-1 flex flex-col"
                            >
                                <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-500">PDF Viewer</span>
                                    <button 
                                        onClick={() => setShowPreview(false)}
                                        className="text-xs text-gray-400 hover:text-gray-700 font-bold"
                                    >
                                        Close
                                    </button>
                                </div>
                                {resume.fileName.endsWith('.pdf') ? (
                                    <iframe 
                                        src={resume.fileUrl} 
                                        className="w-full flex-grow border-0"
                                        title="Resume Preview"
                                    />
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                                        <FaFileWord className="text-4xl text-blue-500 mb-2" />
                                        <p className="text-xs font-bold text-gray-700">Preview not supported for Word files (.docx)</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Please download the file or use PDF format to view inline.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                // Drag and Drop Zone Empty State
                <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                        isDragActive 
                            ? 'border-[var(--color-primary)] bg-blue-50/50' 
                            : 'border-gray-200 bg-slate-50 hover:bg-slate-50/80 hover:border-[var(--color-primary)]/40'
                    }`}
                >
                    <FaCloudUploadAlt className="text-4xl text-gray-300 mb-3" />
                    <p className="text-xs font-bold text-gray-700">Drag & Drop your resume here</p>
                    <p className="text-[10px] text-gray-400 mt-1">Acceptable formats: PDF, DOCX (Max 10 MB)</p>
                    <span className="mt-4 px-3.5 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold rounded-lg transition duration-200">
                        Browse File
                    </span>
                </div>
            )}

            {/* Hidden Input File Element */}
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx"
                className="hidden"
            />
        </div>
    );
}
