// ============================================
// Controller Dashboard Admin
// Menyediakan statistik & ringkasan untuk admin:
// - Statistik umum (jumlah produk, pesanan, user, pendapatan)
// - Rekap pesanan per status
// - Produk dengan stok menipis
// - Produk terlaris
// - Pesanan terbaru
// ============================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Status pesanan yang dihitung sebagai pendapatan (sudah selesai/diproses)
const REVENUE_STATUSES = ['processing', 'shipped', 'delivered'];

/**
 * Ringkasan statistik utama dashboard.
 * Menghitung: total produk aktif, total pesanan, total user,
 * total pendapatan, dan rekap jumlah pesanan per status.
 */
export const getStats = async (req, res) => {
  try {
    // Jalankan query agregat secara paralel
    const [
      productsResult,
      ordersResult,
      usersResult,
      revenueResult,
    ] = await Promise.all([
      // Total produk aktif
      supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total seluruh pesanan
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true }),

      // Total user (profiles)
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // Ambil total_amount + status untuk hitung pendapatan
      supabaseAdmin
        .from('orders')
        .select('total_amount, status'),
    ]);

    // Tangani error dari query agregat
    if (productsResult.error) {
      return errorResponse(res, `Gagal mengambil data produk: ${productsResult.error.message}`, 500);
    }
    if (ordersResult.error) {
      return errorResponse(res, `Gagal mengambil data pesanan: ${ordersResult.error.message}`, 500);
    }
    if (usersResult.error) {
      return errorResponse(res, `Gagal mengambil data user: ${usersResult.error.message}`, 500);
    }
    if (revenueResult.error) {
      return errorResponse(res, `Gagal menghitung pendapatan: ${revenueResult.error.message}`, 500);
    }

    // Hitung total pendapatan (hanya status yang dianggap sah)
    // dan rekap jumlah pesanan per status sekaligus dalam satu iterasi.
    const ordersByStatus = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    let totalRevenue = 0;

    for (const order of revenueResult.data || []) {
      // Rekap per status
      if (ordersByStatus[order.status] !== undefined) {
        ordersByStatus[order.status] += 1;
      }
      // Akumulasi pendapatan
      if (REVENUE_STATUSES.includes(order.status)) {
        totalRevenue += Number(order.total_amount) || 0;
      }
    }

    return successResponse(res, 'Statistik dashboard berhasil diambil', {
      total_products: productsResult.count || 0,
      total_orders: ordersResult.count || 0,
      total_users: usersResult.count || 0,
      total_revenue: totalRevenue,
      orders_by_status: ordersByStatus,
    });
  } catch (error) {
    console.error('Error getStats:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Daftar produk dengan stok menipis (di bawah atau sama dengan threshold).
 * Berguna agar admin segera melakukan restock.
 *
 * Query param:
 * - threshold: batas stok (default 5)
 * - limit: jumlah maksimal item (default 10)
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, stock, price, image_url, category_id, categories(id, name)')
      .eq('is_active', true)
      .lte('stock', threshold)
      .order('stock', { ascending: true })
      .limit(limit);

    if (error) {
      return errorResponse(res, `Gagal mengambil produk stok menipis: ${error.message}`, 500);
    }

    return successResponse(res, 'Daftar produk stok menipis berhasil diambil', {
      threshold,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error('Error getLowStockProducts:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Produk terlaris berdasarkan total quantity yang terjual.
 * Diambil dari agregasi tabel order_items.
 *
 * Query param:
 * - limit: jumlah produk teratas (default 5)
 */
export const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    // Ambil seluruh item pesanan untuk diagregasi di aplikasi.
    // (Supabase JS tidak mendukung GROUP BY secara langsung tanpa RPC,
    //  sehingga agregasi dilakukan di sisi server aplikasi.)
    const { data: orderItems, error } = await supabaseAdmin
      .from('order_items')
      .select('product_id, product_name, quantity, price');

    if (error) {
      return errorResponse(res, `Gagal mengambil data penjualan: ${error.message}`, 500);
    }

    // Agregasi per produk: total quantity terjual & total pendapatan
    const aggregated = {};
    for (const item of orderItems || []) {
      // Lewati item yang produknya sudah dihapus (product_id null)
      const key = item.product_id || `deleted-${item.product_name}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          product_id: item.product_id,
          product_name: item.product_name,
          total_sold: 0,
          total_revenue: 0,
        };
      }

      aggregated[key].total_sold += item.quantity;
      aggregated[key].total_revenue += (Number(item.price) || 0) * item.quantity;
    }

    // Urutkan dari yang paling banyak terjual, ambil sejumlah limit
    const topProducts = Object.values(aggregated)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);

    return successResponse(res, 'Produk terlaris berhasil diambil', {
      total: topProducts.length,
      products: topProducts,
    });
  } catch (error) {
    console.error('Error getTopProducts:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Pesanan terbaru untuk ringkasan di dashboard.
 * Diurutkan dari yang paling baru.
 *
 * Query param:
 * - limit: jumlah pesanan (default 5)
 */
export const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    // Ambil pesanan terbaru — tanpa join profiles (orders.user_id → auth.users, bukan profiles)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return errorResponse(res, `Gagal mengambil pesanan terbaru: ${error.message}`, 500);
    }

    // Enrichment: ambil profil user untuk setiap pesanan
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    let profileMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (profiles) {
        profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }
    }

    // Gabungkan profil ke data pesanan
    const enrichedOrders = orders.map(order => ({
      ...order,
      profile: profileMap[order.user_id] || null,
    }));

    return successResponse(res, 'Pesanan terbaru berhasil diambil', {
      total: enrichedOrders.length,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error('Error getRecentOrders:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};
