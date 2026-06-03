'use server';

import { supabaseAdmin } from "@/lib/supabase";
import { encryptData, decryptData } from "@/lib/crypto";

/**
 * Fetch Google authentication settings.
 * Returns only the public configurations (excluding secret keys) if requested,
 * but for the Admin settings panel we fetch everything securely.
 */
export async function getGoogleAuthSettingsAction() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'google_signin_enabled',
        'google_client_id',
        'google_client_secret',
        'google_callback_url'
      ]);

    if (error) throw error;

    const settings: Record<string, string> = {};
    (data || []).forEach((item: { key: string; value: string }) => {
      settings[item.key] = item.value;
    });

    // Fallback defaults
    return encryptData({
      success: true,
      settings: {
        google_signin_enabled: settings.google_signin_enabled || 'false',
        google_client_id: settings.google_client_id || '',
        google_client_secret: settings.google_client_secret || '',
        google_callback_url: settings.google_callback_url || 'http://localhost:3000/auth/callback'
      }
    });
  } catch (err: any) {
    console.error("❌ [GET GOOGLE SETTINGS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}

/**
 * Set Google authentication settings.
 * Includes server-side validation ensuring only a validated admin can perform edits.
 */
export async function setGoogleAuthSettingsAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) {
      return encryptData({ success: false, message: "Unauthorized: Missing identity metadata." });
    }

    // 1. SECURITY VALIDATION: Ensure the user is actually a Super Admin
    const { data: adminCheck, error: adminErr } = await supabaseAdmin
      .from('super_admins')
      .select('role_type')
      .eq('auth_id', payload.userId)
      .maybeSingle();

    if (adminErr || !adminCheck || (adminCheck.role_type !== 'super_admin' && adminCheck.role_type !== 'admin')) {
      console.warn(`⚠️ [SECURITY ALERT]: Unauthorized attempt to modify settings by user ${payload.userId}`);
      return encryptData({ success: false, message: "Security exception: Insufficient permissions." });
    }

    // 2. DATA VALIDATIONS
    const enabled = payload.google_signin_enabled === 'true' || payload.google_signin_enabled === true;
    const clientId = payload.google_client_id?.trim() || '';
    const clientSecret = payload.google_client_secret?.trim() || '';
    const callbackUrl = payload.google_callback_url?.trim() || '';

    if (enabled && !clientId) {
      return encryptData({ success: false, message: "Validation error: Google Client ID cannot be empty when Sign-In is enabled." });
    }

    if (callbackUrl) {
      try {
        new URL(callbackUrl); // checks if it is a valid URL format
      } catch {
        return encryptData({ success: false, message: "Validation error: Google Callback URL must be a valid URL." });
      }
    }

    // 3. UPSERT Configuration Keys in system_settings
    const settingsToSave = [
      { key: 'google_signin_enabled', value: enabled ? 'true' : 'false' },
      { key: 'google_client_id', value: clientId },
      { key: 'google_client_secret', value: clientSecret },
      { key: 'google_callback_url', value: callbackUrl }
    ];

    for (const setting of settingsToSave) {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({ 
          key: setting.key, 
          value: setting.value, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) throw error;
    }

    console.log(`✅ [SETTINGS UPDATE]: Google Sign-In settings updated by Admin ${payload.userId}`);
    return encryptData({ success: true, message: "Google Sign-In configurations updated successfully!" });
  } catch (err: any) {
    console.error("❌ [SET GOOGLE SETTINGS ERROR]:", err.message);
    return encryptData({ success: false, message: `System error: ${err.message}` });
  }
}
