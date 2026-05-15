'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * SECURE ACTION: Create a new report for a message.
 */
export async function createReportAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        if (!payload || !payload.messageId || !payload.reporterId || !payload.reason) {
            throw new Error("Invalid report data.");
        }

        const { data, error } = await supabase
            .from('reports')
            .insert([{
                message_id: payload.messageId,
                reporter_id: payload.reporterId,
                reported_id: payload.reportedId,
                reason: payload.reason,
                description: payload.description || '',
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [CREATE REPORT ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * SECURE ACTION: Get all reports for Super Admin.
 */
export async function getReportsAction() {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                message:message_id(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch details for reporter and reported users from teachers and institutions
        const userIds = [...new Set([
            ...data.map((r: any) => r.reporter_id),
            ...data.map((r: any) => r.reported_id)
        ])];

        const [{ data: teachers }, { data: institutions }] = await Promise.all([
            supabase.from('teachers').select('auth_id, full_name, email, role_type').in('auth_id', userIds),
            supabase.from('institutions').select('auth_id, name, email, role_type').in('auth_id', userIds)
        ]);

        const userMap: Record<string, any> = {};
        teachers?.forEach((t: any) => userMap[t.auth_id] = { name: t.full_name, email: t.email, role: 'teacher' });
        institutions?.forEach((i: any) => userMap[i.auth_id] = { name: i.name, email: i.email, role: 'institution' });

        const enrichedData = data.map((r: any) => ({
            ...r,
            reporter: userMap[r.reporter_id] || { name: 'Unknown User', email: 'N/A', role: 'N/A' },
            reported: userMap[r.reported_id] || { name: 'Unknown User', email: 'N/A', role: 'N/A' }
        }));

        return encryptData({ success: true, data: enrichedData });
    } catch (err: any) {
        console.error("❌ [GET REPORTS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * SECURE ACTION: Resolve or dismiss a report.
 */
export async function updateReportStatusAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        if (!payload || !payload.reportId || !payload.status) {
            throw new Error("Invalid status update data.");
        }

        const { error } = await supabase
            .from('reports')
            .update({ status: payload.status })
            .eq('id', payload.reportId);

        if (error) throw error;

        return encryptData({ success: true });
    } catch (err: any) {
        console.error("❌ [UPDATE REPORT STATUS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * SECURE ACTION: Block a user (teacher or institution).
 */
export async function blockUserAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        if (!payload || !payload.userId || !payload.role) {
            throw new Error("Invalid blocking data.");
        }

        const table = payload.role === 'teacher' ? 'teachers' : 'institutions';
        
        const { error } = await supabase
            .from(table)
            .update({ is_active: false })
            .eq('auth_id', payload.userId);

        if (error) throw error;

        // Optionally, we could also disable their auth account using supabaseAdmin
        await supabaseAdmin.auth.admin.updateUserById(payload.userId, {
            user_metadata: { is_blocked: true }
        });

        return encryptData({ success: true, message: `User blocked successfully.` });
    } catch (err: any) {
        console.error("❌ [BLOCK USER ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
/**
 * SECURE ACTION: Get all blocked users (teachers and institutions).
 */
export async function getBlockedUsersAction() {
    try {
        const [{ data: blockedTeachers }, { data: blockedInstitutions }] = await Promise.all([
            supabaseAdmin.from('teachers').select('*').eq('is_active', false).eq('is_deleted', false),
            supabaseAdmin.from('institutions').select('*').eq('is_active', false).eq('is_deleted', false)
        ]);

        const blockedUsers = [
            ...(blockedTeachers || []).map((t: any) => ({ ...t, role: 'teacher', name: t.full_name })),
            ...(blockedInstitutions || []).map((i: any) => ({ ...i, role: 'institution', name: i.name }))
        ];

        return encryptData({ success: true, data: blockedUsers });
    } catch (err: any) {
        console.error("❌ [GET BLOCKED USERS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * SECURE ACTION: Unblock a user.
 */
export async function unblockUserAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        if (!payload || !payload.userId || !payload.role) {
            throw new Error("Invalid unblocking data.");
        }

        const table = payload.role === 'teacher' ? 'teachers' : 'institutions';
        
        const { error } = await supabaseAdmin
            .from(table)
            .update({ is_active: true })
            .eq('auth_id', payload.userId);

        if (error) throw error;

        // Also update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(payload.userId, {
            user_metadata: { is_blocked: false }
        });

        return encryptData({ success: true, message: `User unblocked successfully.` });
    } catch (err: any) {
        console.error("❌ [UNBLOCK USER ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
