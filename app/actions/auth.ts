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

/**
 * SECURE ACTION: Check Google user existency, auto-link existing users, and return redirect path.
 */
export async function handleGoogleLoginAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.email || !payload.authId) {
      throw new Error("Invalid or untrusted callback payload.");
    }

    const { email, authId, fullName, profilePic, googleId } = payload;
    const now = new Date().toISOString();

    // 1. Check Super Admins table
    const { data: adminData } = await supabaseAdmin
      .from('super_admins')
      .select('id, role_type')
      .eq('email', email)
      .maybeSingle();

    if (adminData) {
      await supabaseAdmin
        .from('super_admins')
        .update({
          auth_id: authId,
          google_id: googleId || null,
          auth_provider: 'google',
          profile_picture: profilePic || null,
          last_google_login_at: now
        })
        .eq('email', email);

      console.log(`✅ [GOOGLE LOGIN LINK]: Linked existing Admin ${email} with auth_id ${authId}`);
      return encryptData({
        success: true,
        exists: true,
        role: adminData.role_type || 'super_admin',
        redirectPath: '/dashboard/super-admin'
      });
    }

    // 2. Check Teachers table
    const { data: teacherData } = await supabaseAdmin
      .from('teachers')
      .select('id, role_type, is_active')
      .eq('email', email)
      .maybeSingle();

    if (teacherData) {
      if (teacherData.is_active === false) {
        return encryptData({ success: false, message: "Your account is currently inactive. Please contact support." });
      }

      await supabaseAdmin
        .from('teachers')
        .update({
          auth_id: authId,
          google_id: googleId || null,
          auth_provider: 'google',
          profile_image_url: profilePic || null,
          email_verified: true,
          last_google_login_at: now
        })
        .eq('email', email);

      console.log(`✅ [GOOGLE LOGIN LINK]: Linked existing Teacher ${email} with auth_id ${authId}`);
      return encryptData({
        success: true,
        exists: true,
        role: teacherData.role_type || 'teacher',
        redirectPath: '/dashboard'
      });
    }

    // 3. Check Institutions table
    const { data: instData } = await supabaseAdmin
      .from('institutions')
      .select('id, role_type, is_active')
      .eq('email', email)
      .maybeSingle();

    if (instData) {
      if (instData.is_active === false) {
        return encryptData({ success: false, message: "Your institution account is currently inactive. Please contact support." });
      }

      await supabaseAdmin
        .from('institutions')
        .update({
          auth_id: authId,
          google_id: googleId || null,
          auth_provider: 'google',
          profile_image_url: profilePic || null,
          email_verified: true,
          last_google_login_at: now
        })
        .eq('email', email);

      console.log(`✅ [GOOGLE LOGIN LINK]: Linked existing Institution Admin ${email} with auth_id ${authId}`);
      return encryptData({
        success: true,
        exists: true,
        role: instData.role_type || 'institution_admin',
        redirectPath: '/dashboard'
      });
    }

    // 4. User does not exist (new user)
    console.log(`ℹ️ [GOOGLE SIGNIN NEW]: New Google user detected: ${email}`);
    return encryptData({
      success: true,
      exists: false
    });
  } catch (err: any) {
    console.error("❌ [handleGoogleLoginAction Error]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * SECURE ACTION: Register new Google user as Teacher.
 */
export async function registerGoogleTeacherAction(encryptedPayload: string) {
  try {
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.email || !formData.authId) {
      throw new Error("Invalid or untrusted registration payload.");
    }

    // Duplicate check
    const [{ count: tCount }, { count: iCount }] = await Promise.all([
      supabaseAdmin.from('teachers').select('email', { count: 'exact', head: true }).eq('email', formData.email),
      supabaseAdmin.from('institutions').select('email', { count: 'exact', head: true }).eq('email', formData.email)
    ]);

    if ((tCount || 0) > 0 || (iCount || 0) > 0) {
      return encryptData({ success: false, message: "This email is already registered. Please sign in instead." });
    }

    // Insert public record in public.teachers
    const { error: dbError } = await supabaseAdmin
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
          is_active: true,
          is_deleted: false,
          auth_id: formData.authId,
          role_type: 'teacher',
          refered_by: formData.referedBy || null,
          google_id: formData.googleId || null,
          auth_provider: 'google',
          profile_image_url: formData.avatarUrl || null,
          email_verified: true,
          last_google_login_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error("❌ [GOOGLE TEACHER DB ERROR]:", dbError.message);
      return encryptData({ success: false, message: `Database error: ${dbError.message}` });
    }

    return encryptData({
      success: true,
      message: "Teacher account created successfully!"
    });
  } catch (err: any) {
    console.error("❌ [registerGoogleTeacherAction Error]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * SECURE ACTION: Register new Google user as Institution.
 */
export async function registerGoogleInstitutionAction(encryptedPayload: string) {
  try {
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.email || !formData.authId) {
      throw new Error("Invalid or untrusted registration payload.");
    }

    // Duplicate check
    const [{ count: tCount }, { count: iCount }] = await Promise.all([
      supabaseAdmin.from('teachers').select('email', { count: 'exact', head: true }).eq('email', formData.email),
      supabaseAdmin.from('institutions').select('email', { count: 'exact', head: true }).eq('email', formData.email)
    ]);

    if ((tCount || 0) > 0 || (iCount || 0) > 0) {
      return encryptData({ success: false, message: "This email is already registered. Please sign in instead." });
    }

    let recordData, dbError;
    const now = new Date().toISOString();

    if (formData.existingId) {
      // Claiming an existing stub
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .update({
          name: formData.name,
          type: formData.type,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null,
          is_active: true,
          auth_id: formData.authId,
          role_type: 'institution_admin',
          google_id: formData.googleId || null,
          auth_provider: 'google',
          profile_image_url: formData.avatarUrl || null,
          email_verified: true,
          last_google_login_at: now,
          updated_at: now
        })
        .eq('id', formData.existingId)
        .select()
        .single();
      recordData = data;
      dbError = error;
    } else {
      // Direct insertion
      const { data, error } = await supabaseAdmin
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
            auth_id: formData.authId,
            role_type: 'institution_admin',
            google_id: formData.googleId || null,
            auth_provider: 'google',
            profile_image_url: formData.avatarUrl || null,
            email_verified: true,
            last_google_login_at: now
          }
        ])
        .select()
        .single();
      recordData = data;
      dbError = error;
    }

    if (dbError) {
      console.error("❌ [GOOGLE INSTITUTION DB ERROR]:", dbError.message);
      return encryptData({ success: false, message: `Database error: ${dbError.message}` });
    }

    return encryptData({
      success: true,
      message: "Institution registered successfully!",
      institutionId: recordData?.id
    });
  } catch (err: any) {
    console.error("❌ [registerGoogleInstitutionAction Error]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}
