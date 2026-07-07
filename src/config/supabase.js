// =============================================================================
// Konfigurasi Supabase Client
// =============================================================================
// Dua jenis client:
// 1. supabaseAdmin  → menggunakan Service Role Key, bypass RLS (untuk operasi sistem)
// 2. createUserClient → membuat client per-request sesuai token user (respects RLS)
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Validasi environment variables yang diperlukan
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Environment variable ${envVar} belum diatur!`);
    process.exit(1);
  }
}

// Client admin - untuk operasi sistem (bypass RLS)
// Gunakan hanya di backend, JANGAN pernah ekspos ke frontend
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Buat client per-request yang sesuai dengan user (respects RLS)
// Token dikirim dari header Authorization client
export function createUserClient(token) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
