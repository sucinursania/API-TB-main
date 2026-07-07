// =============================================================================
// Konfigurasi Swagger/OpenAPI
// =============================================================================
// Menggunakan swagger-jsdoc untuk men-generate dokumentasi API secara otomatis
// dari anotasi JSDoc di file route.
// =============================================================================

import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API E-Commerce - Tugas Besar',
      version: '1.0.0',
      description:
        'Dokumentasi REST API untuk aplikasi E-Commerce. ' +
        'API ini menyediakan endpoint untuk autentikasi, manajemen produk, ' +
        'kategori, keranjang belanja, pesanan, ulasan, dan dashboard admin. ' +
        'Dibangun menggunakan Express.js dengan integrasi Supabase.',
      contact: {
        name: 'Tim Pengembang',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server Development Lokal',
      },
    ],
    // Skema keamanan menggunakan Bearer Token (JWT dari Supabase Auth)
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan token JWT yang didapat dari endpoint login',
        },
      },
    },
    // Tag untuk mengelompokkan endpoint berdasarkan modul
    tags: [
      {
        name: 'Auth',
        description: 'Endpoint autentikasi (register, login, logout, profil)',
      },
      {
        name: 'Categories',
        description: 'Endpoint manajemen kategori produk',
      },
      {
        name: 'Products',
        description: 'Endpoint manajemen produk (CRUD, pencarian, filter)',
      },
      {
        name: 'Cart',
        description: 'Endpoint keranjang belanja pengguna',
      },
      {
        name: 'Orders',
        description: 'Endpoint manajemen pesanan (checkout, riwayat, status)',
      },
      {
        name: 'Reviews',
        description: 'Endpoint ulasan dan rating produk',
      },
      {
        name: 'Dashboard',
        description: 'Endpoint dashboard admin (statistik, laporan)',
      },
    ],
  },
  // Scan semua file route untuk anotasi Swagger
  apis: ['./src/routes/*.js'],
};

// Generate spesifikasi Swagger dari konfigurasi di atas
const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
