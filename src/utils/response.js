// =============================================================================
// Helper Response Format
// =============================================================================
// Fungsi-fungsi utilitas untuk mengirim response JSON yang konsisten
// di seluruh endpoint API.
// =============================================================================

/**
 * Kirim response sukses.
 *
 * Format: { success: true, message: string, data: any }
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Pesan sukses
 * @param {*} data - Data yang dikembalikan
 * @param {number} [statusCode=200] - HTTP status code
 */
export const successResponse = (res, message, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Kirim response error.
 *
 * Format: { success: false, message: string, errors?: any }
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Pesan error
 * @param {number} [statusCode=400] - HTTP status code
 * @param {*} [errors=null] - Detail error tambahan (opsional)
 */
export const errorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
  };

  // Sertakan detail error jika ada
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Kirim response sukses dengan data pagination.
 *
 * Format: {
 *   success: true,
 *   message: string,
 *   data: any,
 *   pagination: { page, limit, total, totalPages }
 * }
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Pesan sukses
 * @param {*} data - Array data hasil query
 * @param {Object} pagination - Metadata pagination
 * @param {number} pagination.page - Halaman saat ini
 * @param {number} pagination.limit - Jumlah item per halaman
 * @param {number} pagination.total - Total keseluruhan item
 * @param {number} pagination.totalPages - Total halaman
 */
export const paginatedResponse = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
    },
  });
};
