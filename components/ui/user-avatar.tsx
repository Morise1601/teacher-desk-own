import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: number;
  fallbackClassName?: string;
}

export function UserAvatar({ 
  src, 
  name, 
  className, 
  size = 20,
  fallbackClassName
}: UserAvatarProps) {
  const [error, setError] = useState(false);
  
  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    return parts[0][0].toUpperCase();
  };

  const hasImage = src && src.startsWith('http') && !error;

  return (
    <div className={cn(
      "relative flex-shrink-0 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200/50 transition-all duration-500",
      className
    )}>
      {hasImage ? (
        <Image 
            src={src as string} 
            alt={name || "User"} 
            fill 
            className="object-cover transition-transform duration-700 hover:scale-110" 
            onError={() => setError(true)}
        />
      ) : name ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/10 via-white to-[var(--color-secondary)]/10">
            <span className={cn("font-bold text-[var(--color-primary)] oswald-font tracking-tight", fallbackClassName)}>
            {getInitials(name)}
            </span>
        </div>
      ) : (
        <UserIcon size={size} className="text-slate-300" />
      )}
    </div>
  );
}
