// ============================================
// Script Setup Supabase Storage
// Membuat bucket 'products' (public) untuk gambar produk.
// Jalankan: node scripts/setup-storage.js
// Aman dijalankan berulang (idempoten).
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/config/supabase.js';

const BUCKET_NAME = 'products';

async function main() {
  console.log(`🔧 Menyiapkan bucket Storage "${BUCKET_NAME}"...`);

  // Cek apakah bucket sudah ada
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    console.error('❌ Gagal mengambil daftar bucket:', listError.message);
    process.exit(1);
  }

  const existing = buckets.find((b) => b.name === BUCKET_NAME);

  if (existing) {
    // Pastikan bucket bersifat public
    if (!existing.public) {
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
        public: true,
      });
      if (updateError) {
        console.error('❌ Gagal mengubah bucket menjadi public:', updateError.message);
        process.exit(1);
      }
      console.log(`✅ Bucket "${BUCKET_NAME}" sudah ada, status diubah menjadi public.`);
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" sudah ada dan sudah public. Tidak ada perubahan.`);
    }
    process.exit(0);
  }

  // Buat bucket baru (public)
  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
  });

  if (createError) {
    console.error('❌ Gagal membuat bucket:', createError.message);
    process.exit(1);
  }

  console.log(`✅ Bucket "${BUCKET_NAME}" berhasil dibuat (public).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error tak terduga:', err.message);
  process.exit(1);
});
