'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { updateLastSeenAction } from '@/app/actions/profile';

/**
 * Global component that updates the user's 'last_seen' timestamp 
 * every 2 minutes as long as the application is open.
 */
export default function UserStatusTracker() {
    useEffect(() => {
        const updateStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await updateLastSeenAction(user.id);
            }
        };

        // Initial update
        updateStatus();

        // Update every 2 minutes
        const interval = setInterval(updateStatus, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
}
