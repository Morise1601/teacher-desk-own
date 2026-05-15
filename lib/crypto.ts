import CryptoJS from 'crypto-js';

// We get the secret key from environment variables for production
// In a real app, this would be in .env.local
const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || 'default-th-secret-key-12345';

/**
 * Encrypt any object or string using AES
 */
export function encryptData(data: any): string {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
}

/**
 * Decrypt a string back to original format
 */
export function decryptData(encryptedString: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    // Check if it was originally an object
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
