'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getMaintenanceModeAction } from '@/app/actions/maintenance';
import { getUserRoleAction } from '@/app/actions/auth';
import { decryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import MaintenancePage from '@/app/maintenance/page';
import { Loader2 } from 'lucide-react';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 1. Check user role if logged in (needed for realtime toggle)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const encryptedRole = await getUserRoleAction(user.id);
          const roleResponse = decryptData(encryptedRole);
          if (roleResponse?.role === 'super_admin' || roleResponse?.role === 'admin') {
            setIsSuperAdmin(true);
          }
        }

        // 2. Fetch initial maintenance status
        const encryptedMaint = await getMaintenanceModeAction();
        const maintResponse = decryptData(encryptedMaint);
        const maintEnabled = maintResponse?.enabled || false;
        setIsMaintenance(maintEnabled);
      } catch (err) {
        console.error("Maintenance check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // 3. Auth state listener (to handle login/logout during maintenance)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const encryptedRole = await getUserRoleAction(session.user.id);
        const roleResponse = decryptData(encryptedRole);
        setIsSuperAdmin(roleResponse?.role === 'super_admin' || roleResponse?.role === 'admin');
      } else {
        setIsSuperAdmin(false);
      }
    });

    // 4. Realtime subscription for maintenance mode changes
    const channel = supabase
      .channel('system_settings_changes')
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
            setIsMaintenance(newValue === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      authListener.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // While checking, show nothing or a subtle loader to prevent flicker
  if (loading) {
    return (
        <div className="fixed inset-0 bg-[#eeeeee] flex items-center justify-center z-[9999]">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
    );
  }

  // Bypass paths
  const isHomePath = pathname === '/';
  const isAuthPath = pathname?.startsWith('/authentication');
  const isAdminPath = pathname?.startsWith('/dashboard/super-admin');
  const isMaintenancePath = pathname === '/maintenance';

  if (isMaintenance && !isSuperAdmin && !isHomePath && !isAuthPath && !isAdminPath && !isMaintenancePath) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
