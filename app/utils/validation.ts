import { toast } from "react-toastify";

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

// Email validation
export function validateEmail(email: string): boolean {
  // Basic structure: local-part@domain
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    toast.error("Email is required");
    return false;
  }

  if (/\s/.test(email)) {
    toast.error("Email cannot contain spaces");
    return false;
  }

  if (!email.includes("@")) {
    toast.error("Email must contain '@'");
    return false;
  }

  const [localPart, domain] = email.split("@");

  if (!localPart) {
    toast.error("Email must have text before '@'");
    return false;
  }

  if (!domain) {
    toast.error("Email must have domain after '@'");
    return false;
  }

  if (!domain.includes(".")) {
    toast.error("Domain must contain '.' (e.g., example.com)");
    return false;
  }

  if (!basicRegex.test(email)) {
    toast.error("Email format is invalid");
    return false;
  }

  return true;
}

// Password validation
export function validatePassword(password: string): boolean {
  if (!password) {
    toast.error("Password is required");
    return false;
  }
  if (password.length < 8) {
    toast.error("Password must be at least 8 characters");
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    toast.error("Password must contain an uppercase letter");
    return false;
  }
  if (!/[a-z]/.test(password)) {
    toast.error("Password must contain a lowercase letter");
    return false;
  }
  if (!/[0-9]/.test(password)) {
    toast.error("Password must contain a number");
    return false;
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    toast.error("Password must contain a special character");
    return false;
  }
  return true ;
}
