// ============================================
// Routes Keranjang Belanja
// Semua endpoint memerlukan autentikasi
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';

const router = Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Lihat keranjang belanja
 *     description: Mengambil isi keranjang belanja user yang sedang login, termasuk detail produk dan total harga
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Keranjang berhasil diambil
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart_id:
 *                       type: string
 *                     items:
 *                       type: array
 *                     total_items:
 *                       type: integer
 *                     grand_total:
 *                       type: number
 *       401:
 *         description: Token tidak valid atau tidak ada
 */
router.get('/', authenticate, getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     tags: [Cart]
 *     summary: Tambah item ke keranjang
 *     description: Menambahkan produk ke keranjang. Jika produk sudah ada, jumlahnya akan ditambahkan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID produk yang akan ditambahkan
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Jumlah produk
 *     responses:
 *       201:
 *         description: Produk berhasil ditambahkan ke keranjang
 *       400:
 *         description: Stok tidak mencukupi atau produk tidak aktif
 *       401:
 *         description: Token tidak valid
 *       404:
 *         description: Produk tidak ditemukan
 *       422:
 *         description: Validasi gagal
 */
router.post(
  '/',
  authenticate,
  [
    body('product_id')
      .notEmpty().withMessage('ID produk wajib diisi')
      .isUUID().withMessage('ID produk harus berformat UUID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('Jumlah minimal 1')
  ],
  validate,
  addToCart
);

/**
 * @swagger
 * /api/cart/{id}:
 *   put:
 *     tags: [Cart]
 *     summary: Update jumlah item di keranjang
 *     description: Mengubah jumlah (quantity) item yang sudah ada di keranjang
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID item keranjang (cart_item)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Jumlah baru
 *     responses:
 *       200:
 *         description: Jumlah item berhasil diperbarui
 *       400:
 *         description: Stok tidak mencukupi
 *       401:
 *         description: Token tidak valid
 *       404:
 *         description: Item tidak ditemukan di keranjang
 *       422:
 *         description: Validasi gagal
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('ID item harus berformat UUID'),
    body('quantity')
      .notEmpty().withMessage('Jumlah wajib diisi')
      .isInt({ min: 1 }).withMessage('Jumlah minimal 1')
  ],
  validate,
  updateCartItem
);

/**
 * @swagger
 * /api/cart/{id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Hapus satu item dari keranjang
 *     description: Menghapus item tertentu dari keranjang berdasarkan ID item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID item keranjang
 *     responses:
 *       200:
 *         description: Item berhasil dihapus dari keranjang
 *       401:
 *         description: Token tidak valid
 *       404:
 *         description: Item tidak ditemukan
 */
router.delete(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('ID item harus berformat UUID')
  ],
  validate,
  removeCartItem
);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Kosongkan keranjang
 *     description: Menghapus semua item dari keranjang belanja
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Keranjang berhasil dikosongkan
 *       401:
 *         description: Token tidak valid
 */
router.delete('/', authenticate, clearCart);

export default router;
