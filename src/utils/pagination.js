// =============================================================================
// Helper Pagination
// =============================================================================
// Utilitas untuk menghitung offset dan metadata pagination
// dari query parameters (page & limit).
// =============================================================================

/**
 * Hitung parameter pagination dari query string request.
 *
 * - page: minimal 1, default 1
 * - limit: minimal 1, maksimal 100, default 10
 * - offset: dihitung otomatis dari page dan limit
 *
 * @param {Object} query - req.query dari Express
 * @param {string|number} [query.page] - Nomor halaman
 * @param {string|number} [query.limit] - Jumlah item per halaman
 * @returns {{ page: number, limit: number, offset: number }}
 */
export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Buat metadata pagination untuk response.
 *
 * @param {number} page - Halaman saat ini
 * @param {number} limit - Jumlah item per halaman
 * @param {number} total - Total keseluruhan item di database
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
export const getPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
