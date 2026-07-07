# 🛒 API E-Commerce — Supabase + Express.js

REST API untuk aplikasi E-Commerce yang dibangun menggunakan **Express.js** dengan integrasi **Supabase** (PostgreSQL, Auth, dan Storage). API menyediakan endpoint untuk autentikasi, manajemen produk & kategori, keranjang belanja, pesanan, ulasan, serta dashboard admin.

> Catatan: Proyek ini **tidak menggunakan payment gateway**. Status pesanan diperbarui secara manual oleh admin.

---

## ✨ Fitur

- **Autentikasi & Otorisasi** — register, login, logout, profil. Berbasis Supabase Auth (JWT) dengan role `admin` / `customer` (tabel `roles` terpisah).
- **Kategori Produk** — CRUD kategori (publik untuk baca, admin untuk tulis).
- **Produk** — CRUD, pencarian, filter kategori, sorting, pagination, dan upload gambar ke Supabase Storage.
- **Keranjang Belanja** — tambah, lihat, update jumlah, hapus item, dan kosongkan keranjang.
- **Pesanan** — checkout dari keranjang (dengan snapshot harga & pengurangan stok), riwayat pesanan, detail, dan manajemen status oleh admin.
- **Ulasan** — rating & komentar produk (satu ulasan per user per produk).
- **Dashboard Admin** — statistik umum, produk stok menipis, produk terlaris, dan pesanan terbaru.
- **Keamanan** — Helmet, CORS, rate limiting, validasi input (`express-validator`).
- **Dokumentasi** — Swagger UI otomatis di `/api-docs`.

---

## 🧰 Teknologi

| Komponen        | Teknologi                          |
| --------------- | ---------------------------------- |
| Runtime         | Node.js (ES Modules)               |
| Framework       | Express.js 4                       |
| Database & Auth | Supabase (PostgreSQL + Auth)       |
| Storage         | Supabase Storage                   |
| Validasi        | express-validator                  |
| Dokumentasi     | swagger-jsdoc + swagger-ui-express |
| Keamanan        | helmet, cors, express-rate-limit   |
| Upload          | multer (memory storage)            |

---

## 📋 Prasyarat

- **Node.js** v18 atau lebih baru
- Akun & proyek **Supabase** ([supabase.com](https://supabase.com))

---

## 🚀 Instalasi & Setup

### 1. Clone & install dependencies

```bash
npm install
```

### 2. Konfigurasi environment variables

Salin file contoh lalu isi dengan kredensial Supabase Anda:

```bash
copy .env.example .env
```

Isi `.env`:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PORT=3000
NODE_ENV=development
```

> Kredensial bisa didapat dari **Supabase Dashboard → Project Settings → API**.
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia — hanya digunakan di backend, jangan diekspos ke frontend.

### 3. Setup database

Jalankan skrip SQL pada **Supabase SQL Editor** dengan urutan berikut:

1. `database/schema.sql` — membuat semua tabel, trigger, dan index
2. `database/policies.sql` — Row Level Security (RLS) policies
3. `database/seed.sql` — data dummy (opsional, untuk testing)

### 4. Setup Supabase Storage

Buat bucket bernama **`products`** (set sebagai **public**) di Supabase Dashboard → Storage. Bucket ini digunakan untuk menyimpan gambar produk.

### 5. Jalankan server

```bash
# Development (dengan auto-reload via nodemon)
npm run dev

# Production
npm start
```

Server berjalan di `http://localhost:3000` dan dokumentasi tersedia di `http://localhost:3000/api-docs`.

---

## 📚 Dokumentasi API

Dokumentasi interaktif lengkap tersedia melalui **Swagger UI**:

```
http://localhost:3000/api-docs
```

### Autentikasi

Sebagian besar endpoint memerlukan **Bearer Token** (JWT) yang didapat dari endpoint login. Sertakan di header:

```
Authorization: Bearer <access_token>
```

### Ringkasan Endpoint

#### 🔑 Auth — `/api/auth`

| Method | Endpoint    | Deskripsi              | Akses    |
| ------ | ----------- | ---------------------- | -------- |
| POST   | `/register` | Registrasi user baru   | Publik   |
| POST   | `/login`    | Login & dapatkan token | Publik   |
| POST   | `/logout`   | Logout                 | Publik   |
| GET    | `/profile`  | Lihat profil           | Terautentikasi |
| PUT    | `/profile`  | Update profil          | Terautentikasi |

#### 📁 Categories — `/api/categories`

| Method | Endpoint | Deskripsi             | Akses  |
| ------ | -------- | --------------------- | ------ |
| GET    | `/`      | Daftar semua kategori | Publik |
| GET    | `/:id`   | Detail kategori       | Publik |
| POST   | `/`      | Tambah kategori       | Admin  |
| PUT    | `/:id`   | Update kategori       | Admin  |
| DELETE | `/:id`   | Hapus kategori        | Admin  |

#### 📦 Products — `/api/products`

| Method | Endpoint      | Deskripsi                                    | Akses  |
| ------ | ------------- | -------------------------------------------- | ------ |
| GET    | `/`           | Daftar produk (search, filter, sort, page)   | Publik |
| GET    | `/:id`        | Detail produk (+ rata-rata rating)           | Publik |
| POST   | `/`           | Tambah produk                                | Admin  |
| PUT    | `/:id`        | Update produk                                | Admin  |
| DELETE | `/:id`        | Hapus produk (soft delete)                   | Admin  |
| POST   | `/:id/image`  | Upload gambar produk                         | Admin  |

Query parameter `GET /api/products`: `search`, `category_id`, `sort` (`price_asc`, `price_desc`, `newest`), `page`, `limit`.

#### 🛒 Cart — `/api/cart`

| Method | Endpoint | Deskripsi                  | Akses          |
| ------ | -------- | -------------------------- | -------------- |
| GET    | `/`      | Lihat isi keranjang        | Terautentikasi |
| POST   | `/`      | Tambah item ke keranjang   | Terautentikasi |
| PUT    | `/:id`   | Update jumlah item         | Terautentikasi |
| DELETE | `/:id`   | Hapus satu item            | Terautentikasi |
| DELETE | `/`      | Kosongkan keranjang        | Terautentikasi |

#### 🧾 Orders — `/api/orders`

| Method | Endpoint        | Deskripsi                          | Akses          |
| ------ | --------------- | ---------------------------------- | -------------- |
| POST   | `/`             | Checkout dari keranjang            | Terautentikasi |
| GET    | `/`             | Riwayat pesanan saya               | Terautentikasi |
| GET    | `/:id`          | Detail pesanan                     | Pemilik/Admin  |
| GET    | `/admin/all`    | Semua pesanan (filter status)      | Admin          |
| PUT    | `/:id/status`   | Update status pesanan              | Admin          |

Alur status pesanan:

```
pending → processing → shipped → delivered
   ↓           ↓
cancelled   cancelled
```

Saat status diubah ke `cancelled`, stok produk dikembalikan otomatis.

#### ⭐ Reviews — `/api/reviews`

| Method | Endpoint              | Deskripsi               | Akses          |
| ------ | --------------------- | ----------------------- | -------------- |
| GET    | `/product/:productId` | Daftar ulasan produk    | Publik         |
| POST   | `/product/:productId` | Tambah ulasan           | Terautentikasi |
| DELETE | `/:id`                | Hapus ulasan sendiri    | Terautentikasi |

#### 📊 Dashboard — `/api/dashboard`

| Method | Endpoint          | Deskripsi                             | Akses |
| ------ | ----------------- | ------------------------------------- | ----- |
| GET    | `/stats`          | Statistik utama (produk, order, dll)  | Admin |
| GET    | `/low-stock`      | Produk dengan stok menipis            | Admin |
| GET    | `/top-products`   | Produk terlaris                       | Admin |
| GET    | `/recent-orders`  | Pesanan terbaru                       | Admin |

---

## 📂 Struktur Proyek

```
API-TB/
├── database/
│   ├── schema.sql          # DDL semua tabel, trigger, index
│   ├── seed.sql            # Data dummy
│   └── policies.sql        # RLS policies
├── src/
│   ├── config/
│   │   ├── supabase.js     # Supabase client (admin + user-scoped)
│   │   └── swagger.js      # Konfigurasi Swagger/OpenAPI
│   ├── controllers/        # Logika bisnis tiap modul
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── review.controller.js
│   │   └── dashboard.controller.js
│   ├── middleware/
│   │   ├── auth.js         # authenticate & authorizeAdmin
│   │   ├── validate.js     # Runner express-validator
│   │   ├── errorHandler.js # Global error handler
│   │   └── upload.js       # Multer + Supabase Storage
│   ├── routes/             # Definisi endpoint + anotasi Swagger
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── review.routes.js
│   │   └── dashboard.routes.js
│   ├── utils/
│   │   ├── response.js     # Format response konsisten
│   │   └── pagination.js   # Helper pagination
│   ├── app.js              # Setup Express app
│   └── server.js           # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## 📐 Format Response

Semua response menggunakan format JSON yang konsisten.

**Sukses:**

```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": { }
}
```

**Sukses dengan pagination:**

```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": [ ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Pesan error",
  "errors": [ ]
}
```

---

## 🔒 Keamanan

- **Helmet** — proteksi HTTP headers (XSS, clickjacking, dll).
- **CORS** — dapat dikonfigurasi melalui variabel `CORS_ORIGIN`.
- **Rate Limiting** — maksimal 100 request per 15 menit per IP.
- **Row Level Security (RLS)** — kebijakan akses data di level database (lihat `database/policies.sql`).
- **Validasi input** — seluruh input divalidasi dengan `express-validator`.

---

## 📝 Lisensi

Proyek ini dibuat untuk keperluan Tugas Besar (akademik).
