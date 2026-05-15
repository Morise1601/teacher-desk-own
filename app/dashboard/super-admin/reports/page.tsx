'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    Search,
    Filter,
    Mail,
    MapPin,
    ChevronRight,
    Calendar,
    User,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Ban
} from 'lucide-react';
import { getReportsAction, updateReportStatusAction, blockUserAction } from '@/app/actions/reports';
import { decryptData, encryptData } from '@/lib/crypto';
import { toast } from 'react-hot-toast';
import { Sheet } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Report Row Component
const ReportRow = ({ report, idx, onView }: { report: any, idx: number, onView: (r: any) => void }) => {
    const statusColors: any = {
        pending: 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] border-[var(--color-primary)]/20',
        resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        dismissed: 'bg-gray-50 text-gray-600 border-gray-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx }}
            className="group bg-white border border-gray-100 p-4 rounded-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${statusColors[report.status] || 'bg-gray-50'}`}>
                    <AlertTriangle size={20} />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="flex flex-col truncate">
                        <h3 className="text-base font-semibold text-[var(--color-primary)] truncate capitalize">
                            {report.reason}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                            Reported by: {report.reporter?.name}
                        </p>
                    </div>
                    <div className="hidden sm:flex flex-col truncate">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Reported User</span>
                        <span className="text-sm text-gray-700 font-bold truncate">
                            {report.reported?.name}
                        </span>
                    </div>
                    <div className="hidden lg:flex flex-col truncate">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Date</span>
                        <span className="text-sm text-gray-500 font-medium truncate flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" /> {new Date(report.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="hidden lg:flex items-center justify-start">
                        <div className={`px-3 py-1 text-xs font-bold rounded-md border capitalize tracking-wide ${statusColors[report.status]}`}>
                            {report.status}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 md:pt-0 border-t border-gray-50 md:border-none w-full md:w-auto justify-end">
                <button
                    onClick={() => onView(report)}
                    className="h-10 px-5 bg-white border border-gray-200 rounded-md text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-md transition-all flex items-center gap-2"
                >
                    <Eye size={16} />
                    <span>View Details</span>
                </button>
            </div>
        </motion.div>
    );
};

export default function ReportsListPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Sheet state
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isActioning, setIsActioning] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [userToBlock, setUserToBlock] = useState<any>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = decryptData(await getReportsAction());
            if (res.success) {
                setReports(res.data || []);
            } else {
                toast.error("Failed to load reports.");
            }
        } catch (err) {
            toast.error("Network error fetching reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateStatus = async (reportId: string, status: string) => {
        try {
            setIsActioning(true);
            const payload = encryptData({ reportId, status });
            const res = decryptData(await updateReportStatusAction(payload));
            if (res.success) {
                toast.success(`Report marked as ${status}`);
                setSelectedReport(null);
                fetchReports();
            } else {
                toast.error(res.message || "Failed to update status");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsActioning(false);
        }
    };

    const handleBlockUser = async () => {
        if (!userToBlock) return;

        try {
            setIsActioning(true);
            const payload = encryptData({ userId: userToBlock.userId, role: userToBlock.role });
            const res = decryptData(await blockUserAction(payload));
            if (res.success) {
                toast.success("User blocked successfully");
                setSelectedReport(null);
                setShowBlockConfirm(false);
                setUserToBlock(null);
                fetchReports();
            } else {
                toast.error(res.message || "Failed to block user");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsActioning(false);
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = 
            (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.reported?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.reporter?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Widget */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-md shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize flex items-center gap-3">
                        <ShieldAlert className="text-[var(--color-secondary)]" />
                        Message Reports
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Review and manage reported messages from the community.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-md py-2.5 pl-10 pr-4 text-sm font-medium w-full focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
                            autoComplete="off"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm font-bold text-gray-600 outline-none focus:bg-white transition-all w-full sm:w-auto"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                </div>
            </div>

            {/* Main Listing View */}
            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-md border border-gray-100 shadow-sm min-h-[400px]"
                        >
                            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/10 border-t-[var(--color-primary)] rounded-full animate-spin" />
                            <p className="text-sm font-bold oswald-font text-gray-400 tracking-widest capitalize">Fetching report data...</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {filteredReports.length > 0 ? filteredReports.map((report, idx) => (
                                <ReportRow key={report.id} report={report} idx={idx} onView={setSelectedReport} />
                            )) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-24 flex flex-col items-center text-center bg-white rounded-md border border-gray-100 shadow-sm"
                                >
                                    <CheckCircle size={48} className="text-emerald-300 mb-4" />
                                    <h3 className="text-lg font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">All clear!</h3>
                                    <p className="text-sm text-gray-400 mt-1">No reports matching your criteria were found.</p>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Report Details Sheet */}
            <Sheet
                open={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                width="max-w-xl"
            >
                {selectedReport && (
                    <div className="flex flex-col h-full bg-white">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-[var(--color-primary)]/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Report Details</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Status: {selectedReport.status}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Report Info */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Issue Information</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedReport.reason}</p>
                                    </div>
                                    {selectedReport.description && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Description</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.description}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Reported Message */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Reported Content</h3>
                                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <UserAvatar 
                                            name={selectedReport.reported?.name}
                                            className="w-8 h-8 text-[10px]"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{selectedReport.reported?.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{selectedReport.reported?.role}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg italic text-gray-600 text-sm leading-relaxed border border-gray-100">
                                        "{selectedReport.message?.content || 'No text content'}"
                                    </div>
                                    {selectedReport.message?.attachments?.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {selectedReport.message.attachments.map((att: any, i: number) => (
                                                <div key={i} className="bg-gray-100 rounded-lg h-24 flex items-center justify-center overflow-hidden border">
                                                    {att.type?.startsWith('image/') ? (
                                                        <img src={att.url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <MessageSquare className="text-gray-400" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Reporter Info */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Reporter Information</h3>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <UserAvatar name={selectedReport.reporter?.name} className="w-10 h-10" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{selectedReport.reporter?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedReport.reporter?.email}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Actions */}
                            <div className="pt-8 space-y-4 pb-10">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Administrative Actions</h3>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                        disabled={isActioning}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} /> Resolve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                                        disabled={isActioning}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                                    >
                                        <XCircle size={18} /> Dismiss
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setUserToBlock({ userId: selectedReport.reported_id, role: selectedReport.reported?.role });
                                        setShowBlockConfirm(true);
                                        setSelectedReport(null); // Close the sheet to reveal the confirmation dialog
                                    }}
                                    disabled={isActioning}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
                                >
                                    <Ban size={18} /> Block User ({selectedReport.reported?.role})
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Sheet>

            <ConfirmDialog
                isOpen={showBlockConfirm}
                onClose={() => setShowBlockConfirm(false)}
                onConfirm={handleBlockUser}
                title="Confirm Block"
                message={`Are you sure you want to block this ${userToBlock?.role || 'user'}? This will permanently prevent them from accessing the Teacher Desk platform.`}
                confirmText="Block User"
                type="danger"
                isLoading={isActioning}
            />
        </div>
    );
}
