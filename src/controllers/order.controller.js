// ============================================
// Controller Pesanan
// Mengelola checkout, riwayat, dan status pesanan
// Status diupdate manual oleh admin (tanpa payment gateway)
// ============================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';

/**
 * Transisi status yang diperbolehkan
 * Kunci = status saat ini, Nilai = status yang bisa dipilih
 */
const ALLOWED_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

/**
 * Checkout - Buat pesanan dari keranjang belanja
 * Langkah:
 * 1. Ambil item keranjang beserta detail produk
 * 2. Validasi produk masih aktif & stok cukup
 * 3. Hitung total harga
 * 4. Buat record pesanan
 * 5. Buat order_items dengan snapshot harga
 * 6. Kurangi stok produk
 * 7. Kosongkan keranjang
 */
export const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping_address, notes } = req.body;

    // 1. Ambil keranjang user
    const { data: cart } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      return errorResponse(res, 'Keranjang belanja kosong', 400);
    }

    // 2. Ambil item keranjang beserta detail produk
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          price,
          stock,
          is_active
        )
      `)
      .eq('cart_id', cart.id);

    if (cartError) {
      return errorResponse(res, `Gagal mengambil keranjang: ${cartError.message}`, 500);
    }

    if (!cartItems || cartItems.length === 0) {
      return errorResponse(res, 'Keranjang belanja kosong', 400);
    }

    // 3. Validasi semua produk masih aktif dan stok cukup
    const validationErrors = [];
    for (const item of cartItems) {
      if (!item.products) {
        validationErrors.push(`Produk dengan ID ${item.product_id} tidak ditemukan`);
        continue;
      }
      if (!item.products.is_active) {
        validationErrors.push(`Produk "${item.products.name}" sudah tidak aktif`);
      }
      if (item.products.stock < item.quantity) {
        validationErrors.push(
          `Stok "${item.products.name}" tidak cukup (tersedia: ${item.products.stock}, diminta: ${item.quantity})`
        );
      }
    }

    if (validationErrors.length > 0) {
      return errorResponse(res, 'Validasi gagal', 400, validationErrors);
    }

    // 4. Hitung total harga
    const totalAmount = cartItems.reduce(
      (total, item) => total + (item.products.price * item.quantity),
      0
    );

    // 5. Buat record pesanan
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total_amount: totalAmount,
        shipping_address,
        notes: notes || null
      })
      .select()
      .single();

    if (orderError) {
      return errorResponse(res, `Gagal membuat pesanan: ${orderError.message}`, 500);
    }

    // 6. Buat order_items dengan snapshot harga saat checkout
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.products.id,
      product_name: item.products.name,
      quantity: item.quantity,
      price: item.products.price
    }));

    const { data: createdOrderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      // Rollback: hapus pesanan jika gagal buat items
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return errorResponse(res, `Gagal membuat item pesanan: ${itemsError.message}`, 500);
    }

    // 7. Kurangi stok produk
    for (const item of cartItems) {
      const newStock = item.products.stock - item.quantity;
      await supabaseAdmin
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.products.id);
    }

    // 8. Kosongkan keranjang
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    return successResponse(res, 'Pesanan berhasil dibuat', {
      order: {
        ...order,
        items: createdOrderItems
      }
    }, 201);
  } catch (error) {
    console.error('Error checkout:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Riwayat pesanan user yang sedang login
 * Diurutkan dari yang terbaru, dengan pagination
 */
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPagination(req.query);

    // Hitung total pesanan user
    const { count: total } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Ambil pesanan dengan jumlah item
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse(res, `Gagal mengambil pesanan: ${error.message}`, 500);
    }

    // Format data: tambahkan items_count
    const formattedOrders = orders.map(order => ({
      ...order,
      items_count: order.order_items ? order.order_items.length : 0,
      order_items: undefined // Hapus array detail, cukup count
    }));

    const pagination = getPaginationMeta(page, limit, total || 0);
    return paginatedResponse(res, 'Riwayat pesanan berhasil diambil', formattedOrders, pagination);
  } catch (error) {
    console.error('Error getMyOrders:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Detail pesanan berdasarkan ID
 * User hanya bisa lihat pesanannya sendiri (kecuali admin)
 */
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Ambil pesanan dengan item dan info produk
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return errorResponse(res, 'Pesanan tidak ditemukan', 404);
    }

    // Cek kepemilikan: user hanya bisa lihat pesanannya sendiri
    // Admin bisa lihat semua (dicek melalui profile role)
    if (order.user_id !== userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.roles?.name === 'admin';
      if (!isAdmin) {
        return errorResponse(res, 'Anda tidak memiliki akses ke pesanan ini', 403);
      }
    }

    return successResponse(res, 'Detail pesanan berhasil diambil', order);
  } catch (error) {
    console.error('Error getOrderById:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Update status pesanan (khusus admin)
 * Validasi transisi status yang diperbolehkan
 * Jika dibatalkan, kembalikan stok produk
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Ambil pesanan saat ini
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (findError || !order) {
      return errorResponse(res, 'Pesanan tidak ditemukan', 404);
    }

    // Validasi transisi status
    const allowedStatuses = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(
        res,
        `Tidak bisa mengubah status dari "${order.status}" ke "${status}". Status yang diperbolehkan: ${allowedStatuses.join(', ') || 'tidak ada'}`,
        400
      );
    }

    // Jika dibatalkan, kembalikan stok produk
    if (status === 'cancelled' && order.order_items) {
      for (const item of order.order_items) {
        if (item.product_id) {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabaseAdmin
              .from('products')
              .update({
                stock: product.stock + item.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.product_id);
          }
        }
      }
    }

    // Update status pesanan
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(res, `Gagal memperbarui status: ${updateError.message}`, 500);
    }

    return successResponse(res, `Status pesanan berhasil diubah ke "${status}"`, updatedOrder);
  } catch (error) {
    console.error('Error updateOrderStatus:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Semua pesanan (khusus admin)
 * Support filter by status dan pagination
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    // Query count
    let countQuery = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Query data — tanpa join profiles (orders.user_id → auth.users, bukan profiles)
    let dataQuery = supabaseAdmin
      .from('orders')
      .select('*');

    // Filter berdasarkan status jika disediakan
    if (status) {
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    }

    // Hitung total
    const { count: total } = await countQuery;

    // Ambil data dengan pagination
    const { data: orders, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse(res, `Gagal mengambil pesanan: ${error.message}`, 500);
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

    const pagination = getPaginationMeta(page, limit, total || 0);
    return paginatedResponse(res, 'Daftar pesanan berhasil diambil', enrichedOrders, pagination);
  } catch (error) {
    console.error('Error getAllOrders:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};
