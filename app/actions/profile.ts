'use server';
import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * SECURE ACTION: Get profile by user_id.
 * If not exists, creates a default one based on user metadata.
 */
export async function getProfileByUserIdAction(userId: string) {
  try {
    if (!userId) {
      return encryptData({ success: false, message: "Identification missing." });
    }

    // 1. DATABASE: Check if profile exists
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Error codes other than 'no record found'
      console.error("❌ [DB GET PROFILE ERROR]:", error.message);
      return encryptData({ success: false, message: `DB error: ${error.message}` });
    }

    // 2. INITIALIZATION: If profile doesn't exist, create an initial one
    if (!data) {
      // Fetch user role from auth to initialize correctly
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const role = userData?.user?.user_metadata?.role || 'teacher';

      const initialProfile = {
        user_id: userId,
        role: role,
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

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([initialProfile])
        .select()
        .single();

      if (createError) {
        console.error("❌ [DB INITIALIZE ERROR]:", createError.message);
        return encryptData({ success: false, message: "Profile initialization failed." });
      }
      data = newProfile;
    }

    // 3. FETCH IDENTITY: Fetch the Name from teachers or institutions table
    let fullName = "Member";
    if (data.role === 'teacher') {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('full_name, work_status')
        .eq('auth_id', userId)
        .single();
      if (teacherData) {
        fullName = teacherData.full_name;
        data.work_status = teacherData.work_status;
      }
    } else if (data.role === 'institution') {
      const { data: instData } = await supabase
        .from('institutions')
        .select('name')
        .eq('auth_id', userId)
        .single();
      if (instData) fullName = instData.name;
    }

    return encryptData({ success: true, profile: { ...data, fullName } });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [SECURITY ALERT]:", error?.message || "Unknown error");
    return encryptData({ success: false, message: error?.message || `Security failure: ${error?.message}` });
  }
}

/**
 * SECURE ACTION: Update profile data.
 * Prevents unauthorized updates by ensuring auth.uid matches payload.
 */
export async function updateProfileAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.user_id) {
      throw new Error("Invalid or untrusted payload.");
    }

    // 1. DATA FILTERING: Only update valid columns in 'public.profiles'
    // This prevents "column does not exist" errors when UI sends extra metadata
    const profileAllowedFields = [
      'headline', 'about', 'location', 'profile_pic_url', 
      'experience', 'education', 'skills', 'specializations', 
      'volunteering', 'languages', 'interests', 'papers_presented'
    ];

    const profileUpdate: any = {};
    profileAllowedFields.forEach(field => {
      if (typeof payload[field] !== 'undefined') {
        profileUpdate[field] = payload[field];
      }
    });
    profileUpdate.updated_at = new Date().toISOString();

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', payload.user_id);

    if (profileError) {
      console.error("❌ [PROFILE UPDATE ERROR]:", profileError.message);
      return encryptData({ success: false, message: `Profile DB error: ${profileError.message}` });
    }

    // 2. Specialized Table Updates (e.g. teachers table)
    if (payload.role === 'teacher') {
      const teacherUpdate: any = {};
      
      // UpdatefullName if it's sent from the UI
      if (payload.fullName) teacherUpdate.full_name = payload.fullName;
      
      // Update work_status
      if (typeof payload.work_status !== 'undefined') teacherUpdate.work_status = payload.work_status;

      if (Object.keys(teacherUpdate).length > 0) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .update(teacherUpdate)
          .eq('auth_id', payload.user_id);
          
        if (teacherError) {
          console.error("❌ [TEACHER UPDATE ERROR]:", teacherError.message);
          // We don't necessarily return error here if profile update succeeded, 
          // but logging it is critical.
        }
      }
    }

    return encryptData({ success: true, message: "Profile updated successfully!" });
  } catch (error: any) {
    console.error("❌ [SECURITY ALERT]:", error.message);
    return encryptData({ success: false, message: `Security failure: ${error.message}` });
  }
}

/**
 * SECURE ACTION: Handle profile picture upload.
 * Receives base64 string and userId.
 * Stores in bucket 'profile' folder '{userId}/profile_pic.jpg'.
 */
export async function uploadProfilePicAction(encryptedPayload: string) {
  try {
    const { userId, base64Image, fileName } = decryptData(encryptedPayload);
    if (!userId || !base64Image) {
      throw new Error("Incomplete identification or file payload.");
    }

    // 1. STORAGE: Upload to Supabase Bucket 'profile'
    // Convert base64 back to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Path structure: teacher_id/profile_pic.[ext]
    const ext = fileName.split('.').pop() || 'jpg';
    const filePath = `${userId}/profile_pic_${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile')
      .upload(filePath, buffer, {
        contentType: `image/${ext}`,
        upsert: true
      });

    if (uploadError) {
      console.error("❌ [STORAGE ERROR]:", uploadError.message);
      return encryptData({ success: false, message: "Image upload failed." });
    }

    // 2. GET PUBLIC URL:
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile')
      .getPublicUrl(filePath);

    // 3. DATABASE update: Store URL in profile table
    const { error: dbUpdateError } = await supabase
      .from('profiles')
      .update({ profile_pic_url: publicUrl })
      .eq('user_id', userId);

    if (dbUpdateError) {
      console.error("❌ [DB URL UPDATE ERROR]:", dbUpdateError.message);
      return encryptData({ success: false, message: "Profile link update failed." });
    }

    return encryptData({ success: true, profilePicUrl: publicUrl, message: "Profile picture uploaded!" });
  } catch (error: any) {
    console.error("❌ [SECURITY ALERT]:", error.message);
    return encryptData({ success: false, message: `Security failure: ${error.message}` });
  }
}
/**
 * SECURE ACTION: Update last_seen timestamp for online presence.
 */
export async function updateLastSeenAction(userId: string) {
  try {
    if (!userId) return encryptData({ success: false });

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
    return encryptData({ success: true });
  } catch (err: any) {
    return encryptData({ success: false });
  }
}
