// =============================================================================
// Routes Produk
// =============================================================================
// Definisi endpoint CRUD untuk produk.
// GET bersifat publik, POST/PUT/DELETE/upload memerlukan autentikasi admin.
// =============================================================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/product.controller.js';

const router = Router();

// =============================================================================
// Validasi Rules
// =============================================================================

// Validasi query parameters untuk list produk
const listProductsValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Kata kunci pencarian maksimal 200 karakter.'),
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Format category_id tidak valid.'),
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'newest'])
    .withMessage('Sort harus salah satu dari: price_asc, price_desc, newest.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus bilangan bulat positif.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100.'),
];

// Validasi untuk membuat produk baru
const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama produk wajib diisi.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nama produk harus antara 2-200 karakter.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Deskripsi maksimal 2000 karakter.'),
  body('price')
    .notEmpty()
    .withMessage('Harga produk wajib diisi.')
    .isFloat({ min: 0 })
    .withMessage('Harga harus berupa angka positif.'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok harus berupa bilangan bulat positif.'),
  body('category_id')
    .notEmpty()
    .withMessage('ID kategori wajib diisi.')
    .isUUID()
    .withMessage('Format ID kategori tidak valid.'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Format URL gambar tidak valid.'),
];

// Validasi untuk mengupdate produk
const updateProductValidation = [
  param('id')
    .isUUID()
    .withMessage('Format ID produk tidak valid.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nama produk harus antara 2-200 karakter.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Deskripsi maksimal 2000 karakter.'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Harga harus berupa angka positif.'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok harus berupa bilangan bulat positif.'),
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Format ID kategori tidak valid.'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Format URL gambar tidak valid.'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active harus berupa boolean.'),
];

// Validasi parameter ID
const idParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Format ID produk tidak valid.'),
];

// =============================================================================
// Route Definitions
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Endpoint manajemen produk
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID unik produk
 *         name:
 *           type: string
 *           description: Nama produk
 *         slug:
 *           type: string
 *           description: Slug URL-friendly dari nama produk
 *         description:
 *           type: string
 *           description: Deskripsi produk
 *         price:
 *           type: number
 *           format: float
 *           description: Harga produk
 *         stock:
 *           type: integer
 *           description: Jumlah stok produk
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: ID kategori produk
 *         image_url:
 *           type: string
 *           format: uri
 *           description: URL gambar produk
 *         is_active:
 *           type: boolean
 *           description: Status aktif produk
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         categories:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             slug:
 *               type: string
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Ambil semua produk aktif
 *     description: |
 *       Mengambil daftar semua produk aktif dengan dukungan pencarian, filter, sorting, dan pagination.
 *       Endpoint publik, tidak memerlukan autentikasi.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari produk berdasarkan nama (case-insensitive)
 *         example: laptop
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter berdasarkan ID kategori
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest]
 *         description: Urutan sorting (default - newest)
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
 *         description: Daftar produk berhasil diambil
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
 *                   example: Daftar produk berhasil diambil.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
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
 *       422:
 *         description: Validasi query parameter gagal
 *       500:
 *         description: Kesalahan server
 */
router.get('/', listProductsValidation, validate, getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Ambil detail produk
 *     description: Mengambil detail produk berdasarkan ID. Termasuk informasi kategori dan rata-rata rating dari ulasan. Endpoint publik.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk
 *     responses:
 *       200:
 *         description: Detail produk berhasil diambil
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
 *                   example: Detail produk berhasil diambil.
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Product'
 *                     - type: object
 *                       properties:
 *                         average_rating:
 *                           type: number
 *                           format: float
 *                           example: 4.5
 *                           description: Rata-rata rating dari ulasan
 *                         total_reviews:
 *                           type: integer
 *                           example: 10
 *                           description: Total jumlah ulasan
 *       404:
 *         description: Produk tidak ditemukan
 *       422:
 *         description: Format ID tidak valid
 */
router.get('/:id', idParamValidation, validate, getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Tambah produk baru
 *     description: Menambahkan produk baru ke database. Hanya admin yang bisa mengakses. Slug otomatis di-generate dari nama produk.
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
 *               - price
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop Gaming ASUS ROG
 *                 description: Nama produk
 *               description:
 *                 type: string
 *                 example: Laptop gaming dengan prosesor terbaru
 *                 description: Deskripsi produk (opsional)
 *               price:
 *                 type: number
 *                 example: 15000000
 *                 description: Harga produk dalam Rupiah
 *               stock:
 *                 type: integer
 *                 example: 50
 *                 description: Jumlah stok (default 0)
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID kategori produk
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/laptop.jpg
 *                 description: URL gambar produk (opsional)
 *     responses:
 *       201:
 *         description: Produk berhasil ditambahkan
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
 *                   example: Produk berhasil ditambahkan.
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Data tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       404:
 *         description: Kategori tidak ditemukan
 *       422:
 *         description: Validasi input gagal
 */
router.post('/', authenticate, authorizeAdmin, createProductValidation, validate, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update produk
 *     description: Mengupdate data produk berdasarkan ID. Hanya admin yang bisa mengakses. Hanya field yang dikirim yang akan diupdate (partial update).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk yang akan diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Laptop Gaming ASUS ROG Updated
 *               description:
 *                 type: string
 *                 example: Deskripsi produk yang diupdate
 *               price:
 *                 type: number
 *                 example: 16000000
 *               stock:
 *                 type: integer
 *                 example: 45
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               image_url:
 *                 type: string
 *                 format: uri
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
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
 *                   example: Produk berhasil diupdate.
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Tidak ada data yang diupdate
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       404:
 *         description: Produk atau kategori tidak ditemukan
 *       422:
 *         description: Validasi input gagal
 */
router.put('/:id', authenticate, authorizeAdmin, updateProductValidation, validate, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Hapus produk (soft delete)
 *     description: Menonaktifkan produk dengan mengubah status is_active menjadi false. Hanya admin yang bisa mengakses. Produk tidak benar-benar dihapus dari database.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk yang akan dihapus
 *     responses:
 *       200:
 *         description: Produk berhasil dinonaktifkan
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
 *                   example: Produk berhasil dinonaktifkan.
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
 *         description: Produk tidak ditemukan
 *       422:
 *         description: Format ID tidak valid
 */
router.delete('/:id', authenticate, authorizeAdmin, idParamValidation, validate, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/image:
 *   post:
 *     tags: [Products]
 *     summary: Upload gambar produk
 *     description: Mengupload gambar produk ke Supabase Storage dan mengupdate URL gambar di database. Hanya admin yang bisa mengakses. Format yang diterima JPEG, PNG, dan WebP (maks 5MB).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID unik produk
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File gambar produk (JPEG, PNG, WebP, maks 5MB)
 *     responses:
 *       200:
 *         description: Gambar produk berhasil diupload
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
 *                   example: Gambar produk berhasil diupload.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                       format: uri
 *                     storage_path:
 *                       type: string
 *       400:
 *         description: File tidak ditemukan atau format tidak valid
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Hanya admin yang bisa mengakses
 *       404:
 *         description: Produk tidak ditemukan
 *       500:
 *         description: Gagal mengupload gambar
 */
router.post('/:id/image', authenticate, authorizeAdmin, upload.single('image'), uploadProductImage);

export default router;
