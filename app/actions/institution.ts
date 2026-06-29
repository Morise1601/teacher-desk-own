'use server';
import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * SECURE ACTION: Create a new institution record.
 * Following the schema: public.institutions (name, type, address, email, phone, website)
 * Data is encrypted during transmission between client and server actions.
 */
export async function createInstitutionAction(encryptedPayload: string) {
  try {
    // 1. SECURITY LAYER: Decrypt the sensitive payload on the server
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.name || !formData.adminEmail || !formData.password) {
      throw new Error("Invalid or untrusted payload received.");
    }

    // 2. DUPLICATE CHECK: Check if email exists in either teachers or institutions table
    const [{ count: tCount }, { count: iCount }] = await Promise.all([
      supabaseAdmin.from('teachers').select('email', { count: 'exact', head: true }).eq('email', formData.adminEmail),
      supabaseAdmin.from('institutions').select('email', { count: 'exact', head: true }).eq('email', formData.adminEmail)
    ]);

    if ((tCount || 0) > 0 || (iCount || 0) > 0) {
      return encryptData({ success: false, message: "This email is already registered. Please use a different email or sign in." });
    }

    // 3. AUTHENTICATION (ADMIN): Create the administrator user without sending a confirmation email
    // This bypasses the "email rate limit exceeded" error and auto-confirms the account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.adminEmail,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.adminName,
        role: 'institution_admin'
      }
    });

    if (authError) {
      console.error("❌ Auth Error:", authError.message);
      return encryptData({ success: false, message: `Auth: ${authError.message}` });
    }

    // 3. DATABASE: Insert or Update the institution record
    let recordData, dbError;
    
    if (formData.existingId) {
      // UPDATE EXISTING STUB
      const { data, error } = await supabase
        .from('institutions')
        .update({
          name: formData.name,
          type: formData.type,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null,
          is_active: true,
          auth_id: authData.user.id,
          role_type: 'institution_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.existingId)
        .select()
        .single();
      recordData = data;
      dbError = error;
    } else {
      // INSERT NEW RECORD
      const { data, error } = await supabase
        .from('institutions')
        .insert([
          {
            name: formData.name,
            type: formData.type,
            address: formData.address,
            email: formData.email,
            phone: formData.phone,
            website: formData.website || null,
            is_active: true,
            is_deleted: false,
            hire_status: false,
            auth_id: authData.user.id,
            role_type: 'institution_admin',
          }
        ])
        .select()
        .single();
      recordData = data;
      dbError = error;
    }

    if (dbError) {
      console.error("❌ [DB ERROR]:", dbError.message);
      return encryptData({ success: false, message: `DB: ${dbError.message}` });
    }

    console.log("✅ [SECURE SERVER ACTION]: Institution & Admin created in DB.");

    const response = {
      success: true,
      message: "Institution created successfully!",
      institutionId: recordData?.id,
    };

    return encryptData(response);
  } catch (err) {
    const error = err as Error;
    console.error("❌ [SECURITY ALERT]:", error?.message || "Unknown error");
    return encryptData({
      success: false,
      message: error?.message || "Could not process registration securely."
    });
  }
}

/**
 * SECURE ACTION: Get all active institutions for the signup dropdown.
 */
export async function getInstitutionsAction() {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name');

    if (error) throw error;

    return encryptData({ success: true, data });
  } catch (err) {
    const error = err as Error;
    console.error("❌ Error fetching institutions:", error?.message || "Unknown error");
    return encryptData({ success: true, data: [] });
  }
}

/**
 * SECURE ACTION: Fetch all institutions for the admin list.
 */
export async function getInstitutionsListAction() {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ [FETCH INSTITUTIONS ERROR]:", error.message);
      return encryptData({ success: false, message: error.message });
    }

    return encryptData({
      success: true,
      data: data || []
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [SECURITY ALERT]:", error?.message || "Unknown error");
    return encryptData({
      success: false,
      message: error?.message || "An unexpected security error occurred during fetch."
    });
  }
}
/**
 * SECURE ACTION: Get institution profile by auth_id.
 * MERGES data from public.institutions and public.profiles.
 */
export async function getInstitutionProfileAction(authId: string) {
  try {
    if (!authId) {
      return encryptData({ success: false, message: "Identification missing." });
    }

    // 1. Fetch from institutions table
    const { data: instData, error: instError } = await supabase
      .from('institutions')
      .select('*')
      .eq('auth_id', authId)
      .single();

    if (instError) {
      console.error("❌ [DB GET INSTITUTION ERROR]:", instError.message);
      return encryptData({ success: false, message: `Institution DB error: ${instError.message}` });
    }

    // 2. Fetch from profiles table for extra info (about, logo, etc)
    let { data: profData } = await supabaseAdmin
      .from('profiles')
      .select('about, profile_pic_url, location')
      .eq('user_id', authId)
      .maybeSingle();

    if (!profData && instData) {
      console.log(`ℹ️ [AUTO PROFILE CREATION]: Initializing profile for institution ${authId}`);
      const initialProfile = {
        user_id: authId,
        role: instData.role_type || 'institution_admin',
        headline: '',
        about: instData.about || '',
        location: instData.address || '',
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

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([initialProfile])
        .select('about, profile_pic_url, location')
        .single();

      if (createError) {
        console.error("❌ [DB INITIALIZE INSTITUTION PROFILE ERROR]:", createError.message);
      } else {
        profData = newProfile;
      }
    }

    // 3. MERGE
    const mergedData = {
      ...instData,
      // Prefer institutions table but fallback to profiles for backward compatibility/consistency
      about: instData.about || profData?.about || '',
      profile_pic_url: profData?.profile_pic_url || '',
      location: instData.address || profData?.location || ''
    };

    return encryptData({ success: true, data: mergedData });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [SECURITY ALERT]:", error?.message || "Unknown error");
    return encryptData({ success: false, message: error?.message || `Security failure: ${error?.message}` });
  }
}

/**
 * SECURE ACTION: Update institution profile data.
 * Updates both public.institutions and public.profiles tables.
 */
export async function updateInstitutionProfileAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.auth_id) {
      throw new Error("Invalid or untrusted payload.");
    }

    const authId = payload.auth_id;

    // 1. SPLIT DATA
    // Institutions table fields
    const instFields = {
      name: payload.name,
      type: payload.type,
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      website: payload.website,
      founded_year: payload.founded_year,
      staff_count: payload.staff_count,
      rank: payload.rank,
      about: payload.about,
      hire_status: payload.hire_status, // New field for hiring status
      updated_at: new Date().toISOString()
    };

    // Profiles table fields
    const profileFields = {
      about: payload.about,
      profile_pic_url: payload.profile_pic_url,
      location: payload.address // Sync location with address
    };

    // 2. UPDATE INSTITUTIONS
    const { error: instError } = await supabase
      .from('institutions')
      .update(instFields)
      .eq('auth_id', authId);

    if (instError) {
      console.error("❌ [INSTITUTION UPDATE ERROR]:", instError.message);
      throw new Error(`Institution update failed: ${instError.message}`);
    }

    // 3. UPDATE PROFILES
    const { error: profError } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('user_id', authId);

    if (profError) {
      console.error("❌ [PROFILE UPDATE ERROR]:", profError.message);
      // Optimization: In a real app, maybe log this but don't fail the whole request
    }

    return encryptData({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [SECURITY ALERT]:", error?.message || "Unknown error");
    return encryptData({ success: false, message: `Security failure: ${error.message}` });
  }
}

/**
 * SECURE ACTION: Find an institution by name and address, or create a stub.
 * This is used when a teacher is signing up and selects an institution from the map.
 */
export async function findOrCreateInstitutionAction(encryptedPayload: string) {
  try {
    const data = decryptData(encryptedPayload);
    if (!data || !data.name || !data.address) {
      throw new Error("Institution name and address are required.");
    }

    // 1. Check if institution with similar name exists
    const { data: existing, error: findError } = await supabase
      .from('institutions')
      .select('id, name, address, email, phone')
      .ilike('name', `%${data.name}%`)
      .limit(1);

    if (findError) throw findError;

    if (existing && existing.length > 0) {
      // Return the match
      return encryptData({ 
        success: true, 
        message: "Existing institution found.", 
        data: existing[0],
        isNew: false 
      });
    }

    // 2. Not found, create a new record
    // Note: This creates an institution WITHOUT an auth_id (a stub)
    // A stub can be claimed later by an admin.
    const { data: newInst, error: createError } = await supabase
      .from('institutions')
      .insert([{
        name: data.name,
        address: data.address,
        type: data.type || 'Other',
        is_active: true,
        is_deleted: false,
        hire_status: false,
        // No auth_id yet
      }])
      .select('id, name, address')
      .single();

    if (createError) throw createError;

    return encryptData({ 
      success: true, 
      message: "New institution created.", 
      data: newInst,
      isNew: true 
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ findOrCreateInstitutionAction Error:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Check if an institution exists by name.
 */
export async function checkInstitutionExistsAction(name: string) {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .ilike('name', name)
      .is('auth_id', null); // Only return stubs (institutions without an admin)

    if (error) throw error;

    return encryptData({ 
      success: true, 
      exists: data && data.length > 0, 
      data: data && data.length > 0 ? data[0] : null 
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ checkInstitutionExistsAction Error:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Check if an institution exists by address.
 */
export async function checkInstitutionByAddressAction(address: string) {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, address, type, email, phone, website, auth_id')
      .eq('address', address)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const institution = data[0];
      return encryptData({ 
        success: true, 
        exists: true, 
        isClaimed: !!institution.auth_id,
        data: institution 
      });
    }

    return encryptData({ 
      success: true, 
      exists: false 
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ checkInstitutionByAddressAction Error:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}
