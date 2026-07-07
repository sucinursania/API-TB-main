// ============================================
// Script Seed User Akun Sample
// Membuat 1 akun admin dan 1 akun customer via Supabase Auth API.
// Jalankan: node scripts/seed-users.js
//
// Akun yang dibuat:
//   Admin    → admin@example.com / admin123
//   Customer → customer@example.com / customer123
//
// Script ini aman dijalankan berulang (skip jika email sudah ada).
// ============================================

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/config/supabase.js';

const USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    full_name: 'Admin Toko',
    role: 'admin',
  },
  {
    email: 'customer@example.com',
    password: 'customer123',
    full_name: 'Budi Santoso',
    role: 'customer',
  },
];

async function seedUsers() {
  console.log('🌱 Memulai seed akun sample...\n');

  for (const user of USERS) {
    console.log(`📧 Proses: ${user.email} (${user.role})`);

    // 1. Buat user via Supabase Auth Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Langsung verified, skip email konfirmasi
      user_metadata: { full_name: user.full_name },
    });

    if (authError) {
      // Jika user sudah ada, skip
      if (authError.message.includes('already been registered') || authError.status === 422) {
        console.log(`   ⚠️  Email sudah terdaftar, skip pembuatan.`);

        // Tetap pastikan role-nya benar
        // Cari user ID dari email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);

        if (existingUser && user.role === 'admin') {
          await assignAdminRole(existingUser.id, user.full_name);
        }
        console.log(`   ✅ Role "${user.role}" dipastikan benar.\n`);
        continue;
      }

      console.error(`   ❌ Gagal membuat user: ${authError.message}\n`);
      continue;
    }

    const userId = authData.user.id;
    console.log(`   ✅ User dibuat: ${userId}`);

    // 2. Tunggu sebentar agar trigger handle_new_user() selesai membuat profil
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Jika role admin, update profile.role_id ke role admin
    if (user.role === 'admin') {
      await assignAdminRole(userId, user.full_name);
    }

    // 4. Update full_name & phone di profiles (jika trigger belum set)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: user.full_name,
        phone: user.role === 'admin' ? '081200000001' : '081200000002',
      }, { onConflict: 'id' });

    if (profileError) {
      console.log(`   ⚠️  Gagal update profil: ${profileError.message}`);
    }

    console.log(`   ✅ Profil diperbarui.\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('📋 DAFTAR AKUN SAMPLE:');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('🔑 ADMIN');
  console.log('   Email    : admin@example.com');
  console.log('   Password : admin123');
  console.log('');
  console.log('👤 CUSTOMER');
  console.log('   Email    : customer@example.com');
  console.log('   Password : customer123');
  console.log('');
  console.log('═══════════════════════════════════════');

  process.exit(0);
}

/**
 * Assign role admin ke user berdasarkan userId
 */
async function assignAdminRole(userId, fullName) {
  // Ambil role_id admin
  const { data: adminRole, error: roleError } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .single();

  if (roleError || !adminRole) {
    console.log(`   ⚠️  Gagal menemukan role admin: ${roleError?.message}`);
    return;
  }

  // Update role_id di tabel profiles
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      role_id: adminRole.id,
      full_name: fullName,
    }, { onConflict: 'id' });

  if (updateError) {
    console.log(`   ⚠️  Gagal assign role admin: ${updateError.message}`);
    return;
  }

  console.log(`   ✅ Role admin berhasil di-assign.`);
}

seedUsers().catch((err) => {
  console.error('❌ Error tak terduga:', err.message);
  process.exit(1);
});
