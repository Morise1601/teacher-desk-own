import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

// 1. STANDARD CLIENT: Safe for both browser and server
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
        eventsPerSecond: 10,
    },
  },
});

// 2. ADMIN CLIENT: Must ONLY exist on the server (secret key is NOT exposed to browser)
export const supabaseAdmin = 
  (typeof window === 'undefined' && supabaseSecretKey)
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null as any; // Cast as any to avoid type issues in client files using it only on server
