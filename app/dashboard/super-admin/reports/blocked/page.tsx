'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ban,
    UserX,
    Search,
    ShieldCheck,
    Calendar,
    Mail,
    Phone,
    Globe,
    MoreVertical,
    CheckCircle2
} from 'lucide-react';
import { getBlockedUsersAction, unblockUserAction } from '@/app/actions/reports';
import { decryptData, encryptData } from '@/lib/crypto';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function BlockedUsersPage() {
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
    const [userToUnblock, setUserToUnblock] = useState<any>(null);
    const [isActioning, setIsActioning] = useState(false);

    const fetchBlockedUsers = async () => {
        try {
            setLoading(true);
            const res = decryptData(await getBlockedUsersAction());
            if (res.success) {
                setBlockedUsers(res.data || []);
            } else {
                toast.error("Failed to load blocked users.");
            }
        } catch (err) {
            toast.error("Network error.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const handleUnblock = async () => {
        if (!userToUnblock) return;
        try {
            setIsActioning(true);
            const payload = encryptData({ userId: userToUnblock.auth_id, role: userToUnblock.role });
            const res = decryptData(await unblockUserAction(payload));
            if (res.success) {
                toast.success("User unblocked successfully");
                setShowUnblockConfirm(false);
                setUserToUnblock(null);
                fetchBlockedUsers();
            } else {
                toast.error(res.message || "Failed to unblock");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsActioning(false);
        }
    };

    const filteredUsers = blockedUsers.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Widget */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-md shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize flex items-center gap-3">
                        <UserX className="text-red-500" />
                        Blocked Accounts
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage users and institutions that have been restricted from the platform.</p>
                </div>

                <div className="relative group w-full lg:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-md py-2.5 pl-10 pr-4 text-sm font-medium w-full focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
                    />
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-100 rounded" />
                                        <div className="h-3 w-20 bg-gray-100 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-gray-50 rounded" />
                                    <div className="h-3 w-full bg-gray-50 rounded" />
                                </div>
                            </div>
                        ))
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => (
                            <motion.div
                                key={user.auth_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * idx }}
                                className="group bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
                                
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                                            <Ban size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize truncate max-w-[150px]">
                                                {user.name}
                                            </h3>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{user.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setUserToUnblock(user);
                                        setShowUnblockConfirm(true);
                                    }}
                                    className="w-full py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    Unblock User
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-gray-200">
                            <ShieldCheck size={48} className="text-emerald-300 mb-4" />
                            <h3 className="text-lg font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">No Blocked Users</h3>
                            <p className="text-sm text-gray-400 mt-1">The platform is clean! All accounts are currently active.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <ConfirmDialog
                isOpen={showUnblockConfirm}
                onClose={() => setShowUnblockConfirm(false)}
                onConfirm={handleUnblock}
                title="Unblock User"
                message={`Are you sure you want to restore access for "${userToUnblock?.name}"? They will be able to sign in and interact with the platform immediately.`}
                confirmText="Yes, Unblock"
                type="info"
                isLoading={isActioning}
            />
        </div>
    );
}
