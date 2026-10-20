# GCC Web

Situs pemesanan dan panel operasional untuk jasa servis AC dan elektronik rumah.
Pelanggan memilih layanan, tanggal, dan slot kedatangan; admin mengonfirmasi,
menugaskan teknisi, mencatat pembayaran, memoderasi ulasan, dan memantau stok.

**Nama produk:** GCC Web · **Domain:** `https://gcc-web.id` ·
**Database:** `gcc_web`

## Fitur

**Situs publik**

- Landing page editorial dengan harga awal, alur kerja, garansi, area layanan,
  FAQ, dan ulasan.
- Katalog layanan: cuci AC, isi freon, bongkar pasang AC, perbaikan kulkas,
  mesin cuci, dan TV, lengkap dengan varian harga.
- Quick Booking empat langkah: layanan → jadwal → data pelanggan → konfirmasi.
- Ketersediaan slot dua jam secara real time, kapasitas tiga pesanan per slot.
- Pelacakan pesanan dengan kode `GCC-YYMMDD-XXXX`; alamat hanya terbuka setelah
  nomor WhatsApp cocok.
- Halaman area Jakarta Selatan, Jakarta Pusat, Jakarta Barat, Depok, dan
  Tangerang Selatan.
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
- Moderasi testimoni: terbitkan, sembunyikan, unggulkan, hapus.
- Stok: barang, kategori, ambang minimum, serta mutasi masuk/keluar/penyesuaian.
- Pengaturan identitas usaha, area layanan, dan rekening transfer.

**Backend**

- REST API Express + Prisma + PostgreSQL.
- State machine pesanan yang divalidasi di server.
- Perhitungan harga di server; browser tidak pernah mengirim harga.
- Transaksi serializable untuk mencegah dua pesanan mengambil slot terakhir.
- Audit log untuk perubahan status, penugasan, pembayaran, stok, dan pengaturan.
- WhatsApp (mock/Fonnte/Wablas) dan Midtrans Snap + webhook bertanda tangan.
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

## Mulai cepat

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

Ganti kata sandi sebelum deploy. Untuk mode demo tanpa API, set
`NEXT_PUBLIC_DEMO_MODE=1`; panel admin memakai kredensial yang sama dan
menyimpan perubahan hanya di `sessionStorage`.

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

## Environment

API (`apps/api/.env`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gcc_web?schema=public"
PORT=4000
NODE_ENV=development
WEB_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET="<32+ byte random>"
JWT_REFRESH_SECRET="<32+ byte random, berbeda>"
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
SLOT_CAPACITY=3
WHATSAPP_PROVIDER=mock
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_TOKEN=
ADMIN_WHATSAPP=6281234567890
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

Web (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_DEMO_MODE=0
```

Hanya `.env.example` yang masuk repository. Jangan commit `.env` atau token
nyata.

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

## Sebelum publikasi

Beberapa hal di repository ini sengaja berupa contoh agar desain dan alur bisa
ditinjau. Ganti sebelum situs dipublikasikan:

- Nomor telepon, WhatsApp, email, alamat, dan jam operasional di
  `apps/web/lib/site.ts`, pengaturan admin, dan `apps/api/prisma/seed.ts`.
- Rekening bank; nilai seed `0000000000` hanya placeholder.
- Nama, nomor, dan ulasan pelanggan pada data contoh.
- Harga layanan dan kebijakan garansi.
- Ilustrasi teknis di `apps/web/public/images/` saat ini berupa SVG buatan
  sendiri (`manifold-gauge.svg`, `ac-cleaning.svg`, `outdoor-unit.svg`,
  `jakarta-street.svg`) dan dilabeli sebagai ilustrasi. Ganti dengan foto asli
  berlisensi komersial bila tersedia; sertakan kredit fotografer dan perbarui
  teks kredit di beranda.
- Kunci Midtrans dan token WhatsApp; biarkan kosong untuk mode manual/mock.
- Kata sandi akun seed.

Set `NEXT_PUBLIC_DEMO_MODE=0` dan `NEXT_PUBLIC_SITE_URL` ke domain HTTPS
sebelum build produksi.

## Status pengujian

Belum ada automated test suite. Sebelum rilis, jalankan:

```bash
npm install
npm run db:generate
npm --workspace @gcc/api run typecheck
npm --workspace @gcc/web run typecheck
npm run lint
npm run build
```

Lalu uji manual: buat pesanan, konfirmasi dan tugaskan teknisi, ubah status
sampai selesai, tandai pembayaran, kirim testimoni, lacak pesanan, dan periksa
tampilan pada lebar ponsel 360 px, tablet 768 px, dan desktop 1440 px.

## Lisensi

Proprietary. Seluruh isi, merek, dan data contoh hanya untuk proyek GCC Web.
