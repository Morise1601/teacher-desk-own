'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/ui/loading-screen';
import { IoIosHome } from 'react-icons/io';

const PUBLIC_PATHS = ['/', '/authentication', '/maintenance'];

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let isSubscribed = true;

        const checkAuth = async () => {
            const isPublicPath = PUBLIC_PATHS.includes(pathname);
            
            // If it is a public path, skip the session verification completely
            if (isPublicPath) {
                if (isSubscribed) {
                    setIsAuthenticated(false);
                    setLoading(false);
                }
                return;
            }

            try {
                // Retrieve the user session dynamically
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (isSubscribed) {
                        setIsAuthenticated(false);
                        setLoading(false);
                        router.push('/');
                    }
                } else {
                    if (isSubscribed) {
                        setIsAuthenticated(true);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("AuthGuard session check error:", error);
                if (isSubscribed) {
                    setIsAuthenticated(false);
                    setLoading(false);
                    router.push('/');
                }
            }
        };

        checkAuth();

        // Subscribe to auth state changes to detect sign-out globally
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const isPublicPath = PUBLIC_PATHS.includes(pathname);
            if (!session && !isPublicPath) {
                if (isSubscribed) {
                    setIsAuthenticated(false);
                    setLoading(false);
                    router.push('/');
                }
            }
        });

        return () => {
            isSubscribed = false;
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Render immediately if on a public landing page
    if (isPublicPath) {
        return <>{children}</>;
    }

    // Show a premium loading spinner during verification
    if (loading) {
        return (
            <LoadingScreen 
                message="Verifying session..." 
                icon={<IoIosHome className="text-white w-8 h-8" />} 
            />
        );
    }

    // Render page content if session is authenticated
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Temporary loading while routing redirects to root
    return (
        <LoadingScreen 
            message="Redirecting to login..." 
            icon={<IoIosHome className="text-white w-8 h-8" />} 
        />
    );
}
