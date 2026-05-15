'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Fetch all available contacts (Friends + Followed Institutions)
 */
export async function getChatContactsAction(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required.");

        // 1. Fetch Friends
        const { data: friendsData, error: friendsError } = await supabase
            .from('friends')
            .select('user_one, user_two')
            .or(`user_one.eq.${userId},user_two.eq.${userId}`);

        if (friendsError) throw friendsError;

        const friendIds = friendsData.map(f => f.user_one === userId ? f.user_two : f.user_one);

        // 2. Fetch Followed Institutions
        const { data: followedInstData, error: instError } = await supabase
            .from('institution_followers')
            .select('institution_id')
            .eq('user_id', userId);

        if (instError) throw instError;

        const institutionIds = followedInstData.map(f => f.institution_id);

        // Fetch auth_ids for the institutions the user follows
        const { data: followedInstAuthData } = await supabase
            .from('institutions')
            .select('auth_id')
            .in('id', institutionIds);
        
        const instAuthIds = (followedInstAuthData || []).map(i => i.auth_id).filter(Boolean) as string[];

        // 5. Get all other conversation partners (including Super Admin)
        const { data: convHistory } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        const historyIds = [...new Set((convHistory || []).flatMap(m => [m.sender_id, m.receiver_id]))]
            .filter(id => id !== userId);

        const allRelevantIds = [...new Set([...friendIds, ...instAuthIds, ...historyIds])];

        // 6. Get Details for all relevant IDs
        const [{ data: teachers }, { data: institutions }, { data: superAdmins }, { data: profiles }] = await Promise.all([
            supabase.from('teachers').select('auth_id, full_name, specialization').in('auth_id', allRelevantIds),
            supabase.from('institutions').select('auth_id, name').in('auth_id', allRelevantIds),
            supabase.from('super_admins').select('auth_id').in('auth_id', allRelevantIds),
            supabase.from('profiles').select('user_id, profile_pic_url, last_seen').in('user_id', allRelevantIds)
        ]);

        const profileMap: Record<string, any> = {};
        teachers?.forEach(t => profileMap[t.auth_id] = { name: t.full_name, role: t.specialization || 'Teacher' });
        institutions?.forEach(i => profileMap[i.auth_id] = { name: i.name, role: 'Institution' });
        superAdmins?.forEach(s => profileMap[s.auth_id] = { name: 'Administration', role: 'Official Support' });

        const avatarMap: Record<string, string> = {};
        profiles?.forEach(p => avatarMap[p.user_id] = p.profile_pic_url || '');

        const allContacts = allRelevantIds.map(id => {
            const profile = profiles?.find(p => p.user_id === id);
            // We consider online if last_seen is within 5 minutes
            const isOnline = profile?.last_seen 
                ? (new Date().getTime() - new Date(profile.last_seen).getTime()) < 5 * 60 * 1000 
                : false;

            return {
                id,
                sender: profileMap[id]?.name || 'Unknown User',
                avatar: avatarMap[id] || '',
                role: profileMap[id]?.role || 'Member',
                type: 'user',
                isOnline: isOnline,
                lastMessage: '',
                time: '',
                unread: 0
            };
        });
        const contactIds = allContacts.map(c => c.id);

        if (contactIds.length > 0) {
            // Fetch last message for each contact to show in sidebar
            // This is complex in a single query without a 'conversations' table, 
            // so we'll fetch the most recent messages for the user.
            const { data: lastMessages } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            allContacts.forEach(contact => {
                const lastMsg = lastMessages?.find(m => 
                    (m.sender_id === userId && m.receiver_id === contact.id) ||
                    (m.sender_id === contact.id && m.receiver_id === userId)
                );
                contact.lastMessage = lastMsg ? lastMsg.content : 'No messages yet';
                contact.time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                contact.unread = lastMessages?.filter(m => m.sender_id === contact.id && m.receiver_id === userId && !m.is_read).length || 0;
                // Add a timestamp for sorting
                (contact as any).lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
            });

            // Sort contacts: Unread first, then by last message time
            allContacts.sort((a: any, b: any) => {
                if (b.unread !== a.unread) return b.unread - a.unread;
                return (b.lastMsgTime || 0) - (a.lastMsgTime || 0);
            });
        }

        return encryptData({ success: true, data: allContacts });
    } catch (err: any) {
        console.error("❌ [GET CHAT CONTACTS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Fetch message history between two users
 */
export async function getMessagesAction(userId: string, contactId: string) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*, reply_to:reply_to_id(content, sender_id)')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
            .not('deleted_for', 'cs', `{${userId}}`) // Filter out messages deleted by the user
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', contactId)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [GET MESSAGES ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Send a message
 */
export async function sendMessageAction(encryptedPayload: string) {
    try {
        const { senderId, receiverId, content, replyToId, isForwarded, attachments } = decryptData(encryptedPayload);

        const { data, error } = await supabase
            .from('messages')
            .insert([{ 
                sender_id: senderId, 
                receiver_id: receiverId, 
                content: content || "",
                reply_to_id: replyToId || null,
                is_forwarded: isForwarded || false,
                attachments: attachments || []
            }])
            .select('*, reply_to:reply_to_id(content, sender_id)')
            .single();

        if (error) throw error;

        // Optional: Create notification for receiver
        // await supabaseAdmin.from('notifications').insert([{...}]);

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [SEND MESSAGE ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Handle secure file uploads for chat attachments using Server Action
 */
export async function uploadAttachmentAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string;
        
        if (!file || !fileName) throw new Error("File or fileName missing in formdata.");

        const { error } = await supabaseAdmin.storage
            .from('chat_files')
            .upload(fileName, file);

        if (error) {
            console.error("Upload error:", error);
            throw error;
        }

        const { data } = supabaseAdmin.storage.from('chat_files').getPublicUrl(fileName);
        return { success: true, url: data.publicUrl };
    } catch (err: any) {
        console.error("❌ [UPLOAD ATTACHMENT ERROR]:", err.message);
        return { success: false, message: err.message };
    }
}

/**
 * Edit a message
 */
export async function editMessageAction(encryptedPayload: string) {
    try {
        const { messageId, newContent, senderId } = decryptData(encryptedPayload);

        const { data, error } = await supabase
            .from('messages')
            .update({ content: newContent, is_edited: true })
            .eq('id', messageId)
            .eq('sender_id', senderId)
            .select('*, reply_to:reply_to_id(content, sender_id)')
            .single();

        if (error) throw error;

        return encryptData({ success: true, data });
    } catch (err: any) {
        console.error("❌ [EDIT MESSAGE ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Delete a message
 */
export async function deleteMessageAction(encryptedPayload: string) {
    try {
        const { messageId, userId, deleteType } = decryptData(encryptedPayload);

        if (deleteType === 'everyone') {
            // "Delete for Everyone" - only sender can do this
            const { data, error } = await supabase
                .from('messages')
                .update({ 
                    content: "This message was deleted", 
                    is_deleted_for_everyone: true,
                    attachments: [] // Clear attachments for everyone
                })
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select('*, reply_to:reply_to_id(content, sender_id)')
                .single();

            if (error) throw error;
            return encryptData({ success: true, data });
        } else {
            // "Delete for Me" - add user to deleted_for array
            // We use RPC for atomic array update or fetch and update
            const { data: msg, error: fetchError } = await supabase
                .from('messages')
                .select('deleted_for')
                .eq('id', messageId)
                .single();
            
            if (fetchError) throw fetchError;

            const currentDeletedFor = msg?.deleted_for || [];
            if (!currentDeletedFor.includes(userId)) {
                const { data, error } = await supabase
                    .from('messages')
                    .update({ deleted_for: [...currentDeletedFor, userId] })
                    .eq('id', messageId)
                    .select('*, reply_to:reply_to_id(content, sender_id)')
                    .single();

                if (error) throw error;
                return encryptData({ success: true, data });
            }
            return encryptData({ success: true });
        }
    } catch (err: any) {
        console.error("❌ [DELETE MESSAGE ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
/**
 * Fetch all available contacts for Super Admin (All Teachers + All Institutions)
 */
export async function getAdminGlobalContactsAction(userId: string) {
    try {
        if (!userId) throw new Error("User ID is required.");

        // 1. Fetch ALL active teachers
        const { data: teachers, error: tError } = await supabase
            .from('teachers')
            .select('auth_id, full_name, specialization')
            .eq('is_active', true)
            .eq('is_deleted', false);

        if (tError) throw tError;

        // 2. Fetch ALL active institutions with auth accounts
        const { data: insts, error: iError } = await supabase
            .from('institutions')
            .select('auth_id, name')
            .eq('is_active', true)
            .eq('is_deleted', false)
            .not('auth_id', 'is', null); // Only ones we can actually message

        if (iError) throw iError;

        const teacherAuthIds = (teachers || []).map(t => t.auth_id);
        const instAuthIds = (insts || []).map(i => i.auth_id).filter(Boolean) as string[];
        const allAuthIds = [...new Set([...teacherAuthIds, ...instAuthIds])];

        // 3. Fetch profiles for avatars
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, profile_pic_url, last_seen')
            .in('user_id', allAuthIds);

        const profileMap: Record<string, string> = {};
        profiles?.forEach(p => profileMap[p.user_id] = p.profile_pic_url || '');

        // 4. Map Teachers
        const teacherContacts = (teachers || []).map(t => ({
            id: t.auth_id,
            sender: t.full_name,
            avatar: profileMap[t.auth_id] || '',
            role: t.specialization || 'Teacher',
            type: 'user',
            category: 'teacher',
            isOnline: false,
            lastMessage: '',
            time: '',
            unread: 0,
            lastMsgTime: 0
        }));

        // 5. Map Institutions
        const institutionContacts = (insts || []).map(i => ({
            id: i.auth_id,
            sender: i.name,
            avatar: profileMap[i.auth_id || ''] || '',
            role: 'Educational Institution',
            type: 'user',
            category: 'institution',
            isOnline: false,
            lastMessage: '',
            time: '',
            unread: 0,
            lastMsgTime: 0
        }));

        // 6. Get last messages to show recent activity
        const { data: lastMessages } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        const allContacts = [...teacherContacts, ...institutionContacts];

        allContacts.forEach(contact => {
            const lastMsg = lastMessages?.find(m => 
                (m.sender_id === userId && m.receiver_id === contact.id) ||
                (m.sender_id === contact.id && m.receiver_id === userId)
            );
            const profile = profiles?.find(p => p.user_id === contact.id);
            
            contact.lastMessage = lastMsg ? lastMsg.content : 'No messages yet';
            contact.time = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            contact.unread = lastMessages?.filter(m => m.sender_id === contact.id && m.receiver_id === userId && !m.is_read).length || 0;
            
            // Online logic based on last_seen
            contact.isOnline = profile?.last_seen 
                ? (new Date().getTime() - new Date(profile.last_seen).getTime()) < 5 * 60 * 1000 
                : false;

            contact.lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
        });

        // Sort by unread first, then by last message time
        allContacts.sort((a, b) => {
            if (b.unread !== a.unread) return b.unread - a.unread;
            return (b.lastMsgTime || 0) - (a.lastMsgTime || 0);
        });

        return encryptData({ success: true, data: allContacts });
    } catch (err: any) {
        console.error("❌ [GET ADMIN CONTACTS ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}
/**
 * Mark all messages from a specific contact as read
 */
export async function markMessagesAsReadAction(userId: string, contactId: string) {
    try {
        if (!userId || !contactId) return encryptData({ success: false });

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', contactId)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return encryptData({ success: true });
    } catch (err: any) {
        console.error("❌ [MARK AS READ ERROR]:", err.message);
        return encryptData({ success: false });
    }
}
