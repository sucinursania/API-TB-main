// =============================================================================
// Controller Kategori
// =============================================================================
// Menangani CRUD (Create, Read, Update, Delete) untuk kategori produk.
// Slug otomatis di-generate dari nama kategori.
// =============================================================================

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Generate slug dari nama kategori.
 * Mengubah nama menjadi lowercase, mengganti karakter non-alfanumerik
 * dengan dash, dan menghapus dash di awal/akhir.
 *
 * Contoh: "Makanan & Minuman" → "makanan-minuman"
 *
 * @param {string} name - Nama kategori
 * @returns {string} Slug yang sudah di-generate
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Ambil semua kategori.
 * Endpoint publik — tidak memerlukan autentikasi.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAllCategories = async (_req, res) => {
  try {
    // Ambil semua kategori, urutkan berdasarkan nama
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Gagal mengambil kategori:', error.message);
      return errorResponse(res, 'Gagal mengambil data kategori.', 500);
    }

    return successResponse(res, 'Daftar kategori berhasil diambil.', categories);
  } catch (error) {
    console.error('❌ Error pada getAllCategories:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Ambil kategori berdasarkan ID.
 * Endpoint publik — tidak memerlukan autentikasi.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return errorResponse(res, 'Kategori tidak ditemukan.', 404);
    }

    return successResponse(res, 'Kategori berhasil diambil.', category);
  } catch (error) {
    console.error('❌ Error pada getCategoryById:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Tambah kategori baru.
 * Hanya bisa diakses oleh admin. Slug otomatis di-generate dari nama.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    // Generate slug dari nama kategori
    const slug = generateSlug(name);

    // Cek apakah slug sudah ada (nama kategori duplikat)
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return errorResponse(res, 'Kategori dengan nama serupa sudah ada.', 409);
    }

    // Insert kategori baru
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Gagal menambah kategori:', error.message);
      return errorResponse(res, `Gagal menambah kategori: ${error.message}`, 400);
    }

    return successResponse(res, 'Kategori berhasil ditambahkan.', category, 201);
  } catch (error) {
    console.error('❌ Error pada createCategory:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Update kategori berdasarkan ID.
 * Hanya bisa diakses oleh admin. Jika nama diubah, slug juga diupdate.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url } = req.body;

    // Cek apakah kategori ada
    const { data: existingCategory, error: findError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existingCategory) {
      return errorResponse(res, 'Kategori tidak ditemukan.', 404);
    }

    // Siapkan data update
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name); // Update slug jika nama berubah

      // Cek apakah slug baru sudah digunakan oleh kategori lain
      const { data: duplicateSlug } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();

      if (duplicateSlug) {
        return errorResponse(res, 'Kategori dengan nama serupa sudah ada.', 409);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;

    // Pastikan ada field yang diupdate
    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'Tidak ada data yang diupdate.', 400);
    }

    // Update kategori di database
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Gagal update kategori:', error.message);
      return errorResponse(res, `Gagal mengupdate kategori: ${error.message}`, 400);
    }

    return successResponse(res, 'Kategori berhasil diupdate.', category);
  } catch (error) {
    console.error('❌ Error pada updateCategory:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};

/**
 * Hapus kategori berdasarkan ID.
 * Hanya bisa diakses oleh admin.
 * Perhatian: Kategori yang memiliki produk tidak bisa dihapus.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah kategori ada
    const { data: existingCategory, error: findError } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (findError || !existingCategory) {
      return errorResponse(res, 'Kategori tidak ditemukan.', 404);
    }

    // Cek apakah ada produk yang menggunakan kategori ini
    const { count, error: countError } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      console.error('❌ Gagal mengecek produk terkait:', countError.message);
      return errorResponse(res, 'Gagal mengecek produk terkait.', 500);
    }

    if (count > 0) {
      return errorResponse(
        res,
        `Tidak bisa menghapus kategori "${existingCategory.name}" karena masih memiliki ${count} produk.`,
        409
      );
    }

    // Hapus kategori
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Gagal menghapus kategori:', error.message);
      return errorResponse(res, `Gagal menghapus kategori: ${error.message}`, 400);
    }

    return successResponse(res, 'Kategori berhasil dihapus.', { id });
  } catch (error) {
    console.error('❌ Error pada deleteCategory:', error.message);
    return errorResponse(res, 'Terjadi kesalahan pada server.', 500);
  }
};
