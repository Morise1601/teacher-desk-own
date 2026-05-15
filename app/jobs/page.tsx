'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/app/shared/NavBar';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    FaSearch, FaMapMarkerAlt, FaBookmark, FaRegBookmark,
    FaBriefcase, FaClock, FaRupeeSign, FaFilter,
    FaChevronDown, FaChevronUp, FaTimes, FaGraduationCap,
    FaStar, FaBell, FaArrowRight, FaChalkboardTeacher,
    FaSchool, FaUserTie, FaCheckCircle, FaVideo,
    FaFireAlt, FaChartBar, FaLightbulb, FaUpload,
    FaCalendarCheck,
} from 'react-icons/fa';
import Footer from '@/app/shared/Footer';
import { MdWork, MdVerified, MdLocationOn, MdTrendingUp } from 'react-icons/md';
import { HiLightningBolt } from 'react-icons/hi';
import { IoMdTrendingUp } from 'react-icons/io';
import { BiTargetLock } from 'react-icons/bi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Job {
    id: number;
    title: string;
    school: string;
    schoolInitial: string;
    schoolColor: string;
    location: string;
    state: string;
    salary: string;
    salaryMin: number;
    experience: string;
    subject: string;
    qualification: string;
    board: string;
    jobType: string;
    gradeLevel: string;
    postedDate: string;
    postedDaysAgo: number;
    isVerified: boolean;
    isFeatured: boolean;
    rating: number;
    applicants: number;
    tags: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const allJobs: Job[] = [
    {
        id: 1, title: 'Senior Mathematics Teacher', school: 'Delhi Public School', schoolInitial: 'DPS',
        schoolColor: 'var(--color-primary)', location: 'New Delhi', state: 'Delhi', salary: '₹45,000 – ₹65,000',
        salaryMin: 45000, experience: '3–5 Years', subject: 'Mathematics',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: '2 days ago', postedDaysAgo: 2, isVerified: true, isFeatured: true,
        rating: 4.8, applicants: 38, tags: ['CBSE', 'Maths', 'Full-time'],
    },
    {
        id: 2, title: 'Physics Teacher (PGT)', school: 'Ryan International School', schoolInitial: 'RIS',
        schoolColor: 'var(--color-secondary)', location: 'Mumbai', state: 'Maharashtra', salary: '₹40,000 – ₹55,000',
        salaryMin: 40000, experience: '1–3 Years', subject: 'Physics',
        qualification: 'B.Ed', board: 'ICSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: '1 day ago', postedDaysAgo: 1, isVerified: true, isFeatured: false,
        rating: 4.5, applicants: 22, tags: ['ICSE', 'Physics', 'PGT'],
    },
    {
        id: 3, title: 'English Language Teacher', school: 'Kendriya Vidyalaya', schoolInitial: 'KV',
        schoolColor: '#b45309', location: 'Bangalore', state: 'Karnataka', salary: '₹30,000 – ₹45,000',
        salaryMin: 30000, experience: 'Fresher', subject: 'English',
        qualification: 'B.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'Middle School',
        postedDate: '3 days ago', postedDaysAgo: 3, isVerified: false, isFeatured: false,
        rating: 4.2, applicants: 56, tags: ['CBSE', 'English', 'Fresher'],
    },
    {
        id: 4, title: 'Computer Science Teacher', school: 'The Heritage School', schoolInitial: 'THS',
        schoolColor: '#7c3aed', location: 'Kolkata', state: 'West Bengal', salary: '₹35,000 – ₹50,000',
        salaryMin: 35000, experience: '1–3 Years', subject: 'Computer Science',
        qualification: 'B.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: 'Today', postedDaysAgo: 0, isVerified: true, isFeatured: true,
        rating: 4.6, applicants: 14, tags: ['CBSE', 'CS', 'Tech'],
    },
    {
        id: 5, title: 'Biology Teacher (TGT)', school: "St. Xavier's High School", schoolInitial: 'SXS',
        schoolColor: '#dc2626', location: 'Chennai', state: 'Tamil Nadu', salary: '₹28,000 – ₹40,000',
        salaryMin: 28000, experience: 'Fresher', subject: 'Biology',
        qualification: 'B.Ed', board: 'State Board', jobType: 'Full-time', gradeLevel: 'Middle School',
        postedDate: '5 days ago', postedDaysAgo: 5, isVerified: false, isFeatured: false,
        rating: 4.0, applicants: 31, tags: ['State Board', 'Biology', 'TGT'],
    },
    {
        id: 6, title: 'Montessori Primary Teacher', school: 'Little Flowers Montessori', schoolInitial: 'LFM',
        schoolColor: '#0891b2', location: 'Pune', state: 'Maharashtra', salary: '₹22,000 – ₹32,000',
        salaryMin: 22000, experience: 'Fresher', subject: 'General',
        qualification: 'Montessori', board: 'State Board', jobType: 'Full-time', gradeLevel: 'Primary',
        postedDate: '1 week ago', postedDaysAgo: 7, isVerified: true, isFeatured: false,
        rating: 4.7, applicants: 18, tags: ['Montessori', 'Primary', 'Full-time'],
    },
    {
        id: 7, title: 'Chemistry Teacher (Part-time)', school: 'Amity International School', schoolInitial: 'AIS',
        schoolColor: '#059669', location: 'Noida', state: 'Uttar Pradesh', salary: '₹20,000 – ₹30,000',
        salaryMin: 20000, experience: '1–3 Years', subject: 'Chemistry',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Part-time', gradeLevel: 'High School',
        postedDate: '4 days ago', postedDaysAgo: 4, isVerified: true, isFeatured: false,
        rating: 4.4, applicants: 9, tags: ['CBSE', 'Chemistry', 'Part-time'],
    },
    {
        id: 8, title: 'Special Education Teacher', school: 'Bloom International School', schoolInitial: 'BIS',
        schoolColor: '#e11d48', location: 'Hyderabad', state: 'Telangana', salary: '₹35,000 – ₹48,000',
        salaryMin: 35000, experience: '3–5 Years', subject: 'Special Education',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'Primary',
        postedDate: '6 days ago', postedDaysAgo: 6, isVerified: true, isFeatured: true,
        rating: 4.9, applicants: 7, tags: ['Special Ed', 'CBSE', 'Full-time'],
    },
];

// ─── Filter Options ────────────────────────────────────────────────────────────
const subjectOptions = ['All Subjects', 'Mathematics', 'Physics', 'English', 'Biology', 'Chemistry', 'Computer Science', 'General', 'Special Education'];
const boardOptions = ['All Boards', 'CBSE', 'ICSE', 'State Board'];
const qualificationOptions = ['All Qualifications', 'B.Ed', 'M.Ed', 'PhD', 'NET/SET', 'Montessori'];
const experienceOptions = ['Any Experience', 'Fresher', '1–3 Years', '3–5 Years', '5–10 Years', '10+ Years'];
const salaryOptions = ['Any Salary', '₹10k–₹20k', '₹20k–₹40k', '₹40k–₹80k'];
const jobTypeOptions = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const gradeLevelOptions = ['All Levels', 'Primary', 'Middle School', 'High School'];
const salaryRangeMap: Record<string, number> = { 'Any Salary': 0, '₹10k–₹20k': 10000, '₹20k–₹40k': 20000, '₹40k–₹80k': 40000 };

// ─── Right Panel Data ─────────────────────────────────────────────────────────
const trendingSearches = ['Mathematics CBSE', 'English Teacher', 'Primary Montessori', 'Physics PGT', 'Computer Science'];

const topSchools = [
    { name: 'Delhi Public School', jobs: 12, color: 'var(--color-primary)', initial: 'DPS' },
    { name: 'Ryan International', jobs: 8, color: 'var(--color-secondary)', initial: 'RIS' },
    { name: 'Kendriya Vidyalaya', jobs: 21, color: '#b45309', initial: 'KV' },
    { name: 'Amity International', jobs: 6, color: '#059669', initial: 'AIS' },
];

const salaryInsights = [
    { subject: 'Mathematics', avg: '₹48K', trend: '+12%', up: true },
    { subject: 'Computer Science', avg: '₹52K', trend: '+18%', up: true },
    { subject: 'Physics', avg: '₹42K', trend: '+8%', up: true },
    { subject: 'English', avg: '₹36K', trend: '-3%', up: false },
];

const appliedJobs = [
    { id: 1, title: 'Maths Teacher', school: 'DPS', status: 'Under Review', statusColor: 'bg-amber-100 text-amber-700' },
    { id: 2, title: 'Physics PGT', school: 'RIS', status: 'Shortlisted', statusColor: 'bg-green-100 text-[var(--color-secondary)]' },
    { id: 3, title: 'CS Teacher', school: 'THS', status: 'Interview Scheduled', statusColor: 'bg-blue-100 text-[var(--color-primary)]' },
];

const profileSteps = [
    { label: 'Basic Info', done: true },
    { label: 'Qualifications', done: true },
    { label: 'Work Experience', done: true },
    { label: 'Demo Video', done: false },
    { label: 'Resume Upload', done: false },
];

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.06, duration: 0.42, ease: 'easeOut' },
    }),
};

// ─── Reusable Sub-components ─────────────────────────────────────────────────

function FilterSection({ title, children, defaultOpen = true }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
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
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-200 mb-1 ${selected
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                }`}
        >
            {label}
        </button>
    );
}

function RightPanelCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function RightPanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[var(--color-primary)] text-sm">{icon}</span>
            <h3 className="text-[13px] font-bold text-[var(--color-primary)]">{title}</h3>
        </div>
    );
}

function JobCard({ job, index, saved, onToggleSave }: {
    job: Job; index: number; saved: boolean; onToggleSave: (id: number) => void;
}) {
    return (
        <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={index}
            whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(20,60,100,0.11)' }}
            transition={{ type: 'spring', stiffness: 280 }}
            className={`bg-white rounded-lg border p-4 flex flex-col gap-3 cursor-pointer relative overflow-hidden ${job.isFeatured ? 'border-[var(--color-primary)]/25 shadow-sm' : 'border-gray-200'}`}
        >
            {job.isFeatured && (
                <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-l from-[var(--color-primary)] to-[#1e5a9a] text-white text-xs font-bold px-3 py-0.5 rounded-bl-xl tracking-widest capitalize">
                        ⭐ Featured
                    </div>
                </div>
            )}

            {/* Header: Logo + Title + Bookmark */}
            <div className="flex items-start gap-3">
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: job.schoolColor }}
                >
                    {job.schoolInitial}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-800 leading-tight line-clamp-1">
                        {job.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[12px] text-gray-500 font-medium truncate">{job.school}</span>
                        {job.isVerified && <MdVerified className="text-[var(--color-primary)] text-[13px] flex-shrink-0" />}
                    </div>
                </div>
                <button
                    onClick={e => { e.stopPropagation(); onToggleSave(job.id); }}
                    className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                >
                    {saved
                        ? <FaBookmark className="text-[var(--color-secondary)] text-sm" />
                        : <FaRegBookmark className="text-gray-300 hover:text-[var(--color-secondary)] text-sm transition-colors" />
                    }
                </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-100">
                        {tag}
                    </span>
                ))}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-[var(--color-secondary)] border border-green-100">
                    {job.jobType}
                </span>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MdLocationOn className="text-[var(--color-secondary)] text-sm flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaRupeeSign className="text-amber-500 text-xs flex-shrink-0" />
                    <span className="truncate">{job.salary}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaBriefcase className="text-[var(--color-primary)] text-xs flex-shrink-0" />
                    <span>{job.experience}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FaGraduationCap className="text-purple-500 text-sm flex-shrink-0" />
                    <span>{job.qualification}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FaClock className="text-xs" />{job.postedDate}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FaUserTie className="text-xs" />{job.applicants} applied
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                        <FaStar className="text-xs" />{job.rating}
                    </span>
                </div>
                <button className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <HiLightningBolt className="text-xs" /> Apply
                </button>
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [savedJobs, setSavedJobs] = useState<number[]>([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'recommended'>('all');
    const [alertEmail, setAlertEmail] = useState('');
    const [alertSet, setAlertSet] = useState(false);

    // Filters
    const [filterSubject, setFilterSubject] = useState('All Subjects');
    const [filterBoard, setFilterBoard] = useState('All Boards');
    const [filterQual, setFilterQual] = useState('All Qualifications');
    const [filterExp, setFilterExp] = useState('Any Experience');
    const [filterSalary, setFilterSalary] = useState('Any Salary');
    const [filterType, setFilterType] = useState('All Types');
    const [filterGrade, setFilterGrade] = useState('All Levels');

    const activeFilterCount = [
        filterSubject !== 'All Subjects', filterBoard !== 'All Boards',
        filterQual !== 'All Qualifications', filterExp !== 'Any Experience',
        filterSalary !== 'Any Salary', filterType !== 'All Types',
        filterGrade !== 'All Levels',
    ].filter(Boolean).length;

    const resetFilters = () => {
        setFilterSubject('All Subjects'); setFilterBoard('All Boards');
        setFilterQual('All Qualifications'); setFilterExp('Any Experience');
        setFilterSalary('Any Salary'); setFilterType('All Types');
        setFilterGrade('All Levels');
    };

    const toggleSave = (id: number) =>
        setSavedJobs(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);

    const filteredJobs = useMemo(() => {
        let jobs = allJobs;
        if (activeTab === 'saved') jobs = jobs.filter(j => savedJobs.includes(j.id));
        if (activeTab === 'recommended') jobs = jobs.filter(j => j.isFeatured || j.rating >= 4.5);
        if (searchQuery) jobs = jobs.filter(j =>
            j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (locationQuery) jobs = jobs.filter(j =>
            j.location.toLowerCase().includes(locationQuery.toLowerCase()) ||
            j.state.toLowerCase().includes(locationQuery.toLowerCase())
        );
        if (filterSubject !== 'All Subjects') jobs = jobs.filter(j => j.subject === filterSubject);
        if (filterBoard !== 'All Boards') jobs = jobs.filter(j => j.board === filterBoard);
        if (filterQual !== 'All Qualifications') jobs = jobs.filter(j => j.qualification === filterQual);
        if (filterExp !== 'Any Experience') jobs = jobs.filter(j => j.experience === filterExp);
        if (filterType !== 'All Types') jobs = jobs.filter(j => j.jobType === filterType);
        if (filterGrade !== 'All Levels') jobs = jobs.filter(j => j.gradeLevel === filterGrade);
        if (filterSalary !== 'Any Salary') {
            const minSal = salaryRangeMap[filterSalary];
            jobs = jobs.filter(j => j.salaryMin >= minSal);
        }
        return jobs;
    }, [searchQuery, locationQuery, filterSubject, filterBoard, filterQual, filterExp, filterSalary, filterType, filterGrade, activeTab, savedJobs]);

    const profileCompletion = Math.round((profileSteps.filter(s => s.done).length / profileSteps.length) * 100);

    // ── Column 1: Filter Panel ───────────────
    const FiltersColumn = () => (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FaFilter className="text-[var(--color-primary)] text-sm" />
                    <span className="text-[13px] font-bold text-[var(--color-primary)]">Search Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-[var(--color-secondary)] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1">
                        <FaTimes className="text-xs" /> Reset
                    </button>
                )}
            </div>

            <FilterSection title="Subject">
                <div className="flex flex-wrap gap-1">
                    {subjectOptions.map(s => (
                        <FilterChip key={s} label={s === 'All Subjects' ? 'All' : s} selected={filterSubject === s} onClick={() => setFilterSubject(s)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Board Type">
                <div className="flex flex-wrap gap-1">
                    {boardOptions.map(b => (
                        <FilterChip key={b} label={b === 'All Boards' ? 'All' : b} selected={filterBoard === b} onClick={() => setFilterBoard(b)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Qualification">
                <div className="flex flex-wrap gap-1">
                    {qualificationOptions.map(q => (
                        <FilterChip key={q} label={q === 'All Qualifications' ? 'All' : q} selected={filterQual === q} onClick={() => setFilterQual(q)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Experience">
                <div className="flex flex-wrap gap-1">
                    {experienceOptions.map(e => (
                        <FilterChip key={e} label={e === 'Any Experience' ? 'Any' : e} selected={filterExp === e} onClick={() => setFilterExp(e)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Salary Range">
                <div className="flex flex-wrap gap-1">
                    {salaryOptions.map(s => (
                        <FilterChip key={s} label={s === 'Any Salary' ? 'Any' : s} selected={filterSalary === s} onClick={() => setFilterSalary(s)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Job Type">
                <div className="flex flex-wrap gap-1">
                    {jobTypeOptions.map(t => (
                        <FilterChip key={t} label={t === 'All Types' ? 'All' : t} selected={filterType === t} onClick={() => setFilterType(t)} />
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Grade Level" defaultOpen={false}>
                <div className="flex flex-wrap gap-1">
                    {gradeLevelOptions.map(g => (
                        <FilterChip key={g} label={g === 'All Levels' ? 'All' : g} selected={filterGrade === g} onClick={() => setFilterGrade(g)} />
                    ))}
                </div>
            </FilterSection>

            {/* Job Alert mini-CTA */}
            <div className="mt-3 rounded-lg p-3 text-center" style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))' }}>
                <FaBell className="mx-auto text-lg text-white/80 mb-1" />
                <p className="text-[12px] font-bold text-white">Never Miss a Role</p>
                <p className="text-xs text-white/60 mt-0.5">Get email alerts for these filters</p>
                <button className="mt-2 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                    Set Alert
                </button>
            </div>
        </div>
    );

    // ── Column 3: Innovative Right Panel ──────────────────────────────────────
    const RightPanel = () => (
        <div className="flex flex-col gap-4">

            {/* 1. Profile Strength */}
            <RightPanelCard>
                <RightPanelTitle icon={<BiTargetLock />} title="Profile Strength" />
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{profileCompletion}% Complete</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profileCompletion >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {profileCompletion >= 80 ? 'Strong' : 'Needs Work'}
                    </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <motion.div
                        className="h-2 rounded-full"
                        style={{ background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${profileCompletion}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                </div>
                {/* Steps */}
                <ul className="flex flex-col gap-1.5">
                    {profileSteps.map((step, i) => (
                        <li key={i} className="flex items-center gap-2">
                            {step.done
                                ? <FaCheckCircle className="text-[var(--color-secondary)] text-sm flex-shrink-0" />
                                : <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0" />
                            }
                            <span className={`text-xs font-medium ${step.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                {step.label}
                            </span>
                            {!step.done && (
                                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                    Pending
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <FaUpload className="text-xs" /> Upload Demo Video
                </button>
            </RightPanelCard>

            {/* 2. Application Tracker */}
            <RightPanelCard>
                <RightPanelTitle icon={<FaCalendarCheck />} title="Application Tracker" />
                <ul className="flex flex-col gap-2">
                    {appliedJobs.map((a) => (
                        <motion.li
                            key={a.id}
                            whileHover={{ x: 3 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 hover:border-[var(--color-primary)]/30 transition-colors cursor-pointer"
                        >
                            <div>
                                <p className="text-xs font-semibold text-gray-700 leading-tight">{a.title}</p>
                                <p className="text-xs text-gray-400">{a.school}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${a.statusColor}`}>
                                {a.status}
                            </span>
                        </motion.li>
                    ))}
                </ul>
                <button className="mt-2 w-full text-xs text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-semibold flex items-center justify-center gap-1 transition-colors">
                    View all applications <FaArrowRight className="text-xs" />
                </button>
            </RightPanelCard>

            {/* 3. Salary Insights */}
            <RightPanelCard>
                <RightPanelTitle icon={<FaChartBar />} title="Salary Insights" />
                <p className="text-[10px] text-gray-400 -mt-1 mb-2">Average monthly salary by subject</p>
                <ul className="flex flex-col gap-2.5">
                    {salaryInsights.map((s, i) => (
                        <li key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-gray-700">{s.subject}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-[var(--color-primary)]">{s.avg}</span>
                                    <span className={`text-xs font-bold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                                        {s.up ? <MdTrendingUp /> : '↓'} {s.trend}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <motion.div
                                    className="h-1.5 rounded-full"
                                    style={{ background: s.up ? 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))' : '#f87171' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${40 + i * 15}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </RightPanelCard>

            {/* 4. Trending Searches */}
            <RightPanelCard>
                <RightPanelTitle icon={<FaFireAlt />} title="Trending Now" />
                <div className="flex flex-col gap-1.5">
                    {trendingSearches.map((term, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            onClick={() => setSearchQuery(term)}
                            className="flex items-center gap-2 text-left text-xs text-gray-600 hover:text-[var(--color-primary)] font-medium py-1 border-b border-gray-50 last:border-0 transition-colors group"
                        >
                            <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                            <FaSearch className="text-xs text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                            {term}
                            <MdTrendingUp className="ml-auto text-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    ))}
                </div>
            </RightPanelCard>

            {/* 5. Top Hiring Schools */}
            <RightPanelCard>
                <RightPanelTitle icon={<FaSchool />} title="Top Hiring Schools" />
                <ul className="flex flex-col gap-2">
                    {topSchools.map((sch, i) => (
                        <motion.li
                            key={i}
                            whileHover={{ x: 3 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            className="flex items-center gap-2.5 cursor-pointer group"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                style={{ backgroundColor: sch.color }}
                            >
                                {sch.initial}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-700 group-hover:text-[var(--color-primary)] transition-colors truncate">{sch.name}</p>
                                <p className="text-xs text-gray-400">{sch.jobs} open positions</p>
                            </div>
                            <FaArrowRight className="text-xs text-gray-300 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                        </motion.li>
                    ))}
                </ul>
            </RightPanelCard>

            {/* 6. Career Tip + Demo upload nudge */}
            <div className="rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f2a4a 0%,var(--color-primary) 50%,var(--color-secondary) 100%)' }}>
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FaLightbulb className="text-amber-300 text-base" />
                        <span className="text-xs font-bold capitalize tracking-widest text-white/60">Career Tip</span>
                    </div>
                    <p className="text-xs font-medium text-white leading-relaxed">
                        Schools shortlist teachers who upload a <span className="text-amber-300 font-bold">demo class video</span>. It boosts your visibility by <span className="text-green-300 font-bold">3x</span>.
                    </p>
                    <button className="mt-3 w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                        <FaVideo className="text-xs" /> Record & Upload Demo
                    </button>
                </div>
            </div>

            {/* 7. Job Alert Setup */}
            <RightPanelCard>
                <RightPanelTitle icon={<FaBell />} title="Job Alert" />
                <p className="text-xs text-gray-500 -mt-1 mb-2">Get notified when new matching jobs post</p>
                {alertSet ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-[var(--color-secondary)] bg-green-50 rounded-lg px-3 py-2"
                    >
                        <FaCheckCircle className="text-sm" />
                        <span className="text-[12px] font-semibold">Alert set! We&apos;ll notify you.</span>
                    </motion.div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={alertEmail}
                            onChange={e => setAlertEmail(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-primary)] transition"
                        />
                        <button
                            onClick={() => { if (alertEmail) setAlertSet(true); }}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <FaBell className="text-xs" /> Activate Alert
                        </button>
                    </div>
                )}
            </RightPanelCard>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#eeeeee]">
            <Navbar />

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
                                <MdWork className="text-2xl opacity-70" /> Find Your Teaching Career
                            </h1>
                            <p className="text-white/65 text-sm mt-1 max-w-lg">
                                Opportunities across CBSE, ICSE & State Board schools — built exclusively for educators.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {[{ v: '2,400+', l: 'Active Jobs' }, { v: '850+', l: 'Schools' }, { v: '12K+', l: 'Placements' }].map((s, i) => (
                                <div key={i} className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-center backdrop-blur-sm">
                                    <p className="text-xl font-bold text-white oswald-font">{s.v}</p>
                                    <p className="text-[11px] text-white/55">{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Smart Search Bar */}
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
                        </div>
                        <button className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2 shadow-md flex-shrink-0">
                            <FaSearch /> Search
                        </button>
                    </div>

                    {/* Quick pills */}
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
                            <p className="text-[11px] font-bold text-[var(--color-primary)] capitalize tracking-wider">For Institution</p>
                            <p className="text-[13px] text-gray-600">Post a vacancy and connect with 50,000+ qualified teachers instantly.</p>
                        </div>
                    </div>
                    <button className="bg-[var(--color-secondary)] hover:bg-[#0d3812] text-white text-[13px] font-semibold px-5 py-2 rounded-lg flex items-center gap-2 flex-shrink-0 transition-colors">
                        <MdWork /> Post a Job <FaArrowRight className="text-xs" />
                    </button>
                </motion.div>
            </div>

            {/* ══ 3-Column Main Layout ══ */}
            <section className="max-w-[1440px] mx-auto px-4 py-8 pb-16">
                {/* items-start is essential: prevents grid from stretching children to full height, which breaks sticky */}
                <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6 items-start">

                    {/* ═══ COLUMN 1 — Filters ═══ */}
                    <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100vh-10rem)] sidebar-scroll pr-1 rounded-lg">
                        <FiltersColumn />
                    </aside>

                    {/* ═══ COLUMN 2 — Job Results ═══ */}
                    <div className="min-w-0">

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {([
                                    { key: 'all', label: 'All Jobs', icon: <MdWork /> },
                                    { key: 'recommended', label: 'For You', icon: <IoMdTrendingUp /> },
                                    { key: 'saved', label: `Saved (${savedJobs.length})`, icon: <FaBookmark /> },
                                ] as const).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-[13px] font-medium transition-colors ${activeTab === tab.key
                                            ? 'bg-[var(--color-primary)] text-white'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Mobile filter btn */}
                                <button
                                    onClick={() => setShowMobileFilters(true)}
                                    className="xl:hidden flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] border border-[var(--color-primary)]/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    <FaFilter className="text-xs" /> Filters
                                    {activeFilterCount > 0 && (
                                        <span className="bg-[var(--color-secondary)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                                    )}
                                </button>
                                <p className="text-[13px] text-gray-400">
                                    <span className="font-bold text-[var(--color-primary)]">{filteredJobs.length}</span> jobs found
                                </p>
                            </div>
                        </div>

                        {/* Active filter tags */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {filterSubject !== 'All Subjects' && (
                                    <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-[var(--color-primary)] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                                        {filterSubject}
                                        <button onClick={() => setFilterSubject('All Subjects')}><FaTimes className="text-[9px]" /></button>
                                    </span>
                                )}
                                {filterBoard !== 'All Boards' && (
                                    <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-[var(--color-primary)] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                                        {filterBoard}
                                        <button onClick={() => setFilterBoard('All Boards')}><FaTimes className="text-[9px]" /></button>
                                    </span>
                                )}
                                {filterExp !== 'Any Experience' && (
                                    <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-[var(--color-primary)] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                                        {filterExp}
                                        <button onClick={() => setFilterExp('Any Experience')}><FaTimes className="text-[9px]" /></button>
                                    </span>
                                )}
                                {filterType !== 'All Types' && (
                                    <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-[var(--color-primary)] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                                        {filterType}
                                        <button onClick={() => setFilterType('All Types')}><FaTimes className="text-[9px]" /></button>
                                    </span>
                                )}
                                {filterSalary !== 'Any Salary' && (
                                    <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-[var(--color-primary)] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                                        {filterSalary}
                                        <button onClick={() => setFilterSalary('Any Salary')}><FaTimes className="text-[9px]" /></button>
                                    </span>
                                )}
                                <button onClick={resetFilters} className="text-[11px] text-red-400 hover:text-red-600 font-semibold px-2">
                                    Clear All
                                </button>
                            </div>
                        )}

                        {/* Job Cards — single column in the middle */}
                        {filteredJobs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredJobs.map((job, i) => (
                                    <JobCard
                                        key={job.id} job={job} index={i}
                                        saved={savedJobs.includes(job.id)} onToggleSave={toggleSave}
                                    />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-lg border border-gray-200 py-16 text-center"
                            >
                                <FaChalkboardTeacher className="mx-auto text-5xl text-gray-200 mb-3" />
                                <h3 className="text-base font-semibold text-gray-400">No jobs found</h3>
                                <p className="text-sm text-gray-300 mt-1">Try adjusting your filters or search terms.</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 bg-[var(--color-primary)] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[var(--color-secondary)] transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </motion.div>
                        )}

                        {/* Load More */}
                        {filteredJobs.length > 0 && (
                            <div className="mt-5 flex justify-center">
                                <button className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 px-6 py-2.5 rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200">
                                    Load More Jobs <IoMdTrendingUp />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ═══ COLUMN 3 — Innovative Right Panel ═══ */}
                    <aside className="hidden xl:block sticky top-24 self-start max-h-[calc(100vh-10rem)] sidebar-scroll pr-1 rounded-lg">
                        <RightPanel />
                    </aside>
                </div>
            </section>

            {/* ── Mobile Filter Drawer ── */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                            className="fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl overflow-y-auto xl:hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <h2 className="font-bold text-[var(--color-primary)] flex items-center gap-2 text-sm">
                                    <FaFilter /> Filter Jobs
                                </h2>
                                <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-4">
                                <FiltersColumn />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
}
