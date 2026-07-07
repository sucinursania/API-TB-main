// =============================================================================
// Routes Kategori
// =============================================================================
// Definisi endpoint CRUD untuk kategori produk.
// GET bersifat publik, POST/PUT/DELETE memerlukan autentikasi admin.
// =============================================================================

import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';

const router = Router();

// =============================================================================
// Validasi Rules
// =============================================================================

// Validasi untuk membuat kategori baru
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama kategori wajib diisi.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama kategori harus antara 2-100 karakter.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter.'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Format URL gambar tidak valid.'),
];

// Validasi untuk mengupdate kategori
const updateCategoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Format ID kategori tidak valid.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama kategori harus antara 2-100 karakter.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Deskripsi maksimal 500 karakter.'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Format URL gambar tidak valid.'),
];

// Validasi parameter ID
const idParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Format ID kategori tidak valid.'),
];

// =============================================================================
// Route Definitions
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Endpoint manajemen kategori produk
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID unik kategori
 *         name:
 *           type: string
 *           description: Nama kategori
 *         slug:
 *           type: string
 *           description: Slug URL-friendly dari nama kategori
 *         description:
 *           type: string
 *           description: Deskripsi kategori
 *         image_url:
 *           type: string
 *           format: uri
 *           description: URL gambar kategori
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Waktu pembuatan kategori
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Ambil semua kategori
 *     description: Mengambil daftar seluruh kategori produk. Endpoint publik, tidak memerlukan autentikasi.
 *     responses:
 *       200:
 *         description: Daftar kategori berhasil diambil
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
 *                   example: Daftar kategori berhasil diambil.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Kesalahan server
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Ambil kategori berdasarkan ID
 *     description: Mengambil detail kategori berdasarkan ID. Endpoint publik, tidak memerlukan autentikasi.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik kategori
 *     responses:
 *       200:
 *         description: Kategori berhasil diambil
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
 *                   example: Kategori berhasil diambil.
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Kategori tidak ditemukan
 *       422:
 *         description: Format ID tidak valid
 */
router.get('/:id', idParamValidation, validate, getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Tambah kategori baru
 *     description: Menambahkan kategori produk baru. Hanya admin yang bisa mengakses. Slug otomatis di-generate dari nama.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Elektronik
 *                 description: Nama kategori
 *               description:
 *                 type: string
 *                 example: Perangkat elektronik dan gadget
 *                 description: Deskripsi kategori (opsional)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/electronics.jpg
 *                 description: URL gambar kategori (opsional)
 *     responses:
 *       201:
 *         description: Kategori berhasil ditambahkan
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
 *                   example: Kategori berhasil ditambahkan.
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       409:
 *         description: Kategori dengan nama serupa sudah ada
 *       422:
 *         description: Validasi input gagal
 */
router.post('/', authenticate, authorizeAdmin, createCategoryValidation, validate, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update kategori
 *     description: Mengupdate data kategori berdasarkan ID. Hanya admin yang bisa mengakses. Jika nama diubah, slug otomatis diupdate.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik kategori yang akan diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Elektronik Updated
 *                 description: Nama kategori baru (opsional)
 *               description:
 *                 type: string
 *                 example: Deskripsi kategori yang diupdate
 *                 description: Deskripsi baru (opsional)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/electronics-new.jpg
 *                 description: URL gambar baru (opsional)
 *     responses:
 *       200:
 *         description: Kategori berhasil diupdate
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
 *                   example: Kategori berhasil diupdate.
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Tidak ada data yang diupdate
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       404:
 *         description: Kategori tidak ditemukan
 *       409:
 *         description: Kategori dengan nama serupa sudah ada
 *       422:
 *         description: Validasi input gagal
 */
router.put('/:id', authenticate, authorizeAdmin, updateCategoryValidation, validate, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Hapus kategori
 *     description: Menghapus kategori berdasarkan ID. Hanya admin yang bisa mengakses. Kategori yang masih memiliki produk tidak bisa dihapus.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik kategori yang akan dihapus
 *     responses:
 *       200:
 *         description: Kategori berhasil dihapus
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
 *                   example: Kategori berhasil dihapus.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       404:
 *         description: Kategori tidak ditemukan
 *       409:
 *         description: Kategori masih memiliki produk
 *       422:
 *         description: Format ID tidak valid
 */
router.delete('/:id', authenticate, authorizeAdmin, idParamValidation, validate, deleteCategory);

export default router;
