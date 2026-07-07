// =============================================================================
// Middleware Validasi Request
// =============================================================================
// Menjalankan validasi dari express-validator dan mengembalikan
// response error yang konsisten jika validasi gagal.
// =============================================================================

import { validationResult } from 'express-validator';

/**
 * Middleware untuk menjalankan validasi express-validator.
 *
 * Jika terdapat error validasi, mengembalikan response 422
 * dengan daftar field dan pesan error yang mudah dipahami.
 *
 * Penggunaan:
 *   router.post('/endpoint', [...rules], validate, controller);
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};
