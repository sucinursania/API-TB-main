// =============================================================================
// Controller Produk
// =============================================================================
// Menangani CRUD produk, pencarian, filter, sorting, pagination,
// dan upload gambar ke Supabase Storage.
// =============================================================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { uploadToSupabase } from '../middleware/upload.js';

/**
 * Generate slug dari nama produk.
 *
 * @param {string} name - Nama produk
 * @returns {string} Slug yang sudah di-generate
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Ambil semua produk aktif dengan dukungan search, filter, sort, dan pagination.
 *
 * Query parameters:
 * - search: Cari berdasarkan nama produk (case-insensitive)
 * - category_id: Filter berdasarkan ID kategori
 * - sort: Urutan (price_asc, price_desc, newest). Default: newest
 * - page: Halaman (default: 1)
 * - limit: Jumlah per halaman (default: 10, maks: 100)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAllProducts = async (req, res) => {
  try {
    const { search, category_id, sort } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    // Bangun query dasar — hanya produk aktif, include nama kategori
    let query = supabaseAdmin
      .from('products')
      .select('*, categories(id, name, slug)', { count: 'exact' })
      .eq('is_active', true);

    // Filter: pencarian berdasarkan nama produk (case-insensitive)
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Filter: berdasarkan kategori
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    // Sorting berdasarkan parameter sort
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Terapkan pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, count, error } = await query;

    if (error) {
      console.error('❌ Gagal mengambil produk:', error.message);
      return errorResponse(res, 'Gagal mengambil data produk.', 500);
    }

    // Buat metadata pagination
    const pagination = getPaginationMeta(page, limit, count || 0);

    return paginatedResponse(res, 'Daftar produk berhasil diambil.', products, pagination);
  } catch (error) {
    console.error('❌ Error pada getAllProducts:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Ambil detail produk berdasarkan ID.
 * Include informasi kategori dan rata-rata rating dari reviews.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil produk dengan join kategori
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .single();

    if (error || !product) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }

    // Hitung rata-rata rating dari tabel reviews
    const { data: ratingData, error: ratingError } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', id);

    let averageRating = 0;
    let totalReviews = 0;

    if (!ratingError && ratingData && ratingData.length > 0) {
      totalReviews = ratingData.length;
      const sumRating = ratingData.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((sumRating / totalReviews).toFixed(1));
    }

    return successResponse(res, 'Detail produk berhasil diambil.', {
      ...product,
      average_rating: averageRating,
      total_reviews: totalReviews,
    });
  } catch (error) {
    console.error('❌ Error pada getProductById:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Tambah produk baru.
 * Hanya bisa diakses oleh admin. Slug otomatis di-generate dari nama.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;

    // Generate slug dari nama produk
    const slug = generateSlug(name);

    // Cek apakah kategori yang dipilih ada
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return errorResponse(res, 'Kategori tidak ditemukan.', 404);
    }

    // Insert produk baru
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug,
        description: description || null,
        price,
        stock: stock || 0,
        category_id,
        image_url: image_url || null,
        is_active: true,
      })
      .select('*, categories(id, name, slug)')
      .single();

    if (error) {
      console.error('❌ Gagal menambah produk:', error.message);
      return errorResponse(res, `Gagal menambah produk: ${error.message}`, 400);
    }

    return successResponse(res, 'Produk berhasil ditambahkan.', product, 201);
  } catch (error) {
    console.error('❌ Error pada createProduct:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Update produk berdasarkan ID.
 * Hanya bisa diakses oleh admin. Jika nama diubah, slug juga diupdate.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, image_url, is_active } = req.body;

    // Cek apakah produk ada
    const { data: existingProduct, error: findError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existingProduct) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }

    // Siapkan data update — hanya field yang dikirim
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Jika category_id diubah, validasi kategori baru
    if (category_id !== undefined) {
      const { data: category, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (categoryError || !category) {
        return errorResponse(res, 'Kategori tidak ditemukan.', 404);
      }
      updateData.category_id = category_id;
    }

    // Pastikan ada field yang diupdate
    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'Tidak ada data yang diupdate.', 400);
    }

    // Tambahkan timestamp update
    updateData.updated_at = new Date().toISOString();

    // Update produk di database
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*, categories(id, name, slug)')
      .single();

    if (error) {
      console.error('❌ Gagal update produk:', error.message);
      return errorResponse(res, `Gagal mengupdate produk: ${error.message}`, 400);
    }

    return successResponse(res, 'Produk berhasil diupdate.', product);
  } catch (error) {
    console.error('❌ Error pada updateProduct:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Hapus produk (soft delete).
 * Hanya bisa diakses oleh admin.
 * Produk tidak benar-benar dihapus, melainkan diset is_active=false.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah produk ada
    const { data: existingProduct, error: findError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (findError || !existingProduct) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }

    // Soft delete — set is_active = false
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Gagal menghapus produk:', error.message);
      return errorResponse(res, `Gagal menghapus produk: ${error.message}`, 400);
    }

    return successResponse(res, `Produk "${existingProduct.name}" berhasil dinonaktifkan.`, { id });
  } catch (error) {
    console.error('❌ Error pada deleteProduct:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Upload gambar produk ke Supabase Storage.
 * Hanya bisa diakses oleh admin. Menggunakan multer untuk handling upload.
 * File akan disimpan di bucket 'products' di Supabase Storage.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah produk ada
    const { data: existingProduct, error: findError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existingProduct) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }

    // Cek apakah file diupload
    if (!req.file) {
      return errorResponse(res, 'File gambar tidak ditemukan. Kirim file dengan field name "image".', 400);
    }

    // Upload file ke Supabase Storage
    const { url, path } = await uploadToSupabase(req.file, 'products', 'images');

    // Update image_url di database produk
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        image_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, image_url')
      .single();

    if (error) {
      console.error('❌ Gagal update image_url produk:', error.message);
      return errorResponse(res, `Gagal menyimpan URL gambar: ${error.message}`, 400);
    }

    return successResponse(res, 'Gambar produk berhasil diupload.', {
      ...product,
      storage_path: path,
    });
  } catch (error) {
    console.error('❌ Error pada uploadProductImage:', error.message);
    return errorResponse(res, 'Terjadi kesalahan saat mengupload gambar.', 500);
  }
};
