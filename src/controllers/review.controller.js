// =============================================================================
// Controller Review / Ulasan
// =============================================================================
// Menangani operasi CRUD untuk ulasan produk.
// Setiap user hanya bisa memberikan 1 ulasan per produk (UNIQUE constraint).
// =============================================================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';

/**
 * Ambil semua ulasan untuk produk tertentu.
 * Endpoint publik — include nama reviewer dari tabel profiles.
 * Mendukung pagination.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit, offset } = getPagination(req.query);

    // Cek apakah produk ada
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }

    // Ambil reviews (tanpa join profiles — reviews.user_id → auth.users, bukan public.profiles)
    const { data: reviews, count, error } = await supabaseAdmin
      .from('reviews')
      .select('id, user_id, rating, comment, created_at, updated_at', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Gagal mengambil ulasan:', error.message);
      return errorResponse(res, 'Gagal mengambil ulasan produk.', 500);
    }

    // Enrichment: ambil profil reviewer secara terpisah
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    let profileMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }
    }

    // Format response — gabungkan profil ke setiap review
    const formattedReviews = reviews.map((review) => {
      const profile = profileMap[review.user_id] || null;
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer: profile
          ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }
          : null,
        created_at: review.created_at,
        updated_at: review.updated_at,
      };
    });

    // Buat metadata pagination
    const pagination = getPaginationMeta(page, limit, count || 0);

    return paginatedResponse(
      res,
      `Ulasan untuk produk "${product.name}" berhasil diambil.`,
      formattedReviews,
      pagination
    );
  } catch (error) {
    console.error('❌ Error pada getProductReviews:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Tambah ulasan untuk produk tertentu.
 * Memerlukan autentikasi. Satu user hanya bisa memberi 1 ulasan per produk.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Cek apakah produk ada dan aktif
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return errorResponse(res, 'Produk tidak ditemukan atau tidak aktif.', 404);
    }

    // Cek apakah user sudah pernah memberi ulasan untuk produk ini
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (existingReview) {
      return errorResponse(
        res,
        'Anda sudah memberikan ulasan untuk produk ini. Satu user hanya bisa memberi 1 ulasan per produk.',
        409
      );
    }

    // Insert ulasan baru
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        comment: comment || null,
      })
      .select('id, product_id, user_id, rating, comment, created_at')
      .single();

    if (error) {
      // Handle UNIQUE constraint violation dari database
      if (error.code === '23505') {
        return errorResponse(
          res,
          'Anda sudah memberikan ulasan untuk produk ini.',
          409
        );
      }
      console.error('❌ Gagal menambah ulasan:', error.message);
      return errorResponse(res, `Gagal menambah ulasan: ${error.message}`, 400);
    }

    return successResponse(res, 'Ulasan berhasil ditambahkan.', review, 201);
  } catch (error) {
    console.error('❌ Error pada createReview:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Hapus ulasan milik sendiri.
 * User hanya bisa menghapus ulasan yang mereka buat sendiri.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cek apakah ulasan ada dan milik user yang login
    const { data: review, error: findError } = await supabaseAdmin
      .from('reviews')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (findError || !review) {
      return errorResponse(res, 'Ulasan tidak ditemukan.', 404);
    }

    // Pastikan user hanya bisa menghapus ulasan miliknya sendiri
    if (review.user_id !== userId) {
      return errorResponse(res, 'Anda tidak memiliki izin untuk menghapus ulasan ini.', 403);
    }

    // Hapus ulasan
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Gagal menghapus ulasan:', error.message);
      return errorResponse(res, `Gagal menghapus ulasan: ${error.message}`, 400);
    }

    return successResponse(res, 'Ulasan berhasil dihapus.', { id });
  } catch (error) {
    console.error('❌ Error pada deleteReview:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};
