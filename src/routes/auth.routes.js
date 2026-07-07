// =============================================================================
// Routes Autentikasi
// =============================================================================
// Definisi endpoint untuk registrasi, login, logout, dan manajemen profil.
// =============================================================================

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller.js';

const router = Router();

// =============================================================================
// Validasi Rules
// =============================================================================

// Validasi untuk registrasi
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter.'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Nama lengkap wajib diisi.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus antara 2-100 karakter.'),
];

// Validasi untuk login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Format email tidak valid.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi.'),
];

// Validasi untuk update profil
const updateProfileValidation = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus antara 2-100 karakter.'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-() ]+$/)
    .withMessage('Format nomor telepon tidak valid.'),
  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Format URL avatar tidak valid.'),
];

// =============================================================================
// Route Definitions
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoint autentikasi dan manajemen profil pengguna
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register user baru
 *     description: Mendaftarkan user baru ke sistem. Membuat akun di Supabase Auth dan profil di tabel profiles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Alamat email pengguna
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *                 description: Password minimal 6 karakter
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *                 description: Nama lengkap pengguna
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registrasi berhasil.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Data tidak valid atau gagal membuat akun
 *       409:
 *         description: Email sudah terdaftar
 *       422:
 *         description: Validasi input gagal
 */
router.post('/register', registerValidation, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Autentikasi user menggunakan email dan password. Mengembalikan access_token dan refresh_token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Alamat email pengguna
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: Password pengguna
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login berhasil.
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: JWT access token
 *                     refresh_token:
 *                       type: string
 *                       description: Refresh token untuk memperpanjang sesi
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         avatar_url:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: customer
 *       401:
 *         description: Email atau password salah
 *       422:
 *         description: Validasi input gagal
 */
router.post('/login', loginValidation, validate, login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Logout user dari sistem. Klien harus menghapus token dari penyimpanan lokal.
 *     responses:
 *       200:
 *         description: Logout berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout berhasil. Silakan hapus token di sisi klien.
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Lihat profil user
 *     description: Mengambil data profil lengkap user yang sedang login, termasuk informasi role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profil berhasil diambil.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       404:
 *         description: Profil tidak ditemukan
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update profil user
 *     description: Mengupdate data profil user yang sedang login. Hanya field yang dikirim yang akan diupdate (partial update).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Doe Updated
 *                 description: Nama lengkap baru
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *                 description: Nomor telepon baru
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.jpg
 *                 description: URL foto profil baru
 *     responses:
 *       200:
 *         description: Profil berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profil berhasil diupdate.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Tidak ada data yang diupdate
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       422:
 *         description: Validasi input gagal
 */
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);

export default router;
