// app/jobs/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import LoadingScreen from '@/components/ui/loading-screen';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaMapMarkerAlt, FaBookmark, FaRegBookmark,
    FaBriefcase, FaClock, FaRupeeSign, FaFilter, FaTimes,
    FaPlus, FaUserEdit, FaBell, FaCheckCircle, FaUserTie,
    FaEye, FaGlobe, FaBuilding, FaGraduationCap, FaPaperPlane,
    FaArrowRight, FaSchool, FaChartLine
} from 'react-icons/fa';
import { MdWork, MdVerified, MdLocationOn } from 'react-icons/md';
import { HiLightningBolt } from 'react-icons/hi';
import { IoMdTrendingUp } from 'react-icons/io';
import { toast } from 'react-toastify';

// Types and Repository
import { Job, Application, Resume, TeacherSettings, InstitutionSettings } from './types';
import { jobsRepository } from './jobsRepository';
import { supabase } from '@/lib/supabase';
import { getUserRoleAction } from '@/app/actions/auth';
import { decryptData } from '@/lib/crypto';

// Components
import ResumeUpload from './components/ResumeUpload';
import JobCreatorModal from './components/JobCreatorModal';
import ApplicantDetailsModal from './components/ApplicantDetailsModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import NotificationCenter from './components/NotificationCenter';

// Filter mapping
const salaryRangeMap: Record<string, number> = { 'Any Salary': 0, '₹10k–₹20k': 10000, '₹20k–₹40k': 20000, '₹40k–₹80k': 40000 };

export default function JobsPage() {
    // Current User Session Context
    const DUMMY_TEACHER_ID = 'teacher-session-123';
    const DUMMY_INSTITUTION_ID = 'institution-session-456';

    const [userRole, setUserRole] = useState<string | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    // View state
    const [viewMode, setViewMode] = useState<'teacher' | 'institution'>('teacher');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const [teacherSettings, setTeacherSettings] = useState<TeacherSettings | null>(null);
    const [institutionSettings, setInstitutionSettings] = useState<InstitutionSettings | null>(null);
    const [resumeData, setResumeData] = useState<Resume | null>(null);

    // Active notifications indicator
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

    // Modal Triggers
    const [showJobCreator, setShowJobCreator] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [applyingJob, setApplyingJob] = useState<Job | null>(null);

    // Application Cover Letter Input
    const [coverLetterInput, setCoverLetterInput] = useState('');

    // Teacher Side: Search & Filter inputs
    const [searchQuery, setSearchQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('All Subjects');
    const [filterBoard, setFilterBoard] = useState('All Boards');
    const [filterExp, setFilterExp] = useState('Any Experience');
    const [filterSalary, setFilterSalary] = useState('Any Salary');
    const [filterType, setFilterType] = useState('All Types');
    const [filterGrade, setFilterGrade] = useState('All Levels');
    const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved' | 'applied'>('all');

    // Institution Side: Tab filters
    const [instTab, setInstTab] = useState<'active-postings' | 'applicants' | 'hiring-settings'>('active-postings');
    const [applicantStatusFilter, setApplicantStatusFilter] = useState('All Statuses');
    const [applicantExpFilter, setApplicantExpFilter] = useState('Any Experience');
    const [applicantSubjectFilter, setApplicantSubjectFilter] = useState('All Subjects');

    const loadData = async () => {
        try {
            const allJobs = await jobsRepository.getJobs();
            setJobs(allJobs);
            const allApps = await jobsRepository.getApplications();
            setApplications(allApps);
            const savedList = await jobsRepository.getSavedJobsList(DUMMY_TEACHER_ID);
            setSavedJobIds(savedList);
            const tSettings = await jobsRepository.getTeacherSettings(DUMMY_TEACHER_ID);
            setTeacherSettings(tSettings);
            const instSettings = await jobsRepository.getInstitutionSettings(DUMMY_INSTITUTION_ID);
            setInstitutionSettings(instSettings);
            const resume = await jobsRepository.getResume(DUMMY_TEACHER_ID);
            setResumeData(resume);
        } catch (err) {
            console.error('Failed to load repository data', err);
        }
    };

    useEffect(() => {
        const fetchRoleAndLoad = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    let role = user.user_metadata?.role;
                    if (!role) {
                        const enc = await getUserRoleAction(user.id);
                        const dec = decryptData(enc);
                        if (dec && dec.success) role = dec.role;
                    }
                    setUserRole(role || 'teacher');
                    if (role === 'institution' || role === 'institution_admin') {
                        setViewMode('institution');
                    } else {
                        setViewMode('teacher');
                    }
                }
            } catch (err) {
                console.error("Error fetching user role on jobs page:", err);
            } finally {
                setRoleLoading(false);
            }
        };

        fetchRoleAndLoad();
        loadData();

        // Listen for internal job updates triggered on this tab
        const handleReload = () => {
            loadData();
        };
        window.addEventListener('jobs:updated', handleReload);

        // Listen for local storage changes from other tabs/windows (realtime sync)
        const handleStorageChange = (e: StorageEvent) => {
            const keysToSync = [
                'td_jobs_list',
                'td_applications_list',
                'td_saved_jobs',
                'td_teacher_settings',
                'td_institution_settings',
                'td_resumes_list',
                'td_notifications_list',
                'td_logs_list'
            ];
            if (e.key && keysToSync.includes(e.key)) {
                loadData();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('jobs:updated', handleReload);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Filter counts calculation
    const activeFilterCount = [
        filterSubject !== 'All Subjects', filterBoard !== 'All Boards',
        filterExp !== 'Any Experience', filterSalary !== 'Any Salary',
        filterType !== 'All Types', filterGrade !== 'All Levels',
    ].filter(Boolean).length;

    const resetFilters = () => {
        setFilterSubject('All Subjects'); setFilterBoard('All Boards');
        setFilterExp('Any Experience'); setFilterSalary('Any Salary');
        setFilterType('All Types'); setFilterGrade('All Levels');
    };

    // Filter jobs for teacher side
    const filteredJobs = useMemo(() => {
        let list = jobs;

        // Tab Filters
        if (activeTab === 'saved') {
            list = list.filter(j => savedJobIds.includes(j.id));
        } else if (activeTab === 'applied') {
            const appliedIds = applications.filter(a => a.teacherId === DUMMY_TEACHER_ID).map(a => a.jobId);
            list = list.filter(j => appliedIds.includes(j.id));
        } else if (activeTab === 'recommended') {
            // Sort by match score
            if (teacherSettings) {
                return list.map(job => {
                    const match = calculateMatchScore(job, teacherSettings);
                    return { ...job, matchScore: match.score };
                })
                    .filter(j => j.matchScore >= 60)
                    .sort((a, b) => b.matchScore - a.matchScore);
            }
        }

        // Text query filters
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(j =>
                j.title.toLowerCase().includes(query) ||
                j.school.toLowerCase().includes(query) ||
                j.subject.toLowerCase().includes(query)
            );
        }
        if (locationQuery) {
            const loc = locationQuery.toLowerCase();
            list = list.filter(j =>
                j.location.toLowerCase().includes(loc) ||
                j.state.toLowerCase().includes(loc)
            );
        }

        // Multi-select pill filters
        if (filterSubject !== 'All Subjects') list = list.filter(j => j.subject === filterSubject);
        if (filterBoard !== 'All Boards') list = list.filter(j => j.board === filterBoard);
        if (filterExp !== 'Any Experience') list = list.filter(j => j.experience === filterExp);
        if (filterType !== 'All Types') list = list.filter(j => j.jobType === filterType);
        if (filterGrade !== 'All Levels') list = list.filter(j => j.gradeLevel === filterGrade);
        if (filterSalary !== 'Any Salary') {
            const minVal = salaryRangeMap[filterSalary];
            list = list.filter(j => j.salaryMin >= minVal);
        }

        return list;
    }, [jobs, activeTab, savedJobIds, applications, searchQuery, locationQuery, filterSubject, filterBoard, filterExp, filterType, filterGrade, filterSalary, teacherSettings]);

    // Recruiter: Filter applicants
    const filteredApplicants = useMemo(() => {
        let list = applications;

        if (applicantStatusFilter !== 'All Statuses') {
            list = list.filter(a => a.status === applicantStatusFilter);
        }
        if (applicantExpFilter !== 'Any Experience') {
            // matches experience requirements
            const matchingJobs = jobs.filter(j => j.experience === applicantExpFilter).map(j => j.id);
            list = list.filter(a => matchingJobs.includes(a.jobId));
        }
        if (applicantSubjectFilter !== 'All Subjects') {
            const matchingJobs = jobs.filter(j => j.subject === applicantSubjectFilter).map(j => j.id);
            list = list.filter(a => matchingJobs.includes(a.jobId));
        }

        return list;
    }, [applications, applicantStatusFilter, applicantExpFilter, applicantSubjectFilter, jobs]);

    // --- Action Handlers ---

    const handleToggleSave = async (id: string) => {
        try {
            const isSaved = await jobsRepository.toggleSaveJob(DUMMY_TEACHER_ID, id);
            setSavedJobIds(prev => isSaved ? [...prev, id] : prev.filter(item => item !== id));
            toast.success(isSaved ? 'Job saved to bookmarks.' : 'Job removed from bookmarks.');
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to save bookmark.');
        }
    };

    const handleApplyClick = (job: Job) => {
        if (!resumeData) {
            toast.warn('Please upload a professional resume before applying.');
            return;
        }
        setApplyingJob(job);
        setCoverLetterInput('');
    };

    const handleConfirmApply = async () => {
        if (!applyingJob) return;

        try {
            await jobsRepository.applyJob({
                jobId: applyingJob.id,
                teacherId: DUMMY_TEACHER_ID,
                teacherName: 'Jessica Taylor', // Mock Teacher Profile details
                teacherEmail: 'jessica.taylor@teacherdesk.com',
                coverLetter: coverLetterInput.trim() || undefined
            });

            toast.success(`Application sent successfully for: ${applyingJob.title}`);
            setApplyingJob(null);

            // Dispatch a reload event to update any listening widgets
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err: any) {
            toast.error(err.message || 'Application submission failed.');
        }
    };

    const handleTeacherSettingsUpdate = async (fields: Partial<TeacherSettings>) => {
        try {
            const updated = await jobsRepository.saveTeacherSettings(DUMMY_TEACHER_ID, fields);
            setTeacherSettings(updated);
            toast.success('Availability settings updated.');
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to update availability.');
        }
    };

    const handleInstitutionHiringUpdate = async (status: InstitutionSettings['hiringStatus']) => {
        try {
            const updated = await jobsRepository.saveInstitutionSettings(DUMMY_INSTITUTION_ID, { hiringStatus: status });
            setInstitutionSettings(updated);
            toast.success(`Hiring status updated to: ${status}`);

            // Notify active followers (simulation)
            if (status === 'Actively Hiring') {
                const activeJobsCount = jobs.filter(j => j.status === 'active').length;
                await jobsRepository.addNotification(DUMMY_TEACHER_ID, {
                    title: 'Ryan International is hiring!',
                    message: `Ryan International School updated status to Actively Hiring. They have ${activeJobsCount} positions open.`,
                    type: 'new_match'
                });
            }

            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to update hiring settings.');
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (confirm('Are you sure you want to delete this job posting?')) {
            try {
                await jobsRepository.deleteJob(id);
                toast.success('Job listing deleted.');
                window.dispatchEvent(new CustomEvent('jobs:updated'));
                await loadData();
            } catch (err) {
                toast.error('Failed to delete listing.');
            }
        }
    };

    const handlePauseJob = async (job: Job) => {
        try {
            const newStatus = job.status === 'paused' ? 'active' : 'paused';
            await jobsRepository.updateJob(job.id, { status: newStatus });
            toast.success(`Listing status set to: ${newStatus}`);
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    // Calculate match score for list view
    const calculateMatchScore = (job: Job, settings: TeacherSettings) => {
        let score = 50;
        if (job.subject.toLowerCase() === settings.subjectExpertise.toLowerCase()) score += 20;
        if (job.experience.toLowerCase() === settings.experience.toLowerCase()) score += 15;
        if (job.location.toLowerCase().includes(settings.preferredLocation.toLowerCase())) score += 10;

        let hits = 0;
        job.skillsRequired.forEach(sk => {
            if (settings.skills.some(usk => usk.toLowerCase().includes(sk.toLowerCase()))) hits++;
        });
        if (job.skillsRequired.length > 0) score += Math.round((hits / job.skillsRequired.length) * 25);
        else score += 25;

        return { score: Math.min(score, 100) };
    };

    if (roleLoading) {
        return <LoadingScreen message="Verifying profile access..." />;
    }

    return (
        <div className="min-h-screen bg-[#f4f6fa] text-gray-800 flex flex-col font-sans">
            <Navbar />

            {/* ── ROLE SWITCHER & NOTIFICATION BUTTON ROW ── */}
            <div className="bg-white border-b border-gray-200 py-3 px-4 shadow-2xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    {/* Switcher badge */}
                    {(userRole === 'super_admin' || !userRole) && (
                        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('teacher')}
                                className={`text-xs font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'teacher'
                                        ? 'bg-[var(--color-primary)] text-white shadow'
                                        : 'text-gray-600 hover:bg-slate-200'
                                    }`}
                            >
                                <FaUserTie className="text-2xs" /> Educator Profile View
                            </button>
                            <button
                                onClick={() => setViewMode('institution')}
                                className={`text-xs font-black px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'institution'
                                        ? 'bg-[var(--color-secondary)] text-white shadow'
                                        : 'text-gray-600 hover:bg-slate-200'
                                    }`}
                            >
                                <FaSchool className="text-2xs" /> Institution Recruiter View
                            </button>
                        </div>
                    )}

                    {/* Alerts button */}
                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative p-2.5 bg-white border border-slate-200 hover:border-[var(--color-primary)] hover:bg-slate-50 text-gray-700 hover:text-[var(--color-primary)] rounded-xl shadow-2xs transition flex items-center gap-2 text-xs font-bold"
                    >
                        <FaBell className="text-base" /> Job Alerts Log
                        {unreadNotifsCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-3xs px-2.5 py-0.5 rounded-full animate-bounce shadow">
                                {unreadNotifsCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── BANNER BANNER ── */}
            <div className="relative overflow-hidden py-10 text-white" style={{ background: 'linear-gradient(135deg, #0a1f33 0%, var(--color-primary) 60%, var(--color-secondary) 100%)' }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/[0.03] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <span className="bg-white/10 border border-white/20 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                            🎓 Exclusive Educator Placements
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-bold oswald-font tracking-wide">
                            {viewMode === 'teacher' ? 'Discover Your Perfect Classroom' : 'Recruitment Pipeline Controls'}
                        </h1>
                        <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
                            {viewMode === 'teacher'
                                ? 'Find matching subject teaching roles in elite CBSE, ICSE, and Montessori schools.'
                                : 'Manage active postings, review smart matches, and coordinate interview communications.'}
                        </p>
                    </div>
                    {/* Stat boxes */}
                    <div className="flex gap-3">
                        <div className="bg-white/10 border border-white/15 p-3 rounded-xl text-center backdrop-blur-3xs">
                            <div className="text-base font-black oswald-font leading-none">{jobs.length}</div>
                            <div className="text-[10px] text-white/50 mt-1 uppercase">Jobs Listed</div>
                        </div>
                        <div className="bg-white/10 border border-white/15 p-3 rounded-xl text-center backdrop-blur-3xs">
                            <div className="text-base font-black oswald-font leading-none">{applications.length}</div>
                            <div className="text-[10px] text-white/50 mt-1 uppercase">Applicants</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT LAYER ── */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">

                {/* --- TEACHER MODE DASHBOARD --- */}
                {viewMode === 'teacher' && (
                    <div className="flex flex-col gap-6">

                        {/* Analytics widgets row */}
                        <AnalyticsPanel role="teacher" userId={DUMMY_TEACHER_ID} />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Column 1: Filters Panel & settings (Col 4) */}
                            <aside className="lg:col-span-4 flex flex-col gap-5">

                                {/* Resume Upload card */}
                                <ResumeUpload teacherId={DUMMY_TEACHER_ID} onResumeChange={loadData} />

                                {/* Open-to-work toggle card */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                                        <FaUserEdit className="text-lg text-[var(--color-secondary)]" /> Availability Settings
                                    </h3>
                                    {teacherSettings && (
                                        <div className="space-y-4">
                                            {/* Toggle switch */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-700">Open to Work</span>
                                                    <p className="text-[10px] text-gray-400">Allows institutions to discover you.</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTeacherSettingsUpdate({ openToWork: !teacherSettings.openToWork })}
                                                    className={`w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none ${teacherSettings.openToWork ? 'bg-green-500' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${teacherSettings.openToWork ? 'translate-x-5' : 'translate-x-0'
                                                        }`} />
                                                </button>
                                            </div>

                                            {/* Availability Select */}
                                            {teacherSettings.openToWork && (
                                                <div className="space-y-3 pt-2.5 border-t border-slate-100">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Availability Status</label>
                                                        <select
                                                            value={teacherSettings.availabilityStatus}
                                                            onChange={e => handleTeacherSettingsUpdate({ availabilityStatus: e.target.value as any })}
                                                            className="text-xs border border-gray-200 bg-white p-2 rounded-lg outline-none"
                                                        >
                                                            {['Available Immediately', 'Available in 15 Days', 'Available in 30 Days', 'Not Currently Available'].map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Visibility Setting</label>
                                                        <select
                                                            value={teacherSettings.visibilitySetting}
                                                            onChange={e => handleTeacherSettingsUpdate({ visibilitySetting: e.target.value as any })}
                                                            className="text-xs border border-gray-200 bg-white p-2 rounded-lg outline-none"
                                                        >
                                                            {['Public', 'Followers Only', 'Institutions Only'].map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Filters list */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <FaFilter className="text-xs text-[var(--color-primary)]" /> Advanced Filter
                                        </h3>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={resetFilters}
                                                className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                                            >
                                                <FaTimes /> Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3.5">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Subject</label>
                                            <select
                                                value={filterSubject}
                                                onChange={e => setFilterSubject(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'General', 'Special Education'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Board Type</label>
                                            <select
                                                value={filterBoard}
                                                onChange={e => setFilterBoard(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['All Boards', 'CBSE', 'ICSE', 'State Board'].map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Grade Level</label>
                                            <select
                                                value={filterGrade}
                                                onChange={e => setFilterGrade(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['All Levels', 'Primary', 'Middle School', 'High School'].map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Employment Type</label>
                                            <select
                                                value={filterType}
                                                onChange={e => setFilterType(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['All Types', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Experience Required</label>
                                            <select
                                                value={filterExp}
                                                onChange={e => setFilterExp(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['Any Experience', 'Fresher', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'].map(e => (
                                                    <option key={e} value={e}>{e}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black text-gray-500 uppercase">Salary Range</label>
                                            <select
                                                value={filterSalary}
                                                onChange={e => setFilterSalary(e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none"
                                            >
                                                {['Any Salary', '₹10k–₹20k', '₹20k–₹40k', '₹40k–₹80k'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </aside>

                            {/* Column 2: Dashboard Content feeds (Col 8) */}
                            <section className="lg:col-span-8 flex flex-col gap-4">

                                {/* Search input block */}
                                <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center gap-2 px-3 py-1 border-r border-gray-100">
                                        <FaSearch className="text-gray-400 text-xs flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by role, subject, or institution..."
                                            className="w-full text-xs outline-none py-2 bg-transparent text-gray-700 placeholder-gray-400"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="text-gray-300 hover:text-gray-500">
                                                <FaTimes />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 px-3 py-1">
                                        <FaMapMarkerAlt className="text-gray-400 text-xs flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={locationQuery}
                                            onChange={e => setLocationQuery(e.target.value)}
                                            placeholder="Search by city, state, or 'Remote'..."
                                            className="w-full text-xs outline-none py-2 bg-transparent text-gray-700 placeholder-gray-400"
                                        />
                                        {locationQuery && (
                                            <button onClick={() => setLocationQuery('')} className="text-gray-300 hover:text-gray-500">
                                                <FaTimes />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs Toolbar */}
                                <div className="flex items-center justify-between gap-4 flex-wrap border-b border-gray-200 pb-2">
                                    <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                                        {([
                                            { key: 'all', label: 'All Jobs' },
                                            { key: 'recommended', label: 'Smart Matches' },
                                            { key: 'saved', label: `Saved (${savedJobIds.length})` },
                                            { key: 'applied', label: 'My Applications' }
                                        ] as const).map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`text-xs font-bold px-4 py-2.5 transition ${activeTab === tab.key
                                                        ? 'bg-[var(--color-primary)] text-white'
                                                        : 'text-gray-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        <strong className="text-gray-700">{filteredJobs.length}</strong> listings found
                                    </span>
                                </div>

                                {/* Job grid listing */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredJobs.map((job) => {
                                        const isSaved = savedJobIds.includes(job.id);
                                        const hasApplied = applications.some(a => a.jobId === job.id && a.teacherId === DUMMY_TEACHER_ID);
                                        const matchRating = teacherSettings ? calculateMatchScore(job, teacherSettings).score : null;

                                        return (
                                            <motion.div
                                                key={job.id}
                                                whileHover={{ y: -2 }}
                                                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition relative overflow-hidden"
                                            >
                                                {job.isFeatured && (
                                                    <div className="absolute top-0 right-0">
                                                        <span className="bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-secondary)] text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                                                            Featured
                                                        </span>
                                                    </div>
                                                )}

                                                <div>
                                                    {/* Row 1: School Badge & Bookmark */}
                                                    <div className="flex items-start justify-between gap-3 mb-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-2xs flex-shrink-0"
                                                                style={{ backgroundColor: job.schoolColor }}
                                                            >
                                                                {job.schoolInitial}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-xs sm:text-sm leading-snug line-clamp-1">{job.title}</h4>
                                                                <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                                                                    <span className="text-[10px] font-bold truncate max-w-[130px]">{job.school}</span>
                                                                    {job.isVerified && <MdVerified className="text-[var(--color-primary)] text-xs flex-shrink-0" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleToggleSave(job.id)}
                                                            className="p-1 text-gray-300 hover:text-[var(--color-secondary)] transition flex-shrink-0"
                                                        >
                                                            {isSaved ? <FaBookmark className="text-[var(--color-secondary)]" /> : <FaRegBookmark />}
                                                        </button>
                                                    </div>

                                                    {/* Row 2: Tag Pills & matching badge */}
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {job.tags.slice(0, 3).map((tag, idx) => (
                                                            <span key={idx} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {matchRating !== null && (
                                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-100">
                                                                {matchRating}% Match
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Row 3: Meta details */}
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-slate-50 pt-2.5 pb-2 text-[11px] text-gray-500">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <MdLocationOn className="text-gray-400 text-xs flex-shrink-0" />
                                                            <span>{job.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <FaRupeeSign className="text-amber-500 text-xs flex-shrink-0" />
                                                            <span>{job.salary}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <FaBriefcase className="text-gray-400 text-xs flex-shrink-0" />
                                                            <span>{job.experience} Exp</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <FaClock className="text-gray-400 text-xs flex-shrink-0" />
                                                            <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Apply button */}
                                                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {job.applicants} applied
                                                    </span>
                                                    {hasApplied ? (
                                                        <button
                                                            disabled
                                                            className="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1"
                                                        >
                                                            <FaCheckCircle className="text-emerald-500" /> Applied
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleApplyClick(job)}
                                                            className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-2xs hover:shadow transition flex items-center gap-1"
                                                        >
                                                            <HiLightningBolt /> Apply
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {filteredJobs.length === 0 && (
                                        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center shadow-2xs">
                                            <FaBriefcase className="mx-auto text-4xl text-slate-200 mb-3" />
                                            <h4 className="font-bold text-gray-700 text-sm">No Jobs Found</h4>
                                            <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">Try broadening your subject filter or updating your preferred city keywords.</p>
                                        </div>
                                    )}
                                </div>

                            </section>

                        </div>

                    </div>
                )}

                {/* --- RECRUITER (INSTITUTION) MODE --- */}
                {viewMode === 'institution' && (
                    <div className="flex flex-col gap-6">

                        {/* Analytics summary counter */}
                        <AnalyticsPanel role="institution" userId={DUMMY_INSTITUTION_ID} />

                        {/* Recruiter Tabs row */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 flex-wrap gap-4">
                            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                                <button
                                    onClick={() => setInstTab('active-postings')}
                                    className={`text-xs font-bold px-4 py-2.5 transition ${instTab === 'active-postings' ? 'bg-[var(--color-secondary)] text-white' : 'text-gray-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Active Job Postings ({jobs.length})
                                </button>
                                <button
                                    onClick={() => setInstTab('applicants')}
                                    className={`text-xs font-bold px-4 py-2.5 transition ${instTab === 'applicants' ? 'bg-[var(--color-secondary)] text-white' : 'text-gray-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Applicant Tracking ({applications.length})
                                </button>
                                <button
                                    onClick={() => setInstTab('hiring-settings')}
                                    className={`text-xs font-bold px-4 py-2.5 transition ${instTab === 'hiring-settings' ? 'bg-[var(--color-secondary)] text-white' : 'text-gray-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Hiring Status Controls
                                </button>
                            </div>

                            {instTab === 'active-postings' && (
                                <button
                                    onClick={() => { setEditingJob(null); setShowJobCreator(true); }}
                                    className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition duration-200"
                                >
                                    <FaPlus /> Post a Job
                                </button>
                            )}
                        </div>

                        {/* TAB 1: ACTIVE POSTINGS */}
                        {instTab === 'active-postings' && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold">
                                                <th className="p-3.5">Job Title</th>
                                                <th className="p-3.5">Subject</th>
                                                <th className="p-3.5">Experience</th>
                                                <th className="p-3.5">Openings</th>
                                                <th className="p-3.5">Applicants</th>
                                                <th className="p-3.5">Deadline</th>
                                                <th className="p-3.5 text-center">Status</th>
                                                <th className="p-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                            {jobs.map(job => (
                                                <tr key={job.id} className="hover:bg-slate-50/50">
                                                    <td className="p-3.5 font-bold text-gray-800">{job.title}</td>
                                                    <td className="p-3.5 text-gray-600">{job.subject}</td>
                                                    <td className="p-3.5 text-gray-500">{job.experience}</td>
                                                    <td className="p-3.5 text-center text-gray-700">{job.openPositions}</td>
                                                    <td className="p-3.5 text-center text-[var(--color-primary)] font-bold">{job.applicants}</td>
                                                    <td className="p-3.5 text-gray-500">{new Date(job.deadline).toLocaleDateString()}</td>
                                                    <td className="p-3.5 text-center">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right space-x-1.5">
                                                        <button
                                                            onClick={() => handlePauseJob(job)}
                                                            className="text-2xs font-bold text-gray-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded"
                                                        >
                                                            {job.status === 'paused' ? 'Resume' : 'Pause'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingJob(job); setShowJobCreator(true); }}
                                                            className="text-2xs font-bold text-[var(--color-primary)] hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteJob(job.id)}
                                                            className="text-2xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {jobs.length === 0 && (
                                                <tr>
                                                    <td colSpan={8} className="p-8 text-center text-gray-400">No jobs posted yet. Click &ldquo;Post a Job&rdquo; to begin recruiting.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: APPLICANT TRACKING BOARD */}
                        {instTab === 'applicants' && (
                            <div className="flex flex-col gap-4">
                                {/* Search & filter criteria */}
                                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex gap-3 flex-wrap items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xs font-bold text-gray-500 uppercase">Status:</span>
                                        <select
                                            value={applicantStatusFilter}
                                            onChange={e => setApplicantStatusFilter(e.target.value)}
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none"
                                        >
                                            {['All Statuses', 'Applied', 'Viewed', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'].map(st => (
                                                <option key={st} value={st}>{st}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xs font-bold text-gray-500 uppercase">Experience:</span>
                                        <select
                                            value={applicantExpFilter}
                                            onChange={e => setApplicantExpFilter(e.target.value)}
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none"
                                        >
                                            {['Any Experience', 'Fresher', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'].map(ex => (
                                                <option key={ex} value={ex}>{ex}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xs font-bold text-gray-500 uppercase">Subject:</span>
                                        <select
                                            value={applicantSubjectFilter}
                                            onChange={e => setApplicantSubjectFilter(e.target.value)}
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none"
                                        >
                                            {['All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'General', 'Special Education'].map(su => (
                                                <option key={su} value={su}>{su}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Applicant Grid board */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {filteredApplicants.map(app => (
                                        <div
                                            key={app.id}
                                            onClick={() => setSelectedApplicationId(app.id)}
                                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2.5 mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-xs sm:text-sm">{app.teacherName}</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium">{app.teacherEmail}</p>
                                                    </div>
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-50 text-[var(--color-primary)] border border-blue-100 flex-shrink-0">
                                                        {app.matchScore}% Match
                                                    </span>
                                                </div>

                                                <div className="border-t border-slate-50 pt-2 pb-1 text-2xs space-y-1 text-gray-500">
                                                    <div><strong>Job Title:</strong> {app.jobTitle}</div>
                                                    <div><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${app.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                                                        app.status === 'Interview Scheduled' ? 'bg-purple-100 text-purple-700' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                                <span className="text-[9px] text-[var(--color-primary)] hover:underline font-bold flex items-center gap-0.5">
                                                    Open Profile <FaArrowRight className="text-3xs" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredApplicants.length === 0 && (
                                        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center shadow-2xs">
                                            <FaUserTie className="mx-auto text-4xl text-slate-200 mb-3" />
                                            <h4 className="font-bold text-gray-700 text-sm">No Applicants Found</h4>
                                            <p className="text-xs text-gray-400 mt-1">Adjust filters or check back later as educators submit files.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: HIRING STATUS SETTINGS */}
                        {instTab === 'hiring-settings' && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-xl">
                                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <FaBuilding className="text-[var(--color-secondary)]" /> Recruiter Branding Details
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                    Set your current school status to control badge colors on listings and alert followers regarding hiring campaigns.
                                </p>

                                {institutionSettings && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Hiring Status Badge</span>
                                            <div className="grid grid-cols-2 gap-3.5">
                                                {([
                                                    { key: 'Actively Hiring', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                                                    { key: 'Hiring Soon', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                                                    { key: 'Position Filled', color: 'border-slate-200 bg-slate-50 text-slate-700' },
                                                    { key: 'Recruitment Closed', color: 'border-red-200 bg-red-50 text-red-700' }
                                                ] as const).map(badge => (
                                                    <button
                                                        key={badge.key}
                                                        onClick={() => handleInstitutionHiringUpdate(badge.key)}
                                                        className={`p-3 text-xs font-bold border rounded-xl text-center transition-all ${institutionSettings.hiringStatus === badge.key
                                                                ? `${badge.color} border-2 shadow-sm`
                                                                : 'border-gray-200 hover:bg-slate-50 text-gray-600'
                                                            }`}
                                                    >
                                                        {badge.key}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}

            </main>

            <Footer />

            {/* ── POPUPS & MODALS ── */}

            {/* Quick Apply Confirmation Modal */}
            <AnimatePresence>
                {applyingJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100 space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 text-sm sm:text-base">Confirm Job Application</h3>
                                <button onClick={() => setApplyingJob(null)} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <div className="text-xs font-bold text-gray-700 leading-snug">{applyingJob.title}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{applyingJob.school} • {applyingJob.location}</div>
                            </div>

                            {/* Resume attachment verify */}
                            <div className="flex items-center justify-between text-2xs p-2 border border-green-100 bg-green-50/50 rounded-lg">
                                <span className="flex items-center gap-1.5 text-green-700 font-semibold">
                                    <FaCheckCircle /> Attachment: {resumeData?.fileName}
                                </span>
                                <span className="text-gray-400 font-medium">Strength: {resumeData?.strengthScore}%</span>
                            </div>

                            {/* Optional Cover letter text */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Optional Cover Letter</label>
                                <textarea
                                    value={coverLetterInput}
                                    onChange={e => setCoverLetterInput(e.target.value)}
                                    placeholder="Introduce yourself, e.g. Dear hiring manager, I am passionate about High School Calculus teaching..."
                                    rows={3}
                                    className="text-xs border border-gray-200 rounded-lg p-2 Outline-none resize-none focus:border-[var(--color-primary)] transition bg-slate-50/50"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
                                <button
                                    onClick={() => setApplyingJob(null)}
                                    className="font-bold text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApply}
                                    className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold px-5 py-2 rounded-lg shadow-sm transition"
                                >
                                    Submit Application
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Job Creator modal */}
            <JobCreatorModal
                isOpen={showJobCreator}
                editingJob={editingJob}
                onClose={() => { setShowJobCreator(false); setEditingJob(null); }}
                onJobCreated={loadData}
            />

            {/* Recruiter Review modal */}
            {selectedApplicationId && (
                <ApplicantDetailsModal
                    isOpen={!!selectedApplicationId}
                    applicationId={selectedApplicationId}
                    onClose={() => setSelectedApplicationId(null)}
                    onStatusChanged={loadData}
                />
            )}

            {/* Notification Drawer panel */}
            <NotificationCenter
                isOpen={showNotifications}
                userId={viewMode === 'teacher' ? DUMMY_TEACHER_ID : DUMMY_INSTITUTION_ID}
                onClose={() => setShowNotifications(false)}
                unreadCountChange={setUnreadNotifsCount}
            />

        </div>
    );
}
