'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldAlert, Power, Save, Sparkles, Loader2 } from 'lucide-react';
import { getMaintenanceModeAction, setMaintenanceModeAction } from '@/app/actions/maintenance';
import { decryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export default function AdminSettingsPage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const encryptedResponse = await getMaintenanceModeAction();
        const response = decryptData(encryptedResponse);
        if (response && response.success) {
          setMaintenanceEnabled(response.enabled);
        }
      } catch (err) {
        console.error("Fetch status error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();

    // Realtime subscription to keep UI in sync
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 flex flex-col pt-4 px-2">
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
            <Settings size={12} className="text-amber-300" />
            <span className="text-[10px] font-bold tracking-widest capitalize">System Configuration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold oswald-font tracking-tight capitalize leading-none drop-shadow-lg">
            Global <span className="text-indigo-300">Settings</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-300 brcob-font max-w-xl font-light leading-relaxed">
            Manage system-wide configurations and application status. Exercise caution with these controls.
          </p>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 max-w-3xl gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
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
                <p className="text-xs text-gray-500 brcob-font">When enabled, only Super Admins can access the application.</p>
              </div>
            </div>

            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${maintenanceEnabled ? 'bg-amber-500' : 'bg-gray-200'}`}
            >
              <span
                className={`${maintenanceEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>

          {maintenanceEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border border-amber-100 rounded-md p-4 flex items-start gap-3 mt-4"
            >
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-amber-800 leading-relaxed font-medium">
                <strong>Attention:</strong> Maintenance mode is currently <strong>ACTIVE</strong>. 
                Regular teachers and institutions will only see the maintenance splash page. 
                Ensure you turn this off once the maintenance is complete.
              </div>
            </motion.div>
          )}

          {!maintenanceEnabled && (
            <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md p-4 mt-4 font-medium">
              System is running normally. All users have full access.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
