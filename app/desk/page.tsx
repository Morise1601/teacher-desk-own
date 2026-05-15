'use client';

import React, { useState } from 'react';
import Navbar from '@/app/shared/NavBar';
import Footer from '@/app/shared/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBookmark, FaCheck, FaChevronRight, FaFileAlt, FaFolder,
    FaGraduationCap, FaLink, FaPlus, FaStar, FaThumbtack,
    FaTrash, FaVideo, FaBell, FaChalkboardTeacher,
} from 'react-icons/fa';
import { MdAssignment, MdOutlineTimer, MdTask } from 'react-icons/md';
import { IoIosTrendingUp } from 'react-icons/io';
import { HiOutlineDocumentText } from 'react-icons/hi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
    id: number;
    text: string;
    done: boolean;
    priority: 'high' | 'medium' | 'low';
}

interface Resource {
    id: number;
    title: string;
    type: 'pdf' | 'video' | 'link' | 'folder';
    subject: string;
    pinned: boolean;
}

interface Goal {
    id: number;
    label: string;
    current: number;
    target: number;
    color: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const initialTasks: Task[] = [
    { id: 1, text: 'Prepare Grade 10 Mathematics worksheet', done: false, priority: 'high' },
    { id: 2, text: 'Review student assignments for Physics', done: true, priority: 'medium' },
    { id: 3, text: 'Upload Chemistry lab notes to classroom', done: false, priority: 'medium' },
    { id: 4, text: 'Schedule parent-teacher meeting for this Friday', done: false, priority: 'high' },
    { id: 5, text: 'Update attendance records for April', done: true, priority: 'low' },
];

const resources: Resource[] = [
    { id: 1, title: 'Grade 10 Algebra — Unit 3', type: 'pdf', subject: 'Mathematics', pinned: true },
    { id: 2, title: 'Newton\'s Laws of Motion (Video)', type: 'video', subject: 'Physics', pinned: true },
    { id: 3, title: 'Periodic Table Interactive', type: 'link', subject: 'Chemistry', pinned: false },
    { id: 4, title: 'Term 2 Literature Notes', type: 'pdf', subject: 'English', pinned: true },
    { id: 5, title: 'Biology Diagrams Pack', type: 'folder', subject: 'Biology', pinned: false },
    { id: 6, title: 'Math Past Exam Papers 2023', type: 'folder', subject: 'Mathematics', pinned: false },
];

const goals: Goal[] = [
    { id: 1, label: 'Lessons Completed', current: 38, target: 50, color: 'var(--color-primary)' },
    { id: 2, label: 'Resources Shared', current: 12, target: 20, color: 'var(--color-secondary)' },
    { id: 3, label: 'Assignments Reviewed', current: 75, target: 100, color: '#b45309' },
];

const announcements = [
    { id: 1, tag: 'School', title: 'National Teacher\'s Day — Half Day on 5th September', time: '2h ago', icon: <FaBell className="text-[var(--color-primary)]" /> },
    { id: 2, tag: 'Department', title: 'Mathematics syllabus updated for Grade 11 — please review', time: '1d ago', icon: <FaChalkboardTeacher className="text-[var(--color-secondary)]" /> },
    { id: 3, tag: 'Admin', title: 'Submit Term 3 progress reports by 28th February', time: '2d ago', icon: <MdAssignment className="text-amber-600" /> },
];

const recentActivity = [
    { id: 1, action: 'You uploaded', item: '"Grade 10 Algebra — Unit 3"', time: '10 mins ago' },
    { id: 2, action: 'You shared', item: '"Newton\'s Laws Video" to My Classroom', time: '2h ago' },
    { id: 3, action: 'You received a comment on', item: '"Term 2 Literature Notes"', time: 'Yesterday' },
    { id: 4, action: 'You completed', item: 'Assignment review for 32 students', time: '2 days ago' },
];

const typeIcon: Record<Resource['type'], React.ReactNode> = {
    pdf: <FaFileAlt className="text-red-500" />,
    video: <FaVideo className="text-blue-500" />,
    link: <FaLink className="text-purple-500" />,
    folder: <FaFolder className="text-amber-500" />,
};

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
    }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-[var(--color-primary)] text-lg">{icon}</span>
            <h2 className="font-semibold text-[var(--color-primary)] text-[15px] lg:text-base tracking-wide">{title}</h2>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeskPage() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [newTask, setNewTask] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('pinned');

    const toggleTask = (id: number) =>
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

    const deleteTask = (id: number) =>
        setTasks(prev => prev.filter(t => t.id !== id));

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks(prev => [
            { id: Date.now(), text: newTask.trim(), done: false, priority: 'medium' },
            ...prev,
        ]);
        setNewTask('');
    };

    const pendingCount = tasks.filter(t => !t.done).length;
    const displayedResources = activeTab === 'pinned'
        ? resources.filter(r => r.pinned)
        : resources;

    const priorityColor: Record<Task['priority'], string> = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-amber-100 text-amber-700',
        low: 'bg-green-100 text-green-700',
    };

    return (
        <div className="min-h-screen bg-[#eeeeee]">
            <Navbar />

            {/* ── Page Header Banner ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[var(--color-primary)] text-white px-4 py-6 md:py-8"
            >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold oswald-font tracking-wide flex items-center gap-2">
                            <FaChalkboardTeacher className="text-2xl opacity-80" />
                            My Desk
                        </h1>
                        <p className="text-white/70 text-sm mt-1">Your personal teaching workspace — organised, resourceful, and always at hand.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center">
                            <p className="text-xl font-bold">{pendingCount}</p>
                            <p className="text-xs text-white/70">Pending Tasks</p>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center">
                            <p className="text-xl font-bold">{resources.filter(r => r.pinned).length}</p>
                            <p className="text-xs text-white/70">Pinned Resources</p>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center">
                            <p className="text-xl font-bold">{announcements.length}</p>
                            <p className="text-xs text-white/70">Announcements</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Main Grid ── */}
            <section className="max-w-7xl mx-auto px-3 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">

                    {/* ══ LEFT COLUMN ══════════════════════════════════════════════ */}
                    <div className="col-span-1 flex flex-col gap-6">

                        {/* Goals Tracker */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={0}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<IoIosTrendingUp />} title="Teaching Goals" />
                            <div className="flex flex-col gap-4">
                                {goals.map(g => {
                                    const pct = Math.round((g.current / g.target) * 100);
                                    return (
                                        <div key={g.id}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-gray-600 font-medium">{g.label}</span>
                                                <span className="text-xs font-bold" style={{ color: g.color }}>{g.current}/{g.target}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <motion.div
                                                    className="h-2 rounded-full"
                                                    style={{ backgroundColor: g.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% achieved</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Announcements */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<FaBell />} title="Announcements" />
                            <ul className="flex flex-col gap-3">
                                {announcements.map(a => (
                                    <motion.li
                                        key={a.id}
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                        className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                    >
                                        <div className="mt-0.5 text-base">{a.icon}</div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-semibold capitalize tracking-wide text-white bg-[var(--color-primary)] rounded px-1.5 py-0.5">{a.tag}</span>
                                            <p className="text-xs text-gray-700 font-medium mt-1 leading-tight">{a.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Quick Links */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={2}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<FaBookmark />} title="Quick Links" />
                            <ul className="flex flex-col gap-2">
                                {[
                                    { label: 'My Classroom', href: '/classroom' },
                                    { label: 'Resources', href: '/resources' },
                                    { label: 'Jobs Board', href: '/jobs' },
                                    { label: 'My Profile', href: '/profile' },
                                    { label: 'Connections', href: '/connections' },
                                ].map((l, i) => (
                                    <motion.a
                                        key={i}
                                        href={l.href}
                                        whileHover={{ x: 6 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                        className="flex items-center justify-between text-sm text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium py-1.5 border-b border-gray-100 last:border-0"
                                    >
                                        {l.label}
                                        <FaChevronRight className="text-xs opacity-50" />
                                    </motion.a>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* ══ MIDDLE COLUMN ════════════════════════════════════════════ */}
                    <div className="md:col-span-2 flex flex-col gap-6">

                        {/* Task Manager */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={0}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<MdTask />} title="Task Manager" />

                            {/* Add Task */}
                            <form onSubmit={addTask} className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={e => setNewTask(e.target.value)}
                                    placeholder="Add a new task…"
                                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-[var(--color-primary)] transition"
                                />
                                <button
                                    type="submit"
                                    className="bg-[var(--color-primary)] text-white rounded-lg px-4 py-2 text-sm hover:bg-[var(--color-secondary)] transition-colors flex items-center gap-1.5"
                                >
                                    <FaPlus className="text-xs" /> Add
                                </button>
                            </form>

                            {/* Task List */}
                            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                                <AnimatePresence>
                                    {tasks.map(task => (
                                        <motion.li
                                            key={task.id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition group ${task.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-blue-50/40 border-blue-100'}`}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)]' : 'border-gray-300'}`}
                                            >
                                                {task.done && <FaCheck className="text-white text-[9px]" />}
                                            </button>
                                            {/* Text */}
                                            <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {task.text}
                                            </span>
                                            {/* Priority badge */}
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${priorityColor[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                                <span>{tasks.filter(t => t.done).length} of {tasks.length} completed</span>
                                <span>{pendingCount} remaining</span>
                            </div>
                        </motion.div>

                        {/* Pinned Resources */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <SectionTitle icon={<FaThumbtack />} title="My Resources" />
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                                    {(['pinned', 'all'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-3 py-1.5 capitalize font-medium transition-colors ${activeTab === tab ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {tab === 'pinned' ? '📌 Pinned' : '📂 All'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {displayedResources.map((res, i) => (
                                    <motion.div
                                        key={res.id}
                                        variants={fadeUp} custom={i}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2.5 hover:border-[var(--color-primary)] hover:shadow-sm transition-all cursor-pointer group"
                                    >
                                        <div className="text-xl flex-shrink-0">{typeIcon[res.type]}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-[var(--color-primary)]">{res.title}</p>
                                            <p className="text-[11px] text-gray-400">{res.subject}</p>
                                        </div>
                                        {res.pinned && <FaThumbtack className="text-[10px] text-[var(--color-primary)] opacity-60 flex-shrink-0" />}
                                    </motion.div>
                                ))}
                            </div>
                            <button className="mt-4 w-full text-center text-sm text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium transition-colors">
                                + Upload or link a new resource
                            </button>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={2}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<MdOutlineTimer />} title="Recent Activity" />
                            <ul className="flex flex-col gap-0">
                                {recentActivity.map((a, i) => (
                                    <motion.li
                                        key={a.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">
                                                <span className="text-gray-500">{a.action} </span>
                                                <span className="font-semibold text-[var(--color-primary)]">{a.item}</span>
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{a.time}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* ══ RIGHT COLUMN ═════════════════════════════════════════════ */}
                    <div className="md:col-span-full xl:col-span-1 flex flex-col gap-6">

                        {/* Lesson Planner Widget */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={0}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<HiOutlineDocumentText />} title="Lesson Planner" />
                            <div className="flex flex-col gap-3">
                                {[
                                    { subject: 'Mathematics', grade: 'Grade 10', topic: 'Quadratic Equations', time: '08:00 AM' },
                                    { subject: 'Physics', grade: 'Grade 11', topic: 'Circular Motion', time: '10:30 AM' },
                                    { subject: 'Chemistry', grade: 'Grade 9', topic: 'Periodic Trends', time: '01:00 PM' },
                                    { subject: 'English', grade: 'Grade 12', topic: 'Essay Writing', time: '03:15 PM' },
                                ].map((lesson, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition cursor-pointer"
                                    >
                                        <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md w-10 h-10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-center leading-tight">
                                            {lesson.time}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-700 truncate">{lesson.subject}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{lesson.topic} · {lesson.grade}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <button className="mt-3 w-full bg-[var(--color-primary)] text-white text-sm rounded-lg py-2 hover:bg-[var(--color-secondary)] transition-colors font-medium">
                                + Add Lesson
                            </button>
                        </motion.div>

                        {/* Student Highlights */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        >
                            <SectionTitle icon={<FaGraduationCap />} title="Student Highlights" />
                            <ul className="flex flex-col gap-3">
                                {[
                                    { name: 'Amara Osei', subject: 'Mathematics', score: 96, rank: 1 },
                                    { name: 'Kwame Mensah', subject: 'Physics', score: 91, rank: 2 },
                                    { name: 'Abena Boateng', subject: 'English', score: 89, rank: 3 },
                                ].map((s, i) => (
                                    <motion.li
                                        key={i}
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                        className="flex items-center gap-3 pb-2 border-b border-gray-100 last:border-0"
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                                            {s.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-700">{s.name}</p>
                                            <p className="text-[11px] text-gray-400">{s.subject}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="text-amber-400 text-xs" />
                                            <span className="text-sm font-bold text-[var(--color-primary)]">{s.score}%</span>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                            <a href="/classroom" className="mt-3 block text-center text-xs text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium transition-colors">
                                View All Students →
                            </a>
                        </motion.div>

                        {/* Desk Tip */}
                        <motion.div
                            variants={fadeUp} initial="hidden" animate="visible" custom={2}
                            className="rounded-lg overflow-hidden shadow-md border border-[var(--color-primary)]/20"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}
                        >
                            <div className="p-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaStar className="text-amber-300 text-base" />
                                    <span className="text-xs font-bold capitalize tracking-widest text-white/70">Desk Tip</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    &quot;Pin your most-used resources to access them instantly. Keep your lesson plans updated weekly for a smoother teaching experience.&quot;
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 text-white/60 text-[11px]">
                                    <FaChalkboardTeacher />
                                    <span>TeacherDesk Pro Tip</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </section>
            <Footer />
        </div>
    );
}
