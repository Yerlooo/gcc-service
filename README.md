# GCC Web Service

Situs pemesanan dan panel operasional untuk jasa servis AC dan elektronik rumah.

**Nama Aplikasi:** GCC Web · **Domain:** Belum Hosting

## Fitur

**Situs publik**

- Landing page editorial
- Katalog layanan: cuci AC, isi freon, bongkar pasang AC, perbaikan kulkas,
  mesin cuci, dan TV, lengkap dengan varian harga.
- Quick Booking empat langkah: layanan → jadwal → data pelanggan → konfirmasi.
- Ketersediaan slot dua jam secara real time, kapasitas tiga pesanan per slot.
- Pelacakan pesanan dengan kode `GCC-YYMMDD-XXXX`; alamat hanya terbuka setelah
  nomor WhatsApp cocok.
- Halaman area
- Formulir kontak yang menyusun pesan WhatsApp, halaman privasi, 404, sitemap,
  robots, manifest, dan Open Graph image.
- JSON-LD `HVACBusiness`, `Service`, `FAQPage`, `BreadcrumbList`, dan `ItemList`.

**Panel admin** (`/admin`)

- Login dengan sesi httpOnly dan refresh token yang dapat dicabut.
- Ringkasan KPI, jadwal hari ini, tren 7/30 hari, beban teknisi, stok rendah,
  dan ulasan yang menunggu moderasi.
- Daftar dan detail pesanan: filter status/pembayaran, pencarian, riwayat
  status, penugasan teknisi dengan cek kapasitas dan bentrok slot, pembayaran
  manual, tautan WhatsApp, dan cetak.
- Manajemen harga layanan dan varian.
- Manajemen teknisi: akun, zona, keahlian, kapasitas harian, ketersediaan, dan
  penonaktifan yang mencabut sesi.
- Moderasi testimoni
- Stok: barang, kategori, ambang minimum, serta mutasi masuk/keluar/penyesuaian.
- Pengaturan identitas usaha, area layanan, dan rekening transfer.

**Backend**

- REST API Express + Prisma + PostgreSQL.
- State machine pesanan yang divalidasi di server.
- Perhitungan harga di server; browser tidak pernah mengirim harga.
- Transaksi serializable untuk mencegah dua pesanan mengambil slot terakhir.
- Audit log untuk perubahan status, penugasan, pembayaran, stok, dan pengaturan.
- WhatsApp (mock/Fonnte/Wablas) dan Midtrans Snap + webhook bertanda tangan (**belum terintegrasi**).
- Helmet, CORS allowlist, rate limit login/booking/tracking, validasi Zod,
  dan cookie httpOnly.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Web | Next.js 16.4 (App Router), React 19, TypeScript, Tailwind CSS 3.4 |
| API | Node.js 20+, Express 4, Prisma 5, Zod |
| Database | PostgreSQL 15+ |
| Auth | JWT access/refresh, bcrypt, session rotation |
| Integrasi | Fonnte/Wablas (WhatsApp), Midtrans Snap |

## Kalau mau make

Prasyarat: Node.js 20+, npm 10+, PostgreSQL 15+.

```bash
npm install

# 1. Environment API
cp apps/api/.env.example apps/api/.env
# isi DATABASE_URL dan dua JWT secret yang acak

# 2. Environment web
cat > apps/web/.env.local <<'ENV'
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_DEMO_MODE=0
ENV

# 3. Database
createdb -U postgres gcc_web
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Jalankan web + API
npm run dev
```

- Web: <http://localhost:3000>
- Admin: <http://localhost:3000/admin/login>
- API health: <http://localhost:4000/api/health>

Alternatif database tanpa Prisma:

```bash
psql -U postgres -d gcc_web -f database/schema.sql
psql -U postgres -d gcc_web -f database/seed.sql
```

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `admin@gcc-web.id` | `Admin#12345` |
| Teknisi | `budi@gcc-web.id` | `Teknisi#12345` |

## Struktur

```
apps/
  api/        Express, Prisma, seed, integrasi
  web/        Next.js publik + admin
database/
  schema.sql  DDL PostgreSQL
  seed.sql    data contoh SQL
  ERD.md      diagram relasi
docs/
  ARCHITECTURE.md  keputusan arsitektur dan alur
  API.md           referensi endpoint
  SEO.md           metadata, structured data, checklist
  DEPLOYMENT.md    lokal, VPS, Nginx, PM2, backup
  INTEGRATIONS.md  WhatsApp dan Midtrans
```

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | web dan API bersamaan |
| `npm run build` | build API lalu web |
| `npm run lint` | lint Next.js |
| `npm run db:generate` | generate Prisma client |
| `npm run db:migrate` | migrasi development |
| `npm run db:seed` | seed data contoh |
| `npm run db:studio` | Prisma Studio |
| `npm --workspace @gcc/api run typecheck` | cek tipe API |
| `npm --workspace @gcc/web run typecheck` | cek tipe web |

## Dokumentasi

- [Arsitektur dan alur data](docs/ARCHITECTURE.md)
- [Referensi API](docs/API.md)
- [SEO dan konten](docs/SEO.md)
- [Deployment](docs/DEPLOYMENT.md)
- [WhatsApp dan Midtrans](docs/INTEGRATIONS.md)
- [ERD](database/ERD.md)

```bash
npm install
npm run db:generate
npm --workspace @gcc/api run typecheck
npm --workspace @gcc/web run typecheck
npm run lint
npm run build
```

## Lisensi

Proprietary. Seluruh isi, merek, dan data contoh hanya untuk proyek GCC Web.
