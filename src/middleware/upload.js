// =============================================================================
// Middleware Upload File (Multer + Supabase Storage)
// =============================================================================
// Mengkonfigurasi Multer untuk upload file ke memory buffer,
// lalu meng-upload ke Supabase Storage.
// =============================================================================

import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

// Daftar tipe MIME yang diizinkan untuk upload gambar
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Batas ukuran file: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Filter file berdasarkan tipe MIME.
 * Hanya menerima gambar dengan format JPEG, PNG, dan WebP.
 */
const fileFilter = (_req, file, callback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    const error = new Error(
      `Tipe file tidak diizinkan: ${file.mimetype}. Hanya menerima JPEG, PNG, dan WebP.`
    );
    error.name = 'MulterError';
    error.code = 'LIMIT_UNEXPECTED_FILE';
    callback(error, false);
  }
};

/**
 * Konfigurasi Multer:
 * - Menggunakan memoryStorage agar file tersimpan di buffer (RAM)
 * - Batas ukuran file 5MB
 * - Hanya menerima tipe gambar tertentu
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Upload file buffer ke Supabase Storage dan kembalikan public URL.
 *
 * @param {Object} file - Object file dari Multer (req.file)
 * @param {Buffer} file.buffer - Buffer data file
 * @param {string} file.originalname - Nama asli file
 * @param {string} file.mimetype - Tipe MIME file
 * @param {string} bucket - Nama bucket di Supabase Storage
 * @param {string} folder - Nama folder di dalam bucket (opsional prefix)
 * @returns {Promise<{url: string, path: string}>} Public URL dan path file di storage
 * @throws {Error} Jika upload gagal
 */
export const uploadToSupabase = async (file, bucket, folder = '') => {
  // Generate nama file unik menggunakan timestamp + random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = path.extname(file.originalname).toLowerCase();
  const fileName = `${timestamp}-${randomString}${extension}`;

  // Susun path lengkap di storage
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Upload file ke Supabase Storage menggunakan admin client
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false, // Jangan timpa file yang sudah ada
    });

  if (error) {
    console.error('❌ Gagal upload file ke Supabase Storage:', error.message);
    throw new Error(`Gagal mengupload file: ${error.message}`);
  }

  // Dapatkan public URL untuk file yang diupload
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
};
