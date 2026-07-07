// =============================================================================
// Controller Autentikasi
// =============================================================================
// Menangani proses registrasi, login, logout, dan manajemen profil pengguna.
// Menggunakan Supabase Auth untuk autentikasi dan tabel profiles untuk data tambahan.
// =============================================================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Register user baru.
 *
 * Alur:
 * 1. Buat user di Supabase Auth menggunakan admin.createUser()
 * 2. Kirim full_name di user_metadata agar trigger auto-create profile bisa menggunakannya
 * 3. Kembalikan data user yang baru dibuat
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Buat user baru melalui Supabase Auth Admin API
    // full_name disimpan di user_metadata agar bisa diakses oleh trigger database
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true, // Auto-konfirmasi email untuk kemudahan development
    });

    if (error) {
      // Handle error spesifik dari Supabase
      if (error.message.includes('already') || error.message.includes('exists')) {
        return errorResponse(res, 'Email sudah terdaftar.', 409);
      }
      return errorResponse(res, `Gagal mendaftarkan user: ${error.message}`, 400);
    }

    // Kembalikan data user tanpa informasi sensitif
    return successResponse(res, 'Registrasi berhasil.', {
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || full_name,
        created_at: data.user.created_at,
      },
    }, 201);
  } catch (error) {
    console.error('❌ Error pada register:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Login user.
 *
 * Alur:
 * 1. Autentikasi menggunakan email dan password via Supabase Auth
 * 2. Ambil data profil lengkap (JOIN profiles + roles)
 * 3. Kembalikan access_token, refresh_token, dan data user + profil
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Login via Supabase Auth — mengembalikan session dengan token
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return errorResponse(res, 'Email atau password salah.', 401);
    }

    // Ambil data profil lengkap termasuk role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, avatar_url, roles(id, name)')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Gagal mengambil profil saat login:', profileError.message);
    }

    return successResponse(res, 'Login berhasil.', {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || data.user.user_metadata?.full_name,
        phone: profile?.phone || null,
        avatar_url: profile?.avatar_url || null,
        role: profile?.roles?.name || 'customer',
      },
    });
  } catch (error) {
    console.error('❌ Error pada login:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Logout user.
 *
 * Karena Supabase menggunakan JWT, logout dari sisi server cukup
 * memberikan response sukses. Token akan expired secara alami.
 * Klien bertanggung jawab menghapus token dari penyimpanan lokal.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const logout = async (_req, res) => {
  try {
    // JWT bersifat stateless, jadi tidak perlu invalidasi di server
    // Klien harus menghapus token dari storage mereka
    return successResponse(res, 'Logout berhasil. Silakan hapus token di sisi klien.');
  } catch (error) {
    console.error('❌ Error pada logout:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Lihat profil user yang sedang login.
 *
 * Mengambil data lengkap dari tabel profiles dan JOIN ke tabel roles
 * untuk mendapatkan informasi role pengguna.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getProfile = async (req, res) => {
  try {
    // Query profil lengkap dengan JOIN ke tabel roles
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, avatar_url, created_at, updated_at, roles(id, name, description)')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return errorResponse(res, 'Profil tidak ditemukan.', 404);
    }

    return successResponse(res, 'Profil berhasil diambil.', {
      id: profile.id,
      email: req.user.email,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      role: profile.roles,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('❌ Error pada getProfile:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Update profil user yang sedang login.
 *
 * Field yang bisa diupdate: full_name, phone, avatar_url.
 * Hanya field yang dikirim yang akan diupdate (partial update).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;

    // Siapkan object update — hanya field yang dikirim
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Pastikan ada field yang diupdate
    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'Tidak ada data yang diupdate.', 400);
    }

    // Tambahkan timestamp update
    updateData.updated_at = new Date().toISOString();

    // Update profil di database
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, full_name, phone, avatar_url, created_at, updated_at')
      .single();

    if (error) {
      console.error('❌ Gagal update profil:', error.message);
      return errorResponse(res, `Gagal mengupdate profil: ${error.message}`, 400);
    }

    // Update juga user_metadata di Supabase Auth agar konsisten
    if (full_name) {
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        user_metadata: { full_name },
      });
    }

    return successResponse(res, 'Profil berhasil diupdate.', {
      id: profile.id,
      email: req.user.email,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('❌ Error pada updateProfile:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};
