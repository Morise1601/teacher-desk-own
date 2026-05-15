'use client';

import { usePathname } from 'next/navigation';
import MessagePopup from './MessagePopup';

export default function MessagePopupWrapper() {
    const pathname = usePathname();
    
    // Do not show the floating popup on message pages, homepage, or authentication pages
    const isExcluded = 
        pathname === '/messages' || 
        pathname === '/' || 
        pathname === '/authentication' || 
        pathname?.startsWith('/dashboard/super-admin/messages');

    if (isExcluded) return null;
    
    return <MessagePopup />;
}
