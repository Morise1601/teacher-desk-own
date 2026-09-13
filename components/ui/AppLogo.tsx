'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';

interface AppLogoProps {
  variant?: 'full' | 'app';
  mode?: 'auto' | 'light' | 'dark'; // 'auto' uses theme context, or force 'light' / 'dark'
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function AppLogo({
  variant = 'full',
  mode = 'auto',
  className = '',
  width,
  height,
  priority = false,
}: AppLogoProps) {
  const { theme, isMounted } = useTheme();

  // If mode is explicit, use it; otherwise use theme from context (defaulting to light before mount)
  const currentTheme = mode === 'auto' ? (isMounted ? theme : 'light') : mode;
  const isDark = currentTheme === 'dark';

  if (variant === 'app') {
    const src = isDark ? '/images/App_logo_dark.webp' : '/images/App_logo_light.webp';
    const finalWidth = width || 40;
    const finalHeight = height || 40;

    return (
      <Image
        src={src}
        alt="TeacherDesk Logo"
        width={finalWidth}
        height={finalHeight}
        priority={priority}
        className={`object-contain transition-opacity duration-300 ${className}`}
      />
    );
  }

  // Full horizontal logo
  const src = isDark ? '/images/logo_dark.webp' : '/images/logo_light.webp';
  // Default aspect ratio for full logo is ~5:1 or ~6:1
  const finalWidth = width || 170;
  const finalHeight = height || 36;

  return (
    <Image
      src={src}
      alt="TeacherDesk Full Logo"
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      className={`object-contain transition-opacity duration-300 ${className}`}
    />
  );
}
