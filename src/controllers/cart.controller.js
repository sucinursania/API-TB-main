// ============================================
// Controller Keranjang Belanja
// Mengelola operasi CRUD keranjang pengguna
// ============================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Helper: Dapatkan atau buat keranjang untuk user
 * Jika keranjang belum ada, otomatis dibuat
 */
const getOrCreateCart = async (userId) => {
  // Cek apakah keranjang sudah ada
  const { data: existingCart, error: findError } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingCart) {
    return existingCart;
  }

  // Buat keranjang baru jika belum ada
  const { data: newCart, error: createError } = await supabaseAdmin
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Gagal membuat keranjang: ${createError.message}`);
  }

  return newCart;
};

/**
 * Lihat isi keranjang belanja
 * Termasuk detail produk dan kalkulasi total
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Dapatkan atau buat keranjang
    const cart = await getOrCreateCart(userId);

    // Ambil item keranjang beserta detail produk
    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        products (
          id,
          name,
          slug,
          price,
          stock,
          image_url,
          is_active
        )
      `)
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    if (error) {
      return errorResponse(res, `Gagal mengambil keranjang: ${error.message}`, 500);
    }

    // Format data dengan subtotal per item
    const cartItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: item.products,
      subtotal: item.products ? item.products.price * item.quantity : 0,
      created_at: item.created_at
    }));

    // Hitung grand total
    const grandTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);

    return successResponse(res, 'Keranjang berhasil diambil', {
      cart_id: cart.id,
      items: cartItems,
      total_items: cartItems.length,
      grand_total: grandTotal
    });
  } catch (error) {
    console.error('Error getCart:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Tambah item ke keranjang
 * Jika produk sudah ada, tambahkan jumlahnya
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    // Validasi produk: ada, aktif, dan stok cukup
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, is_active')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return errorResponse(res, 'Produk tidak ditemukan', 404);
    }

    if (!product.is_active) {
      return errorResponse(res, 'Produk sudah tidak aktif', 400);
    }

    if (product.stock < quantity) {
      return errorResponse(res, `Stok tidak mencukupi. Stok tersedia: ${product.stock}`, 400);
    }

    // Dapatkan atau buat keranjang
    const cart = await getOrCreateCart(userId);

    // Cek apakah produk sudah ada di keranjang
    const { data: existingItem } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      // Update jumlah jika sudah ada
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return errorResponse(res, `Stok tidak mencukupi. Stok tersedia: ${product.stock}, di keranjang: ${existingItem.quantity}`, 400);
      }

      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(res, `Gagal memperbarui keranjang: ${updateError.message}`, 500);
      }

      return successResponse(res, 'Jumlah item di keranjang berhasil diperbarui', updatedItem);
    }

    // Tambah item baru ke keranjang
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id,
        quantity
      })
      .select()
      .single();

    if (insertError) {
      return errorResponse(res, `Gagal menambahkan ke keranjang: ${insertError.message}`, 500);
    }

    return successResponse(res, 'Produk berhasil ditambahkan ke keranjang', newItem, 201);
  } catch (error) {
    console.error('Error addToCart:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Update jumlah item di keranjang
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    // Dapatkan keranjang user
    const cart = await getOrCreateCart(userId);

    // Cek item ada di keranjang user
    const { data: cartItem, error: findError } = await supabaseAdmin
      .from('cart_items')
      .select('id, product_id, cart_id')
      .eq('id', id)
      .eq('cart_id', cart.id)
      .single();

    if (findError || !cartItem) {
      return errorResponse(res, 'Item tidak ditemukan di keranjang', 404);
    }

    // Validasi stok produk
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock, is_active')
      .eq('id', cartItem.product_id)
      .single();

    if (!product || !product.is_active) {
      return errorResponse(res, 'Produk sudah tidak aktif', 400);
    }

    if (product.stock < quantity) {
      return errorResponse(res, `Stok tidak mencukupi. Stok tersedia: ${product.stock}`, 400);
    }

    // Update jumlah
    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(res, `Gagal memperbarui item: ${updateError.message}`, 500);
    }

    return successResponse(res, 'Jumlah item berhasil diperbarui', updatedItem);
  } catch (error) {
    console.error('Error updateCartItem:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Hapus satu item dari keranjang
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Dapatkan keranjang user
    const cart = await getOrCreateCart(userId);

    // Cek item ada di keranjang user
    const { data: cartItem } = await supabaseAdmin
      .from('cart_items')
      .select('id')
      .eq('id', id)
      .eq('cart_id', cart.id)
      .single();

    if (!cartItem) {
      return errorResponse(res, 'Item tidak ditemukan di keranjang', 404);
    }

    // Hapus item
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return errorResponse(res, `Gagal menghapus item: ${deleteError.message}`, 500);
    }

    return successResponse(res, 'Item berhasil dihapus dari keranjang');
  } catch (error) {
    console.error('Error removeCartItem:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};

/**
 * Kosongkan seluruh keranjang
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Dapatkan keranjang user
    const { data: cart } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      return successResponse(res, 'Keranjang sudah kosong');
    }

    // Hapus semua item
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      return errorResponse(res, `Gagal mengosongkan keranjang: ${deleteError.message}`, 500);
    }

    return successResponse(res, 'Keranjang berhasil dikosongkan');
  } catch (error) {
    console.error('Error clearCart:', error);
    return errorResponse(res, 'Terjadi kesalahan server', 500);
  }
};
