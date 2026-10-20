# Audit QA, Keamanan, dan Kesiapan Produksi — GCC Web

**Tanggal audit:** 21 Oktober 2026  
**Metode:** Bottom-Up Testing (integritas API/data → logika bisnis → UI/UX)  
**Cakupan:** `apps/api` (Express, Prisma, PostgreSQL), `apps/web` (Next.js 16.4.2, React 19), konfigurasi environment, dokumentasi deployment  
**Sifat audit:** Audit statis berbasis pembacaan kode dan konfigurasi. Pengujian runtime tidak dapat dijalankan pada sesi ini (lihat §2.3).

---

## 1. Ringkasan Eksekutif

GCC Web memiliki fondasi arsitektur yang baik: monorepo yang rapi, validasi input dengan Zod, harga dihitung di server, transaksi serializable untuk kapasitas slot, rotasi refresh token dengan hash, bcrypt cost 12, cookie HttpOnly, audit log, serta pemisahan route publik dan admin. Ini bukan aplikasi yang “dibangun asal jadi”.

Namun **aplikasi belum layak dinyatakan production-ready**. Ada satu kerentanan **Critical** yang memungkinkan status pembayaran dipalsukan ketika Midtrans belum dikonfigurasi, ditambah delapan temuan **High** yang menyentuh integritas pesanan, kebenaran harga, keamanan sesi, dan isi situs publik. Yang paling berbahaya bukan sekadar bug individual, melainkan pola **fail-open**: ketika API lambat atau mati, situs publik diam-diam memakai data demo dan bahkan dapat menampilkan “pesanan berhasil” yang sebenarnya tidak pernah masuk database.

### 1.1 Skor kesehatan per area

| Area                       | Status        | Catatan                                                                                        |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| Arsitektur & struktur kode | **Baik**      | Pemisahan modul jelas, TypeScript ketat, Prisma terpusat                                       |
| Keamanan autentikasi       | **Cukup**     | HttpOnly, rotasi refresh, bcrypt 12; tetapi belum ada CSRF dan otorisasi masih mempercayai JWT |
| Keamanan pembayaran        | **Kritis**    | Signature Midtrans dapat diforgery saat server key kosong                                      |
| Integritas pemesanan       | **Berisiko**  | Fallback demo, race condition, dan tidak ada idempotensi                                       |
| Konsistensi konten publik  | **Buruk**     | Pengaturan admin tidak dipakai oleh sebagian besar halaman                                     |
| Kesiapan deployment        | **Belum**     | Konfigurasi contoh berbahaya, seed destruktif, build produksi belum diverifikasi               |
| Observability              | **Cukup**     | Morgan + audit log; belum ada request ID/APM                                                   |
| Otomatisasi pengujian      | **Tidak ada** | Tidak ditemukan unit/integration/E2E test                                                      |

### 1.2 Lima risiko yang harus ditutup lebih dulu

1. **SEC-01** — Endpoint notifikasi Midtrans menerima signature yang dibuat dengan key kosong; penyerang dapat menandai pesanan sebagai lunas.
2. **BOOK-01** — Saat API gagal/timeout, pelanggan melihat layar “pesanan berhasil” padahal data hanya tersimpan di `sessionStorage`.
3. **SET-01 / SET-02** — Pengaturan admin (kontak, area, FAQ) tidak diterapkan; halaman publik justru dapat menampilkan rekening bank placeholder `0000000000`.
4. **CFG-01 / SEC-02** — Arsitektur cookie lintas origin + `SameSite=None` + tanpa CSRF membuat login rapuh dan menambah permukaan serangan.
5. **CFG-02** — Seed menghapus seluruh data, membuat kredensial admin default, dan menerbitkan testimoni fiktif sebagai ulasan nyata.

### 1.3 Yang sudah baik dan perlu dipertahankan

- Harga tidak pernah dipercaya dari client; `calculateBookingTotal` dijalankan di server.
- Kapasitas slot dijaga dengan transaksi `Serializable` dan retry `P2034`.
- Refresh token disimpan sebagai hash SHA-256, bukan plaintext.
- Password di-hash bcrypt cost 12; login selalu melakukan perbandingan bcrypt.
- Cookie HttpOnly, `secure` di produksi, dan `poweredByHeader` dimatikan.
- Validasi Zod memotong field tak dikenal, mengurangi mass-assignment.
- Rate limit dipasang pada login, pembuatan booking, pelacakan, dan pembuatan Snap.
- Audit log mencatat perubahan admin tanpa menggagalkan operasi utama.
- State machine status booking konsisten antara API dan UI.
- Masking nama/telepon/alamat pada pelacakan tanpa verifikasi sudah diterapkan.

**Kesimpulan:** jangan go-live sebelum SEC-01, BOOK-01, SET-01/02, CFG-01/02, dan SEC-02 ditutup. Temuan Medium dapat masuk sprint perbaikan pertama setelah blocker.

---

## 2. Ruang Lingkup, Metode, dan Batasan

### 2.1 Urutan audit

1. **Backend & data** — schema Prisma, route, controller, service, middleware, integrasi Midtrans/WhatsApp, seed, konfigurasi env.
2. **Logika bisnis** — alur booking, kapasitas slot, transisi status, pembayaran, penugasan teknisi, inventori, testimoni, pelacakan.
3. **Frontend** — Server Components, ISR, fallback data, form booking, pelacakan, halaman admin, konsistensi konten.
4. **Konfigurasi & deployment** — CORS, cookie, header keamanan, env example, dokumentasi, build.

### 2.2 Matriks yang seharusnya diuji

| Dimensi       | Target                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Viewport      | 360, 390, 414, 768, 1024, 1280, 1440 px                                                                                       |
| Browser       | Chrome, Edge, Firefox, Safari (desktop + iOS)                                                                                 |
| Alur utama    | Booking happy path, slot penuh, tanggal lewat, pelacakan kode + telepon, login admin, ubah status, assign teknisi, pembayaran |
| Edge case     | API mati/timeout, double submit, dua tab refresh, URL booking tidak valid, stok negatif, pembayaran ganda                     |
| API           | Status code, latency p50/p95, konsistensi envelope, idempotensi                                                               |
| Aksesibilitas | Keyboard, focus, label, kontras, `aria-live` untuk error                                                                      |

### 2.3 Batas eksekusi

Pada sesi ini **tidak dijalankan**: `next build` produksi, `tsc --noEmit`, ESLint, migrasi/seed ke database, panggilan HTTP ke API, Postman/Newman, browser automation, Lighthouse, dan pengujian lintas browser. Bash classifier tidak tersedia sehingga perintah runtime diblokir. Artefak `.next` yang ada hanya hasil kompilasi dev Turbopack; tidak ada bukti build produksi yang lolos.

Konsekuensinya:

- Semua temuan di bawah adalah **temuan statis** dengan tingkat keyakinan tinggi berdasarkan jalur kode, tetapi belum dikonfirmasi lewat reproduksi runtime.
- Temuan visual/responsif tidak dapat diverifikasi secara empiris; yang dilaporkan hanyalah risiko statis dari markup/CSS.
- Angka latency, status code aktual, dan perilaku browser harus diukur ulang menggunakan rencana di §6.

---

## 3. Tabel Temuan Bug

**Legenda severity**

| Severity     | Definisi                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Critical** | Dapat menyebabkan kerugian finansial/data langsung, atau membypass kontrol keamanan utama |
| **High**     | Alur inti rusak, integritas data terancam, atau kelemahan keamanan signifikan             |
| **Medium**   | Dampak terbatas, butuh kondisi tertentu, atau ada workaround                              |
| **Low**      | Kosmetik, edge case jarang, atau peningkatan kualitas                                     |

### 3.1 Critical

| ID         | Kategori     | Severity     | Deskripsi                                                                                                                                                                                                                                                                                                                                   | Langkah Reproduksi                                                                                                                                                                                                                                                                                                                                        | Aktual vs Harapan                                                                                                                                                                                                                                              | Root Cause                                                                                                                                                             |
| ---------- | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-01** | API / Config | **Critical** | `verifySignature()` menghitung `SHA-512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`. Jika `MIDTRANS_SERVER_KEY` kosong — kondisi `.env` saat ini — siapa pun dapat menghitung signature yang valid. Endpoint `POST /api/payments/midtrans/notification` bersifat publik dan **tidak** memanggil `isMidtransConfigured()`. | 1) Pastikan `MIDTRANS_SERVER_KEY=`. 2) Buat pesanan, catat `code` dan `total` dari `GET /api/bookings/track/:code`. 3) Hitung `sig = sha512(code + "200" + total + "")`. 4) `POST /api/payments/midtrans/notification` dengan `transaction_status=settlement`, `status_code=200`, `gross_amount=<total>`, `signature_key=<sig>`. 5) Cek pesanan di admin. | **Aktual:** 200 `{received:true, outcome:"PAID"}`; `paymentStatus` menjadi `PAID`, `paidAt` terisi, notifikasi WhatsApp “lunas” terkirim. **Harapan:** 503 `PAYMENT_UNAVAILABLE` atau 401 saat gateway belum dikonfigurasi; signature tidak mungkin diforgery. | Guard konfigurasi hanya ada di `createSnap`, bukan di `handleNotification`; `verifySignature` tidak menolak key kosong; route selalu dipasang tanpa startup assertion. |

### 3.2 High

| ID          | Kategori       | Severity | Deskripsi                                                                                                                                                                                                                                                                                                                                                                                                           | Langkah Reproduksi                                                                                                                                                                                               | Aktual vs Harapan                                                                                                                                                                                                                                                      | Root Cause                                                                                                                                                               |
| ----------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SEC-02**  | API / Config   | **High** | Autentikasi memakai cookie, `credentials:'include'`, dan di produksi `SameSite=None; Secure`. Tidak ada CSRF token, pemeriksaan `Origin`/`Referer`, atau double-submit cookie. CORS hanya mengatur apakah response boleh dibaca, bukan apakah request boleh dikirim.                                                                                                                                                | 1) Build produksi. 2) Login admin. 3) Dari origin lain, kirim request state-changing yang membawa cookie (endpoint urlencoded seperti login/logout, atau subdomain sama-sama “site”). 4) Amati request diproses. | **Aktual:** request dengan cookie valid diterima tanpa bukti niat pengguna. **Harapan:** 403 tanpa CSRF token/Origin yang diizinkan; `SameSite=Lax` bila web dan API satu site.                                                                                        | Tidak ada middleware CSRF; `SameSite=None` dipilih untuk skenario lintas site, termasuk saat deployment same-origin.                                                     |
| **BOOK-01** | UI / Logic     | **High** | Saat API mati atau timeout (>2,5 detik), `loadCatalogue` memakai `demoCategories` yang ID-nya `svc-…` (bukan UUID). `BookingFlow.localMode` menjadi `true`, lalu pesanan disimpan ke `sessionStorage`, tetapi layar sukses tetap menampilkan kode tiket dan tombol “Konfirmasi via WhatsApp” seolah pesanan masuk database.                                                                                         | 1) Set `NEXT_PUBLIC_DEMO_MODE=0`. 2) Matikan API. 3) Buka `/booking`, isi 4 langkah, submit. 4) Salin kode yang muncul, buka `/admin/bookings`, cari kode tersebut. 5) Buka `/lacak?code=<kode>`.                | **Aktual:** halaman sukses dengan kode `GCC-…`, pelacakan lokal menampilkan data lengkap, tetapi pesanan tidak ada di database/admin. **Harapan:** gagal dengan pesan jelas; atau mode demo yang eksplisit dan tidak menawarkan konfirmasi WhatsApp dengan kode palsu. | Fallback `catch` di `lib/content.ts:35-42`; `localMode` diturunkan dari format ID (`!isUuid`), bukan dari flag demo; UI sukses tidak membedakan “demo” dari “API gagal”. |
| **BOOK-02** | Logic / UI     | **High** | `initialComplete` hanya mengecek keberadaan `service`, `date`, dan `slot` di URL, bukan validitasnya. `paramDate` yang tidak ada di 7 hari diganti `dates[0]`; `paramSlot` dipakai mentah; service tak dikenal diganti `services[0]`; langkah langsung melompat ke 3.                                                                                                                                               | 1) Buka `/booking?service=tidak-ada&date=2020-01-01&slot=08:00-10:00`. 2) Amati form langsung di langkah 3. 3) Isi data dan submit.                                                                              | **Aktual:** layanan pertama, tanggal hari ini, slot lama; pesanan dapat terkirim untuk layanan/tanggal yang tidak dimaksud. **Harapan:** validasi parameter, mulai dari langkah 1/2 dengan pesan, atau redirect/404.                                                   | Inisialisasi state dari URL tanpa validasi terhadap katalog, rentang tanggal, dan slot; `initialComplete` hanya cek presence.                                            |
| **BOOK-03** | Logic / Config | **High** | `loadCatalogue` mengembalikan katalog demo pada **setiap** error, termasuk timeout 2,5 detik. Halaman beranda dan `/layanan` menampilkan harga serta deskripsi demo tanpa label “contoh”. Booking berikutnya memakai ID demo dan menjadi lokal (BOOK-01).                                                                                                                                                           | 1) Hentikan API. 2) Buka `/layanan` dan beranda. 3) Bandingkan harga dengan data admin/database.                                                                                                                 | **Aktual:** harga demo tampil sebagai harga resmi. **Harapan:** status “harga tidak tersedia”/maintenance, bukan data fiktif.                                                                                                                                          | Fallback fail-open di `lib/content.ts`; tidak ada pembeda environment atau indikator kualitas data.                                                                      |
| **SET-01**  | Logic / UI     | **High** | Pengaturan admin tidak menjadi sumber kebenaran. Header, footer, beranda, halaman area, layanan, kontak, dan sitemap memakai konstanta hardcoded (`CONTACT`, `SERVICE_AREAS`, `FAQS`). Admin settings justru menampilkan klaim “langsung dipakai situs publik”, “tampil di beranda dan halaman kontak”, dan “memengaruhi halaman area, sitemap, dan SEO”.                                                           | 1) Login admin. 2) Ubah nomor telepon, WhatsApp, dan area layanan. 3) Simpan. 4) Buka beranda, header, footer, `/area`, `/kontak`, `/sitemap.xml`.                                                               | **Aktual:** tidak ada perubahan di hampir semua halaman. **Harapan:** perubahan langsung tercermin; atau UI tidak menawarkan pengaturan yang tidak berfungsi.                                                                                                          | Duplikasi konten hardcoded di `lib/site.ts` dan banyak page; hanya `/kontak` yang membaca `loadSettings()`; tidak ada single source of truth.                            |
| **SET-02**  | UI / Config    | **High** | `DEFAULT_SETTINGS.payment.bankAccount = '0000000000'`, dan `loadSettings()` mengembalikan `demoSettings` saat API gagal. Halaman `/kontak` menampilkan rekening tersebut lengkap dengan tombol salin. Peringatan “rekening contoh” hanya muncul jika `DEMO_MODE`, bukan berdasarkan validitas data.                                                                                                                 | 1) Gunakan database baru tanpa setting, atau matikan API. 2) Buka `/kontak`. 3) Lihat blok pembayaran. 4) Pastikan `NEXT_PUBLIC_DEMO_MODE=0`.                                                                    | **Aktual:** “BCA 0000000000 a.n. GCC Web” tampil sebagai rekening resmi tanpa peringatan. **Harapan:** blok pembayaran disembunyikan atau diberi peringatan keras sampai rekening diisi.                                                                               | Nilai placeholder di default settings; fallback senyap; peringatan dikaitkan ke flag demo, bukan ke data yang belum dikonfigurasi.                                       |
| **CFG-01**  | Config         | **High** | Web memanggil API lintas origin dengan cookie. Di produksi cookie memakai `SameSite=None`, CORS hanya mengizinkan `WEB_ORIGIN` persis, dan `NEXT_PUBLIC_API_URL` di-inline saat build. Perubahan domain/tunnel menuntut rebuild web + restart API; browser yang memblokir third-party cookie akan menolak login. Dokumentasi menyebut deployment first-party “tanpa `SameSite=None`”, tetapi kode tetap memakainya. | 1) Deploy web di domain A dan API di domain B tanpa `COOKIE_DOMAIN`/CORS yang cocok. 2) Login. 3) Ulangi di Safari atau Chrome incognito. 4) Ganti URL tunnel tanpa rebuild web.                                 | **Aktual:** login gagal (“tidak dapat terhubung”), cookie tidak terkirim, atau client masih memanggil URL lama. **Harapan:** same-origin `/api` rewrite, atau konfigurasi cookie/CORS yang eksplisit dan teruji.                                                       | Arsitektur cross-origin + env build-time + `SameSite=None` otomatis di produksi; tidak ada reverse proxy same-origin di repo.                                            |
| **CFG-02**  | Config / Logic | **High** | `prisma/seed.ts` menghapus seluruh tabel operasional tanpa guard produksi, membuat admin `admin@gcc-web.id` dengan password default `Admin#12345` (atau `SEED_ADMIN_PASSWORD`), teknisi dengan `Teknisi#12345`, dan 6 testimoni — 5 di antaranya `isPublished: true`, hanya 1 terkait booking `COMPLETED`. Alamat dan rekening juga placeholder.                                                                    | 1) Jalankan `npm run db:seed` pada database yang sudah berisi data. 2) Login dengan kredensial default. 3) Buka beranda/testimoni publik.                                                                        | **Aktual:** data terhapus, kredensial default valid, testimoni fiktif tampil sebagai ulasan pelanggan nyata. **Harapan:** seed menolak `NODE_ENV=production`, memakai password acak/forced change, dan menandai konten demo.                                           | Seed pengembangan merangkap bootstrap produksi; tidak ada pengecekan environment; `isPublished` default `true`.                                                          |

### 3.3 Medium

| ID           | Kategori           | Severity   | Deskripsi                                                                                                                                                                                                                                                                                                             | Langkah Reproduksi                                                                                                                                                      | Aktual vs Harapan                                                                                                                                                                   | Root Cause                                                                                                                |
| ------------ | ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **SEC-03**   | Config             | **Medium** | Header keamanan web hanya `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, dan `Permissions-Policy`. Tidak ada CSP, HSTS, COOP, atau COEP.                                                                                                                                                             | `curl -I` ke web produksi; periksa `Content-Security-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`.                                                | **Aktual:** header tidak ada. **Harapan:** CSP berbasis nonce/hash, HSTS `max-age` memadai, COOP `same-origin`; COEP bila kompatibel.                                               | Header belum dikonfigurasi di `next.config.mjs` maupun reverse proxy.                                                     |
| **SEC-04**   | API                | **Medium** | `publicLimiter` (120/menit) didefinisikan tetapi tidak pernah dipasang. Hanya login, booking POST, track, Snap, dan gateway yang dibatasi. `/services`, `/testimonials`, `/settings/public`, `/technicians`, dan `/bookings/availability` tanpa batas.                                                                | Kirim 500–1.000 GET beruntun ke `/api/services` dan `/api/bookings/availability?date=…`.                                                                                | **Aktual:** semua 200; tidak ada 429. **Harapan:** 429 setelah ambang wajar.                                                                                                        | Middleware tidak di-wire di `routes.ts`/`app.ts`.                                                                         |
| **SEC-05**   | API                | **Medium** | `requireAuth` memverifikasi signature lalu mempercayai `role` dan `sub` dari JWT. Tidak ada query DB untuk `isActive` atau role terbaru. Admin yang dinonaktifkan/diturunkan tetap bisa mengakses `/api/admin` sampai access token (15 menit) kedaluwarsa.                                                            | 1) Login admin. 2) Set `isActive=false` atau ubah role di DB. 3) Panggil `/api/admin/dashboard` dengan cookie lama.                                                     | **Aktual:** 200. **Harapan:** 401/403 segera, atau mekanisme token version/revocation.                                                                                              | Otorisasi stateless; tidak ada pengecekan sesi per request.                                                               |
| **SEC-06**   | Config             | **Medium** | `app.set('trust proxy', 1)`. Jika API dapat dijangkau langsung (port 4000), klien dapat mengirim `X-Forwarded-For` palsu dan memecah hitungan rate limit per IP.                                                                                                                                                      | Kirim 9 percobaan login dengan nilai `X-Forwarded-For` berbeda.                                                                                                         | **Aktual:** limit dihitung per IP palsu; brute force tidak terblokir. **Harapan:** hanya percaya proxy/CIDR yang dikenal; API tidak diekspos langsung.                              | Trust hop-count, bukan allowlist alamat proxy.                                                                            |
| **BOOK-04**  | UI / Logic         | **Medium** | Fetch ketersediaan tidak memakai `AbortController` atau penanda urutan request. Jika pengguna mengganti tanggal cepat, respons lama dapat menimpa respons baru, sehingga slot tanggal A tampil di bawah tanggal B. Slot juga dapat terkirim bersama tanggal yang berbeda.                                             | 1) Throttle network. 2) Klik tanggal A lalu B cepat. 3) Buat respons A selesai terakhir. 4) Periksa slot dan payload submit.                                            | **Aktual:** data slot tidak sinkron dengan tanggal terpilih. **Harapan:** hanya respons terakhir yang boleh mengubah state.                                                         | Race condition async di `BookingFlow` dan `QuickBooking`; tidak ada request sequence/cancellation.                        |
| **BOOK-05**  | Logic / UI         | **Medium** | Checkbox persetujuan hanya divalidasi di client dan tidak dikirim ke API; database tidak menyimpan bukti consent (versi/waktu). Kebijakan privasi menjadikan persetujuan sebagai dasar pemrosesan.                                                                                                                    | 1) Submit booking dengan checkbox tercentang. 2) Inspeksi payload POST dan record `Booking`/`Customer`.                                                                 | **Aktual:** tidak ada jejak consent. **Harapan:** simpan `consentVersion`, `consentedAt`, dan teks kebijakan yang disetujui.                                                        | Validasi UI-only; schema API tidak memiliki field consent.                                                                |
| **BOOK-06**  | API / Logic        | **Medium** | `updatePayment` mengizinkan transisi `PAID → UNPAID` atau `PAID → FAILED` dan mengosongkan `paidAt`. UI admin menawarkan opsi tersebut untuk pesanan yang sudah lunas.                                                                                                                                                | 1) Tandai pesanan `PAID`. 2) Ubah status pembayaran menjadi `UNPAID`. 3) Cek `paidAt`, revenue KPI, dan audit log.                                                      | **Aktual:** pembayaran hilang dari laporan; `paidAt` null. **Harapan:** `PAID` terminal kecuali `REFUNDED`; koreksi hanya lewat alur khusus dengan alasan.                          | Tidak ada state machine untuk status pembayaran.                                                                          |
| **BOOK-07**  | API / Logic        | **Medium** | `updateStatus` membaca booking di luar transaksi; `assignTechnician` memeriksa kapasitas dan bentrok slot di luar transaksi. Dua request paralel dapat sama-sama lolos validasi.                                                                                                                                      | Kirim dua PATCH status/assign bersamaan untuk booking/teknisi yang sama.                                                                                                | **Aktual:** keduanya sukses; riwayat ganda dan/atau teknisi melebihi kapasitas. **Harapan:** satu sukses, satu 409.                                                                 | Check-then-act di luar transaksi; tidak ada row lock/conditional update.                                                  |
| **BOOK-08**  | API / Logic        | **Medium** | Pemeriksaan bentrok teknisi hanya membandingkan `slotLabel`, bukan durasi. Varian 180 menit pada slot 08.00–10.00 juga menempati 10.00–12.00, tetapi dianggap tidak bentrok.                                                                                                                                          | 1) Assign teknisi ke booking 08.00 dengan varian berdurasi 180 menit. 2) Assign teknisi yang sama ke booking 10.00 pada tanggal yang sama.                              | **Aktual:** keduanya diterima. **Harapan:** tolak berdasarkan interval `[scheduledAt, scheduledAt + durationMinutes)`.                                                              | Slot id dipakai sebagai proksi overlap; durasi layanan diabaikan.                                                         |
| **BOOK-09**  | API / Privacy      | **Medium** | Pelacakan hanya dengan kode mengembalikan total, kota, kecamatan, layanan, varian, status pembayaran, dan nama depan teknisi. Kode `GCC-YYMMDD-XXXX` memiliki ruang ~1.048.576 kombinasi/hari; `trackLimiter` 20 per 15 menit per IP. Kebijakan privasi hanya menyebut masking nama/telepon dan penyembunyian alamat. | `GET /api/bookings/track/GCC-…` tanpa parameter `phone`; inspeksi JSON.                                                                                                 | **Aktual:** field operasional dan nominal terekspos. **Harapan:** tampilkan status/jadwal minimum sampai nomor terverifikasi, atau gunakan tautan bertanda tangan.                  | Response tidak diminimalkan; entropy kode relatif rendah terhadap data yang diekspos; limit per IP mudah didistribusikan. |
| **BOOK-13**  | API / Logic        | **Medium** | Tidak ada idempotency key atau deteksi duplikat pada `POST /bookings`. Retry jaringan atau double submit dapat membuat dua pesanan dengan kode berbeda untuk customer, layanan, tanggal, dan slot yang sama.                                                                                                          | Kirim payload booking yang identik dua kali berurutan/paralel.                                                                                                          | **Aktual:** dua booking dibuat; kapasitas slot berkurang dua. **Harapan:** satu booking, atau 409 dengan kode yang sama.                                                            | Tidak ada idempotency key/unique constraint jangka pendek.                                                                |
| **SET-03**   | UI                 | **Medium** | Halaman kontak memberi label “WhatsApp” tetapi menampilkan `business.phone`, sementara tautannya memakai `business.whatsapp`. `ContactForm`, `Header`, dan `Footer` memakai nomor hardcoded dari `lib/site.ts`, bukan settings. `NEXT_PUBLIC_WHATSAPP_NUMBER` tidak pernah dibaca kode.                               | 1) Ubah `whatsapp` di admin menjadi nomor berbeda. 2) Buka `/kontak`, klik WhatsApp, lalu submit `ContactForm`. 3) Periksa nomor tujuan.                                | **Aktual:** label dan tujuan bisa berbeda; form tetap memakai nomor lama. **Harapan:** satu sumber nomor yang konsisten di semua kanal.                                             | Settings tidak dipakai konsisten; env terdokumentasi tetapi mati.                                                         |
| **ADMIN-01** | Logic / UI         | **Medium** | Penyimpanan harga layanan menyimpan harga dasar lebih dulu, lalu setiap varian satu per satu dalam loop. Jika satu varian gagal, sebagian harga sudah berubah dan UI hanya menampilkan error.                                                                                                                         | 1) Buka editor harga layanan dengan ≥2 varian. 2) Ubah harga dasar dan semua varian. 3) Buat satu request varian gagal (mis. putuskan koneksi setelah request pertama). | **Aktual:** harga dasar/varian pertama tersimpan, sisanya tidak. **Harapan:** satu transaksi atomik atau rollback.                                                                  | Tidak ada batch transaction di API/UI; urutan PATCH non-atomik.                                                           |
| **ADMIN-02** | UI / Logic         | **Medium** | Dashboard, daftar booking, testimoni, dan inventori otomatis jatuh ke data demo saat API error. Notice sumber ada, tetapi KPI tetap terlihat seperti data nyata; aksi pada baris demo disimulasikan dan dapat disangka berhasil.                                                                                      | 1) Login admin. 2) Matikan API. 3) Buka dashboard, daftar booking, lalu detail booking ber-ID `bk-…`; ubah status.                                                      | **Aktual:** KPI/booking fiktif tampil; aksi “berhasil” tanpa menyentuh database. **Harapan:** error state dengan tombol retry; simulasi hanya saat `DEMO_MODE`.                     | Fallback otomatis pada error; `localMode` diturunkan dari prefix ID.                                                      |
| **ADMIN-06** | API / Logic        | **Medium** | Delta `ADJUSTMENT` dihitung dari item yang dibaca di luar transaksi. Dua adjustment bersamaan dapat menulis `delta` yang tidak sesuai dengan perubahan stok sebenarnya.                                                                                                                                               | Kirim dua adjustment paralel pada item yang sama dengan target berbeda.                                                                                                 | **Aktual:** stok akhir benar/salah tergantung urutan, tetapi `StockMovement.quantity` bisa tidak konsisten. **Harapan:** hitung delta di dalam transaksi dengan row lock.           | Read-then-write di luar transaksi.                                                                                        |
| **AUTH-01**  | API / Logic        | **Medium** | Rotasi refresh token tidak mentoleransi request paralel. Dua tab yang memakai refresh token sama: tab pertama merotasi, tab kedua melihat hash lama lalu mencabut **semua** sesi pengguna.                                                                                                                            | 1) Login di dua tab. 2) Tunggu access token kedaluwarsa. 3) Picu request bersamaan di kedua tab.                                                                        | **Aktual:** kedua tab ter-logout. **Harapan:** grace window/rotation family; hanya token yang benar-benar diputar ulang yang dicurigai.                                             | Reuse detection terlalu agresif; single-flight hanya berlaku dalam satu tab.                                              |
| **CFG-03**   | Config             | **Medium** | `.env.example` menetapkan `NEXT_PUBLIC_DEMO_MODE=1` (tidak aman untuk produksi) dan mendokumentasikan `NEXT_PUBLIC_WHATSAPP_NUMBER` yang tidak dibaca kode. Menyalin contoh ke produksi akan mengaktifkan login demo dan booking palsu.                                                                               | 1) Salin `.env.example` ke `.env.local`. 2) Build. 3) Login dengan kredensial demo. 4) Ubah `NEXT_PUBLIC_WHATSAPP_NUMBER`; lihat header.                                | **Aktual:** mode demo aktif; nomor tidak berubah. **Harapan:** default aman (`0`) dan env benar-benar dipakai.                                                                      | Template env tidak production-safe; key mati.                                                                             |
| **CFG-04**   | Config             | **Medium** | `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` hanya diwajibkan ≥16 karakter. Pengecekan produksi hanya menolak string yang mengandung `dev-` atau `change-me`; secret 16 karakter lemah tetap lolos.                                                                                                                       | Set secret 16 karakter acak rendah entropy, jalankan produksi.                                                                                                          | **Aktual:** aplikasi boot. **Harapan:** minimal 32 byte acak (64 hex) dan validasi entropy/panjang.                                                                                 | Validasi env terlalu longgar.                                                                                             |
| **DATA-01**  | Logic / Compliance | **Medium** | Kebijakan privasi menjanjikan penyimpanan maksimal 24 bulan lalu penghapusan/anonymization. Tidak ada job retensi, cron, atau mekanisme purge di kode.                                                                                                                                                                | Cari job/cron di repo; tidak ditemukan. Periksa data lama di DB.                                                                                                        | **Aktual:** data disimpan tanpa batas. **Harapan:** job retensi terjadwal + prosedur terdokumentasi.                                                                                | Kebijakan ditulis mendahului implementasi.                                                                                |
| **SEO-01**   | Config / SEO       | **Medium** | `sitemap.ts` memakai `SERVICE_AREAS` hardcoded dan `loadCatalogue()` yang bisa fallback ke demo. Layanan yang ditambahkan lewat API tidak masuk `generateStaticParams`; jika API gagal saat revalidate, halaman layanan nyata dapat 404 dan sitemap memuat URL demo.                                                  | 1) Tambah layanan baru via API. 2) Periksa `/sitemap.xml` dan akses `/layanan/<slug-baru>` saat API mati.                                                               | **Aktual:** sitemap/area tidak mengikuti settings; halaman baru bergantung pada ISR dan ketersediaan API. **Harapan:** sitemap dari DB, area dari settings, halaman baru konsisten. | Sumber data ganda (statis vs API) dan fallback fail-open.                                                                 |

### 3.4 Low

| ID           | Kategori       | Severity | Deskripsi                                                                                                                                                                                                                                             | Langkah Reproduksi                                                                                | Aktual vs Harapan                                                                                                                       | Root Cause                                         |
| ------------ | -------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **SEC-07**   | API            | **Low**  | `DUMMY_PASSWORD_HASH` memakai bcrypt cost 10, sedangkan password nyata cost 12. Login dengan email tidak dikenal lebih cepat daripada password salah, memungkinkan enumerasi akun berbasis timing.                                                    | Ukur waktu respons login untuk email tidak dikenal vs email dikenal + password salah, ulangi 50×. | **Aktual:** selisih waktu signifikan. **Harapan:** cost sama (12) atau delay seragam.                                                   | Hash dummy tidak disamakan cost-nya.               |
| **SEC-08**   | API            | **Low**  | `/auth/refresh` dan `/auth/logout` tidak memiliki rate limit, padahal keduanya melakukan query/update database.                                                                                                                                       | Kirim ribuan request refresh tanpa cookie.                                                        | **Aktual:** semua diproses. **Harapan:** limit longgar tetapi ada.                                                                      | Limiter hanya dipasang di login.                   |
| **SEC-09**   | API            | **Low**  | Sesi kedaluwarsa/dicabut tidak pernah dibersihkan dari tabel `Session`.                                                                                                                                                                               | Periksa jumlah baris `Session` setelah beberapa bulan.                                            | **Aktual:** baris menumpuk. **Harapan:** job purge berkala.                                                                             | Tidak ada maintenance job.                         |
| **BOOK-10**  | API            | **Low**  | Pembuatan kode booking melakukan cek unik di luar transaksi. Tabrakan sangat jarang, tetapi jika terjadi, `P2002` dipetakan menjadi 409 “sudah ada” alih-alih retry.                                                                                  | Paksa `createUniqueBookingCode` mengembalikan kode yang sudah ada (uji unit), lalu submit.        | **Aktual:** 409 membingungkan. **Harapan:** retry kode baru.                                                                            | Hanya `P2034` yang di-retry.                       |
| **BOOK-11**  | API            | **Low**  | `/bookings/availability` menerima tanggal berapa pun yang formatnya valid, termasuk >60 hari. Slot tampil tersedia, tetapi pembuatan booking kemudian ditolak.                                                                                        | `GET /api/bookings/availability?date=<hari+90>`.                                                  | **Aktual:** slot “tersedia”. **Harapan:** tanggal di luar window ditolak/ditandai.                                                      | Validasi batas atas hanya di `createBooking`.      |
| **BOOK-12**  | UI             | **Low**  | `TrackBooking` memeriksa `findDemoBooking()` sebelum cek `DEMO_MODE`. Booking yang ditulis ke `sessionStorage` dapat dibuka tanpa verifikasi telepon, bahkan saat mode demo mati.                                                                     | Buat entri `gcc:demo-bookings` manual di sessionStorage, lalu lacak kodenya.                      | **Aktual:** data lengkap tampil tanpa telepon. **Harapan:** lookup demo hanya saat `DEMO_MODE`.                                         | Urutan pengecekan terbalik.                        |
| **SET-04**   | UI             | **Low**  | Footer memakai `demoServices` hardcoded untuk tautan layanan. Layanan baru tidak muncul; layanan yang dihapus tetap tertaut dan berujung 404.                                                                                                         | Tambah/hapus layanan via API, lalu lihat footer.                                                  | **Aktual:** daftar footer statis. **Harapan:** daftar dari katalog aktual.                                                              | Konten hardcoded.                                  |
| **ADMIN-03** | UI             | **Low**  | Aksi publish/feature/delete testimoni memperbarui state lokal secara optimistis dan tidak memakai respons server. Jika server menolak, UI tetap tampak berhasil sampai reload.                                                                        | Paksa PATCH gagal (401/500), lakukan publish.                                                     | **Aktual:** badge berubah di UI, data server tidak. **Harapan:** rollback + pesan error.                                                | State lokal tidak direkonsiliasi.                  |
| **ADMIN-04** | UI / Logic     | **Low**  | Total “Nilai pesanan” pada grafik menjumlahkan `trend[].revenue`, yang hanya mencakup booking **yang dibuat** dalam rentang dan dibayar dalam rentang. Booking lama yang dibayar hari ini masuk KPI “Pendapatan bulan ini” tetapi tidak masuk grafik. | Bandingkan KPI pendapatan dengan total grafik setelah membayar booking lama.                      | **Aktual:** angka tidak cocok. **Harapan:** definisi metrik konsisten dan diberi label.                                                 | Query trend memfilter `createdAt`, bukan `paidAt`. |
| **ADMIN-05** | UI             | **Low**  | API mendukung CRUD layanan, kategori, varian, dan reaktivasi teknisi (`isActive`), tetapi UI admin tidak menyediakannya. Tidak ada UI untuk mengedit inventori atau mengelola FAQ/area.                                                               | Buka `/admin/services` dan `/admin/technicians`; cari tombol tambah/edit/hapus/reactivate.        | **Aktual:** hanya edit harga/toggle aktif dan buat teknisi. **Harapan:** UI lengkap atau dokumentasi bahwa operasi dilakukan via API.   | Gap fitur, bukan regresi.                          |
| **UI-01**    | UI             | **Low**  | QuickBooking membatasi unit maksimal 10, sedangkan BookingFlow maksimal 20. Tautan membawa `units`, tetapi pengguna yang mulai dari quick booking mendapat batas lebih rendah.                                                                        | Dari beranda, pilih 10 unit; lanjut ke `/booking`; coba 20.                                       | **Aktual:** batas tidak konsisten. **Harapan:** satu konstanta batas.                                                                   | Duplikasi aturan validasi di dua komponen.         |
| **UI-02**    | UI             | **Low**  | `autoAdvanced` pada QuickBooking tidak pernah di-reset. Setelah sekali pindah dari tanggal pertama ke tanggal kedua, memilih kembali tanggal pertama yang penuh tidak memicu auto-advance lagi.                                                       | Kosongkan slot tanggal 0, biarkan auto-advance; pilih lagi tanggal 0.                             | **Aktual:** tidak pindah otomatis. **Harapan:** perilaku konsisten.                                                                     | Ref guard global, bukan per transisi.              |
| **UI-03**    | UI             | **Low**  | Halaman layanan memakai ISR 300 detik dan tidak ada revalidasi on-demand setelah admin mengubah harga. Harga publik dapat tertinggal hingga 5 menit.                                                                                                  | Ubah harga di admin, refresh `/layanan` segera.                                                   | **Aktual:** harga lama. **Harapan:** revalidate tag/path setelah update.                                                                | Tidak ada `revalidatePath`/tag.                    |
| **UI-04**    | UI / Responsif | **Low**  | Tabel admin booking dan inventori memakai `min-w-[54rem]`/`min-w-[48rem]` di dalam `overflow-x-auto`. Di layar 360–768 px, pengguna harus scroll horizontal untuk melihat kolom penting.                                                              | Buka `/admin/bookings` pada viewport 360 px.                                                      | **Aktual:** tabel melebar dan scroll horizontal (belum diverifikasi visual). **Harapan:** kartu ringkas atau kolom prioritas di mobile. | Layout tabel desktop dipertahankan di mobile.      |

### 3.5 Ringkasan jumlah temuan

| Severity  | Jumlah |
| --------- | ------ |
| Critical  | 1      |
| High      | 8      |
| Medium    | 20     |
| Low       | 14     |
| **Total** | **43** |

---

## 4. Rekomendasi Strategis

### 4.1 P0 — sebelum go-live (1–2 minggu)

1. **Fail-closed untuk pembayaran.** Tolak boot atau nonaktifkan route notifikasi jika `MIDTRANS_SERVER_KEY` kosong. Validasi juga `MIDTRANS_CLIENT_KEY` dan `MIDTRANS_IS_PRODUCTION`. Tambahkan health check konfigurasi dan test signature dengan sandbox.
2. **Hapus “success palsu”.** Pisahkan mode demo dari fallback error. Jika katalog tidak dapat dimuat, tampilkan error dan CTA WhatsApp; jangan membuat kode booking lokal saat `DEMO_MODE=0`. Ubah notice sukses agar tidak menyuruh mematikan flag yang sudah mati.
3. **Jadikan settings satu-satunya sumber konten.** Ganti `CONTACT`, `SERVICE_AREAS`, dan `FAQS` hardcoded dengan data dari settings/DB. Jika FAQ/area belum bisa dikelola, hapus klaim di UI admin. Tambahkan revalidasi setelah update.
4. **Amankan sesi.** Aktifkan `SameSite=Lax` untuk deployment same-origin; sediakan `/api` reverse proxy. Jika benar-benar lintas site, tambahkan CSRF token + pemeriksaan Origin dan uji di Safari/incognito.
5. **Amankan seed.** Tolak seed saat `NODE_ENV=production`; buat perintah `create-admin` terpisah; paksa ganti password; tandai testimoni demo dengan `isDemo`/`isPublished=false`.
6. **Perbaiki parameter booking.** Validasi `service`, `date`, `slot`, `variant`, dan `units` terhadap katalog/window; mulai dari langkah yang tepat; jangan pernah mengganti diam-diam ke layanan pertama.

### 4.2 P1 — sprint berikutnya

7. **State machine pembayaran.** `PAID` terminal kecuali `REFUNDED`; koreksi hanya lewat alur khusus dengan alasan dan audit.
8. **Transaksi untuk transisi status/assign.** Bungkus baca-validasi-tulis dalam satu transaksi dengan row lock atau conditional update. Hitung overlap berdasarkan durasi, bukan slot.
9. **Idempotensi booking.** Terima `Idempotency-Key` atau deteksi duplikat (customer + layanan + slot dalam window singkat); kembalikan booking yang sama.
10. **Rate limit menyeluruh.** Pasang `publicLimiter` di semua route publik; pertimbangkan limit terpisah untuk availability dan testimonial submit.
11. **Consent ledger.** Simpan versi kebijakan, timestamp, dan IP/UA persetujuan; selaraskan dengan kebijakan privasi.
12. **Retensi data.** Implementasikan job pembersihan/anonymization 24 bulan; dokumentasikan backup dan penghapusan.
13. **Perbaiki observability.** Request ID, log JSON, error tracking (Sentry), metrik p95, alert untuk 5xx/latency/DB down.
14. **Lengkapi admin.** CRUD layanan/kategori/varian, reaktivasi teknisi, edit inventori, pengelolaan FAQ/area, dan preview dampak perubahan.

### 4.3 P2 — kualitas jangka panjang

15. **Testing pyramid.** Unit test untuk pricing/phone/slot/state machine; integration test API dengan PostgreSQL sementara; E2E Playwright untuk booking, tracking, login, admin, payment callback; contract test Postman/Newman.
16. **CI gate.** Jalankan `typecheck`, `lint`, `build`, `prisma migrate diff`, dan test pada setiap PR. Tambahkan smoke test setelah deploy.
17. **Visual regression.** Playwright screenshot pada 360/768/1440 untuk halaman publik dan admin; ambang diff eksplisit.
18. **Performance budget.** Lighthouse CI, ukuran bundle, p95 API, query plan Prisma untuk dashboard/booking.
19. **SEO dari DB.** Sitemap dinamis dari layanan/area aktual, canonical per environment, `noindex` untuk preview, dan structured data yang konsisten dengan settings.
20. **Runbook operasional.** Prosedur rotasi secret, rollback migrasi, restore backup, penanganan payment dispute, dan prosedur verifikasi manual jika gateway down.

---

## 5. Checkpoint Konfigurasi Sebelum Deployment

Tandai setiap item sebelum produksi. Item **P0** adalah blocker.

### 5.1 Secret dan environment — P0

- [ ] `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` diganti dengan 32 byte acak (64 hex), bukan 16 karakter.
- [ ] `DATABASE_URL` produksi memakai user khusus aplikasi, bukan `postgres`, dan password kuat.
- [ ] `.env`, `.env.local`, dan seluruh `*.local` tidak masuk repository; hanya `.env.example`.
- [ ] `NODE_ENV=production` dan `WEB_ORIGIN` berisi origin web produksi **tanpa** trailing slash.
- [ ] `NEXT_PUBLIC_DEMO_MODE=0`.
- [ ] `NEXT_PUBLIC_SITE_URL` dan `NEXT_PUBLIC_API_URL` HTTPS; diisi **saat build** karena di-inline.
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` dihapus dari dokumentasi atau benar-benar dipakai kode.

### 5.2 Midtrans dan WhatsApp — P0

- [ ] `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` diisi; `MIDTRANS_IS_PRODUCTION=true` hanya untuk produksi.
- [ ] Route notifikasi dinonaktifkan/ditolak saat key kosong.
- [ ] URL notifikasi di dashboard Midtrans mengarah ke `https://<domain>/api/payments/midtrans/notification`.
- [ ] Uji signature sandbox, nominal tidak cocok, order tidak dikenal, dan replay.
- [ ] `WHATSAPP_PROVIDER` bukan `mock`; token valid; uji pesan ke customer dan admin.
- [ ] `ADMIN_WHATSAPP` berisi nomor operasional nyata.

### 5.3 Domain, cookie, dan CORS — P0

- [ ] Putuskan topologi: **same-origin** `/api` (disarankan) atau subdomain API.
- [ ] Jika same-origin: `SameSite=Lax`, tanpa `COOKIE_DOMAIN`.
- [ ] Jika lintas site: `SameSite=None; Secure`, `COOKIE_DOMAIN` benar, CSRF token/Origin check aktif, dan uji Safari/Chrome incognito.
- [ ] `WEB_ORIGIN` hanya origin produksi; hapus localhost dari allowlist produksi.
- [ ] API tidak dapat dijangkau langsung dari internet; hanya lewat reverse proxy.
- [ ] `trust proxy` dikonfigurasi sesuai alamat proxy, bukan asumsi hop count.

### 5.4 Konten dan seed — P0

- [ ] Seed **tidak** dijalankan pada database produksi.
- [ ] Admin dibuat lewat prosedur aman; password default `Admin#12345` tidak valid.
- [ ] Password teknisi default `Teknisi#12345` tidak valid.
- [ ] Rekening bank di settings bukan `0000000000`; nama pemilik benar.
- [ ] Nomor telepon/WhatsApp/email/alamat sesuai bisnis nyata.
- [ ] Area layanan dan FAQ sesuai cakupan nyata.
- [ ] Testimoni fiktif dihapus atau ditandai `isPublished=false`; hanya testimoni terverifikasi yang tayang.

### 5.5 Build, database, dan rilis — P0

- [ ] `npm run build` (API + web) sukses tanpa error TypeScript.
- [ ] `npm --workspace @gcc/api run typecheck` dan `npm --workspace @gcc/web run typecheck` sukses.
- [ ] `npm run lint` sukses.
- [ ] `npm --workspace @gcc/api run db:deploy` dijalankan di staging, lalu produksi.
- [ ] Backup database sebelum migrasi; uji restore.
- [ ] `GET /api/health` mengembalikan 200 dan `database: "up"`.
- [ ] Build produksi diuji, bukan hanya `next dev`/Turbopack.
- [ ] Rollback image/commit dan rollback migrasi tersedia.

### 5.6 Header dan infrastruktur — P1

- [ ] CSP dengan nonce/hash; uji tidak memblokir Next.js, font, dan WhatsApp link.
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] `Cross-Origin-Opener-Policy: same-origin`; `Cross-Origin-Embedder-Policy` bila kompatibel.
- [ ] TLS valid, redirect HTTP→HTTPS, HSTS tidak dipasang sebelum yakin.
- [ ] `X-Frame-Options`/`frame-ancestors` konsisten.

### 5.7 Operasional — P1

- [ ] Rate limit publik aktif dan diuji dari IP berbeda.
- [ ] Log terpusat, request ID, alert 5xx/latency/DB.
- [ ] Job retensi data dan backup terjadwal.
- [ ] Monitoring uptime untuk web, API, dan health check.
- [ ] Prosedur insiden: rotasi secret, cabut sesi, nonaktifkan akun, refund.

---

## 6. Rencana Verifikasi Runtime yang Belum Dijalankan

Jalankan di staging dengan database berisi data uji (bukan produksi).

### 6.1 Perintah build dan kualitas

```bash
npm install
npm --workspace @gcc/api run db:generate
npm --workspace @gcc/api run typecheck
npm --workspace @gcc/web run typecheck
npm run lint
npm run build
```

### 6.2 Smoke test API

```bash
curl -i http://localhost:4000/api/health
curl -i http://localhost:4000/api/services
curl -i "http://localhost:4000/api/bookings/availability?date=$(date +%F)"
```

Yang diperiksa: status code, envelope `success/data`, `Cache-Control`, waktu respons, dan tidak ada stack trace.

### 6.3 Skenario manual wajib

1. **Booking happy path** — pilih layanan/varian, tanggal, slot, isi alamat, submit; cek kode di admin dan database.
2. **Slot penuh** — isi kapasitas `SLOT_CAPACITY`, coba booking ke-4; harus 409 dan UI menampilkan pesan.
3. **Tanggal lewat / slot sudah mulai** — harus ditolak konsisten di UI dan API.
4. **API mati/timeout** — matikan API; booking harus gagal eksplisit, bukan sukses palsu.
5. **URL booking tidak valid** — service/date/slot palsu; harus kembali ke langkah awal dengan pesan.
6. **Pelacakan** — kode saja (masked), kode + telepon salah (404), kode + telepon benar (data lengkap).
7. **Login admin** — kredensial benar/salah, akun teknisi ditolak, refresh dua tab.
8. **Ubah status** — semua transisi valid/invalid; cek riwayat dan notifikasi.
9. **Assign teknisi** — kapasitas penuh, bentrok slot, durasi lintas slot, teknisi nonaktif.
10. **Pembayaran** — PAID, REFUNDED, notifikasi Midtrans valid/invalid, nominal salah, replay.
11. **Pengaturan admin** — ubah kontak/area; verifikasi header, footer, beranda, area, kontak, sitemap.
12. **Inventori** — IN/OUT/ADJUSTMENT, stok negatif, dua adjustment paralel.
13. **Testimoni** — submit dari booking COMPLETED, moderasi, publish/feature/delete.
14. **Double submit booking** — klik dua kali/retry; harus satu pesanan.

### 6.4 Matriks browser dan viewport

| Halaman                | 360 px | 768 px | 1440 px | Catatan                          |
| ---------------------- | ------ | ------ | ------- | -------------------------------- |
| Beranda                | ☐      | ☐      | ☐       | Hero, area, FAQ, testimoni       |
| `/layanan` + detail    | ☐      | ☐      | ☐       | Tabel harga, CTA                 |
| `/booking`             | ☐      | ☐      | ☐       | 4 langkah, sticky summary, error |
| `/lacak`               | ☐      | ☐      | ☐       | Masked/unlocked                  |
| `/kontak`              | ☐      | ☐      | ☐       | WhatsApp, rekening, form         |
| `/area` + detail       | ☐      | ☐      | ☐       | Daftar area                      |
| `/admin`               | ☐      | ☐      | ☐       | KPI, grafik, tabel               |
| `/admin/bookings`      | ☐      | ☐      | ☐       | Tabel horizontal, filter         |
| `/admin/bookings/[id]` | ☐      | ☐      | ☐       | Panel aksi                       |
| `/admin/settings`      | ☐      | ☐      | ☐       | Form panjang                     |

Ulangi minimal di Chrome, Firefox, Safari (iOS), dan Edge.

### 6.5 Aksesibilitas

- Navigasi keyboard penuh pada header, form booking, modal menu, dan panel admin.
- Fokus terlihat; `aria-invalid`/`aria-describedby` pada error.
- Kontras teks `text-muted` di atas `bone`/`paper` memenuhi WCAG AA.
- `aria-live` untuk hasil submit dan error async.
- Uji `prefers-reduced-motion`.

---

## 7. Lampiran: Berkas Kunci yang Diaudit

**Backend**

- `apps/api/src/app.ts`, `routes.ts`, `config/env.ts`
- `apps/api/src/middleware/auth.ts`, `rate-limit.ts`, `validate.ts`, `error.ts`
- `apps/api/src/modules/auth/*`
- `apps/api/src/modules/bookings/*`
- `apps/api/src/modules/payments/*`, `integrations/midtrans.ts`
- `apps/api/src/modules/technicians/*`, `inventory/*`, `dashboard/*`, `settings/*`, `services/*`, `testimonials/*`
- `apps/api/src/lib/{jwt,codes,slots,status,audit,http,errors}.ts`
- `apps/api/prisma/schema.prisma`, `prisma/seed.ts`
- `apps/api/.env`, `.env.example`

**Frontend**

- `apps/web/next.config.mjs`, `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`
- `apps/web/lib/{api,content,site,format,admin-auth,demo-data,demo-store,types}.ts`
- `apps/web/app/(site)/**`
- `apps/web/app/admin/(dashboard)/**`
- `apps/web/components/site/{Header,Footer,ContactForm}.tsx`
- `apps/web/components/booking/{BookingFlow,QuickBooking,TrackBooking}.tsx`
- `apps/web/components/admin/{AdminShell,AdminUI,LoginForm}.tsx`

**Dokumentasi**

- `README.md`, `docs/{API,ARCHITECTURE,DEPLOYMENT,INTEGRATIONS,SEO}.md`, `database/ERD.md`

---

## 8. Penutup

Audit ini menemukan **43 temuan**: 1 Critical, 8 High, 20 Medium, dan 14 Low. Fondasi teknisnya layak dikembangkan, tetapi perilaku fail-open pada data publik, konfigurasi pembayaran, dan pengelolaan konten harus diperbaiki sebelum situs menerima pesanan nyata. Setelah P0 ditutup, lakukan verifikasi runtime di §6 dan ulangi audit ini pada build produksi—bukan pada mode dev.
