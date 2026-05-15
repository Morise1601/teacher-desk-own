'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

/**
 * SECURE ACTION: Login a user and determine their redirect path based on role.
 */
export async function loginAction(encryptedPayload: string) {
  try {
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.email || !formData.password) {
      throw new Error("Invalid login credentials.");
    }

    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return encryptData({ success: false, message: error.message });
    }

    if (!data.user) {
      throw new Error("Login failed: User not found.");
    }

    // 2. Fetch role securely to determine redirect path
    const { data: teacherData } = await supabaseAdmin
      .from('teachers')
      .select('role_type, is_active')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (teacherData && teacherData.role_type === 'teacher') {
      if (teacherData.is_active === false) {
        await supabase.auth.signOut();
        return encryptData({ success: false, message: "Your account is currently inactive or blocked. Please contact support." });
      }
      return encryptData({ success: true, message: "Login successful!", redirectPath: '/dashboard' });
    }

    const { data: instData } = await supabaseAdmin
      .from('institutions')
      .select('role_type, is_active')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (instData && instData.role_type === 'institution_admin') {
      if (instData.is_active === false) {
        await supabase.auth.signOut();
        return encryptData({ success: false, message: "Your institution account is currently inactive or blocked. Please contact support." });
      }
      return encryptData({ success: true, message: "Login successful!", redirectPath: '/dashboard' });
    }

    const { data: adminData } = await supabaseAdmin
      .from('super_admins')
      .select('role_type')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (adminData && (adminData.role_type === 'super_admin' || adminData.role_type === 'admin')) {
      console.log(`✅ [LOGIN]: Super Admin ${data.user.email} logged in. Redirection to Super Admin Dashboard.`);
      return encryptData({
        success: true,
        message: "Welcome Super Admin!",
        redirectPath: '/dashboard/super-admin'
      });
    }

    // Default redirect
    const redirectPath = '/dashboard';
    console.log(`✅ [LOGIN]: User ${data.user.email} logged in. Redirection to Dashboard.`);

    return encryptData({
      success: true,
      message: "Login successful!",
      redirectPath
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [LOGIN ERROR]:", error?.message || "Unknown error");
    return encryptData({
      success: false,
      message: "Security failure during authentication."
    });
  }
}

export async function getUserRoleAction(userId: string) {
  console.log("TeacherDesk LOG: Fetching role for User ID:", userId);
  try {
    if (!userId) {
      return encryptData({ success: false, role: null });
    }

    // 1. Check Database Tables by auth_id (Using Admin client to bypass RLS on server)
    // Check Teachers Table
    const { data: teacherData, error: tError } = await supabaseAdmin
      .from('teachers')
      .select('role_type')
      .eq('auth_id', userId)
      .maybeSingle();

    if (teacherData) {
      console.log("TeacherDesk LOG: Found in Teachers:", teacherData);
      return encryptData({ success: true, role: teacherData.role_type || 'teacher' });
    }

    // Check Institutions Table
    const { data: instData, error: iError } = await supabaseAdmin
      .from('institutions')
      .select('role_type')
      .eq('auth_id', userId)
      .maybeSingle();

    if (instData) {
      console.log("TeacherDesk LOG: Found in Institutions:", instData);
      return encryptData({ success: true, role: instData.role_type || 'institution_admin' });
    }

    // Check Super Admins Table
    const { data: adminData, error: aError } = await supabaseAdmin
      .from('super_admins')
      .select('role_type')
      .eq('auth_id', userId)
      .maybeSingle();

    if (adminData) {
      console.log("TeacherDesk LOG: Found in Super Admins:", adminData);
      return encryptData({ success: true, role: adminData.role_type || 'super_admin' });
    }

    console.log("TeacherDesk LOG: No role found for user.");
    return encryptData({ success: true, role: null });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [ROLE ACTION ERROR]:", error?.message || "Unknown error");
    return encryptData({ success: false, role: null, message: error?.message || "Unknown error" });
  }
}

/**
 * SECURE ACTION: Fetch statistics for the super admin dashboard.
 */
export async function getAdminDashboardStatsAction() {
  try {
    const { count: teacherCount, error: tError } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true });

    if (tError) throw tError;

    const { count: instCount, error: iError } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    if (iError) throw iError;

    return encryptData({
      success: true,
      data: {
        teachers: teacherCount || 0,
        institutions: instCount || 0
      }
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [FETCH STATS ERROR]:", error?.message || "Unknown error");
    return encryptData({ success: false, message: error?.message || "Unknown error" });
  }
}
