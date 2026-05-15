'use client';

import * as React from "react";
import { useState } from "react";
import { Input } from "./input";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.ComponentProps<"input"> {
  error?: boolean;
}

export function PasswordInput({ className, error, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group w-full">
      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn(
          "pr-10 h-10 transition-all duration-300",
          error && "border-red-500 bg-red-50/30 focus-visible:ring-red-500/20",
          className
        )}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--color-primary)] transition-colors p-1"
        tabIndex={-1}
      >
        {showPassword ? (
          <FaEyeSlash size={14} />
        ) : (
          <FaEye size={14} />
        )}
      </button>
    </div>
  );
}
