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
    FaArrowRight, FaSchool, FaChartLine, FaChevronUp, FaChevronDown,
    FaChartBar, FaLightbulb, FaCalendarCheck, FaStar, FaVideo, FaFireAlt,
    FaFilePdf, FaFileWord, FaDownload
} from 'react-icons/fa';
import { MdWork, MdVerified, MdLocationOn, MdTrendingUp } from 'react-icons/md';
import { HiLightningBolt } from 'react-icons/hi';
import { IoMdTrendingUp } from 'react-icons/io';
import { BiTargetLock } from 'react-icons/bi';
import { Variants } from 'framer-motion';
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


    // Modal Triggers
    const [showJobCreator, setShowJobCreator] = useState(false);
    const [showResumePreview, setShowResumePreview] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
    const [applyingJob, setApplyingJob] = useState<Job | null>(null);

    // Application Cover Letter Input
    const [coverLetterInput, setCoverLetterInput] = useState('');
    const [alertEmail, setAlertEmail] = useState('');

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
        let list = jobs.filter(j => j.status === 'active' || !j.status);

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
    function calculateMatchScore(job: Job, settings: TeacherSettings) {
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
    }

    if (roleLoading) {
        return <LoadingScreen message="Verifying profile access..." />;
    }

    // ─── Animation Variants ───
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 18 },
        visible: (i = 0) => ({
            opacity: 1, y: 0,
            transition: { delay: i * 0.06, duration: 0.42, ease: 'easeOut' },
        }),
    };

    // ─── Reusable Sub-components ───
    const FilterSection = ({ title, children, defaultOpen = true }: {
        title: string; children: React.ReactNode; defaultOpen?: boolean;
    }) => {
        const [open, setOpen] = useState(defaultOpen);
        return (
            <div className="border-b border-gray-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                <button
                    onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between text-[13px] font-semibold text-[var(--color-primary)] mb-2"
                >
                    {title}
                    {open ? <FaChevronUp className="text-[10px] opacity-50" /> : <FaChevronDown className="text-[10px] opacity-50" />}
                </button>
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const FilterChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => {
        return (
            <button
                onClick={onClick}
                className={`text-2xs px-2.5 py-1 rounded-full border font-bold transition-all duration-200 mb-1 mr-1 ${selected
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                    }`}
            >
                {label}
            </button>
        );
    };

    const RightPanelCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:shadow-sm transition duration-300 ${className}`}>
                {children}
            </div>
        );
    };

    const RightPanelTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
        return (
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[var(--color-primary)] text-sm">{icon}</span>
                <h3 className="text-[12px] font-bold text-[var(--color-primary)] uppercase tracking-wider">{title}</h3>
            </div>
        );
    };

    const JobCard = ({ job, index, saved, hasApplied, matchRating, onToggleSave, onApplyClick }: {
        job: Job; index: number; saved: boolean; hasApplied: boolean; matchRating: number | null; onToggleSave: (id: string) => void; onApplyClick: (job: Job) => void;
    }) => {
        const schoolInitial = job.schoolInitial || job.school.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
        const getSchoolColor = (name: string) => {
            const colors = ['#1e40af', '#0d9488', '#b45309', '#7c3aed', '#dc2626', '#0891b2', '#059669', '#e11d48'];
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % colors.length;
            return colors[index];
        };
        const schoolColor = job.schoolColor || getSchoolColor(job.school);

        return (
            <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={index}
                whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(20,60,100,0.06)' }}
                transition={{ type: 'spring', stiffness: 280 }}
                className={`bg-white rounded-xl border p-4 flex flex-col justify-between gap-3.5 cursor-pointer relative overflow-hidden shadow-2xs hover:shadow-md transition duration-300 ${job.isFeatured ? 'border-[var(--color-primary)]/20' : 'border-gray-200'}`}
            >
                {job.isFeatured && (
                    <div className="absolute top-0 right-0 z-10">
                        <div className="bg-gradient-to-l from-[var(--color-primary)] to-[#1e5a9a] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl tracking-widest uppercase">
                            ⭐ Featured
                        </div>
                    </div>
                )}

                <div>
                    {/* Header: Logo + Title + Bookmark */}
                    <div className="flex items-start gap-3 justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-2xs"
                                style={{ backgroundColor: schoolColor }}
                            >
                                {schoolInitial}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-1">
                                    {job.title}
                                </h3>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[11px] text-gray-500 font-semibold truncate max-w-[130px]">{job.school}</span>
                                    {job.isVerified && <MdVerified className="text-[var(--color-primary)] text-xs flex-shrink-0" />}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={e => { e.stopPropagation(); onToggleSave(job.id); }}
                            className="flex-shrink-0 text-gray-300 hover:text-[var(--color-secondary)] transition p-1"
                        >
                            {saved
                                ? <FaBookmark className="text-[var(--color-secondary)] text-sm" />
                                : <FaRegBookmark className="text-gray-300 hover:text-[var(--color-secondary)] text-sm transition-colors" />
                            }
                        </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {job.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                                {tag}
                            </span>
                        ))}
                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-[var(--color-secondary)] border border-green-100">
                            {job.jobType}
                        </span>
                        {matchRating !== null && (
                            <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {matchRating}% Match
                            </span>
                        )}
                    </div>

                    {/* Meta details */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-slate-50 pt-2.5 text-[11px] text-gray-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <MdLocationOn className="text-gray-400 text-xs flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <FaRupeeSign className="text-amber-500 text-xs flex-shrink-0" />
                            <span className="truncate">{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <FaBriefcase className="text-gray-400 text-xs flex-shrink-0" />
                            <span className="truncate">{job.experience}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <FaGraduationCap className="text-purple-500 text-xs flex-shrink-0" />
                            <span className="truncate">{job.qualification}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Apply Button */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                            <FaClock className="text-[10px]" />{job.postedDate || 'Active'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                            <FaUserTie className="text-[10px]" />{job.applicants} applied
                        </span>
                    </div>
                    {hasApplied ? (
                        <button
                            disabled
                            className="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1"
                        >
                            <FaCheckCircle className="text-emerald-500" /> Applied
                        </button>
                    ) : (
                        <button 
                            onClick={e => { e.stopPropagation(); onApplyClick(job); }}
                            className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                            <HiLightningBolt className="text-[11px]" /> Apply
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    const FiltersColumn = () => (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                    <FaFilter className="text-[var(--color-primary)] text-sm" />
                    <span className="text-[13px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Search Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-[var(--color-secondary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                        <FaTimes /> Reset
                    </button>
                )}
            </div>

            <FilterSection title="Subject">
                <div className="flex flex-wrap gap-1">
                    {['All Subjects', 'Mathematics', 'Physics', 'English', 'Biology', 'Chemistry', 'Computer Science', 'General', 'Special Education'].map(s => (
                        <FilterChip key={s} label={s === 'All Subjects' ? 'All' : s} selected={filterSubject === s} onClick={() => setFilterSubject(s)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Board Type">
                <div className="flex flex-wrap gap-1">
                    {['All Boards', 'CBSE', 'ICSE', 'State Board'].map(b => (
                        <FilterChip key={b} label={b === 'All Boards' ? 'All' : b} selected={filterBoard === b} onClick={() => setFilterBoard(b)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Grade Level">
                <div className="flex flex-wrap gap-1">
                    {['All Levels', 'Primary', 'Middle School', 'High School'].map(g => (
                        <FilterChip key={g} label={g === 'All Levels' ? 'All' : g} selected={filterGrade === g} onClick={() => setFilterGrade(g)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Experience">
                <div className="flex flex-wrap gap-1">
                    {['Any Experience', 'Fresher', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'].map(e => (
                        <FilterChip key={e} label={e === 'Any Experience' ? 'Any' : e} selected={filterExp === e} onClick={() => setFilterExp(e)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Salary Range">
                <div className="flex flex-wrap gap-1">
                    {['Any Salary', '₹10k–₹20k', '₹20k–₹40k', '₹40k–₹80k'].map(s => (
                        <FilterChip key={s} label={s === 'Any Salary' ? 'Any' : s} selected={filterSalary === s} onClick={() => setFilterSalary(s)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Employment Type">
                <div className="flex flex-wrap gap-1">
                    {['All Types', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'].map(t => (
                        <FilterChip key={t} label={t === 'All Types' ? 'All' : t} selected={filterType === t} onClick={() => setFilterType(t)} />
                    ))}
                </div>
            </FilterSection>

            {/* Job Alert mini-CTA */}
            <div className="rounded-xl p-4 text-center select-none shadow-sm" style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))' }}>
                <FaBell className="mx-auto text-lg text-white/80 mb-1" />
                <p className="text-[12px] font-bold text-white">Never Miss a Role</p>
                <p className="text-xs text-white/60 mt-0.5 font-medium">Get email alerts for these filters</p>
                <button 
                    onClick={() => {
                        toast.info("Notifications configured for your preferences.");
                    }}
                    className="mt-2.5 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                    Set Job Alerts
                </button>
            </div>
        </div>
    );

    const RightPanel = () => {
        const baseScore = resumeData ? 60 : 20;
        const completePercent = teacherSettings?.openToWork ? baseScore + 20 : baseScore;

        const profileSteps = [
            { label: 'Basic Info Completed', done: !!DUMMY_TEACHER_ID },
            { label: 'Resume Uploaded', done: !!resumeData },
            { label: 'Hiring Settings preference', done: !!teacherSettings },
            { label: 'Open to Work status', done: !!teacherSettings?.openToWork },
        ];

        return (
            <div className="flex flex-col gap-4">
                {/* 1. Profile Strength */}
                <RightPanelCard>
                    <RightPanelTitle icon={<BiTargetLock />} title="Profile Strength" />
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{completePercent}% Complete</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${completePercent >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {completePercent >= 80 ? 'Strong' : 'Needs Work'}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                        <motion.div
                            className="h-2 rounded-full"
                            style={{ background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${completePercent}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                        />
                    </div>
                    {/* Steps */}
                    <ul className="flex flex-col gap-1.5">
                        {profileSteps.map((step, i) => (
                            <li key={i} className="flex items-center gap-2">
                                {step.done
                                    ? <FaCheckCircle className="text-[var(--color-secondary)] text-xs flex-shrink-0" />
                                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0" />
                                }
                                <span className={`text-[11px] font-medium ${step.done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                    {step.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </RightPanelCard>

                {/* 2. Application Tracker */}
                <RightPanelCard>
                    <RightPanelTitle icon={<FaCalendarCheck />} title="Application Tracker" />
                    {applications.length === 0 ? (
                        <p className="text-2xs text-gray-400 italic">No applications filed yet.</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {applications.slice(0, 3).map((a) => {
                                const statusColor = 
                                    a.status === 'Shortlisted' ? 'bg-green-50 text-green-700 border-green-100' :
                                    a.status === 'Interview Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    a.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    a.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100';

                                return (
                                    <li
                                        key={a.id}
                                        className="flex items-center justify-between border border-gray-100 rounded-lg px-2.5 py-2 bg-gray-50/20"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-gray-700 truncate">{a.jobTitle || 'Teaching vacancy'}</p>
                                            <p className="text-[9px] text-gray-400 truncate">{a.schoolName || 'Institutions Group'}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${statusColor}`}>
                                            {a.status}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <button 
                        onClick={() => setActiveTab('applied')}
                        className="mt-2 w-full text-[10px] text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                        View all applications <FaArrowRight className="text-3xs" />
                    </button>
                </RightPanelCard>

                {/* 3. Salary Insights */}
                <RightPanelCard>
                    <RightPanelTitle icon={<FaChartBar />} title="Salary Insights" />
                    <p className="text-[9px] text-gray-400 -mt-1 mb-2">Average monthly teaching pay scale</p>
                    <ul className="flex flex-col gap-2.5">
                        {[
                            { subject: 'Mathematics', avg: '₹48K', trend: '+12%', up: true },
                            { subject: 'Computer Science', avg: '₹52K', trend: '+18%', up: true },
                            { subject: 'Physics', avg: '₹42K', trend: '+8%', up: true },
                            { subject: 'English', avg: '₹36K', trend: '-3%', up: false }
                        ].map((s, i) => (
                            <li key={i}>
                                <div className="flex items-center justify-between mb-0.5 text-[11px]">
                                    <span className="font-semibold text-gray-600">{s.subject}</span>
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <span className="text-[var(--color-primary)]">{s.avg}</span>
                                        <span className={`text-[10px] ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                                            {s.up ? '↑' : '↓'} {s.trend}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden font-semibold">
                                    <motion.div
                                        className="h-1 rounded-full bg-[var(--color-primary)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${40 + i * 15}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </RightPanelCard>

                {/* 4. Trending searches */}
                <RightPanelCard>
                    <RightPanelTitle icon={<FaFireAlt />} title="Trending Now" />
                    <div className="flex flex-col gap-1">
                        {['Mathematics CBSE', 'English Teacher', 'Primary Montessori', 'Physics PGT', 'Computer Science'].map((term, i) => (
                            <button
                                key={i}
                                onClick={() => setSearchQuery(term)}
                                className="flex items-center gap-2 text-left text-2xs text-gray-600 hover:text-[var(--color-primary)] font-bold py-1 border-b border-gray-50 last:border-0 transition-colors group"
                            >
                                <span className="text-gray-300 w-3">#{i + 1}</span>
                                <FaSearch className="text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                                <span>{term}</span>
                            </button>
                        ))}
                    </div>
                </RightPanelCard>

                {/* 5. Top Hiring Schools */}
                <RightPanelCard>
                    <RightPanelTitle icon={<FaSchool />} title="Top Hiring Schools" />
                    <ul className="flex flex-col gap-2">
                        {[
                            { name: 'Delhi Public School', jobs: 12, color: 'var(--color-primary)', initial: 'DPS' },
                            { name: 'Ryan International', jobs: 8, color: 'var(--color-secondary)', initial: 'RIS' },
                            { name: 'Kendriya Vidyalaya', jobs: 21, color: '#b45309', initial: 'KV' }
                        ].map((sch, i) => (
                            <li
                                key={i}
                                onClick={() => setSearchQuery(sch.name)}
                                className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-slate-50 transition cursor-pointer group"
                            >
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
                                    style={{ backgroundColor: sch.color }}
                                >
                                    {sch.initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-gray-700 group-hover:text-[var(--color-primary)] transition-colors truncate">{sch.name}</p>
                                    <p className="text-[9px] text-gray-400">{sch.jobs} open positions</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </RightPanelCard>

                {/* 6. Career Tip */}
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg,#0f2a4a 0%,var(--color-primary) 50%,var(--color-secondary) 100%)' }}>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FaLightbulb className="text-amber-300 text-sm" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Career Tip</span>
                        </div>
                        <p className="text-[11px] font-medium text-white/90 leading-relaxed">
                            Schools prioritize candidates who update their profile and submit a <span className="text-amber-300 font-bold">digital resume</span>.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#eeeeee] text-gray-800 flex flex-col font-sans">
            <Navbar />

            {/* ── ROLE SWITCHER & NOTIFICATION BUTTON ROW ── */}
            <div className="bg-white border-b border-gray-200 py-3 px-4 shadow-2xs">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 flex-wrap">
                    {/* Switcher badge */}
                    {(userRole === 'super_admin' || userRole === 'institution' || userRole === 'institution_admin' || !userRole) && (
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

                </div>
            </div>

            {/* ── Page Header Banner ── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#0f2a4a 0%,var(--color-primary) 55%,var(--color-secondary) 100%)' }}
            >
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
                <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/[0.04] pointer-events-none" />

                <div className="max-w-[1440px] mx-auto px-4 py-7 md:py-10 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div>
                            <span className="inline-block bg-white/15 border border-white/25 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize tracking-widest mb-2">
                                🎓 Education Jobs Platform
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold oswald-font tracking-wide text-white flex items-center gap-2">
                                <MdWork className="text-2xl opacity-70" /> {viewMode === 'teacher' ? 'Find Your Teaching Career' : 'Recruitment Pipeline Controls'}
                            </h1>
                            <p className="text-white/65 text-sm mt-1 max-w-lg">
                                {viewMode === 'teacher' 
                                    ? 'Opportunities across CBSE, ICSE & State Board schools — built exclusively for educators.'
                                    : 'Manage active postings, review smart matches, and coordinate interview communications.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-center backdrop-blur-sm">
                                <p className="text-xl font-bold text-white oswald-font">{jobs.length}</p>
                                <p className="text-[11px] text-white/55">Active Jobs</p>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-center backdrop-blur-sm">
                                <p className="text-xl font-bold text-white oswald-font">{applications.length}</p>
                                <p className="text-[11px] text-white/55">Applicants</p>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-center backdrop-blur-sm">
                                <p className="text-xl font-bold text-white oswald-font">12K+</p>
                                <p className="text-[11px] text-white/55">Placements</p>
                            </div>
                        </div>
                    </div>

                    {/* Smart Search Bar (Teacher mode only) */}
                    {viewMode === 'teacher' && (
                        <div className="mt-5 bg-white rounded-lg shadow-xl p-1.5 flex flex-col sm:flex-row gap-1.5">
                            <div className="flex-1 flex items-center gap-2 px-4 py-1 border-r border-gray-200">
                                <FaSearch className="text-[var(--color-primary)] opacity-50 text-sm flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Job title, subject or school…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent py-1.5"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')}>
                                        <FaTimes className="text-xs text-gray-300 hover:text-gray-500" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 flex items-center gap-2 px-4 py-1">
                                <FaMapMarkerAlt className="text-[var(--color-secondary)] opacity-50 text-sm flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="City, state or 'Remote'…"
                                    value={locationQuery}
                                    onChange={e => setLocationQuery(e.target.value)}
                                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent py-1.5"
                                />
                                {locationQuery && (
                                    <button onClick={() => setLocationQuery('')}>
                                        <FaTimes className="text-xs text-gray-300 hover:text-gray-500" />
                                    </button>
                                )}
                            </div>
                            <button className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2 shadow-md flex-shrink-0">
                                <FaSearch /> Search
                            </button>
                        </div>
                    )}

                    {/* Quick pills (Teacher mode only) */}
                    {viewMode === 'teacher' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {['Mathematics', 'Physics', 'English', 'Biology', 'Computer Science', 'Chemistry'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterSubject(s)}
                                    className={`text-[11px] border px-3 py-1 rounded-full transition-all ${filterSubject === s
                                        ? 'bg-white text-[var(--color-primary)] font-bold border-white'
                                        : 'text-white/75 border-white/25 hover:text-white hover:border-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── School CTA ── */}
            <div className="max-w-[1440px] mx-auto px-4 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
                    className="rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 gap-3 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white flex-shrink-0">
                            <FaSchool className="text-base" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[var(--color-primary)] capitalize tracking-wider">{viewMode === 'teacher' ? 'For Institution' : 'For Recruiters'}</p>
                            <p className="text-[13px] text-gray-600">
                                {viewMode === 'teacher' 
                                    ? 'Post a vacancy and connect with 50,000+ qualified teachers instantly.' 
                                    : 'Need to list a new job opening? Create and publish a vacancy now.'}
                            </p>
                        </div>
                    </div>
                    {viewMode === 'teacher' ? (
                        <button 
                            onClick={() => {
                                if (userRole === 'super_admin' || userRole === 'institution' || userRole === 'institution_admin' || !userRole) {
                                    setViewMode('institution');
                                } else {
                                    toast.info("Recruiter profile view is only accessible to institutions.");
                                }
                            }}
                            className="bg-[var(--color-secondary)] hover:bg-[#0d3812] text-white text-[13px] font-semibold px-5 py-2 rounded-lg flex items-center gap-2 flex-shrink-0 transition-colors"
                        >
                            <MdWork /> Switch to Recruiter <FaArrowRight className="text-xs" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowJobCreator(true)}
                            className="bg-[var(--color-secondary)] hover:bg-[#0d3812] text-white text-[13px] font-semibold px-5 py-2 rounded-lg flex items-center gap-2 flex-shrink-0 transition-colors"
                        >
                            <FaPlus /> Create Job Vacancy <FaArrowRight className="text-xs" />
                        </button>
                    )}
                </motion.div>
            </div>

            {/* ══ Main Column Layout ══ */}
            <main className="max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex-1">
                {viewMode === 'teacher' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6 items-start">
                        {/* Column 1: Filters Panel & Settings (Left Sidebar) */}
                        <aside className="hidden xl:flex flex-col gap-5 sticky top-24 self-start max-h-[calc(100vh-10rem)] sidebar-scroll pr-1 rounded-lg">
                            {/* Resume Upload card */}
                            <ResumeUpload 
                                teacherId={DUMMY_TEACHER_ID} 
                                onResumeChange={loadData} 
                                showPreview={showResumePreview} 
                                onPreviewClick={() => setShowResumePreview(!showResumePreview)} 
                            />

                            {/* Open-to-work toggle card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                                    <FaUserEdit className="text-lg text-[var(--color-secondary)]" /> Availability Settings
                                </h3>
                                {teacherSettings && (
                                    <div className="space-y-4">
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

                            {/* Filters Panel */}
                            <FiltersColumn />
                        </aside>

                        {/* Column 2: Dashboard Content feeds (Job results) */}
                        <div className="min-w-0 flex flex-col gap-4">
                            {/* Toolbar (Tabs Selection) */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    {([
                                        { key: 'all', label: 'All Jobs', icon: <MdWork /> },
                                        { key: 'recommended', label: 'Smart Matches', icon: <IoMdTrendingUp /> },
                                        { key: 'saved', label: `Saved (${savedJobIds.length})`, icon: <FaBookmark /> },
                                        { key: 'applied', label: 'Applied', icon: <FaCheckCircle /> }
                                    ] as const).map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-[13px] font-semibold transition-colors ${activeTab === tab.key
                                                ? 'bg-[var(--color-primary)] text-white font-bold'
                                                : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{tab.icon}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    {filteredJobs.length} listings found
                                </span>
                            </div>

                            {/* Job cards list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredJobs.map((job, idx) => {
                                    const isSaved = savedJobIds.includes(job.id);
                                    const hasApplied = applications.some(a => a.jobId === job.id && a.teacherId === DUMMY_TEACHER_ID);
                                    const matchRating = teacherSettings ? calculateMatchScore(job, teacherSettings).score : null;

                                    return (
                                        <JobCard 
                                            key={job.id}
                                            job={job}
                                            index={idx}
                                            saved={isSaved}
                                            hasApplied={hasApplied}
                                            matchRating={matchRating}
                                            onToggleSave={handleToggleSave}
                                            onApplyClick={handleApplyClick}
                                        />
                                    );
                                })}

                                {filteredJobs.length === 0 && (
                                    <div className="col-span-1 sm:col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center shadow-2xs">
                                        <FaBriefcase className="mx-auto text-4xl text-slate-200 mb-3 animate-pulse" />
                                        <h4 className="font-bold text-gray-700 text-sm">No Jobs Found</h4>
                                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">We couldn&apos;t find any roles matching your current search filters. Try adjusting your query or resetting the filters.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 3: Right Sidebar panel */}
                        <aside className="hidden xl:flex flex-col gap-5 sticky top-24 self-start max-h-[calc(100vh-10rem)] sidebar-scroll pl-1 rounded-lg">
                            <RightPanel />
                        </aside>
                    </div>
                ) : (
                    // Recruiter Dashboard View (Original Recruiter Dashboard)
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
                                                    <td className="p-3.5 text-right space-x-1.5 font-semibold">
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
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none font-semibold"
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
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none font-semibold"
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
                                            className="text-xs border border-gray-200 rounded p-1 bg-white outline-none font-semibold"
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
                                            <FaUserTie className="mx-auto text-4xl text-slate-200 mb-3 animate-pulse" />
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
                                <p className="text-xs text-gray-400 mb-4 leading-relaxed font-semibold">
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



            {/* PDF Viewer Modal Overlay (Lifted to page root context for z-index containment resolution) */}
            <AnimatePresence>
                {showResumePreview && resumeData && resumeData.fileUrl && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
                        >
                            <div className="bg-slate-50 border-b border-gray-200 px-4.5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 bg-red-50 text-red-500 rounded flex items-center justify-center text-sm flex-shrink-0">
                                        {resumeData.fileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileWord className="text-blue-500" />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 truncate">{resumeData.fileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a 
                                        href={resumeData.fileUrl} 
                                        download={resumeData.fileName}
                                        className="text-xs font-bold text-gray-700 hover:text-[var(--color-primary)] px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs transition flex items-center gap-1.5"
                                    >
                                        <FaDownload /> Download
                                    </a>
                                    <button 
                                        onClick={() => setShowResumePreview(false)}
                                        className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 relative">
                                {resumeData.fileName.endsWith('.pdf') ? (
                                    <iframe 
                                        src={resumeData.fileUrl} 
                                        className="w-full h-full border-0"
                                        title="Resume Preview"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
                                        <FaFileWord className="text-5xl text-blue-500 mb-3" />
                                        <p className="text-sm font-bold text-gray-700">Preview not supported for Word files (.docx)</p>
                                        <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-normal">
                                            Inline previews are only available for PDF documents. Please download the file to view, or re-upload your resume as a PDF.
                                        </p>
                                        <a 
                                            href={resumeData.fileUrl} 
                                            download={resumeData.fileName}
                                            className="mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
                                        >
                                            Download Resume File
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
