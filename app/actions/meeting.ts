'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Creates a new scheduled meeting in the database.
 */
export async function createMeetingAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        const { title, subject, meeting_date, start_time, meet_link, teacher_id, classroom_id } = payload;

        if (!title || !meeting_date || !start_time || !teacher_id) {
            throw new Error("Missing required meeting fields.");
        }

        const { data, error } = await supabaseAdmin
            .from('meetings')
            .insert([{
                title,
                subject,
                meeting_date,
                start_time,
                meet_link,
                teacher_id,
                classroom_id: classroom_id || null
            }])
            .select()
            .single();

        if (error) throw error;

        // Auto-generate notification
        await supabaseAdmin
            .from('notifications')
            .insert([{
                user_id: teacher_id,
                title: 'Meeting Scheduled',
                message: `Your session "${title}" has been successfully scheduled for ${meeting_date} at ${start_time}.`,
                type: 'meeting',
                action_url: `/classroom/calendar`,
                is_read: false
            }]);

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [CREATE MEETING ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Fetches all scheduled meetings for a specific teacher.
 */
export async function getTeacherMeetingsAction(teacherId: string) {
    try {
        if (!teacherId) throw new Error("Teacher ID is required.");

        const { data, error } = await supabaseAdmin
            .from('meetings')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('meeting_date', { ascending: true });

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [FETCH MEETINGS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Deletes a scheduled meeting.
 */
export async function deleteMeetingAction(meetingId: string) {
    try {
        if (!meetingId) throw new Error("Meeting ID is required.");

        const { error } = await supabaseAdmin
            .from('meetings')
            .delete()
            .eq('id', meetingId);

        if (error) throw error;

        return encryptData({ success: true });
    } catch (err: any) {
        console.error("❌ [DELETE MEETING ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Updates an existing scheduled meeting.
 */
export async function updateMeetingAction(encryptedPayload: string) {
    try {
        const payload = decryptData(encryptedPayload);
        const { id, title, subject, meeting_date, start_time } = payload;

        if (!id) throw new Error("Meeting ID is required for update.");

        const { data, error } = await supabaseAdmin
            .from('meetings')
            .update({
                title,
                subject,
                meeting_date,
                start_time,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [UPDATE MEETING ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
