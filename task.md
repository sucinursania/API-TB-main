# 🛒 Task List — API E-Commerce Supabase

## 1. Database & Project Setup
- [x] `package.json` — dependencies & scripts
- [x] `.env.example` — template environment variables
- [x] `.gitignore` — ignore rules
- [x] `database/schema.sql` — DDL semua tabel (termasuk tabel `roles` terpisah)
- [x] `database/seed.sql` — data dummy
- [x] `database/policies.sql` — RLS policies

## 2. Core Infrastructure
- [x] `src/config/supabase.js` — Supabase client (admin + user-scoped)
- [x] `src/config/swagger.js` — Swagger/OpenAPI config
- [x] `src/middleware/auth.js` — authenticate & authorizeAdmin
- [x] `src/middleware/validate.js` — express-validator runner
- [x] `src/middleware/errorHandler.js` — global error handler
- [x] `src/middleware/upload.js` — multer + Supabase Storage
- [x] `src/utils/response.js` — response formatter
- [x] `src/utils/pagination.js` — pagination helper
- [x] `src/app.js` — Express app setup
- [x] `src/server.js` — Entry point

## 3. API Modules — Part 1
- [x] Auth routes & controller
- [x] Category routes & controller
- [x] Product routes & controller
- [x] Review routes & controller

## 4. API Modules — Part 2
- [x] Cart routes & controller
- [x] Order routes & controller
- [x] Dashboard routes & controller
- [x] `README.md` — dokumentasi lengkap

## 5. Verification
- [x] npm install berhasil
- [x] Server bisa start tanpa error