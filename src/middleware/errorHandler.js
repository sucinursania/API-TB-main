// =============================================================================
// Middleware Global Error Handler
// =============================================================================
// Menangani semua error yang tidak tertangkap di route handler.
// Memberikan response JSON yang konsisten dan aman.
// =============================================================================

/**
 * Middleware global error handler untuk Express.
 *
 * Menangani berbagai jenis error:
 * - Error dari Supabase (PostgrestError, AuthError)
 * - Error validasi (express-validator)
 * - Error umum JavaScript
 *
 * Di mode development, menyertakan error stack untuk debugging.
 *
 * @param {Error} err - Object error yang ditangkap
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next - Harus ada 4 parameter agar Express mengenali sebagai error handler
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Log error ke console untuk monitoring
  console.error('═══════════════════════════════════════════');
  console.error(`❌ ERROR: ${err.message}`);
  console.error(`📍 Path: ${req.method} ${req.originalUrl}`);
  console.error(`🕐 Waktu: ${new Date().toISOString()}`);

  if (process.env.NODE_ENV === 'development') {
    console.error('📋 Stack:', err.stack);
  }

  console.error('═══════════════════════════════════════════');

  // Tentukan status code berdasarkan jenis error
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Terjadi kesalahan pada server.';
  let errors = null;

  // Tangani error spesifik dari Supabase (PostgrestError)
  if (err.code && err.details && err.hint) {
    statusCode = 400;
    message = 'Kesalahan pada operasi database.';
    errors = {
      code: err.code,
      details: err.details,
      hint: err.hint,
    };
  }

  // Tangani error autentikasi Supabase (AuthError)
  if (err.name === 'AuthError' || err.__isAuthError) {
    statusCode = 401;
    message = err.message || 'Kesalahan autentikasi.';
  }

  // Tangani error validasi (dari express-validator atau custom)
  if (err.name === 'ValidationError' || err.type === 'validation') {
    statusCode = 422;
    message = 'Data yang dikirim tidak valid.';
    errors = err.errors || null;
  }

  // Tangani error Multer (upload file)
  if (err.name === 'MulterError') {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Ukuran file melebihi batas maksimum (5MB).';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Field upload file tidak sesuai.';
        break;
      default:
        message = `Kesalahan upload file: ${err.message}`;
    }
  }

  // Tangani error JSON parsing
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Format JSON pada request body tidak valid.';
  }

  // Jangan tampilkan detail error internal di mode production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Terjadi kesalahan internal pada server.';
  }

  // Kirim response error yang konsisten
  const errorResponse = {
    success: false,
    message,
  };

  // Sertakan detail error jika ada
  if (errors) {
    errorResponse.errors = errors;
  }

  // Sertakan stack trace di mode development untuk debugging
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
