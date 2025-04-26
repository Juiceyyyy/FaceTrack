// -------------------------------
// SUPABASE CLIENT INITIALIZATION
// -------------------------------
// Features:
// 1. Environment validation
// 2. Client instance creation
// -------------------------------

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase credentials! 
    Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_KEY
  `);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;

// -------------------------------
// HELPER FUNCTIONS
// -------------------------------

/**
 * Get public URL for storage object
 * @param {string} path - Storage path
 */
export const getPublicUrl = (path) => 
  supabase.storage.from("static").getPublicUrl(path).data.publicUrl;