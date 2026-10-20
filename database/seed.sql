-- ─────────────────────────────────────────────────────────────
-- GCC Web — sample data
--
-- Run AFTER database/schema.sql:
--   psql -d gcc_web -f database/seed.sql
--
-- All names, phone numbers, reviews and bank details are
-- placeholders for design review. Change them before launch.
--
-- Requires pgcrypto for gen_random_uuid() and bcrypt crypt().
-- Admin password : Admin#12345
-- Teknisi password: Teknisi#12345
-- ─────────────────────────────────────────────────────────────

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────── Accounts ───────────────────────────

INSERT INTO "User" (
  "id", "name", "email", "phone", "passwordHash", "role", "isActive", "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'GCC Admin',
  'admin@gcc-web.id',
  '6281200000001',
  crypt('Admin#12345', gen_salt('bf', 12)),
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Technician users + profiles
WITH techs(name, email, phone, zone, specialties, capacity, available) AS (
  VALUES
    (
      'Budi Santoso',
      'budi@gcc-web.id',
      '6281200000002',
      'Jakarta Selatan · Kebayoran, Cilandak, Pasar Minggu',
      ARRAY['Cuci AC', 'Isi freon', 'Bongkar pasang AC']::TEXT[],
      4,
      true
    ),
    (
      'Rizky Pratama',
      'rizky@gcc-web.id',
      '6281200000003',
      'Jakarta Pusat · Menteng, Tanah Abang, Kemayoran',
      ARRAY['Kulkas', 'Mesin cuci', 'Freon R32 & R410A']::TEXT[],
      3,
      true
    ),
    (
      'Dedi Kurniawan',
      'dedi@gcc-web.id',
      '6281200000004',
      'Depok · Beji, Margonda, Cinere',
      ARRAY['AC', 'TV LED', 'Instalasi listrik rumah']::TEXT[],
      4,
      true
    ),
    (
      'Agus Setiawan',
      'agus@gcc-web.id',
      '6281200000005',
      'Tangerang Selatan · BSD, Bintaro, Pamulang',
      ARRAY['AC cassette', 'Kulkas dua pintu', 'Mesin cuci front loading']::TEXT[],
      3,
      false
    )
),
inserted_users AS (
  INSERT INTO "User" (
    "id", "name", "email", "phone", "passwordHash", "role", "isActive", "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid()::text,
    techs.name,
    techs.email,
    techs.phone,
    crypt('Teknisi#12345', gen_salt('bf', 12)),
    'TECHNICIAN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM techs
  ON CONFLICT ("email") DO NOTHING
  RETURNING "id", "email"
)
INSERT INTO "TechnicianProfile" (
  "id", "userId", "zone", "specialties", "capacityPerDay", "isAvailable", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  u."id",
  techs.zone,
  techs.specialties,
  techs.capacity,
  techs.available,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM inserted_users u
JOIN techs ON techs.email = u.email
ON CONFLICT ("userId") DO NOTHING;

-- ─────────────────────────── Catalogue ───────────────────────────

INSERT INTO "ServiceCategory" (
  "id", "slug", "name", "description", "sortOrder", "isActive", "createdAt", "updatedAt"
)
VALUES
  (
    gen_random_uuid()::text,
    'servis-ac',
    'Servis & Perawatan AC',
    'Cuci AC, isi freon, dan bongkar pasang untuk AC split, cassette, dan floor standing.',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'elektronik-rumah',
    'Elektronik Rumah',
    'Perbaikan kulkas, mesin cuci, dan TV dengan pemeriksaan di tempat dan garansi pekerjaan.',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Service" (
  "id", "categoryId", "slug", "name", "shortDescription", "description",
  "basePrice", "unit", "durationMinutes", "warrantyDays", "isActive", "isFeatured",
  "sortOrder", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  c."id",
  v.slug,
  v.name,
  v.short_description,
  v.description,
  v.base_price,
  v.unit::"ServiceUnit",
  v.duration,
  v.warranty,
  true,
  true,
  v.sort_order,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ServiceCategory" c
JOIN (
  VALUES
    (
      'servis-ac',
      'cuci-ac',
      'Cuci AC',
      'Pembersihan indoor dan outdoor, cek tekanan freon, dan uji aliran udara setelah servis.',
      'Udara AC yang tidak dingin sering kali bukan karena freon habis, melainkan karena debu yang menumpuk di evaporator, blower, dan filter. Teknisi kami membongkar unit indoor, mencuci evaporator dan blower, membersihkan saluran pembuangan, mengecek tekanan freon, lalu menguji suhu keluaran. Pekerjaan dilakukan dengan penutup lantai dan kain pelindung agar ruangan tetap bersih. Setiap servis mendapat garansi kebersihan dan fungsi selama 7 hari.',
      75000,
      'UNIT',
      60,
      7,
      1
    ),
    (
      'servis-ac',
      'isi-freon-ac',
      'Isi Freon AC',
      'Pengisian freon sesuai jenis refrigeran unit, didahului deteksi kebocoran.',
      'Pengisian freon tanpa pemeriksaan kebocoran hanya menyelesaikan gejala. Teknisi kami mengukur tekanan kerja, memeriksa sambungan dan pipa, lalu mengisi refrigeran yang sesuai. Untuk kebocoran yang ditemukan, tindakan perbaikan disepakati lebih dulu sebelum pekerjaan dilanjutkan. Kami membawa R32, R410A, dan R22 sesuai kebutuhan unit.',
      250000,
      'UNIT',
      90,
      30,
      2
    ),
    (
      'servis-ac',
      'bongkar-pasang-ac',
      'Bongkar Pasang AC',
      'Pindahan unit, pemasangan unit baru, atau bongkar untuk renovasi. Termasuk vakum pipa.',
      'Pemasangan yang rapi menentukan umur pemakaian AC. Kami mengukur jalur pipa, memasang bracket dengan jarak yang benar, melakukan vakum sebelum unit dinyalakan, dan merapikan jalur pipa serta kabel. Untuk bongkar, refrigeran dikumpulkan terlebih dahulu agar tidak terbuang dan unit tetap siap dipasang kembali di lokasi baru.',
      350000,
      'UNIT',
      180,
      30,
      3
    ),
    (
      'elektronik-rumah',
      'perbaikan-kulkas',
      'Perbaikan Kulkas',
      'Diagnosa tidak dingin, berisik, bocor, atau bunga es. Biaya pemeriksaan transparan.',
      'Kulkas yang tidak dingin bisa disebabkan oleh thermostat, kompresor, kebocoran freon, atau saluran pembuangan yang tersumbat. Kami memeriksa kelistrikan dan sistem pendingin di lokasi, menjelaskan penyebab serta pilihan tindakan, dan baru melanjutkan pekerjaan setelah Anda setuju. Suku cadang yang diganti dicatat pada nota servis.',
      150000,
      'UNIT',
      90,
      30,
      1
    ),
    (
      'elektronik-rumah',
      'perbaikan-mesin-cuci',
      'Perbaikan Mesin Cuci',
      'Mesin tidak berputar, tidak menguras, bergetar, atau berhenti di tengah siklus.',
      'Masalah mesin cuci dapat berasal dari modul elektronik, karet pintu, pompa pembuangan, atau bantalan tabung. Teknisi memeriksa komponen satu per satu dan menguji seluruh siklus sebelum meninggalkan lokasi. Untuk mesin front loading, kami membawa alat khusus untuk membuka tabung tanpa merusak seal.',
      150000,
      'UNIT',
      90,
      30,
      2
    ),
    (
      'elektronik-rumah',
      'perbaikan-tv',
      'Perbaikan TV',
      'Layar gelap, garis, tanpa suara, atau tidak menyala. Pemeriksaan di rumah.',
      'Untuk TV LED, kerusakan sering berada di backlight, power supply, atau mainboard. Teknisi memeriksa di tempat; bila unit perlu dibawa ke workshop, kami menjelaskan perkiraan waktu dan biaya sebelum membawa unit. Kami tidak mengganti panel bila biayanya melebihi nilai wajar unit.',
      150000,
      'UNIT',
      90,
      30,
      3
    )
) AS v(
  category_slug, slug, name, short_description, description,
  base_price, unit, duration, warranty, sort_order
) ON v.category_slug = c."slug"
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "ServiceVariant" (
  "id", "serviceId", "name", "price", "durationMinutes", "sortOrder",
  "isActive", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, s."id", v.name, v.price, v.duration, v.sort_order,
       true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Service" s
JOIN (
  VALUES
    ('cuci-ac', 'AC 0,5–1 PK', 75000, 60, 1),
    ('cuci-ac', 'AC 1,5–2 PK', 95000, 75, 2),
    ('cuci-ac', 'Cassette / Floor Standing', 150000, 120, 3),
    ('isi-freon-ac', 'Freon R32', 250000, 90, 1),
    ('isi-freon-ac', 'Freon R410A', 300000, 90, 2),
    ('isi-freon-ac', 'Freon R22', 275000, 90, 3),
    ('bongkar-pasang-ac', 'Pasang unit baru', 350000, 180, 1),
    ('bongkar-pasang-ac', 'Bongkar unit lama', 200000, 90, 2),
    ('bongkar-pasang-ac', 'Bongkar + pasang', 500000, 240, 3),
    ('perbaikan-kulkas', 'Pemeriksaan & diagnosa', 150000, 60, 1),
    ('perbaikan-kulkas', 'Perbaikan kebocoran freon', 450000, 120, 2),
    ('perbaikan-kulkas', 'Ganti kompresor', 900000, 180, 3),
    ('perbaikan-mesin-cuci', 'Pemeriksaan & diagnosa', 150000, 60, 1),
    ('perbaikan-mesin-cuci', 'Perbaikan tabung & seal', 400000, 150, 2),
    ('perbaikan-mesin-cuci', 'Ganti modul / board', 550000, 120, 3),
    ('perbaikan-tv', 'Pemeriksaan & diagnosa', 150000, 60, 1),
    ('perbaikan-tv', 'TV LED 32–43 inci', 200000, 90, 2),
    ('perbaikan-tv', 'TV LED 50 inci ke atas', 350000, 120, 3)
) AS v(service_slug, name, price, duration, sort_order) ON v.service_slug = s."slug"
ON CONFLICT ("serviceId", "name") DO NOTHING;

-- ─────────────────────────── Customers ───────────────────────────

INSERT INTO "Customer" (
  "id", "name", "phone", "email", "address", "city", "district", "postalCode",
  "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid()::text, 'Ayu Lestari', '6281311110001', 'ayu.lestari@example.com',
   'Jl. Melati No. 12, RT 03/RW 05', 'Jakarta Selatan', 'Kebayoran Baru', '12130',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Dimas Nugroho', '6281311110002', 'dimas.nugroho@example.com',
   'Apartemen Green Park View Tower B, Lantai 17', 'Jakarta Barat', 'Kembangan', '11610',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sari Wulandari', '6281311110003', 'sari.wulandari@example.com',
   'Jl. Kenanga Raya No. 8', 'Depok', 'Beji', '16421',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hendra Saputra', '6281311110004', NULL,
   'Ruko Boulevard Raya Blok C No. 5', 'Tangerang Selatan', 'BSD Serpong', '15310',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Maya Ramadhani', '6281311110005', 'maya.ramadhani@example.com',
   'Jl. Cempaka Putih Tengah No. 21', 'Jakarta Pusat', 'Cempaka Putih', '10510',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Fajar Hidayat', '6281311110006', 'fajar.hidayat@example.com',
   'Jl. Margonda Raya No. 45, Gang Dahlia', 'Depok', 'Beji', '16423',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("phone") DO NOTHING;

-- ─────────────────────────── Bookings ───────────────────────────
-- Dates are relative to CURRENT_DATE so the sample stays useful.
-- Slot times are Jakarta local (WIB), stored as UTC like Prisma.

INSERT INTO "Booking" (
  "id", "code", "customerId", "serviceId", "variantId", "technicianId",
  "status", "paymentStatus", "paymentMethod", "source", "scheduledAt",
  "slotLabel", "durationMinutes", "propertyType", "address", "city", "district",
  "postalCode", "notes", "unitCount", "basePrice", "addOnTotal", "discount",
  "total", "paidAt", "completedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'GCC-' || to_char(CURRENT_DATE + b.offset_days, 'YYMMDD') || '-' || b.suffix,
  c."id",
  s."id",
  v."id",
  u."id",
  b.status::"BookingStatus",
  b.payment_status::"PaymentStatus",
  NULLIF(b.payment_method, '')::"PaymentMethod",
  CASE b.source WHEN 'WEBSITE' THEN 'WEBSITE'::"BookingSource"
                WHEN 'WHATSAPP' THEN 'WHATSAPP'::"BookingSource"
                ELSE 'PHONE'::"BookingSource" END,
  (((CURRENT_DATE + b.offset_days)::timestamp + b.slot_start)
    AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'UTC',
  b.slot_label,
  90,
  b.property_type::"PropertyType",
  c."address",
  c."city",
  c."district",
  c."postalCode",
  b.notes,
  b.unit_count,
  b.base_price,
  0,
  0,
  b.base_price,
  CASE WHEN b.paid
    THEN ((((CURRENT_DATE + b.offset_days)::timestamp + b.slot_start)
      AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'UTC')
    ELSE NULL END,
  CASE WHEN b.completed
    THEN ((((CURRENT_DATE + b.offset_days)::timestamp + b.slot_start)
      AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'UTC')
    ELSE NULL END,
  CURRENT_TIMESTAMP - make_interval(days => b.created_days_ago),
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('D001', 0, TIME '08:00', '08:00-10:00', '6281311110001', 'cuci-ac', 'AC 0,5–1 PK',
     'IN_PROGRESS', 'PAID', 'CASH', 'budi@gcc-web.id', 2, 'RUMAH',
     'Gate kompleks, hubungi sebelum masuk.', 150000, true, false, 2, 'WEBSITE'),
    ('D002', 0, TIME '10:00', '10:00-12:00', '6281311110002', 'isi-freon-ac', 'Freon R32',
     'ASSIGNED', 'UNPAID', '', 'rizky@gcc-web.id', 1, 'APARTEMEN',
     'AC kamar utama kurang dingin sejak seminggu terakhir.', 250000, false, false, 1, 'WHATSAPP'),
    ('D003', 0, TIME '13:00', '13:00-15:00', '6281311110003', 'bongkar-pasang-ac', 'Bongkar + pasang',
     'CONFIRMED', 'UNPAID', '', NULL, 1, 'RUMAH',
     'Pindah unit dari kamar belakang ke ruang tamu.', 500000, false, false, 1, 'PHONE'),
    ('D004', 0, TIME '15:00', '15:00-17:00', '6281311110004', 'perbaikan-kulkas', 'Pemeriksaan & diagnosa',
     'PENDING', 'UNPAID', '', NULL, 1, 'RUKO',
     'Kulkas showroom, mohon bawa alat ukur freon.', 150000, false, false, 0, 'WEBSITE'),
    ('D005', 1, TIME '08:00', '08:00-10:00', '6281311110005', 'cuci-ac', 'AC 1,5–2 PK',
     'PENDING', 'UNPAID', '', NULL, 3, 'RUMAH', NULL, 285000, false, false, 0, 'WHATSAPP'),
    ('D006', 1, TIME '10:00', '10:00-12:00', '6281311110006', 'perbaikan-mesin-cuci', 'Ganti modul / board',
     'ASSIGNED', 'UNPAID', '', 'dedi@gcc-web.id', 1, 'RUMAH',
     'Mesin cuci front loading berhenti di tengah siklus.', 550000, false, false, 2, 'PHONE'),
    ('D007', 2, TIME '08:00', '08:00-10:00', '6281311110001', 'perbaikan-tv', 'TV LED 50 inci ke atas',
     'CONFIRMED', 'UNPAID', '', NULL, 1, 'RUMAH', NULL, 350000, false, false, 1, 'WEBSITE'),
    ('D008', -1, TIME '10:00', '10:00-12:00', '6281311110002', 'cuci-ac', 'AC 0,5–1 PK',
     'COMPLETED', 'PAID', 'TRANSFER', 'budi@gcc-web.id', 2, 'RUMAH', NULL, 150000, true, true, 4, 'WHATSAPP'),
    ('D009', -3, TIME '13:00', '13:00-15:00', '6281311110003', 'isi-freon-ac', 'Freon R410A',
     'COMPLETED', 'PAID', 'CASH', 'rizky@gcc-web.id', 1, 'RUMAH', NULL, 300000, true, true, 5, 'PHONE'),
    ('D010', -4, TIME '15:00', '15:00-17:00', '6281311110004', 'bongkar-pasang-ac', 'Bongkar unit lama',
     'CANCELLED', 'UNPAID', '', NULL, 1, 'RUMAH',
     'Pelanggan menunda renovasi.', 200000, false, false, 6, 'WEBSITE')
) AS b(
  suffix, offset_days, slot_start, slot_label, customer_phone, service_slug,
  variant_name, status, payment_status, payment_method, technician_email,
  unit_count, property_type, notes, base_price, paid, completed,
  created_days_ago, source
)
JOIN "Customer" c ON c."phone" = b.customer_phone
JOIN "Service" s ON s."slug" = b.service_slug
LEFT JOIN "ServiceVariant" v ON v."serviceId" = s."id" AND v."name" = b.variant_name
LEFT JOIN "User" u ON u."email" = b.technician_email
ON CONFLICT ("code") DO NOTHING;

-- Status history for seeded bookings (only when none exists).
INSERT INTO "BookingStatusHistory" (
  "id", "bookingId", "status", "note", "changedById", "createdAt"
)
SELECT
  gen_random_uuid()::text,
  b."id",
  chain.status::"BookingStatus",
  chain.note,
  admin."id",
  b."createdAt" + make_interval(hours => chain.ord * 6)
FROM "Booking" b
JOIN "User" admin ON admin."email" = 'admin@gcc-web.id'
CROSS JOIN LATERAL (
  SELECT *
  FROM (
    VALUES
      ('PENDING', 0, 'Pesanan dibuat melalui website.'),
      ('CONFIRMED', 1, 'Jadwal dikonfirmasi admin.'),
      ('ASSIGNED', 2, 'Teknisi ditugaskan.'),
      ('EN_ROUTE', 3, 'Teknisi dalam perjalanan ke lokasi.'),
      ('IN_PROGRESS', 4, 'Teknisi tiba dan mulai bekerja.'),
      ('COMPLETED', 5, 'Pekerjaan selesai dan diuji bersama pelanggan.')
  ) AS t(status, ord, note)
  WHERE t.ord <= CASE b."status"
    WHEN 'PENDING' THEN 0
    WHEN 'CONFIRMED' THEN 1
    WHEN 'ASSIGNED' THEN 2
    WHEN 'EN_ROUTE' THEN 3
    WHEN 'IN_PROGRESS' THEN 4
    WHEN 'COMPLETED' THEN 5
    ELSE 0
  END
  UNION ALL
  SELECT 'CANCELLED', 1, 'Pesanan dibatalkan.'
  WHERE b."status" = 'CANCELLED'
) AS chain
WHERE b."code" LIKE 'GCC-%'
  AND NOT EXISTS (
    SELECT 1 FROM "BookingStatusHistory" h WHERE h."bookingId" = b."id"
  );

-- ─────────────────────────── Inventory ───────────────────────────

INSERT INTO "InventoryItem" (
  "id", "sku", "name", "category", "unit", "quantity", "minQuantity",
  "costPrice", "isActive", "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid()::text, 'FRN-R32', 'Freon R32', 'Freon', 'kg', 8, 3, 95000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FRN-R410A', 'Freon R410A', 'Freon', 'kg', 6, 3, 120000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FRN-R22', 'Freon R22', 'Freon', 'kg', 4, 4, 110000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CAP-25', 'Kapasitor AC 25 µF', 'Sparepart', 'pcs', 10, 5, 45000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CAP-35', 'Kapasitor AC 35 µF', 'Sparepart', 'pcs', 5, 4, 55000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PIPA-14', 'Pipa tembaga 1/4 inci', 'Bahan', 'meter', 25, 10, 38000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PIPA-38', 'Pipa tembaga 3/8 inci', 'Bahan', 'meter', 18, 8, 52000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SELANG-AC', 'Selang drainase AC', 'Bahan', 'meter', 15, 5, 12000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FLT-DRY', 'Filter dryer', 'Sparepart', 'pcs', 6, 3, 65000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'RM-AC', 'Remote AC universal', 'Sparepart', 'pcs', 3, 5, 85000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'KABEL-315', 'Kabel 3×1,5 mm', 'Bahan', 'meter', 40, 15, 18000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PCB-MC', 'Modul mesin cuci universal', 'Sparepart', 'pcs', 2, 2, 310000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BRN-AC', 'Bracket outdoor AC', 'Sparepart', 'set', 7, 4, 95000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TOOL-VAC', 'Vacuum pump 1/4 PK', 'Peralatan', 'unit', 2, 1, 1850000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("sku") DO NOTHING;

-- ─────────────────────────── Testimonials ───────────────────────────
-- Only seed reviews that do not already exist by customer name.

INSERT INTO "Testimonial" (
  "id", "bookingId", "serviceId", "customerName", "customerMeta", "rating",
  "content", "isPublished", "isFeatured", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  NULL::text,
  s."id",
  t.customer_name,
  t.customer_meta,
  t.rating,
  t.content,
  t.is_published,
  t.is_featured,
  CURRENT_TIMESTAMP - make_interval(days => t.days_ago),
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('Dimas Nugroho', 'Kembangan, Jakarta Barat · Cuci AC', 5,
     'Teknisi datang tepat waktu, memasang penutup lantai sebelum bekerja, dan menjelaskan kondisi unit. Setelah dicuci, AC kamar jauh lebih dingin dan tidak berbau.',
     true, true, 1, 'cuci-ac'),
    ('Sari Wulandari', 'Beji, Depok · Cuci AC', 5,
     'Pesan lewat website jam sembilan pagi, sorenya sudah dikonfirmasi untuk besok. Hasil cuci AC rapi, air tidak menetes lagi ke dinding.',
     true, true, 10, 'cuci-ac'),
    ('Maya Ramadhani', 'Cempaka Putih, Jakarta Pusat · Bongkar Pasang AC', 5,
     'Bongkar pasang dua unit untuk pindahan. Pipa dan kabel dirapikan, vakum dilakukan sebelum dinyalakan. Biaya sesuai yang dijanjikan di awal.',
     true, true, 20, 'bongkar-pasang-ac'),
    ('Hendra Saputra', 'BSD Serpong, Tangerang Selatan · Perbaikan Kulkas', 4,
     'Kulkas showroom sempat mati total. Penjelasan penyebabnya jelas dan sparepart yang diganti ditunjukkan. Perlu satu hari menunggu part, tapi komunikasinya bagus.',
     true, false, 30, 'perbaikan-kulkas'),
    ('Andi Prakoso', 'Menteng, Jakarta Pusat · Isi Freon AC', 5,
     'Freon R410A diisi setelah dicek kebocorannya. Tidak langsung diisi begitu saja, jadi lebih tenang. Sudah sebulan dan masih dingin.',
     true, false, 45, 'isi-freon-ac'),
    ('Rina Kartika', 'Pamulang, Tangerang Selatan · Perbaikan Mesin Cuci', 5,
     'Hanya menunggu satu hari setelah booking. Modul diganti dan mesin diuji sampai selesai satu siklus sebelum teknisinya pulang.',
     false, false, 3, 'perbaikan-mesin-cuci')
) AS t(
  customer_name, customer_meta, rating, content, is_published, is_featured,
  days_ago, service_slug
)
JOIN "Service" s ON s."slug" = t.service_slug
WHERE NOT EXISTS (
  SELECT 1 FROM "Testimonial" existing WHERE existing."customerName" = t.customer_name
);

-- ─────────────────────────── Settings ───────────────────────────

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES
  (
    'business',
    '{
      "name": "GCC Web",
      "tagline": "Servis AC dan elektronik rumah, dikerjakan rapi dan bergaransi.",
      "phone": "0812-3456-7890",
      "whatsapp": "6281234567890",
      "email": "halo@gcc-web.id",
      "address": "Jl. Contoh Raya No. 1",
      "city": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "serviceAreas": ["Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Depok", "Tangerang Selatan"],
      "hours": "Senin–Sabtu, 08.00–17.00",
      "instagram": ""
    }'::jsonb,
    CURRENT_TIMESTAMP
  ),
  (
    'payment',
    '{
      "bankName": "BCA",
      "bankAccount": "0000000000",
      "accountName": "GCC Web",
      "note": "Konfirmasi bukti transfer melalui WhatsApp agar pesanan segera diproses."
    }'::jsonb,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO NOTHING;

COMMIT;
