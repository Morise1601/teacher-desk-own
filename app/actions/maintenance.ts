'use server';

import { supabaseAdmin } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";

/**
 * Fetch the maintenance mode status.
 */
export async function getMaintenanceModeAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    if (error) {
      // If table doesn't exist or other error, assume maintenance is OFF
      console.error("Error fetching maintenance mode:", error);
      return encryptData({ success: true, enabled: false });
    }

    const enabled = data?.value === 'true';
    return encryptData({ success: true, enabled });
  } catch (err) {
    console.error("Maintenance action error:", err);
    return encryptData({ success: false, enabled: false });
  }
}

/**
 * Set the maintenance mode status.
 */
export async function setMaintenanceModeAction(enabled: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({ key: 'maintenance_mode', value: enabled ? 'true' : 'false' }, { onConflict: 'key' });

    if (error) throw error;

    return encryptData({ success: true, message: `Maintenance mode turned ${enabled ? 'ON' : 'OFF'}` });
  } catch (err) {
    const error = err as Error;
    console.error("Error setting maintenance mode:", error);
    return encryptData({ success: false, message: error.message });
  }
}
