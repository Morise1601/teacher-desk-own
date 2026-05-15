'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Creates a new notification in the database.
 */
export async function createNotificationAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        const { user_id, title, message, type, action_url } = payload;

        if (!user_id || !title || !message) {
            throw new Error("Missing required notification fields.");
        }

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert([{
                user_id,
                title,
                message,
                type: type || 'info',
                action_url: action_url || null,
                is_read: false
            }])
            .select()
            .single();

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [CREATE NOTIFICATION ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Fetches all notifications for a specific user.
 */
export async function getUserNotificationsAction(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required.");

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [FETCH NOTIFICATIONS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Marks a notification as read.
 */
export async function markAsReadAction(notificationId: string) {
    try {
        if (!notificationId) throw new Error("Notification ID is required.");

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        return encryptData({ success: true });
    } catch (err: any) {
        console.error("❌ [MARK READ ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsReadAction(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required.");

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);

        if (error) throw error;

        return encryptData({ success: true });
    } catch (err: any) {
        console.error("❌ [MARK ALL READ ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
