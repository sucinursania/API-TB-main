-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Tugas Besar - Integrasi Supabase
-- ============================================
-- Catatan:
--   - RLS diaktifkan pada SEMUA tabel
--   - Pengecekan admin menggunakan JOIN ke tabel roles
--   - Menggunakan (select auth.uid()) untuk performa optimal
--   - TIDAK ada payment gateway (status order diupdate manual oleh admin)
-- ============================================


-- ============================================
-- AKTIFKAN RLS PADA SEMUA TABEL
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;


-- ============================================
-- KEBIJAKAN: TABEL ROLES
-- Semua user bisa melihat daftar role
-- ============================================
CREATE POLICY "roles_baca_publik"
  ON roles FOR SELECT
  USING (true);


-- ============================================
-- KEBIJAKAN: TABEL PROFILES
-- ============================================

-- Semua user yang login bisa melihat profil pengguna lain (untuk tampilan nama, dsb)
CREATE POLICY "profiles_baca_publik"
  ON profiles FOR SELECT
  USING (true);

-- User hanya bisa mengubah profil miliknya sendiri
CREATE POLICY "profiles_update_sendiri"
  ON profiles FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));


-- ============================================
-- KEBIJAKAN: TABEL CATEGORIES
-- ============================================

-- Semua orang bisa melihat kategori (termasuk user yang belum login)
CREATE POLICY "categories_baca_publik"
  ON categories FOR SELECT
  USING (true);

-- Hanya admin yang bisa menambah kategori baru
CREATE POLICY "categories_tambah_admin"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa mengubah kategori
CREATE POLICY "categories_ubah_admin"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa menghapus kategori
CREATE POLICY "categories_hapus_admin"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );


-- ============================================
-- KEBIJAKAN: TABEL PRODUCTS
-- ============================================

-- Semua orang bisa melihat produk yang aktif
CREATE POLICY "products_baca_aktif"
  ON products FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa menambah produk baru
CREATE POLICY "products_tambah_admin"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa mengubah produk
CREATE POLICY "products_ubah_admin"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa menghapus produk
CREATE POLICY "products_hapus_admin"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );


-- ============================================
-- KEBIJAKAN: TABEL CARTS
-- ============================================

-- User hanya bisa melihat keranjang miliknya sendiri
CREATE POLICY "carts_baca_sendiri"
  ON carts FOR SELECT
  USING (user_id = (select auth.uid()));

-- User hanya bisa membuat keranjang untuk dirinya sendiri
CREATE POLICY "carts_tambah_sendiri"
  ON carts FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- User hanya bisa mengubah keranjang miliknya sendiri
CREATE POLICY "carts_ubah_sendiri"
  ON carts FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User hanya bisa menghapus keranjang miliknya sendiri
CREATE POLICY "carts_hapus_sendiri"
  ON carts FOR DELETE
  USING (user_id = (select auth.uid()));


-- ============================================
-- KEBIJAKAN: TABEL CART_ITEMS
-- ============================================

-- User hanya bisa melihat item di keranjang miliknya sendiri
CREATE POLICY "cart_items_baca_sendiri"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (select auth.uid())
    )
  );

-- User hanya bisa menambah item ke keranjang miliknya sendiri
CREATE POLICY "cart_items_tambah_sendiri"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (select auth.uid())
    )
  );

-- User hanya bisa mengubah item di keranjang miliknya sendiri
CREATE POLICY "cart_items_ubah_sendiri"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (select auth.uid())
    )
  );

-- User hanya bisa menghapus item dari keranjang miliknya sendiri
CREATE POLICY "cart_items_hapus_sendiri"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = (select auth.uid())
    )
  );


-- ============================================
-- KEBIJAKAN: TABEL ORDERS
-- ============================================

-- User bisa melihat pesanan miliknya sendiri, admin bisa melihat semua pesanan
CREATE POLICY "orders_baca"
  ON orders FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- User bisa membuat pesanan untuk dirinya sendiri
CREATE POLICY "orders_tambah_sendiri"
  ON orders FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Admin bisa mengubah status pesanan (update manual tanpa payment gateway)
-- User juga bisa mengubah pesanannya (misal: membatalkan pesanan pending)
CREATE POLICY "orders_ubah"
  ON orders FOR UPDATE
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );

-- Hanya admin yang bisa menghapus pesanan
CREATE POLICY "orders_hapus_admin"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );


-- ============================================
-- KEBIJAKAN: TABEL ORDER_ITEMS
-- ============================================

-- User bisa melihat item pesanan miliknya, admin bisa melihat semua
CREATE POLICY "order_items_baca"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM profiles
            JOIN roles ON profiles.role_id = roles.id
            WHERE profiles.id = (select auth.uid())
              AND roles.name = 'admin'
          )
        )
    )
  );

-- User bisa menambah item pesanan saat checkout
CREATE POLICY "order_items_tambah"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (select auth.uid())
    )
  );

-- Hanya admin yang bisa menghapus item pesanan
CREATE POLICY "order_items_hapus_admin"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = (select auth.uid())
        AND roles.name = 'admin'
    )
  );


-- ============================================
-- KEBIJAKAN: TABEL REVIEWS
-- ============================================

-- Semua orang bisa melihat ulasan produk
CREATE POLICY "reviews_baca_publik"
  ON reviews FOR SELECT
  USING (true);

-- User yang login bisa menambah ulasan
CREATE POLICY "reviews_tambah_sendiri"
  ON reviews FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- User hanya bisa mengubah ulasan miliknya sendiri
CREATE POLICY "reviews_ubah_sendiri"
  ON reviews FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User hanya bisa menghapus ulasan miliknya sendiri
CREATE POLICY "reviews_hapus_sendiri"
  ON reviews FOR DELETE
  USING (user_id = (select auth.uid()));
