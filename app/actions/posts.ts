'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * Helper to validate image file size and format.
 */
function validateImage(fileName: string, base64Str: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp'];
  if (!ext || !allowed.includes(ext)) {
    throw new Error(`Unsupported image format: .${ext}. Supported: JPG, JPEG, PNG, WEBP`);
  }
  // Base64 size estimation
  const sizeInBytes = (base64Str.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    throw new Error("Image file size exceeds maximum limit of 5MB.");
  }
}

/**
 * Helper to validate PDF file size and format.
 */
function validatePDF(fileName: string, base64Str: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') {
    throw new Error("Only PDF resources are supported.");
  }
  // Base64 size estimation
  const sizeInBytes = (base64Str.length * 3) / 4;
  if (sizeInBytes > 10 * 1024 * 1024) {
    throw new Error("PDF file size exceeds maximum limit of 10MB.");
  }
}

/**
 * Creates a new Post (text, image, PDF, poll, repost).
 */
export async function createPostAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    const { 
      userId, 
      postType, 
      content, 
      visibility, 
      classroomId, 
      institutionId, 
      repostPostId, 
      files, // Array of { base64: string, name: string }
      poll, // { question: string, options: string[], expiresAt: string, allowMultiple?: boolean }
      tags // Array of { imageIndex: number, tagged_user_id: string, x: number, y: number }
    } = payload;

    if (!userId) {
      throw new Error("Authentication user ID is required.");
    }
    if (!postType || !['text', 'image', 'resource', 'poll', 'repost'].includes(postType)) {
      throw new Error("Invalid post type.");
    }
    if (!visibility || !['public', 'network', 'institution', 'classroom'].includes(visibility)) {
      throw new Error("Invalid visibility setting.");
    }

    // Classroom specific validations
    if (visibility === 'classroom' && !classroomId) {
      throw new Error("Classroom ID is required for classroom visible posts.");
    }
    if (visibility === 'classroom' && classroomId) {
      // Validate classroom membership
      const { data: membership, error: memErr } = await supabaseAdmin
        .from('classroom_members')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('user_id', userId)
        .single();
      if (memErr || !membership) {
        throw new Error("Access denied: You are not a member of this classroom.");
      }
    }

    // Content character limit validation
    if (content && content.length > 3000) {
      throw new Error("Post content exceeds 3000 character limit.");
    }
    if (postType === 'text' && (!content || content.trim().length === 0)) {
      throw new Error("Content cannot be empty for text posts.");
    }

    // Ensure the profile exists in public.profiles table to prevent foreign key violation
    const { data: existingProfile, error: profileGetErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      console.log(`ℹ️ [AUTO PROFILE CREATION]: No profile found for user ${userId}. Initializing profile...`);
      // Get role from auth
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const role = userData?.user?.user_metadata?.role || 'teacher';

      // Verify if they are in institutions or teachers table
      let profileRole = role;
      if (!role || role === 'teacher') {
        const { data: inst } = await supabaseAdmin.from('institutions').select('role_type').eq('auth_id', userId).maybeSingle();
        if (inst) {
          profileRole = inst.role_type || 'institution_admin';
        }
      }

      const initialProfile = {
        user_id: userId,
        role: profileRole,
        headline: '',
        about: '',
        location: '',
        profile_pic_url: '',
        experience: [],
        education: [],
        skills: [],
        specializations: [],
        volunteering: [],
        languages: [],
        interests: [],
        papers_presented: []
      };

      const { error: profileCreateErr } = await supabaseAdmin
        .from('profiles')
        .insert([initialProfile]);

      if (profileCreateErr) {
        console.error("❌ [AUTO PROFILE CREATION FAILED]:", profileCreateErr.message);
        throw new Error(`Failed to initialize profile: ${profileCreateErr.message}`);
      }
    }

    // 1. Insert base post
    const { data: postRecord, error: postErr } = await supabaseAdmin
      .from('posts')
      .insert([{
        user_id: userId,
        institution_id: institutionId || null,
        post_type: postType,
        content: content || '',
        visibility,
        classroom_id: classroomId || null,
        repost_post_id: repostPostId || null
      }])
      .select()
      .single();

    if (postErr || !postRecord) {
      throw new Error(`Failed to create post record: ${postErr?.message}`);
    }

    const postId = postRecord.id;

    // 2. Handle images post type
    if (postType === 'image') {
      if (!files || files.length === 0) {
        throw new Error("At least one image is required for image posts.");
      }
      if (files.length > 5) {
        throw new Error("A maximum of 5 images are allowed per post.");
      }

      let imgIndex = 0;
      for (const file of files) {
        validateImage(file.name, file.base64);

        const base64Data = file.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${userId}/${postId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('post-images')
          .upload(filePath, buffer, {
            contentType: `image/${ext}`,
            upsert: true
          });

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('post-images')
          .getPublicUrl(filePath);

        // Save reference in post_media and get ID for tagging
        const { data: mediaRecord, error: mediaErr } = await supabaseAdmin
          .from('post_media')
          .insert([{
            post_id: postId,
            file_url: publicUrl,
            file_type: `image/${ext}`,
            file_name: file.name
          }])
          .select()
          .single();

        if (mediaErr) throw new Error(`Failed to save post media: ${mediaErr.message}`);

        // Insert tags for this specific image if present
        if (mediaRecord && tags && tags.length > 0) {
          const imageTags = tags.filter((t: any) => t.imageIndex === imgIndex);
          if (imageTags.length > 0) {
            const tagsToInsert = imageTags.map((t: any) => ({
              post_id: postId,
              post_media_id: mediaRecord.id,
              tagged_user_id: t.tagged_user_id,
              x: t.x,
              y: t.y
            }));
            const { error: tagInsertErr } = await supabaseAdmin
              .from('post_tags')
              .insert(tagsToInsert);
            if (tagInsertErr) {
              console.error("❌ [TAG INSERT ERROR]:", tagInsertErr.message);
            }
          }
        }

        imgIndex++;
      }
    }

    // 3. Handle resource/PDF post type
    if (postType === 'resource') {
      if (!files || files.length !== 1) {
        throw new Error("Exactly one PDF file must be attached for resource sharing.");
      }
      const file = files[0];
      validatePDF(file.name, file.base64);

      const base64Data = file.base64.replace(/^data:application\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Sanitize filename to prevent invalid key error on Supabase Storage (e.g. from special/unicode characters)
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');
      const filePath = `${userId}/${postId}_${Date.now()}_${cleanFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('post-resources')
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('post-resources')
        .getPublicUrl(filePath);

      // Save reference in post_media
      await supabaseAdmin.from('post_media').insert([{
        post_id: postId,
        file_url: publicUrl,
        file_type: 'application/pdf',
        file_name: file.name
      }]);
    }

    // 4. Handle poll post type
    if (postType === 'poll') {
      if (!poll || !poll.question) {
        throw new Error("Poll configuration is required.");
      }
      if (!poll.options || poll.options.length < 2) {
        throw new Error("A poll requires at least 2 options.");
      }
      if (poll.options.length > 5) {
        throw new Error("A poll can have a maximum of 5 options.");
      }
      if (!poll.expiresAt) {
        throw new Error("Poll expiration date is required.");
      }

      // Insert poll metadata
      const { data: pollRecord, error: pollErr } = await supabaseAdmin
        .from('post_polls')
        .insert([{
          post_id: postId,
          question: poll.question,
          expires_at: poll.expiresAt,
          allow_multiple: poll.allowMultiple || false
        }])
        .select()
        .single();

      if (pollErr || !pollRecord) {
        throw new Error(`Failed to create poll parameters: ${pollErr?.message}`);
      }

      // Insert options
      const optionRecords = poll.options.map((optText: string) => ({
        poll_id: pollRecord.id,
        option_text: optText
      }));

      const { error: optErr } = await supabaseAdmin
        .from('poll_options')
        .insert(optionRecords);

      if (optErr) throw new Error(`Failed to create poll options: ${optErr.message}`);
    }

    // 5. Handle repost post type
    if (postType === 'repost') {
      if (!repostPostId) {
        throw new Error("Original post ID is required for reposting.");
      }
      // Log repost interaction for notification trigger
      await supabaseAdmin.from('reposts').insert([{
        user_id: userId,
        original_post_id: repostPostId,
        commentary: content || ''
      }]);
    }

    // 6. Handle post-level (coordinate-free) tags
    if (tags && tags.length > 0) {
      const postLevelTags = tags.filter((t: any) => t.imageIndex === undefined || t.imageIndex === null || t.imageIndex === -1);
      if (postLevelTags.length > 0) {
        const tagsToInsert = postLevelTags.map((t: any) => ({
          post_id: postId,
          post_media_id: null,
          tagged_user_id: t.tagged_user_id,
          x: null,
          y: null
        }));
        const { error: tagInsertErr } = await supabaseAdmin
          .from('post_tags')
          .insert(tagsToInsert);
        if (tagInsertErr) {
          console.error("❌ [POST LEVEL TAG INSERT ERROR]:", tagInsertErr.message);
        }
      }
    }

    // Return the completed post data
    return encryptData({ success: true, postId });
  } catch (err: any) {
    console.error("❌ [CREATE POST ACTION ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Fetches the Social Feed with visibility, sorting, filters, and pagination.
 */
export async function getFeedAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    const { userId, filter, sortBy, cursor, limit, classroomId } = payload;

    if (!userId) throw new Error("User ID is required to compile feed.");

    // Retrieve visible posts from PG RPC function
    const { data: posts, error } = await supabaseAdmin.rpc('get_visible_posts', {
      p_user_id: userId,
      p_filter: filter || 'all',
      p_sort_by: sortBy || 'latest',
      p_cursor: cursor || null,
      p_limit: limit || 10,
      p_classroom_id: classroomId || null
    });

    if (error) throw error;

    return encryptData({ success: true, data: posts || [] });
  } catch (err: any) {
    console.error("❌ [GET FEED ACTION ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Toggles a post like status (Like / Unlike).
 */
export async function likePostAction(encryptedPayload: string) {
  try {
    const { userId, postId } = decryptData(encryptedPayload);
    if (!userId || !postId) throw new Error("User ID and Post ID are required.");

    // Check if like exists
    const { data: existingLike } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
      return encryptData({ success: true, liked: false });
    } else {
      // Like
      const { error } = await supabaseAdmin
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }]);
      if (error) throw error;
      return encryptData({ success: true, liked: true });
    }
  } catch (err: any) {
    console.error("❌ [LIKE POST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Adds a comment to a post.
 */
export async function commentPostAction(encryptedPayload: string) {
  try {
    const { userId, postId, commentText, parentCommentId } = decryptData(encryptedPayload);
    if (!userId || !postId || !commentText) {
      throw new Error("Missing parameters for comment.");
    }
    if (commentText.length > 500) {
      throw new Error("Comment text exceeds 500 character limit.");
    }

    const { data: comment, error } = await supabaseAdmin
      .from('post_comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        comment_text: commentText,
        parent_comment_id: parentCommentId || null
      }])
      .select(`
        *,
        author_profile:profiles!user_id (
          user_id,
          profile_pic_url,
          headline
        )
      `)
      .single();

    if (error) throw error;

    // Fetch author full name
    let fullName = "Member";
    const { data: teacherData } = await supabaseAdmin
      .from('teachers')
      .select('full_name')
      .eq('auth_id', userId)
      .single();
    
    if (teacherData) {
      fullName = teacherData.full_name;
    } else {
      const { data: instData } = await supabaseAdmin
        .from('institutions')
        .select('name')
        .eq('auth_id', userId)
        .single();
      if (instData) fullName = instData.name;
    }

    const commentWithAuthor = {
      ...comment,
      author_profile: {
        ...comment.author_profile,
        fullName
      }
    };

    return encryptData({ success: true, data: commentWithAuthor });
  } catch (err: any) {
    console.error("❌ [COMMENT POST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Deletes a post comment.
 */
export async function deleteCommentAction(encryptedPayload: string) {
  try {
    const { userId, commentId } = decryptData(encryptedPayload);
    if (!userId || !commentId) throw new Error("Missing deletion identifiers.");

    // Verify ownership or admin
    const { data: comment } = await supabaseAdmin
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment) throw new Error("Comment not found.");

    if (comment.user_id !== userId) {
      // Check admin status
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        throw new Error("Unauthorized deletion request.");
      }
    }

    const { error } = await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return encryptData({ success: true });
  } catch (err: any) {
    console.error("❌ [DELETE COMMENT ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Edits a post comment.
 */
export async function editCommentAction(encryptedPayload: string) {
  try {
    const { userId, commentId, commentText } = decryptData(encryptedPayload);
    if (!userId || !commentId || !commentText) throw new Error("Missing parameters for editing comment.");

    if (commentText.length > 500) {
      throw new Error("Comment text exceeds 500 character limit.");
    }

    const { data: comment } = await supabaseAdmin
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment) throw new Error("Comment not found.");

    if (comment.user_id !== userId) {
      throw new Error("Unauthorized edit request.");
    }

    const { data: updatedComment, error } = await supabaseAdmin
      .from('post_comments')
      .update({
        comment_text: commentText,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;

    return encryptData({ success: true, data: updatedComment });
  } catch (err: any) {
    console.error("❌ [EDIT COMMENT ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}


/**
 * Fetches comments for a specific post.
 */
export async function getPostCommentsAction(postId: string) {
  try {
    if (!postId) throw new Error("Post ID is required.");

    const { data: comments, error } = await supabaseAdmin
      .from('post_comments')
      .select(`
        *,
        author_profile:profiles!user_id (
          user_id,
          profile_pic_url,
          headline
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Batch resolve full names
    const resolvedComments = await Promise.all(comments.map(async (c: any) => {
      let fullName = "Member";
      const { data: teacherData } = await supabaseAdmin
        .from('teachers')
        .select('full_name')
        .eq('auth_id', c.user_id)
        .single();
      
      if (teacherData) {
        fullName = teacherData.full_name;
      } else {
        const { data: instData } = await supabaseAdmin
          .from('institutions')
          .select('name')
          .eq('auth_id', c.user_id)
          .single();
        if (instData) fullName = instData.name;
      }

      return {
        ...c,
        author_profile: {
          ...c.author_profile,
          fullName
        }
      };
    }));

    return encryptData({ success: true, data: resolvedComments });
  } catch (err: any) {
    console.error("❌ [GET COMMENTS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Saves or unsaves a post (Toggles Bookmark).
 */
export async function savePostAction(encryptedPayload: string) {
  try {
    const { userId, postId } = decryptData(encryptedPayload);
    if (!userId || !postId) throw new Error("Parameters missing.");

    const { data: existing } = await supabaseAdmin
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Unsave
      const { error } = await supabaseAdmin
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
      return encryptData({ success: true, saved: false });
    } else {
      // Save
      const { error } = await supabaseAdmin
        .from('saved_posts')
        .insert([{ post_id: postId, user_id: userId }]);
      if (error) throw error;
      return encryptData({ success: true, saved: true });
    }
  } catch (err: any) {
    console.error("❌ [SAVE POST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Casts a vote on a poll option.
 */
export async function votePollAction(encryptedPayload: string) {
  try {
    const { userId, pollOptionId } = decryptData(encryptedPayload);
    if (!userId || !pollOptionId) throw new Error("Parameters missing.");

    // Retrieve poll_id from options
    const { data: option, error: optErr } = await supabaseAdmin
      .from('poll_options')
      .select('poll_id')
      .eq('id', pollOptionId)
      .single();

    if (optErr || !option) throw new Error("Poll option not found.");

    // Verify poll expiration
    const { data: poll, error: pollErr } = await supabaseAdmin
      .from('post_polls')
      .select('expires_at')
      .eq('id', option.poll_id)
      .single();

    if (pollErr || !poll) throw new Error("Poll not found.");

    if (new Date() > new Date(poll.expires_at)) {
      throw new Error("This poll has already expired.");
    }

    // Ensure the voter has a record in public.teachers to prevent database trigger notification crash
    const { data: existingTeacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();

    if (!existingTeacher) {
      const { data: inst } = await supabaseAdmin
        .from('institutions')
        .select('name, email')
        .eq('auth_id', userId)
        .maybeSingle();

      if (inst) {
        console.log(`Creating dummy teacher record for institution voter: ${inst.name}`);
        const { error: dummyErr } = await supabaseAdmin
          .from('teachers')
          .insert([{
            auth_id: userId,
            full_name: inst.name,
            email: inst.email || 'institution@teacherdesk.com',
            gender: 'Other',
            qualification: 'N/A',
            specialization: 'N/A',
            experience: 'N/A',
            is_active: true
          }]);
        if (dummyErr) {
          console.error("❌ Failed to create safeguard teacher record:", dummyErr.message);
        }
      }
    }

    // Insert vote. Unique check trigger check_poll_vote_limit will fail automatically if constraint is violated
    const { error: voteErr } = await supabaseAdmin
      .from('poll_votes')
      .insert([{ poll_option_id: pollOptionId, user_id: userId }]);

    if (voteErr) {
      if (voteErr.message.includes("already voted")) {
        throw new Error("You have already voted in this poll.");
      }
      throw voteErr;
    }

    return encryptData({ success: true });
  } catch (err: any) {
    console.error("❌ [POLL VOTE ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Fetches classrooms where user is a teacher or student.
 */
export async function getClassroomsAction(userId: string) {
  try {
    if (!userId) throw new Error("User ID is required.");

    // Fetch classroom list U is a member of
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('classroom_members')
      .select('classroom_id')
      .eq('user_id', userId);

    if (memErr) throw memErr;

    const classroomIds = memberships.map((m: any) => m.classroom_id);

    // Fetch classes U teaches or is enrolled in
    const { data: classes, error: classErr } = await supabaseAdmin
      .from('classrooms')
      .select('*')
      .or(`teacher_id.eq.${userId},id.in.(${classroomIds.length > 0 ? classroomIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

    if (classErr) throw classErr;

    return encryptData({ success: true, classrooms: classes || [] });
  } catch (err: any) {
    console.error("❌ [GET CLASSROOMS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Deletes a post. Restricted to authors or admins.
 */
export async function deletePostAction(encryptedPayload: string) {
  try {
    const { userId, postId } = decryptData(encryptedPayload);
    if (!userId || !postId) throw new Error("Post ID and User ID are required.");

    // Check ownership
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post) throw new Error("Post not found.");

    if (post.user_id !== userId) {
      // Check admin status
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        throw new Error("Unauthorized deletion request.");
      }
    }

    // 1. Delete associated media files from storage
    const { data: mediaFiles } = await supabaseAdmin
      .from('post_media')
      .select('file_url')
      .eq('post_id', postId);

    if (mediaFiles && mediaFiles.length > 0) {
      for (const m of mediaFiles) {
        // Extract filename from public url
        // Format: .../storage/v1/object/public/post-images/userId/filename
        const parts = m.file_url.split('/');
        const bucket = parts.includes('post-images') ? 'post-images' : 'post-resources';
        const folderIndex = parts.indexOf(bucket);
        if (folderIndex !== -1 && folderIndex + 2 < parts.length) {
          const filePath = parts.slice(folderIndex + 1).join('/');
          await supabaseAdmin.storage.from(bucket).remove([filePath]);
        }
      }
    }

    // 2. Delete database post record (cascades automatically to media, comments, likes, polls)
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    return encryptData({ success: true });
  } catch (err: any) {
    console.error("❌ [DELETE POST ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Searches for users (teachers & institutions) to tag in a post.
 */
export async function searchUsersAction(encryptedPayload: string) {
  try {
    const { query } = decryptData(encryptedPayload);
    if (!query || query.trim().length === 0) {
      return encryptData({ success: true, data: [] });
    }

    const searchQuery = query.trim();

    // Search teachers
    const { data: teachers } = await supabaseAdmin
      .from('teachers')
      .select('auth_id, full_name, role_type')
      .ilike('full_name', `%${searchQuery}%`)
      .limit(10);

    // Search institutions
    const { data: institutions } = await supabaseAdmin
      .from('institutions')
      .select('auth_id, name, role_type')
      .ilike('name', `%${searchQuery}%`)
      .limit(10);

    // Combine results
    const results: any[] = [];
    const userIds: string[] = [];

    if (teachers) {
      teachers.forEach((t: any) => {
        results.push({
          user_id: t.auth_id,
          fullName: t.full_name,
          role: 'teacher',
        });
        userIds.push(t.auth_id);
      });
    }

    if (institutions) {
      institutions.forEach((inst: any) => {
        results.push({
          user_id: inst.auth_id,
          fullName: inst.name,
          role: 'institution',
        });
        userIds.push(inst.auth_id);
      });
    }

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, profile_pic_url, headline')
        .in('user_id', userIds);

      if (profiles) {
        results.forEach((res: any) => {
          const profile = profiles.find((p: any) => p.user_id === res.user_id);
          if (profile) {
            res.profile_pic_url = profile.profile_pic_url;
            res.headline = profile.headline;
          }
        });
      }
    }

    return encryptData({ success: true, data: results });
  } catch (err: any) {
    console.error("❌ [SEARCH USERS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Fetches all tags for a specific post.
 */
export async function getPostTagsAction(postId: string) {
  try {
    if (!postId) throw new Error("Post ID is required.");

    const { data: tags, error } = await supabaseAdmin
      .from('post_tags')
      .select(`
        *,
        tagged_user_profile:profiles!tagged_user_id (
          user_id,
          profile_pic_url,
          headline,
          role
        )
      `)
      .eq('post_id', postId);

    if (error) throw error;

    // Resolve full names for tagged users
    const resolvedTags = await Promise.all((tags || []).map(async (tag: any) => {
      let fullName = "Member";
      const uId = tag.tagged_user_id;
      const role = tag.tagged_user_profile?.role;

      if (role === 'teacher') {
        const { data: teacherData } = await supabaseAdmin
          .from('teachers')
          .select('full_name')
          .eq('auth_id', uId)
          .single();
        if (teacherData) fullName = teacherData.full_name;
      } else if (role === 'institution' || role === 'institution_admin') {
        const { data: instData } = await supabaseAdmin
          .from('institutions')
          .select('name')
          .eq('auth_id', uId)
          .single();
        if (instData) fullName = instData.name;
      }

      return {
        ...tag,
        tagged_user_profile: {
          ...tag.tagged_user_profile,
          fullName
        }
      };
    }));

    return encryptData({ success: true, data: resolvedTags });
  } catch (err: any) {
    console.error("❌ [GET POST TAGS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Updates tags on an existing post. Deletes old tags and inserts new ones.
 */
export async function updatePostTagsAction(encryptedPayload: string) {
  try {
    const { userId, postId, tags } = decryptData(encryptedPayload);
    if (!userId || !postId) throw new Error("Missing parameters.");

    // Verify authorship or super admin role
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post) throw new Error("Post not found.");

    if (post.user_id !== userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        throw new Error("Unauthorized post tag edit.");
      }
    }

    // Delete existing tags
    const { error: delErr } = await supabaseAdmin
      .from('post_tags')
      .delete()
      .eq('post_id', postId);

    if (delErr) throw delErr;

    // Insert new tags
    if (tags && tags.length > 0) {
      const tagsToInsert = tags.map((t: any) => ({
        post_id: postId,
        post_media_id: t.post_media_id || null,
        tagged_user_id: t.tagged_user_id,
        x: t.x !== undefined && t.x !== null ? parseFloat(t.x.toFixed(2)) : null,
        y: t.y !== undefined && t.y !== null ? parseFloat(t.y.toFixed(2)) : null
      }));
      const { error: insErr } = await supabaseAdmin
        .from('post_tags')
        .insert(tagsToInsert);

      if (insErr) throw insErr;
    }

    return encryptData({ success: true });
  } catch (err: any) {
    console.error("❌ [UPDATE POST TAGS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Update post content (text body)
 */
export async function updatePostContentAction(encryptedPayload: string) {
  try {
    const { userId, postId, content } = decryptData(encryptedPayload);
    if (!userId || !postId || content === undefined) throw new Error("Missing parameters.");

    // Verify authorship or super admin role
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post) throw new Error("Post not found.");

    if (post.user_id !== userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        throw new Error("Unauthorized post edit.");
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from('posts')
      .update({ content: content.trim() })
      .eq('id', postId);

    if (updateErr) throw updateErr;

    return encryptData({ success: true });
  } catch (err: any) {
    console.error("❌ [UPDATE POST CONTENT ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}
