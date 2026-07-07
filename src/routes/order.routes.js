// ============================================
// Routes Pesanan
// Checkout, riwayat, detail, dan manajemen status
// ============================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  checkout,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders
} from '../controllers/order.controller.js';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout dari keranjang
 *     description: |
 *       Membuat pesanan baru dari isi keranjang belanja.
 *       Proses: validasi stok → buat pesanan → snapshot harga → kurangi stok → kosongkan keranjang.
 *       Status awal pesanan: "pending". Admin akan memproses secara manual.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipping_address
 *             properties:
 *               shipping_address:
 *                 type: string
 *                 description: Alamat pengiriman lengkap
 *                 example: "Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 10110"
 *               notes:
 *                 type: string
 *                 description: Catatan tambahan (opsional)
 *                 example: "Tolong packing dengan bubble wrap"
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 *       400:
 *         description: Keranjang kosong atau stok tidak cukup
 *       401:
 *         description: Token tidak valid
 *       422:
 *         description: Validasi gagal
 */
router.post(
  '/',
  authenticate,
  [
    body('shipping_address')
      .notEmpty().withMessage('Alamat pengiriman wajib diisi')
      .isLength({ min: 10 }).withMessage('Alamat pengiriman minimal 10 karakter'),
    body('notes')
      .optional()
      .isString().withMessage('Catatan harus berupa teks')
  ],
  validate,
  checkout
);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     tags: [Orders]
 *     summary: Semua pesanan (admin)
 *     description: Mengambil daftar semua pesanan dari semua user. Khusus admin. Support filter by status dan pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter berdasarkan status pesanan
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Daftar pesanan berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 */
router.get(
  '/admin/all',
  authenticate,
  authorizeAdmin,
  [
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Status tidak valid')
  ],
  validate,
  getAllOrders
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Riwayat pesanan saya
 *     description: Mengambil daftar pesanan milik user yang sedang login. Diurutkan dari yang terbaru.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Riwayat pesanan berhasil diambil
 *       401:
 *         description: Token tidak valid
 */
router.get('/', authenticate, getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Detail pesanan
 *     description: Mengambil detail pesanan berdasarkan ID. User hanya bisa melihat pesanannya sendiri, admin bisa melihat semua.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID pesanan
 *     responses:
 *       200:
 *         description: Detail pesanan berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Tidak memiliki akses ke pesanan ini
 *       404:
 *         description: Pesanan tidak ditemukan
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('ID pesanan harus berformat UUID')
  ],
  validate,
  getOrderById
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update status pesanan (admin)
 *     description: |
 *       Mengubah status pesanan. Khusus admin. Transisi yang diperbolehkan:
 *       - pending → processing, cancelled
 *       - processing → shipped, cancelled
 *       - shipped → delivered
 *       - delivered → (tidak bisa diubah)
 *       - cancelled → (tidak bisa diubah)
 *       Jika dibatalkan, stok produk akan dikembalikan.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID pesanan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: Status baru pesanan
 *     responses:
 *       200:
 *         description: Status pesanan berhasil diubah
 *       400:
 *         description: Transisi status tidak diperbolehkan
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 *       404:
 *         description: Pesanan tidak ditemukan
 *       422:
 *         description: Validasi gagal
 */
router.put(
  '/:id/status',
  authenticate,
  authorizeAdmin,
  [
    param('id').isUUID().withMessage('ID pesanan harus berformat UUID'),
    body('status')
      .notEmpty().withMessage('Status wajib diisi')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Status tidak valid')
  ],
  validate,
  updateOrderStatus
);

export default router;
