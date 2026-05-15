'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
    const pathname = usePathname();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAll = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const startBar = useCallback(() => {
        clearAll();
        setVisible(true);
        setProgress(15);

        // Simulate incremental progress up to 85%
        let p = 15;
        intervalRef.current = setInterval(() => {
            p += Math.random() * 12;
            if (p >= 85) {
                p = 85;
                clearInterval(intervalRef.current!);
            }
            setProgress(p);
        }, 200);
    }, [clearAll]);

    const completeBar = useCallback(() => {
        clearAll();
        setProgress(100);
        timeoutRef.current = setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, 350);
    }, [clearAll]);

    // ── Kick off bar on any internal link click ────────────────────────────
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

            // Don't trigger if same page
            if (href === pathname || href === window.location.pathname) return;

            startBar();
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [pathname, startBar]);

    // ── Complete bar when pathname actually changes ────────────────────────
    const prevPathname = useRef(pathname);
    useEffect(() => {
        if (prevPathname.current !== pathname) {
            prevPathname.current = pathname;
            completeBar();
        }
    }, [pathname, completeBar]);


    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
            style={{ height: '3px' }}
        >
            <div
                style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-primary) 100%)',
                    transition: progress === 100
                        ? 'width 0.2s ease-out, opacity 0.35s ease 0.2s'
                        : 'width 0.2s ease-out',
                    opacity: visible ? 1 : 0,
                    boxShadow: '0 0 10px var(--color-primary)',
                    borderRadius: '0 2px 2px 0',
                }}
            />
        </div>
    );
}
