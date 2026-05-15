'use server';
import { encryptData, decryptData } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";

/**
 * SECURE ACTION: Check if the user is new and needs a welcome popup.
 */
export async function checkNewUserAction(userId: string, role: string) {
  try {
    if (!userId || !role) {
      return encryptData({ success: false, isNew: false });
    }

    const table = role === 'teacher' ? 'teachers' : (role === 'institution_admin' ? 'institutions' : null);

    if (!table) {
      return encryptData({ success: false, isNew: false });
    }

    const { data, error } = await supabase
      .from(table)
      .select('is_new')
      .eq('auth_id', userId)
      .single();

    if (error) {
      console.error(`❌ [CHECK NEW USER ERROR]:`, error.message);
      return encryptData({ success: false, isNew: false });
    }

    // is_new = false means they are NEW and haven't seen the popup (user logic)
    return encryptData({
      success: true,
      isNew: data.is_new === false
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [CHECK NEW USER EXCEPTION]:", error.message);
    return encryptData({ success: false, isNew: false });
  }
}

/**
 * SECURE ACTION: Mark the user as no longer "new" after showing the welcome popup.
 */
export async function markUserAsOldAction(userId: string, role: string) {
  try {
    if (!userId || !role) {
      return encryptData({ success: false });
    }

    const table = role === 'teacher' ? 'teachers' : (role === 'institution_admin' ? 'institutions' : null);

    if (!table) {
      return encryptData({ success: false });
    }

    const { error } = await supabase
      .from(table)
      .update({ is_new: true })
      .eq('auth_id', userId);

    if (error) {
      console.error(`❌ [MARK USER OLD ERROR]:`, error.message);
      return encryptData({ success: false });
    }

    return encryptData({ success: true });
  } catch (err) {
    const error = err as Error;
    console.error("❌ [MARK USER OLD EXCEPTION]:", error.message);
    return encryptData({ success: false });
  }
}
