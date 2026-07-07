// =============================================================================
// Middleware Autentikasi & Otorisasi
// =============================================================================
// authenticate  → Verifikasi token JWT dan attach user ke request
// authorizeAdmin → Cek apakah user memiliki role 'admin' via JOIN tabel roles
// =============================================================================

import { supabaseAdmin, createUserClient } from '../config/supabase.js';

/**
 * Middleware untuk memverifikasi token JWT dari Supabase Auth.
 *
 * Alur:
 * 1. Ambil token dari header Authorization (format: "Bearer <token>")
 * 2. Verifikasi token menggunakan supabaseAdmin.auth.getUser()
 * 3. Jika valid, attach data user ke req.user
 * 4. Buat client Supabase yang scoped ke user tersebut di req.supabase
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authenticate = async (req, res, next) => {
  try {
    // Ambil header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    // Ekstrak token dari header
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Format token tidak valid.',
      });
    }

    // Verifikasi token menggunakan Supabase Admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kedaluwarsa.',
      });
    }

    // Attach data user ke request object
    req.user = data.user;

    // Buat Supabase client yang scoped ke user ini (respects RLS)
    req.supabase = createUserClient(token);

    next();
  } catch (error) {
    console.error('❌ Error pada middleware authenticate:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada proses autentikasi.',
    });
  }
};

/**
 * Middleware untuk memverifikasi apakah user memiliki role 'admin'.
 *
 * HARUS digunakan SETELAH middleware authenticate.
 *
 * Alur:
 * 1. Ambil user ID dari req.user (sudah di-set oleh authenticate)
 * 2. Query tabel profiles JOIN tabel roles untuk cek nama role
 * 3. Jika role bukan 'admin', tolak dengan 403
 *
 * Menggunakan supabaseAdmin (service role) agar bisa bypass RLS
 * saat mengecek role user.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authorizeAdmin = async (req, res, next) => {
  try {
    // Pastikan middleware authenticate sudah dijalankan
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan sebelum otorisasi.',
      });
    }

    // Query profiles JOIN roles untuk mendapatkan nama role user
    // Menggunakan supabaseAdmin agar bypass RLS
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role_id, roles(id, name)')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('❌ Error saat mengecek role admin:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal memverifikasi role pengguna.',
      });
    }

    // Cek apakah profile ditemukan dan memiliki role 'admin'
    if (!profile || profile.roles?.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses resource ini.',
      });
    }

    // Simpan informasi role di request untuk digunakan di handler selanjutnya
    req.userRole = profile.roles.name;

    next();
  } catch (error) {
    console.error('❌ Error pada middleware authorizeAdmin:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada proses otorisasi.',
    });
  }
};
