-- ============================================
-- DATA SEED E-COMMERCE
-- Tugas Besar - Integrasi Supabase
-- ============================================
-- Catatan:
--   - Data dummy realistis untuk toko online Indonesia
--   - Harga dalam Rupiah (IDR)
--   - Jalankan setelah schema.sql
-- ============================================


-- ============================================
-- KATEGORI PRODUK
-- 6 kategori utama toko online
-- ============================================
INSERT INTO categories (name, slug, description, image_url) VALUES
  (
    'Elektronik',
    'elektronik',
    'Perangkat elektronik, gadget, dan aksesoris teknologi terbaru',
    'https://picsum.photos/seed/elektronik/400/300'
  ),
  (
    'Fashion Pria',
    'fashion-pria',
    'Pakaian, sepatu, dan aksesoris pria terkini',
    'https://picsum.photos/seed/fashion-pria/400/300'
  ),
  (
    'Fashion Wanita',
    'fashion-wanita',
    'Pakaian, sepatu, tas, dan aksesoris wanita terlengkap',
    'https://picsum.photos/seed/fashion-wanita/400/300'
  ),
  (
    'Makanan & Minuman',
    'makanan-minuman',
    'Makanan ringan, minuman, dan bahan makanan berkualitas',
    'https://picsum.photos/seed/makanan-minuman/400/300'
  ),
  (
    'Kesehatan & Kecantikan',
    'kesehatan-kecantikan',
    'Produk perawatan tubuh, skincare, dan suplemen kesehatan',
    'https://picsum.photos/seed/kesehatan-kecantikan/400/300'
  ),
  (
    'Rumah Tangga',
    'rumah-tangga',
    'Peralatan rumah tangga, dekorasi, dan kebutuhan harian',
    'https://picsum.photos/seed/rumah-tangga/400/300'
  );


-- ============================================
-- PRODUK
-- 18 produk terdistribusi di berbagai kategori
-- ============================================

-- ---- Kategori: Elektronik ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Laptop ASUS VivoBook 14',
    'laptop-asus-vivobook-14',
    'Laptop ASUS VivoBook 14 inci dengan prosesor Intel Core i5 generasi ke-12, RAM 8GB DDR4, SSD 512GB NVMe. Cocok untuk produktivitas dan kuliah.',
    8500000.00,
    25,
    (SELECT id FROM categories WHERE slug = 'elektronik'),
    'https://picsum.photos/seed/laptop-asus/400/300'
  ),
  (
    'Samsung Galaxy A54 5G',
    'samsung-galaxy-a54-5g',
    'Smartphone Samsung Galaxy A54 5G dengan layar Super AMOLED 6.4 inci, kamera 50MP OIS, baterai 5000mAh. Tahan air IP67.',
    5299000.00,
    50,
    (SELECT id FROM categories WHERE slug = 'elektronik'),
    'https://picsum.photos/seed/samsung-a54/400/300'
  ),
  (
    'TWS Earbuds Pro Bluetooth 5.3',
    'tws-earbuds-pro-bluetooth',
    'Earbuds nirkabel dengan Active Noise Cancelling (ANC), driver 12mm, baterai hingga 30 jam dengan case pengisian. Mendukung Bluetooth 5.3.',
    349000.00,
    100,
    (SELECT id FROM categories WHERE slug = 'elektronik'),
    'https://picsum.photos/seed/tws-earbuds/400/300'
  );

-- ---- Kategori: Fashion Pria ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Kaos Polos Pria Cotton Combed 30s',
    'kaos-polos-pria-cotton-combed',
    'Kaos polos pria berbahan Cotton Combed 30s yang lembut dan nyaman. Tersedia dalam berbagai ukuran (S-XXL). Jahitan rapi dan tidak mudah melar.',
    89000.00,
    200,
    (SELECT id FROM categories WHERE slug = 'fashion-pria'),
    'https://picsum.photos/seed/kaos-polos/400/300'
  ),
  (
    'Celana Chino Pria Slim Fit',
    'celana-chino-pria-slim-fit',
    'Celana chino pria slim fit berbahan stretch yang nyaman dipakai seharian. Cocok untuk casual maupun semi-formal.',
    189000.00,
    80,
    (SELECT id FROM categories WHERE slug = 'fashion-pria'),
    'https://picsum.photos/seed/celana-chino/400/300'
  ),
  (
    'Sepatu Sneakers Pria Casual',
    'sepatu-sneakers-pria-casual',
    'Sepatu sneakers pria dengan desain modern dan sol empuk. Ringan dan nyaman untuk aktivitas sehari-hari.',
    259000.00,
    60,
    (SELECT id FROM categories WHERE slug = 'fashion-pria'),
    'https://picsum.photos/seed/sneakers-pria/400/300'
  );

-- ---- Kategori: Fashion Wanita ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Dress Midi Wanita Floral',
    'dress-midi-wanita-floral',
    'Dress midi wanita dengan motif floral elegan. Bahan viscose yang adem dan jatuh sempurna. Cocok untuk acara casual hingga semi-formal.',
    175000.00,
    70,
    (SELECT id FROM categories WHERE slug = 'fashion-wanita'),
    'https://picsum.photos/seed/dress-floral/400/300'
  ),
  (
    'Tas Selempang Wanita Mini',
    'tas-selempang-wanita-mini',
    'Tas selempang mini wanita dengan bahan kulit sintetis premium. Desain minimalis dengan tali rantai yang elegan.',
    145000.00,
    90,
    (SELECT id FROM categories WHERE slug = 'fashion-wanita'),
    'https://picsum.photos/seed/tas-selempang/400/300'
  ),
  (
    'Hijab Pashmina Diamond Italiano',
    'hijab-pashmina-diamond-italiano',
    'Hijab pashmina berbahan Diamond Italiano yang lembut, tidak licin, dan mudah dibentuk. Ukuran 175x75cm.',
    55000.00,
    150,
    (SELECT id FROM categories WHERE slug = 'fashion-wanita'),
    'https://picsum.photos/seed/hijab-pashmina/400/300'
  );

-- ---- Kategori: Makanan & Minuman ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Kopi Arabica Gayo Premium 250g',
    'kopi-arabica-gayo-premium-250g',
    'Biji kopi Arabica Gayo premium grade 1, roasting medium. Aroma khas fruity dengan body yang tebal. Kemasan zip lock 250 gram.',
    78000.00,
    120,
    (SELECT id FROM categories WHERE slug = 'makanan-minuman'),
    'https://picsum.photos/seed/kopi-gayo/400/300'
  ),
  (
    'Keripik Singkong Balado 500g',
    'keripik-singkong-balado-500g',
    'Keripik singkong renyah dengan bumbu balado khas Padang yang pedas gurih. Tanpa pengawet, kemasan ekonomis 500 gram.',
    35000.00,
    200,
    (SELECT id FROM categories WHERE slug = 'makanan-minuman'),
    'https://picsum.photos/seed/keripik-balado/400/300'
  ),
  (
    'Madu Hutan Asli Kalimantan 500ml',
    'madu-hutan-asli-kalimantan-500ml',
    'Madu hutan murni dari lebah liar Kalimantan. Kaya nutrisi dan antioksidan alami. Dikemas dalam botol kaca 500ml.',
    125000.00,
    45,
    (SELECT id FROM categories WHERE slug = 'makanan-minuman'),
    'https://picsum.photos/seed/madu-kalimantan/400/300'
  );

-- ---- Kategori: Kesehatan & Kecantikan ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Serum Vitamin C 20% Brightening',
    'serum-vitamin-c-20-brightening',
    'Serum wajah dengan kandungan Vitamin C 20%, Niacinamide, dan Hyaluronic Acid. Membantu mencerahkan dan meratakan warna kulit.',
    92000.00,
    85,
    (SELECT id FROM categories WHERE slug = 'kesehatan-kecantikan'),
    'https://picsum.photos/seed/serum-vitc/400/300'
  ),
  (
    'Sunscreen SPF 50+ PA++++ 60ml',
    'sunscreen-spf50-pa-60ml',
    'Sunscreen dengan perlindungan SPF 50+ PA++++ yang ringan dan tidak lengket. Water-resistant, cocok untuk aktivitas outdoor.',
    68000.00,
    110,
    (SELECT id FROM categories WHERE slug = 'kesehatan-kecantikan'),
    'https://picsum.photos/seed/sunscreen-spf50/400/300'
  ),
  (
    'Masker Wajah Green Tea Clay 100g',
    'masker-wajah-green-tea-clay-100g',
    'Masker wajah berbahan Green Tea dan Kaolin Clay yang membantu mengangkat sel kulit mati, mengecilkan pori-pori, dan mengontrol minyak.',
    49000.00,
    95,
    (SELECT id FROM categories WHERE slug = 'kesehatan-kecantikan'),
    'https://picsum.photos/seed/masker-greentea/400/300'
  );

-- ---- Kategori: Rumah Tangga ----
INSERT INTO products (name, slug, description, price, stock, category_id, image_url) VALUES
  (
    'Panci Set Anti Lengket 5 Pcs',
    'panci-set-anti-lengket-5-pcs',
    'Set panci anti lengket 5 pcs (16cm, 18cm, 20cm, 22cm, 24cm) dengan tutup kaca tahan panas. Cocok untuk berbagai masakan.',
    275000.00,
    40,
    (SELECT id FROM categories WHERE slug = 'rumah-tangga'),
    'https://picsum.photos/seed/panci-set/400/300'
  ),
  (
    'Rak Sepatu Lipat 4 Tingkat',
    'rak-sepatu-lipat-4-tingkat',
    'Rak sepatu portable 4 tingkat dengan penutup kain anti debu. Muat hingga 12 pasang sepatu. Mudah dirakit tanpa alat.',
    129000.00,
    55,
    (SELECT id FROM categories WHERE slug = 'rumah-tangga'),
    'https://picsum.photos/seed/rak-sepatu/400/300'
  ),
  (
    'Lampu LED Meja Belajar Rechargeable',
    'lampu-led-meja-belajar-rechargeable',
    'Lampu meja LED dengan 3 mode pencahayaan (warm, natural, cool) dan brightness yang dapat diatur. Baterai rechargeable tahan hingga 8 jam.',
    95000.00,
    65,
    (SELECT id FROM categories WHERE slug = 'rumah-tangga'),
    'https://picsum.photos/seed/lampu-led/400/300'
  );
