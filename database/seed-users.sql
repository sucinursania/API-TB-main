-- ============================================
-- SEED AKUN SAMPLE (Admin + Customer)
-- ============================================
-- Jalankan di Supabase SQL Editor
--
-- Akun yang dibuat:
--   Admin    → admin@example.com / admin123
--   Customer → customer@example.com / customer123
-- ============================================


-- ============================================
-- STEP 1: Perbaiki trigger agar tidak error
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  SELECT id INTO customer_role_id FROM public.roles WHERE name = 'customer';

  INSERT INTO public.profiles (id, full_name, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    customer_role_id
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================
-- STEP 2: Hapus user lama jika ada (agar bisa re-run)
-- ============================================
DELETE FROM auth.users WHERE email IN ('admin@example.com', 'customer@example.com');


-- ============================================
-- STEP 3: Buat user admin
-- ============================================
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Admin Toko"}'::jsonb,
    now(),
    now(),
    '',
    ''
  );

  -- Buat identity (wajib untuk login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    admin_uid,
    admin_uid,
    json_build_object('sub', admin_uid::text, 'email', 'admin@example.com')::jsonb,
    'email',
    admin_uid::text,
    now(),
    now(),
    now()
  );

  -- Update profil ke role admin
  UPDATE public.profiles
  SET
    role_id = (SELECT id FROM public.roles WHERE name = 'admin'),
    full_name = 'Admin Toko',
    phone = '081200000001'
  WHERE id = admin_uid;
END $$;


-- ============================================
-- STEP 4: Buat user customer
-- ============================================
DO $$
DECLARE
  customer_uid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    customer_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'customer@example.com',
    crypt('customer123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Budi Santoso"}'::jsonb,
    now(),
    now(),
    '',
    ''
  );

  -- Buat identity (wajib untuk login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    customer_uid,
    customer_uid,
    json_build_object('sub', customer_uid::text, 'email', 'customer@example.com')::jsonb,
    'email',
    customer_uid::text,
    now(),
    now(),
    now()
  );

  -- Profil customer sudah dibuat oleh trigger, update data saja
  UPDATE public.profiles
  SET
    full_name = 'Budi Santoso',
    phone = '081200000002'
  WHERE id = customer_uid;
END $$;


-- ============================================
-- VERIFIKASI
-- ============================================
SELECT
  u.email,
  p.full_name,
  r.name AS role,
  p.phone
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
JOIN public.roles r ON r.id = p.role_id
WHERE u.email IN ('admin@example.com', 'customer@example.com');
