'use server';
import { encryptData, decryptData } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

/**
 * SECURE ACTION: Create a new course record.
 * 
 * Returns the generated course ID, which the client can use to upload the banner.
 */
export async function createCourseAction(encryptedPayload: string) {
  try {
    const formData = decryptData(encryptedPayload);
    if (!formData || !formData.title) {
      throw new Error("Invalid or untrusted payload received.");
    }

    const { data: recordData, error: dbError } = await supabase
      .from('courses')
      .insert([
        {
          title: formData.title,
          description: formData.description || null,
          level: formData.level || 'Beginner',
          price: formData.price || 0,
          status: formData.status || 'Draft',
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return encryptData({
      success: true,
      message: "Course created successfully!",
      course: recordData,
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [CREATE COURSE ERROR]:", error?.message || "Unknown error");
    return encryptData({
      success: false,
      message: error?.message || "Unknown error"
    });
  }
}

/**
 * SECURE ACTION: Fetch all courses for the admin list.
 */
export async function getCoursesListAction() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return encryptData({
      success: true,
      data: data || []
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [FETCH COURSES ERROR]:", error?.message || "Unknown error");
    return encryptData({
      success: false,
      message: error?.message || "An unexpected error occurred during fetch."
    });
  }
}

/**
 * SECURE ACTION: Update course details (banner_url, status, etc.)
 */
export async function updateCourseAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.id) {
      throw new Error("Invalid payload or missing ID.");
    }

    const { error: dbError } = await supabase
      .from('courses')
      .update({
        title: payload.title,
        description: payload.description,
        level: payload.level,
        price: payload.price,
        status: payload.status,
        banner_url: payload.banner_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id);

    if (dbError) throw dbError;

    return encryptData({ success: true, message: "Course updated successfully!" });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [UPDATE COURSE ERROR]:", error?.message || "Unknown error");
    return encryptData({ success: false, message: error?.message || "Unknown error" });
  }
}

/**
 * SECURE ACTION: Delete a course and its associated storage assets.
 */
export async function deleteCourseAction(encryptedId: string) {
  try {
    const payload = decryptData(encryptedId);
    if (!payload || !payload.id) throw new Error("Invalid ID for deletion.");

    const courseId = payload.id;

    // 1. First, list all files in the storage bucket folder for this course
    const { data: files, error: listError } = await supabase.storage
      .from('courses')
      .list(courseId);

    if (!listError && files && files.length > 0) {
      // 2. Delete all files in that folder
      const filesToRemove = files.map((f) => `${courseId}/${f.name}`);
      await supabase.storage.from('courses').remove(filesToRemove);
    }

    // 3. Delete the database record
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;

    return encryptData({ success: true, message: "Course and all associated assets purged." });
  } catch (error: any) {
    console.error("❌ [DELETE COURSE ERROR]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}
