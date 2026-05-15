'use server';
import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * SECURE ACTION: Create a new teacher/faculty record.
 */
export async function createTeacherAction(encryptedPayload: string) {
  try {
    // 1. SECURITY LAYER: Decrypt sensitive payload
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.email || !formData.password) {
      throw new Error("Invalid or untrustred payload received.");
    }

    // 2. DUPLICATE CHECK: Check if email exists in either teachers or institutions table
    const [{ count: tCount }, { count: iCount }] = await Promise.all([
      supabaseAdmin.from('teachers').select('email', { count: 'exact', head: true }).eq('email', formData.email),
      supabaseAdmin.from('institutions').select('email', { count: 'exact', head: true }).eq('email', formData.email)
    ]);

    if ((tCount || 0) > 0 || (iCount || 0) > 0) {
      return encryptData({ success: false, message: "This email is already registered. Please use a different email or sign in." });
    }

    // 3. AUTHENTICATION (ADMIN): Create the teacher account (no email verification needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
        role: 'teacher'
      }
    });

    if (authError || !authData.user) throw authError || new Error("User creation failed.");

    // 3. DATABASE: Insert record into 'public.teachers'
    const { error: dbError } = await supabase
      .from('teachers')
      .insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dob: formData.dob,
          qualification: formData.qualification,
          specialization: formData.specialization,
          experience: formData.experience,
          institution_id: formData.institutionId || null,
          is_active: true, // Default true as requested
          is_deleted: false,
          auth_id: authData.user.id,
          role_type: 'teacher',
          refered_by: formData.referedBy || null,
        }
      ]);

    if (dbError) {
      console.error("❌ [DB ERROR]:", dbError.message);
      return encryptData({ success: false, message: `Database error: ${dbError.message}` });
    }

    return encryptData({
      success: true,
      message: "Teacher account created successfully!"
    });
  } catch (error: any) {
    console.error("❌ [SECURITY ALERT]:", error.message);
    return encryptData({
      success: false,
      message: `Security failure: ${error.message}`
    });
  }
}

/**
 * SECURE ACTION: Get teacher ID by auth_id (for invite link)
 */
export async function getTeacherProfileIdAction(authId: string) {
  try {
    if (!authId) {
      return encryptData({ success: false, message: "Missing auth identification." });
    }

    const { data, error } = await supabase
      .from('teachers')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (error || !data) {
      console.error("❌ [GET PROFILE ERROR]:", error?.message);
      return encryptData({ success: false, message: "Profile not found." });
    }

    return encryptData({
      success: true,
      teacherId: data.id
    });
  } catch (error: any) {
    console.error("❌ [SECURITY ALERT]:", error.message);
    return encryptData({
      success: false,
      message: `Security failure: ${error.message}`
    });
  }
}

/**
 * SECURE ACTION: Fetch all teacher records for the admin list.
 */
export async function getTeachersListAction() {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ [FETCH TEACHERS ERROR]:", error.message);
      return encryptData({ success: false, message: error.message });
    }

    return encryptData({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error("❌ [SECURITY ALERT]:", error.message);
    return encryptData({
      success: false,
      message: "An unexpected security error occurred during fetch."
    });
  }
}
