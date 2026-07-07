// =============================================================================
// Routes Review / Ulasan
// =============================================================================
// Definisi endpoint untuk ulasan produk.
// GET ulasan bersifat publik, POST memerlukan autentikasi,
// DELETE hanya bisa dilakukan oleh pemilik ulasan.
//
// Mounting di app.js: app.use('/api/reviews', reviewRoutes)
// Sehingga path lengkap:
//   GET  /api/reviews/product/:productId  — Ambil ulasan produk
//   POST /api/reviews/product/:productId  — Tambah ulasan
//   DELETE /api/reviews/:id               — Hapus ulasan sendiri
// =============================================================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  getProductReviews,
  createReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = Router();

// =============================================================================
// Validasi Rules
// =============================================================================

// Validasi parameter productId
const productIdValidation = [
  param('productId')
    .isUUID()
    .withMessage('Format ID produk tidak valid.'),
];

// Validasi query pagination untuk list ulasan
const listReviewsValidation = [
  param('productId')
    .isUUID()
    .withMessage('Format ID produk tidak valid.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus bilangan bulat positif.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100.'),
];

// Validasi untuk membuat ulasan
const createReviewValidation = [
  param('productId')
    .isUUID()
    .withMessage('Format ID produk tidak valid.'),
  body('rating')
    .notEmpty()
    .withMessage('Rating wajib diisi.')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating harus antara 1-5.'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Komentar maksimal 1000 karakter.'),
];

// Validasi parameter ID ulasan
const reviewIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Format ID ulasan tidak valid.'),
];

// =============================================================================
// Route Definitions
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Endpoint manajemen ulasan produk
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID unik ulasan
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Nilai rating (1-5)
 *         comment:
 *           type: string
 *           description: Komentar ulasan
 *         reviewer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             full_name:
 *               type: string
 *             avatar_url:
 *               type: string
 *               format: uri
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Ambil semua ulasan produk
 *     description: |
 *       Mengambil daftar semua ulasan untuk produk tertentu.
 *       Termasuk nama dan avatar reviewer dari tabel profiles.
 *       Mendukung pagination. Endpoint publik, tidak memerlukan autentikasi.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah item per halaman
 *     responses:
 *       200:
 *         description: Daftar ulasan berhasil diambil
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
 *                   example: Ulasan untuk produk berhasil diambil.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Produk tidak ditemukan
 *       422:
 *         description: Format ID produk tidak valid
 *       500:
 *         description: Kesalahan server
 */
router.get('/product/:productId', listReviewsValidation, validate, getProductReviews);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   post:
 *     tags: [Reviews]
 *     summary: Tambah ulasan produk
 *     description: |
 *       Menambahkan ulasan untuk produk tertentu. Memerlukan autentikasi.
 *       Setiap user hanya bisa memberikan 1 ulasan per produk (UNIQUE constraint).
 *       Rating harus bernilai antara 1-5.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk yang akan diulas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: Nilai rating (1-5)
 *               comment:
 *                 type: string
 *                 example: Produk sangat bagus, kualitas premium!
 *                 description: Komentar ulasan (opsional, maks 1000 karakter)
 *     responses:
 *       201:
 *         description: Ulasan berhasil ditambahkan
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
 *                   example: Ulasan berhasil ditambahkan.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     rating:
 *                       type: integer
 *                     comment:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       404:
 *         description: Produk tidak ditemukan atau tidak aktif
 *       409:
 *         description: User sudah pernah memberikan ulasan untuk produk ini
 *       422:
 *         description: Validasi input gagal
 */
router.post('/product/:productId', authenticate, createReviewValidation, validate, createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Hapus ulasan sendiri
 *     description: Menghapus ulasan berdasarkan ID. User hanya bisa menghapus ulasan miliknya sendiri. Memerlukan autentikasi.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik ulasan yang akan dihapus
 *     responses:
 *       200:
 *         description: Ulasan berhasil dihapus
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
 *                   example: Ulasan berhasil dihapus.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Tidak memiliki izin untuk menghapus ulasan ini
 *       404:
 *         description: Ulasan tidak ditemukan
 *       422:
 *         description: Format ID tidak valid
 */
router.delete('/:id', authenticate, reviewIdValidation, validate, deleteReview);

export default router;
