// ============================================
// Routes Dashboard Admin
// Semua endpoint memerlukan autentikasi + role admin
// ============================================

import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getStats,
  getLowStockProducts,
  getTopProducts,
  getRecentOrders,
} from '../controllers/dashboard.controller.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistik utama dashboard (admin)
 *     description: |
 *       Mengambil ringkasan statistik untuk dashboard admin:
 *       total produk aktif, total pesanan, total user, total pendapatan,
 *       dan rekap jumlah pesanan per status.
 *       Pendapatan dihitung dari pesanan berstatus processing, shipped, dan delivered.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik berhasil diambil
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
 *                     total_products:
 *                       type: integer
 *                       example: 42
 *                     total_orders:
 *                       type: integer
 *                       example: 128
 *                     total_users:
 *                       type: integer
 *                       example: 57
 *                     total_revenue:
 *                       type: number
 *                       example: 15750000
 *                     orders_by_status:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         processing:
 *                           type: integer
 *                         shipped:
 *                           type: integer
 *                         delivered:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 */
router.get('/stats', authenticate, authorizeAdmin, getStats);

/**
 * @swagger
 * /api/dashboard/low-stock:
 *   get:
 *     tags: [Dashboard]
 *     summary: Produk dengan stok menipis (admin)
 *     description: Daftar produk aktif yang stoknya di bawah atau sama dengan threshold, diurutkan dari stok terkecil.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 5
 *         description: Batas stok minimum yang dianggap menipis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah maksimal produk yang ditampilkan
 *     responses:
 *       200:
 *         description: Daftar produk stok menipis berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 *       422:
 *         description: Validasi query gagal
 */
router.get(
  '/low-stock',
  authenticate,
  authorizeAdmin,
  [
    query('threshold').optional().isInt({ min: 0 }).withMessage('Threshold harus bilangan bulat >= 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus antara 1-100'),
  ],
  validate,
  getLowStockProducts
);

/**
 * @swagger
 * /api/dashboard/top-products:
 *   get:
 *     tags: [Dashboard]
 *     summary: Produk terlaris (admin)
 *     description: Daftar produk terlaris berdasarkan total quantity yang terjual, diagregasi dari item pesanan.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Jumlah produk teratas yang ditampilkan
 *     responses:
 *       200:
 *         description: Produk terlaris berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 *       422:
 *         description: Validasi query gagal
 */
router.get(
  '/top-products',
  authenticate,
  authorizeAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit harus antara 1-50'),
  ],
  validate,
  getTopProducts
);

/**
 * @swagger
 * /api/dashboard/recent-orders:
 *   get:
 *     tags: [Dashboard]
 *     summary: Pesanan terbaru (admin)
 *     description: Daftar pesanan terbaru beserta informasi singkat pemesan, diurutkan dari yang paling baru.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Jumlah pesanan yang ditampilkan
 *     responses:
 *       200:
 *         description: Pesanan terbaru berhasil diambil
 *       401:
 *         description: Token tidak valid
 *       403:
 *         description: Akses ditolak, bukan admin
 *       422:
 *         description: Validasi query gagal
 */
router.get(
  '/recent-orders',
  authenticate,
  authorizeAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit harus antara 1-50'),
  ],
  validate,
  getRecentOrders
);

export default router;
