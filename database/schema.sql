-- ============================================
-- SCHEMA DATABASE E-COMMERCE
-- Tugas Besar - Integrasi Supabase
-- ============================================
-- Catatan:
--   - Semua primary key menggunakan UUID
--   - Timestamp menggunakan TIMESTAMPTZ (timezone-aware)
--   - Harga menggunakan NUMERIC(12,2) untuk presisi mata uang
--   - TIDAK ada payment gateway (status order diupdate manual oleh admin)
--   - Role admin menggunakan tabel terpisah (tabel `roles`)
-- ============================================


-- ============================================
-- 1. TABEL ROLES
-- Tabel terpisah untuk menyimpan peran pengguna
-- ============================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'customer')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Masukkan role default ke dalam tabel
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator sistem dengan akses penuh'),
  ('customer', 'Pelanggan biasa');


-- ============================================
-- 2. TABEL PROFIL PENGGUNA
-- Memperluas data dari auth.users milik Supabase
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: Otomatis membuat profil saat user baru mendaftar
-- Fungsi ini dijalankan setelah INSERT pada auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  -- Ambil ID role 'customer' sebagai default
  SELECT id INTO customer_role_id FROM roles WHERE name = 'customer';

  -- Buat profil baru untuk user yang mendaftar
  INSERT INTO profiles (id, full_name, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    customer_role_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- 3. TABEL KATEGORI PRODUK
-- Pengelompokan produk berdasarkan kategori
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 4. TABEL PRODUK
-- Data produk yang dijual di toko online
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 5. TABEL KERANJANG BELANJA
-- Setiap user hanya memiliki satu keranjang aktif
-- ============================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)  -- Satu keranjang per user
);


-- ============================================
-- 6. TABEL ITEM KERANJANG
-- Daftar produk yang ada di dalam keranjang
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id)  -- Satu produk per item, quantity yang berubah
);


-- ============================================
-- 7. TABEL PESANAN
-- Menyimpan data pesanan pelanggan
-- Status diubah manual oleh admin (tanpa payment gateway)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 8. TABEL ITEM PESANAN
-- Snapshot produk yang dipesan (harga dicatat saat checkout)
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,        -- Nama produk saat checkout (snapshot)
  quantity INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,     -- Harga per item saat checkout (snapshot)
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 9. TABEL ULASAN PRODUK
-- Penilaian dan komentar dari pelanggan
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id)  -- Satu ulasan per user per produk
);


-- ============================================
-- INDEXES
-- Indeks untuk mempercepat query yang sering digunakan
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
