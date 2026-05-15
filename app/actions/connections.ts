'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Send a friend request
 */
export async function sendFriendRequestAction(encryptedPayload: string) {
  try {
    const { senderId, receiverId } = decryptData(encryptedPayload);
    
    if (!senderId || !receiverId) {
      throw new Error("Sender and Receiver IDs are required.");
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: senderId, receiver_id: receiverId, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;

    // Trigger notification for receiver
    const { data: senderProfile } = await supabase
      .from('teachers')
      .select('full_name')
      .eq('auth_id', senderId)
      .single();

    await supabaseAdmin.from('notifications').insert([{
      user_id: receiverId,
      title: 'New Friend Request',
      message: `${senderProfile?.full_name || 'A teacher'} sent you a friend request.`,
      type: 'friend_request',
      reference_id: data.id,
      action_url: '/connections',
      is_read: false
    }]);

    return encryptData({ success: true, message: "Friend request sent!" });
  } catch (err: any) {
    console.error("❌ [SEND FRIEND REQUEST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequestAction(encryptedPayload: string) {
  try {
    const { requestId, userId } = decryptData(encryptedPayload);

    // 1. Get the request details
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) throw new Error("Request not found.");
    if (request.receiver_id !== userId) throw new Error("Unauthorized.");

    // 2. Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 3. Add to friends table
    const { error: friendError } = await supabase
      .from('friends')
      .insert([{ user_one: request.sender_id, user_two: request.receiver_id }]);

    if (friendError) throw friendError;

    // 4. Notify sender
    const { data: receiverProfile } = await supabase
      .from('teachers')
      .select('full_name')
      .eq('auth_id', request.receiver_id)
      .single();

    await supabaseAdmin.from('notifications').insert([{
      user_id: request.sender_id,
      title: 'Friend Request Accepted',
      message: `${receiverProfile?.full_name || 'A teacher'} accepted your friend request.`,
      type: 'friend_request_accepted',
      reference_id: requestId,
      action_url: '/connections',
      is_read: false
    }]);

    return encryptData({ success: true, message: "Friend request accepted!" });
  } catch (err: any) {
    console.error("❌ [ACCEPT FRIEND REQUEST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Ignore/Reject a friend request
 */
export async function rejectFriendRequestAction(encryptedPayload: string) {
  try {
    const { requestId, userId } = decryptData(encryptedPayload);

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;

    return encryptData({ success: true, message: "Friend request ignored." });
  } catch (err: any) {
    console.error("❌ [REJECT FRIEND REQUEST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequestAction(encryptedPayload: string) {
  try {
    const { requestId, userId } = decryptData(encryptedPayload);

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('sender_id', userId);

    if (error) throw error;

    return encryptData({ success: true, message: "Request cancelled." });
  } catch (err: any) {
    console.error("❌ [CANCEL FRIEND REQUEST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Follow an institution
 */
export async function followInstitutionAction(encryptedPayload: string) {
  try {
    const { userId, institutionId } = decryptData(encryptedPayload);

    const { error } = await supabase
      .from('institution_followers')
      .insert([{ user_id: userId, institution_id: institutionId }]);

    if (error) throw error;

    return encryptData({ success: true, message: "Following institution!" });
  } catch (err: any) {
    console.error("❌ [FOLLOW INSTITUTION ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Unfollow an institution
 */
export async function unfollowInstitutionAction(encryptedPayload: string) {
  try {
    const { userId, institutionId } = decryptData(encryptedPayload);

    const { error } = await supabase
      .from('institution_followers')
      .delete()
      .eq('user_id', userId)
      .eq('institution_id', institutionId);

    if (error) throw error;

    return encryptData({ success: true, message: "Unfollowed institution." });
  } catch (err: any) {
    console.error("❌ [UNFOLLOW INSTITUTION ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Consolidate all initial data in ONE call to reduce network overhead
 */
export async function getInitialConnectionsDataAction(userId: string) {
    try {
        const [summaryRes, teachersRes, instRes, friendsRes] = await Promise.all([
            getConnectionsSummaryAction(userId, true),
            searchTeachersAction("", true),
            getInstitutionsWithFollowersAction(userId, true),
            getFriendsAction(userId, true)
        ]);

        return encryptData({
            success: true,
            data: {
                summary: summaryRes,
                teachers: teachersRes,
                institutions: instRes,
                friends: friendsRes
            }
        });
    } catch (err: any) {
        console.error("❌ [GET INITIAL DATA ERROR]:", err.message);
        return encryptData({ success: false, message: err.message });
    }
}

/**
 * Search teachers
 */
export async function searchTeachersAction(query: string = '', internal: boolean = false) {
  try {
    // 1. Fetch teachers - simplified for visibility
    let q = supabase
      .from('teachers')
      .select('*')
      .eq('is_deleted', false);

    if (query) {
      q = q.or(`full_name.ilike.%${query}%,specialization.ilike.%${query}%,qualification.ilike.%${query}%`);
    }

    const { data: teachers, error: teacherError } = await q.limit(100);
    if (teacherError) throw teacherError;

    if (!teachers || teachers.length === 0) {
        return internal ? [] : encryptData({ success: true, data: [] });
    }

    const authIds = teachers.map(t => t.auth_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, profile_pic_url, headline, location')
      .in('user_id', authIds);

    const data = teachers.map(t => ({
      ...t,
      profiles: profiles?.find(p => p.user_id === t.auth_id) || null
    }));

    return internal ? data : encryptData({ success: true, data });
  } catch (err: any) {
    console.error("❌ [SEARCH TEACHERS ERROR]:", err.message);
    return internal ? [] : encryptData({ success: false, message: err.message });
  }
}

/**
 * Get institutions with follower counts
 */
export async function getInstitutionsWithFollowersAction(userId: string, internal: boolean = false) {
  try {
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('*')
      .eq('is_active', true)
      .not('auth_id', 'is', null);

    if (instError) throw instError;

    const authIds = institutions.map(i => i.auth_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, profile_pic_url, location')
      .in('user_id', authIds);

    const { data: follows, error: followError } = await supabase
      .from('institution_followers')
      .select('*');

    if (followError) throw followError;

    const data = institutions.map(inst => {
      const followers = follows.filter(f => f.institution_id === inst.id);
      const profile = profiles?.find(p => p.user_id === inst.auth_id);
      return {
        ...inst,
        logo_url: profile?.profile_pic_url || null,
        location: inst.address || profile?.location || null,
        follower_count: followers.length,
        is_following: followers.some(f => f.user_id === userId)
      };
    });

    return internal ? data : encryptData({ success: true, data });
  } catch (err: any) {
    console.error("❌ [GET INSTITUTIONS ERROR]:", err.message);
    return internal ? [] : encryptData({ success: false, message: err.message });
  }
}

/**
 * Get Connections Summary for a user
 */
export async function getConnectionsSummaryAction(userId: string, internal: boolean = false) {
  try {
    // 1. Friends list count
    const { count, error: friendsError } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .or(`user_one.eq.${userId},user_two.eq.${userId}`);

    if (friendsError) throw friendsError;

    // 2. Incoming requests
    const { data: incoming, error: incomingError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (incomingError) throw incomingError;

    // Optimized Batch Fetching for Incoming Requests
    let incomingWithDetails: any[] = [];
    if (incoming && incoming.length > 0) {
        const senderIds = incoming.map(req => req.sender_id);
        
        const { data: teachers } = await supabase
            .from('teachers')
            .select('*')
            .in('auth_id', senderIds);
            
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, profile_pic_url, headline')
            .in('user_id', senderIds);
            
        incomingWithDetails = incoming.map(req => {
            const t = teachers?.find(teacher => teacher.auth_id === req.sender_id);
            const p = profiles?.find(prof => prof.user_id === req.sender_id);
            return {
                ...req,
                sender: { ...t, profiles: p || null }
            };
        });
    }

    // 3. Sent requests
    const { data: sent, error: sentError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) throw sentError;

    // Optimized Batch Fetching for Sent Requests
    let sentWithDetails: any[] = [];
    if (sent && sent.length > 0) {
        const receiverIds = sent.map(req => req.receiver_id);
        
        const { data: teachers } = await supabase
            .from('teachers')
            .select('*')
            .in('auth_id', receiverIds);
            
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, profile_pic_url, headline')
            .in('user_id', receiverIds);
            
        sentWithDetails = sent.map(req => {
            const t = teachers?.find(teacher => teacher.auth_id === req.receiver_id);
            const p = profiles?.find(prof => prof.user_id === req.receiver_id);
            return {
                ...req,
                receiver: { ...t, profiles: p || null }
            };
        });
    }

    const result = {
        friendsCount: count || 0,
        incomingRequests: incomingWithDetails,
        sentRequests: sentWithDetails
    };

    return internal ? result : encryptData({ success: true, data: result });
  } catch (err: any) {
    console.error("❌ [GET SUMMARY ERROR]:", err.message);
    return internal ? { friendsCount: 0, incomingRequests: [], sentRequests: [] } : encryptData({ success: false, message: err.message });
  }
}

/**
 * Get Friends list for a user
 */
export async function getFriendsAction(userId: string, internal: boolean = false) {
  try {
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_one.eq.${userId},user_two.eq.${userId}`);

    if (friendsError) throw friendsError;

    const friendIds = friends.map(f => f.user_one === userId ? f.user_two : f.user_one).filter(Boolean);

    if (friendIds.length === 0) return internal ? [] : encryptData({ success: true, data: [] });

    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .in('auth_id', friendIds);

    if (teacherError) throw teacherError;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, profile_pic_url, headline')
      .in('user_id', friendIds);

    const data = teachers.map(t => ({
      ...t,
      profiles: profiles?.find(p => p.user_id === t.auth_id) || null
    }));

    return internal ? data : encryptData({ success: true, data });
  } catch (err: any) {
    console.error("❌ [GET FRIENDS ERROR]:", err.message);
    return internal ? [] : encryptData({ success: false, message: err.message });
  }
}
