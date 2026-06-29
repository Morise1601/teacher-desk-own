// app/jobs/components/AnalyticsPanel.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaChartPie, FaChartLine, FaCheckDouble, FaBriefcase,
    FaEnvelopeOpen, FaUsers, FaFolderOpen, FaGraduationCap
} from 'react-icons/fa';
import { jobsRepository } from '../jobsRepository';
import { Job, Application } from '../types';

interface AnalyticsPanelProps {
    role: 'teacher' | 'institution';
    userId: string;
}

export default function AnalyticsPanel({ role, userId }: AnalyticsPanelProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [apps, setApps] = useState<Application[]>([]);
    const [profileScore, setProfileScore] = useState(80);
    const [resumeUploaded, setResumeUploaded] = useState(false);

    const loadData = async () => {
        try {
            const allJobs = await jobsRepository.getJobs();
            setJobs(allJobs);
            const allApps = await jobsRepository.getApplications();
            setApps(allApps);
            const resume = await jobsRepository.getResume(userId);
            setResumeUploaded(!!resume);
            if (resume) {
                setProfileScore(80 + Math.round(resume.strengthScore * 0.2)); // scales profile
            } else {
                setProfileScore(60); // base profile strength
            }
        } catch (err) {
            console.error('Failed to load analytics', err);
        }
    };

    useEffect(() => {
        loadData();

        // Listen to apply events or updates
        const handler = () => { loadData(); };
        window.addEventListener('jobs:updated', handler);
        return () => window.removeEventListener('jobs:updated', handler);
    }, [role, userId]);

    // Calculations - Teacher
    const teacherApps = apps.filter(a => a.teacherId === userId);
    const totalAppsSent = teacherApps.length;
    const viewedApps = teacherApps.filter(a => ['Viewed', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'].includes(a.status)).length;
    const responseRate = totalAppsSent > 0 ? Math.round((viewedApps / totalAppsSent) * 100) : 0;
    const interviewCount = teacherApps.filter(a => a.status === 'Interview Scheduled').length;
    const selectedCount = teacherApps.filter(a => a.status === 'Selected').length;
    const hiringSuccessRate = totalAppsSent > 0 ? Math.round((selectedCount / totalAppsSent) * 100) : 0;

    // Calculations - Recruiter (Institution)
    // Assume all jobs belong to this recruiter stub for demo purposes
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalRecruiterApps = apps; // simplified scope for mock admin
    const shortlistedApps = apps.filter(a => a.status === 'Shortlisted' || a.status === 'Interview Scheduled').length;
    const positionsFilled = apps.filter(a => a.status === 'Selected').length;
    const conversionRate = totalRecruiterApps.length > 0 ? Math.round((positionsFilled / totalRecruiterApps.length) * 100) : 0;

    if (role === 'teacher') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Profile Completeness Nudge */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profile Strength</span>
                            <span className="text-2xs font-bold text-[var(--color-primary)] bg-blue-50 px-1.5 py-0.5 rounded">
                                {profileScore}% Complete
                            </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800 oswald-font">Optimize Visibility</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                            {resumeUploaded
                                ? 'Your profile is looking strong! Consider detailing your skills to match more listings.'
                                : 'Upload a professional resume in PDF/DOCX to increase recruitment matching by 3x.'
                            }
                        </p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                        <div
                            className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${profileScore}%` }}
                        />
                    </div>
                </motion.div>

                {/* Application Funnel Rates */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Response Metrics</span>
                            <span className="text-2xs font-bold text-[var(--color-secondary)] bg-green-50 px-1.5 py-0.5 rounded">
                                {responseRate}% Rate
                            </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800 oswald-font">Application Response</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                <div className="text-lg font-black text-gray-800">{totalAppsSent}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Sent</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                <div className="text-lg font-black text-gray-800">{viewedApps}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Viewed</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Conversion and Interviews */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hiring Conversions</span>
                            <span className="text-2xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                {interviewCount} Scheduled
                            </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800 oswald-font">Interview Pipeline</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                <div className="text-lg font-black text-purple-700">{interviewCount}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Interviews</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                <div className="text-lg font-black text-emerald-600">{selectedCount}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Selected</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        );
    }

    // Recruiter (Institution) View
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[var(--color-primary)] flex items-center justify-center text-lg flex-shrink-0">
                    <FaBriefcase />
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-800 leading-none">{activeJobs}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Active Job Posts</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[var(--color-secondary)] flex items-center justify-center text-lg flex-shrink-0">
                    <FaUsers />
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-800 leading-none">{totalRecruiterApps.length}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total Applicants</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
                    <FaFolderOpen />
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-800 leading-none">{shortlistedApps}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Shortlisted</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-lg flex-shrink-0">
                    <FaCheckDouble />
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-800 leading-none">{positionsFilled}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Positions Filled</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
                    <FaChartLine />
                </div>
                <div>
                    <div className="text-lg font-bold text-gray-800 leading-none">{conversionRate}%</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Hiring Ratio</div>
                </div>
            </div>

        </div>
    );
}
