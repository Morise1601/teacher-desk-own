// app/jobs/components/ApplicantDetailsModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaFilePdf, FaNotesMedical, FaPaperPlane,
    FaEnvelopeOpenText, FaHistory, FaCheck, FaBan, FaCalendarAlt,
    FaArrowRight, FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaEnvelope
} from 'react-icons/fa';
import { Application, CommunicationLog, ApplicationNote } from '../types';
import { jobsRepository } from '../jobsRepository';
import { toast } from 'react-toastify';

interface ApplicantDetailsModalProps {
    isOpen: boolean;
    applicationId: string;
    onClose: () => void;
    onStatusChanged: () => void;
}

export default function ApplicantDetailsModal({ isOpen, applicationId, onClose, onStatusChanged }: ApplicantDetailsModalProps) {
    const [app, setApp] = useState<Application | null>(null);
    const [notes, setNotes] = useState<ApplicationNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);

    // Communication Form State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [templateType, setTemplateType] = useState<'interview' | 'shortlist' | 'reject' | 'custom'>('custom');
    const [interviewTime, setInterviewTime] = useState('');

    const loadData = async () => {
        try {
            const apps = await jobsRepository.getApplications();
            const foundApp = apps.find(a => a.id === applicationId);
            if (foundApp) {
                setApp(foundApp);
                setNotes(foundApp.notes || []);
                const logs = await jobsRepository.getCommunicationLogs(applicationId);
                setCommLogs(logs);
            }
        } catch (err) {
            console.error('Failed to load applicant details', err);
        }
    };

    useEffect(() => {
        if (isOpen && applicationId) {
            loadData();
        }
    }, [isOpen, applicationId]);

    // Handle template changes and populate fields
    useEffect(() => {
        if (!app) return;

        const candidateName = app.teacherName;
        const jobTitle = app.jobTitle;
        const schoolName = app.schoolName;

        if (templateType === 'interview') {
            setEmailSubject(`Interview Invitation: ${jobTitle} role at ${schoolName}`);
            setEmailBody(
                `Dear ${candidateName},\n\n` +
                `Thank you for applying for the "${jobTitle}" position at ${schoolName}. We were highly impressed with your profile and matching qualifications.\n\n` +
                `We would love to invite you for a virtual interview on the Teacher Desk platform.\n` +
                `Proposed Time: ${interviewTime || '[Select interview date & time below]'}\n\n` +
                `Please let us know if this works for you. Looking forward to speaking with you.\n\n` +
                `Warm regards,\n` +
                `Recruitment Team\n` +
                `${schoolName}`
            );
        } else if (templateType === 'shortlist') {
            setEmailSubject(`Application Update: Shortlisted for ${jobTitle}`);
            setEmailBody(
                `Dear ${candidateName},\n\n` +
                `We are pleased to inform you that your application for the "${jobTitle}" role at ${schoolName} has been shortlisted!\n\n` +
                `Our hiring managers are currently reviewing files to coordinate matching rounds. We will reach out shortly with scheduling steps.\n\n` +
                `Best regards,\n` +
                `HR Team\n` +
                `${schoolName}`
            );
        } else if (templateType === 'reject') {
            setEmailSubject(`Application Status: ${jobTitle}`);
            setEmailBody(
                `Dear ${candidateName},\n\n` +
                `Thank you for your interest in the "${jobTitle}" position at ${schoolName}.\n\n` +
                `After careful review of all applications, we regret to inform you that we will not be moving forward with your application at this time. We had many outstanding candidates and the selection was very competitive.\n\n` +
                `We will keep your resume in our database for future opportunities that align with your teaching specialization. We wish you the very best in your search.\n\n` +
                `Sincerely,\n` +
                `HR Team\n` +
                `${schoolName}`
            );
        } else {
            // Custom
            setEmailSubject('');
            setEmailBody('');
        }
    }, [templateType, app, interviewTime]);

    if (!isOpen || !app) return null;

    // Actions
    const handleStatusTransition = async (status: Application['status']) => {
        try {
            await jobsRepository.updateApplicationStatus(app.id, status);
            toast.success(`Application status transitioned to: ${status}`);

            // Auto select template type based on action to help recruiter
            if (status === 'Shortlisted') setTemplateType('shortlist');
            else if (status === 'Interview Scheduled') setTemplateType('interview');
            else if (status === 'Rejected') setTemplateType('reject');

            window.dispatchEvent(new CustomEvent('jobs:updated'));
            onStatusChanged();
            await loadData();
        } catch (err) {
            toast.error('Failed to transition status.');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            await jobsRepository.addApplicationNote(
                app.id,
                newNote.trim(),
                'institution-admin-dummy', // authorId
                'Head Recruiter' // authorName
            );
            toast.success('Internal recruitment note logged.');
            setNewNote('');
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to log note.');
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailSubject.trim() || !emailBody.trim()) {
            toast.error('Subject and message content are required.');
            return;
        }

        try {
            await jobsRepository.addCommunicationLog({
                applicationId: app.id,
                senderId: 'institution-admin-dummy',
                senderName: app.schoolName,
                recipientId: app.teacherId,
                recipientName: app.teacherName,
                subject: emailSubject.trim(),
                message: emailBody.trim(),
                templateType
            });

            toast.success('Email communication dispatched and logged successfully!');

            // If template matches a status trigger, let's sync application status
            if (templateType === 'interview' && app.status !== 'Interview Scheduled') {
                await jobsRepository.updateApplicationStatus(app.id, 'Interview Scheduled');
                onStatusChanged();
            } else if (templateType === 'shortlist' && app.status !== 'Shortlisted') {
                await jobsRepository.updateApplicationStatus(app.id, 'Shortlisted');
                onStatusChanged();
            } else if (templateType === 'reject' && app.status !== 'Rejected') {
                await jobsRepository.updateApplicationStatus(app.id, 'Rejected');
                onStatusChanged();
            }

            // Reset template select
            setTemplateType('custom');
            window.dispatchEvent(new CustomEvent('jobs:updated'));
            await loadData();
        } catch (err) {
            toast.error('Failed to dispatch communication.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-[#f8fafc] rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-4 max-h-[95vh]"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-200 bg-white flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="font-bold text-gray-800 text-sm sm:text-base">{app.teacherName}</h2>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-100">
                                {app.matchScore}% Match
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${app.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                                    app.status === 'Interview Scheduled' ? 'bg-purple-100 text-purple-700' :
                                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {app.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-medium">Applied for &ldquo;{app.jobTitle}&rdquo; • {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                {/* Body Content grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
                    {/* LEFT PANEL: PROFILE, COVER LETTER, RESUME PREVIEW (Col 7) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">

                        {/* Summary Details */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FaEnvelopeOpenText className="text-xs text-[var(--color-secondary)]" /> Application Briefing
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3 text-gray-600">
                                <div><strong>Email:</strong> {app.teacherEmail}</div>
                                <div><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleString()}</div>
                            </div>
                            {app.coverLetter && (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed text-gray-600">
                                    <div className="font-bold text-gray-500 mb-1 text-[10px] uppercase">Cover Letter</div>
                                    {app.coverLetter}
                                </div>
                            )}
                        </div>

                        {/* Match Analysis */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <h3 className="text-xs font-bold text-gray-700 mb-2">Smart Match Evaluation</h3>
                            <ul className="space-y-1.5">
                                {app.matchDetails.map((det, i) => (
                                    <li key={i} className="text-xs font-semibold text-gray-600 flex items-start gap-1.5">
                                        <span className="text-[var(--color-secondary)] font-bold">✓</span>
                                        <span>{det}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* PDF Resume embedded */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex-grow flex flex-col min-h-[350px]">
                            <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><FaFilePdf className="text-red-500" /> Resume Document</span>
                                <a
                                    href={app.resumeUrl}
                                    download={app.resumeName}
                                    className="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                                >
                                    Download Resume ({app.resumeName})
                                </a>
                            </h3>
                            {app.resumeUrl && app.resumeName.endsWith('.pdf') ? (
                                <iframe
                                    src={app.resumeUrl}
                                    className="w-full flex-grow border border-gray-100 rounded-lg min-h-[320px]"
                                    title="Candidate Resume"
                                />
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-50 text-center rounded-lg border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600">Resume in Word format (.docx)</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Direct preview is restricted. Please click Download above to view candidate profile details.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: ACTIONS, EMAIL, INTERNAL NOTES (Col 5) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">

                        {/* Recruitment Actions */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <h3 className="text-xs font-bold text-gray-700 mb-3">Recruitment Actions</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleStatusTransition('Shortlisted')}
                                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 px-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                                >
                                    <FaCheck className="text-3xs" /> Shortlist
                                </button>
                                <button
                                    onClick={() => handleStatusTransition('Interview Scheduled')}
                                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 px-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
                                >
                                    <FaCalendarAlt className="text-3xs" /> Interview
                                </button>
                                <button
                                    onClick={() => handleStatusTransition('Rejected')}
                                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 px-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                >
                                    <FaBan className="text-3xs" /> Reject
                                </button>
                            </div>
                        </div>

                        {/* Email Templates Dispatch */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <FaEnvelope className="text-xs text-[var(--color-primary)]" /> Contact Applicant
                            </h3>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold text-gray-500">Template:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {(['custom', 'interview', 'shortlist', 'reject'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTemplateType(t)}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize transition ${templateType === t
                                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {templateType === 'interview' && (
                                <div className="mb-3 p-2.5 bg-purple-50/50 border border-purple-100 rounded-lg flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-purple-700 uppercase">Interview Time Selection</span>
                                    <input
                                        type="datetime-local"
                                        value={interviewTime}
                                        onChange={e => setInterviewTime(e.target.value)}
                                        className="w-full text-2xs p-1.5 bg-white border border-gray-200 rounded text-gray-700 focus:outline-none"
                                    />
                                </div>
                            )}

                            <form onSubmit={handleSendEmail} className="space-y-2.5">
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                    placeholder="Email Subject Line"
                                    className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none focus:border-[var(--color-primary)] bg-slate-50/50"
                                    required
                                />
                                <textarea
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                    placeholder="Enter your message details here..."
                                    rows={5}
                                    className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none resize-none focus:border-[var(--color-primary)] bg-slate-50/50"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] py-2 rounded-lg transition"
                                >
                                    <FaPaperPlane className="text-2xs" /> Send Message
                                </button>
                            </form>
                        </div>

                        {/* Internal Recruiter Notes */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <h3 className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
                                <FaNotesMedical className="text-gray-400" /> Recruiter Internal Notes
                            </h3>

                            <form onSubmit={handleAddNote} className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    placeholder="Log internal feedback, e.g. Impressive profile..."
                                    className="flex-1 text-xs border border-gray-200 rounded-lg p-2 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition"
                                >
                                    Add
                                </button>
                            </form>

                            <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {notes.map(n => (
                                    <li key={n.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-2xs leading-relaxed text-gray-600">
                                        <div className="flex justify-between font-bold text-gray-500 mb-0.5">
                                            <span>{n.authorName}</span>
                                            <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {n.note}
                                    </li>
                                ))}
                                {notes.length === 0 && (
                                    <p className="text-2xs text-gray-400 text-center py-2 font-medium">No internal comments logged yet.</p>
                                )}
                            </ul>
                        </div>

                        {/* Communication Logs / History */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex-grow max-h-[220px] overflow-hidden flex flex-col">
                            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <FaHistory className="text-gray-400" /> Dispatch History Log
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                                {commLogs.map(l => (
                                    <div key={l.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-2xs">
                                        <div className="flex justify-between font-bold text-gray-500 mb-1">
                                            <span className="truncate max-w-[150px]">{l.subject}</span>
                                            <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-wrap">{l.message}</p>
                                    </div>
                                ))}
                                {commLogs.length === 0 && (
                                    <p className="text-2xs text-gray-400 text-center py-4 font-medium">No emails logged.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}
