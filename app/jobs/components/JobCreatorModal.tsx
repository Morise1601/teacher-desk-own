// app/jobs/components/JobCreatorModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaBriefcase, FaGraduationCap, FaRupeeSign, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { Job } from '../types';
import { jobsRepository } from '../jobsRepository';
import { toast } from 'react-toastify';

interface JobCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJobCreated: () => void;
    editingJob?: Job | null;
}

export default function JobCreatorModal({ isOpen, onClose, onJobCreated, editingJob }: JobCreatorModalProps) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [experience, setExperience] = useState('1-3 Years');
    const [salaryMin, setSalaryMin] = useState(30000);
    const [salaryMax, setSalaryMax] = useState(50000);
    const [employmentType, setEmploymentType] = useState('Full-time');
    const [location, setLocation] = useState('');
    const [state, setState] = useState('');
    const [board, setBoard] = useState('CBSE');
    const [gradeLevel, setGradeLevel] = useState('High School');
    const [deadline, setDeadline] = useState('');
    const [openPositions, setOpenPositions] = useState(1);
    const [skillsText, setSkillsText] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If editing, load the job details
    useEffect(() => {
        if (editingJob) {
            setTitle(editingJob.title);
            setSubject(editingJob.subject);
            setDescription(editingJob.description || '');
            setRequirements(editingJob.requirements || '');
            setExperience(editingJob.experience);
            
            // Extract salary min and max if formatting matches
            setSalaryMin(editingJob.salaryMin || 30000);
            const maxVal = editingJob.salary.split('–').pop()?.replace(/[^0-9]/g, '');
            setSalaryMax(maxVal ? parseInt(maxVal, 10) : 50000);
            
            setEmploymentType(editingJob.jobType);
            setLocation(editingJob.location);
            setState(editingJob.state);
            setBoard(editingJob.board);
            setGradeLevel(editingJob.gradeLevel);
            setDeadline(editingJob.deadline || '');
            setOpenPositions(editingJob.openPositions || 1);
            setSkillsText((editingJob.skillsRequired || []).join(', '));
            setIsFeatured(editingJob.isFeatured);
        } else {
            // Reset fields
            setTitle('');
            setSubject('Mathematics');
            setDescription('');
            setRequirements('');
            setExperience('1-3 Years');
            setSalaryMin(30000);
            setSalaryMax(50000);
            setEmploymentType('Full-time');
            setLocation('');
            setState('');
            setBoard('CBSE');
            setGradeLevel('High School');
            
            // Set default deadline (30 days from now)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            setDeadline(futureDate.toISOString().split('T')[0]);
            
            setOpenPositions(1);
            setSkillsText('');
            setIsFeatured(false);
        }
    }, [editingJob, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- Form Validations ---
        if (!title.trim() || !location.trim() || !state.trim() || !description.trim() || !requirements.trim()) {
            toast.error('Please fill in all mandatory fields.');
            return;
        }

        if (description.length > 3000) {
            toast.error('Job description cannot exceed 3000 characters.');
            return;
        }

        if (requirements.length > 2000) {
            toast.error('Requirements cannot exceed 2000 characters.');
            return;
        }

        // Validate Deadline is not in the past
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
            toast.error('Application deadline cannot be a past date.');
            return;
        }

        // Salary Validations
        if (salaryMin <= 0 || salaryMax <= 0) {
            toast.error('Salary must be a positive number.');
            return;
        }
        if (salaryMin > salaryMax) {
            toast.error('Minimum salary cannot exceed maximum salary.');
            return;
        }

        if (openPositions <= 0) {
            toast.error('Number of open positions must be at least 1.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formattedSalary = `₹${salaryMin.toLocaleString('en-IN')} – ₹${salaryMax.toLocaleString('en-IN')}`;
            const skillsRequired = skillsText.split(',').map(s => s.trim()).filter(s => s !== '');
            const tags = [board, subject, employmentType];

            const jobPayload = {
                title: title.trim(),
                subject,
                description: description.trim(),
                requirements: requirements.trim(),
                experience,
                salary: formattedSalary,
                salaryMin,
                jobType: employmentType,
                location: location.trim(),
                state: state.trim(),
                board,
                gradeLevel,
                deadline,
                openPositions,
                skillsRequired,
                isFeatured,
                status: 'active' as const,
                tags,
                qualification: subject === 'General' || subject === 'Special Education' ? 'B.Ed' : 'M.Ed',
                institutionId: 'institution-id-dummy' // in real app: auth.user.id
            };

            if (editingJob) {
                await jobsRepository.updateJob(editingJob.id, jobPayload);
                toast.success('Job listing updated successfully!');
            } else {
                await jobsRepository.createJob({
                    ...jobPayload,
                    school: 'Ryan International School' // in real, loaded from Institution profile name
                });
                toast.success('Job listing created successfully!');
            }

            window.dispatchEvent(new CustomEvent('jobs:updated'));
            onJobCreated();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save job post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8 max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center shadow-md">
                            <FaBriefcase className="text-sm" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                                {editingJob ? 'Edit Job Posting' : 'Post a New Job Opportunity'}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-medium">Configure roles to find the best educators.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* Basic info row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Job Title <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Senior High School Mathematics Teacher"
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[var(--color-primary)] transition"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Subject Expertise <span className="text-red-500">*</span></label>
                            <select 
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white focus:border-[var(--color-primary)] transition"
                            >
                                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'General', 'Special Education'].map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Meta Selectors Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Board Type <span className="text-red-500">*</span></label>
                            <select 
                                value={board}
                                onChange={e => setBoard(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white"
                            >
                                {['CBSE', 'ICSE', 'State Board'].map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Grade Level <span className="text-red-500">*</span></label>
                            <select 
                                value={gradeLevel}
                                onChange={e => setGradeLevel(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white"
                            >
                                {['Primary', 'Middle School', 'High School'].map(gl => (
                                    <option key={gl} value={gl}>{gl}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Employment Type <span className="text-red-500">*</span></label>
                            <select 
                                value={employmentType}
                                onChange={e => setEmploymentType(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white"
                            >
                                {['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'].map(et => (
                                    <option key={et} value={et}>{et}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                <FaMapMarkerAlt className="text-gray-400 text-2xs" /> City <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. New Delhi"
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">State <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={state}
                                onChange={e => setState(e.target.value)}
                                placeholder="e.g. Delhi"
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Salary & Details Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-0.5">
                                <FaRupeeSign className="text-gray-400 text-2xs" /> Min Salary/Month <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="number"
                                value={salaryMin}
                                onChange={e => setSalaryMin(parseInt(e.target.value, 10))}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-0.5">
                                <FaRupeeSign className="text-gray-400 text-2xs" /> Max Salary/Month <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="number"
                                value={salaryMax}
                                onChange={e => setSalaryMax(parseInt(e.target.value, 10))}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                <FaGraduationCap className="text-gray-400" /> Required Experience <span className="text-red-500">*</span>
                            </label>
                            <select 
                                value={experience}
                                onChange={e => setExperience(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white"
                            >
                                {['Fresher', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'].map(exp => (
                                    <option key={exp} value={exp}>{exp}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Job description */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-700">Job Description <span className="text-red-500">*</span></label>
                            <span className="text-[10px] text-gray-400">{description.length}/3000 chars</span>
                        </div>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Write comprehensive roles, responsibilities, and school context..."
                            rows={4}
                            maxLength={3000}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none resize-none focus:border-[var(--color-primary)] transition"
                            required
                        />
                    </div>

                    {/* Job requirements */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-700">Requirements & Eligibility <span className="text-red-500">*</span></label>
                            <span className="text-[10px] text-gray-400">{requirements.length}/2000 chars</span>
                        </div>
                        <textarea 
                            value={requirements}
                            onChange={e => setRequirements(e.target.value)}
                            placeholder="Specify B.Ed/M.Ed eligibility, specific domain knowledge, teaching values..."
                            rows={3}
                            maxLength={2000}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none resize-none focus:border-[var(--color-primary)] transition"
                            required
                        />
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-700">Required Skills <span className="text-gray-400">(Comma separated)</span></label>
                        <input 
                            type="text"
                            value={skillsText}
                            onChange={e => setSkillsText(e.target.value)}
                            placeholder="e.g. Lesson Planning, Python, Classroom Management, Algebra"
                            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                        />
                    </div>

                    {/* Deadlines & counts */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                <FaCalendarAlt className="text-gray-400 text-2xs" /> Application Deadline <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-700">Open Positions <span className="text-red-500">*</span></label>
                            <input 
                                type="number"
                                value={openPositions}
                                onChange={e => setOpenPositions(parseInt(e.target.value, 10))}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none"
                                min={1}
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end pb-2.5 pl-1.5">
                            <input 
                                type="checkbox"
                                id="isFeatured"
                                checked={isFeatured}
                                onChange={e => setIsFeatured(e.target.checked)}
                                className="w-4 h-4 border-gray-200 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)] cursor-pointer"
                            />
                            <label htmlFor="isFeatured" className="text-xs font-bold text-gray-600 cursor-pointer">
                                ⭐ Feature Listing
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer buttons */}
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-3.5">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold px-6 py-2.5 rounded-lg transition duration-200 shadow-md flex items-center gap-1.5"
                    >
                        {isSubmitting ? 'Saving...' : editingJob ? 'Update Posting' : 'Publish Opportunity'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
