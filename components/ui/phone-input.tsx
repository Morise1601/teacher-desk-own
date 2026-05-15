'use client';

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function PhoneInput({ value, onChange, error, className, ...props }: PhoneInputProps) {
  
  // Format the 10 digits into "+91 xxxxx xxxxx"
  const formatPhone = (digits: string) => {
    // Keep only numbers
    const cleanDigits = digits.replace(/\D/g, '').slice(0, 10);

    let formatted = "+91";
    if (cleanDigits.length > 0) {
      formatted += " " + cleanDigits.slice(0, 5);
    }
    if (cleanDigits.length > 5) {
      formatted += " " + cleanDigits.slice(5, 10);
    }
    
    return { formatted, digits: cleanDigits };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    
    // Remove the +91 prefix if it's there to prevent doubling up
    if (inputVal.startsWith('+91')) {
      inputVal = inputVal.substring(3);
    }
    
    const { digits } = formatPhone(inputVal);
    onChange(digits);
  };

  const displayValue = value ? formatPhone(value).formatted : "+91 ";

  return (
    <div className="relative group w-full">
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="+91 xxxxx xxxxx"
        className={cn(
          "pl-11 h-10 transition-all duration-300",
          error && "border-red-500 bg-red-50/30 focus-visible:ring-red-500/20",
          className
        )}
      />
      {/* Visual indicator for +91 if needed, but it's part of the value now */}
    </div>
  );
}
