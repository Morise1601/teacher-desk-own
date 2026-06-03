'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ShieldAlert, Power, Save, Sparkles, Loader2, Key, Globe, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getMaintenanceModeAction, setMaintenanceModeAction } from '@/app/actions/maintenance';
import { getGoogleAuthSettingsAction, setGoogleAuthSettingsAction } from '@/app/actions/settings';
import { decryptData, encryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export default function AdminSettingsPage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleCallbackUrl, setGoogleCallbackUrl] = useState('');
  
  const [showSecret, setShowSecret] = useState(false);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Retrieve current authenticated admin ID
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }

        // Fetch maintenance mode state
        const encryptedResponse = await getMaintenanceModeAction();
        const response = decryptData(encryptedResponse);
        if (response && response.success) {
          setMaintenanceEnabled(response.enabled);
        }

        // Fetch Google Auth configurations
        const encGoogleRes = await getGoogleAuthSettingsAction();
        const googleRes = decryptData(encGoogleRes);
        if (googleRes && googleRes.success) {
          const s = googleRes.settings;
          setGoogleEnabled(s.google_signin_enabled === 'true');
          setGoogleClientId(s.google_client_id);
          setGoogleClientSecret(s.google_client_secret);
          setGoogleCallbackUrl(s.google_callback_url);
        }
      } catch (err) {
        console.error("Fetch status error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();

    // Realtime subscription for maintenance mode
    const channel = supabase
      .channel('admin_settings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: "key=eq.maintenance_mode"
        },
        (payload: any) => {
          const newValue = payload.new?.value || payload.old?.value;
          if (newValue) {
            setMaintenanceEnabled(newValue === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleMaintenance = async () => {
    setSaving(true);
    try {
      const nextValue = !maintenanceEnabled;
      const encryptedResponse = await setMaintenanceModeAction(nextValue);
      const response = decryptData(encryptedResponse);
      if (response && response.success) {
        setMaintenanceEnabled(nextValue);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Failed to update maintenance mode.");
      }
    } catch (err) {
      toast.error("An error occurred while updating settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoogleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (googleEnabled && !googleClientId.trim()) {
      toast.warning("Google Client ID is required when Sign-In is enabled.");
      return;
    }

    if (googleCallbackUrl.trim()) {
      try {
        new URL(googleCallbackUrl);
      } catch {
        toast.warning("Callback URL must be a valid URL (e.g. http://localhost:3000/auth/callback).");
        return;
      }
    }

    setSavingGoogle(true);
    try {
      const payload = {
        userId,
        google_signin_enabled: googleEnabled ? 'true' : 'false',
        google_client_id: googleClientId,
        google_client_secret: googleClientSecret,
        google_callback_url: googleCallbackUrl
      };

      const encryptedPayload = encryptData(payload);
      const encResponse = await setGoogleAuthSettingsAction(encryptedPayload);
      const response = decryptData(encResponse);

      if (response && response.success) {
        toast.success(response.message);
      } else {
        toast.error(response?.message || "Failed to save Google configurations.");
      }
    } catch (err) {
      toast.error("An authentication error occurred while saving.");
    } finally {
      setSavingGoogle(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 flex flex-col pt-4 px-2 select-none">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-md bg-[var(--color-primary)] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-1 shadow-inner">
            <Settings size={12} className="text-amber-300 animate-spin-slow" />
            <span className="text-[10px] font-bold tracking-widest capitalize">System Configuration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold oswald-font tracking-tight capitalize leading-none drop-shadow-lg">
            Global <span className="text-indigo-300">Settings</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-300 brcob-font max-w-xl font-light leading-relaxed">
            Manage system-wide configurations and authentication rules. Exercise caution when altering these credentials.
          </p>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 max-w-3xl gap-6">
        
        {/* Maintenance Mode Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative overflow-hidden bg-white rounded-md p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-colors duration-300 ${maintenanceEnabled ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Power size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 oswald-font tracking-tight">Maintenance Mode</h3>
                <p className="text-xs text-gray-500 brcob-font">When active, only Super Admins can access the application portal.</p>
              </div>
            </div>

            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${maintenanceEnabled ? 'bg-amber-500' : 'bg-gray-200'}`}
            >
              <span
                className={`${maintenanceEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md`}
              />
            </button>
          </div>

          <AnimatePresence>
            {maintenanceEnabled ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 border border-amber-100 rounded-md p-4 flex items-start gap-3 mt-4"
              >
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Attention:</strong> Maintenance mode is currently <strong>ACTIVE</strong>. 
                  Teachers and Institutions will see the maintenance splash screen. 
                  Ensure you turn this off once administrative work is complete.
                </div>
              </motion.div>
            ) : (
              <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md p-4 mt-4 font-medium">
                System is running normally. All registered users have complete platform access.
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Google Authentication Settings Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="group relative overflow-hidden bg-white rounded-md p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-md flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 oswald-font tracking-tight">Google OAuth Configuration</h3>
              <p className="text-xs text-gray-500 brcob-font">Configure administrative parameters for single sign-on (SSO).</p>
            </div>
          </div>

          <form onSubmit={handleSaveGoogleSettings} className="space-y-5">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-gray-800 brcob-font">Enable Google Sign-In</span>
                <p className="text-[11px] text-gray-400 brcob-font">Allow users to log in or register securely using Google identity.</p>
              </div>
              <button
                type="button"
                onClick={() => setGoogleEnabled(!googleEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${googleEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
              >
                <span
                  className={`${googleEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                />
              </button>
            </div>

            {/* Google Client ID */}
            <div className="group space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500 brcob-font ml-0.5 flex items-center gap-1.5 group-focus-within:text-[var(--color-primary)] transition-colors">
                <Key size={12} /> Google Client ID *
              </label>
              <input
                type="text"
                placeholder="e.g. 123456-abcdef.apps.googleusercontent.com"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-sm text-[var(--color-primary)] placeholder-gray-300"
              />
            </div>

            {/* Google Client Secret */}
            <div className="group space-y-1.5 relative">
              <label className="text-[11px] font-semibold text-gray-500 brcob-font ml-0.5 flex items-center gap-1.5 group-focus-within:text-[var(--color-primary)] transition-colors">
                <Key size={12} /> Google Client Secret (Optional)
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="••••••••••••••••••••••••••••"
                  value={googleClientSecret}
                  onChange={e => setGoogleClientSecret(e.target.value)}
                  className="w-full h-10 rounded-md pl-4 pr-10 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-sm text-[var(--color-primary)] placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Callback URL */}
            <div className="group space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500 brcob-font ml-0.5 flex items-center gap-1.5 group-focus-within:text-[var(--color-primary)] transition-colors">
                <Globe size={12} /> Google OAuth Callback / Redirect URL *
              </label>
              <input
                type="text"
                placeholder="e.g. http://localhost:3000/auth/callback"
                value={googleCallbackUrl}
                onChange={e => setGoogleCallbackUrl(e.target.value)}
                className="w-full h-10 rounded-md px-4 border border-gray-100 bg-gray-50/50 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/5 transition-all duration-300 text-sm text-[var(--color-primary)] placeholder-gray-300"
              />
              <span className="text-[9px] text-gray-400 brcob-font block ml-0.5">
                Must be whitelisted in your Google Cloud Console & Supabase Redirect URIs.
              </span>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={savingGoogle}
              className="w-full h-10 mt-6 rounded-md bg-[var(--color-primary)] text-white font-bold text-xs tracking-wider capitalize hover:bg-[var(--color-primary)]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
            >
              {savingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Configuration...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Google Configuration
                </>
              )}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
