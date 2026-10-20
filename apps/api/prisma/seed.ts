/**
 * Development seed for GCC Web.
 *
 * WARNING: this script clears operational tables before inserting sample data.
 * Never run it against a production database. All names, phone numbers and
 * testimonials below are placeholders for design review.
 */
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { BookingStatus, PaymentMethod, PaymentStatus, PropertyType } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { slotToDate } from '../src/lib/slots';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Jakarta';
const today = dayjs().tz(TZ);

const dateAt = (offsetDays: number) => today.add(offsetDays, 'day').format('YYYY-MM-DD');
const atNoon = (offsetDays: number) => dayjs.tz(`${dateAt(offsetDays)} 12:00`, TZ).toDate();

async function main() {
  console.log('Membersihkan data lama…');
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.serviceVariant.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.session.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('Membuat akun…');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin#12345';
  const techPassword = process.env.SEED_TECH_PASSWORD ?? 'Teknisi#12345';
  const [adminHash, techHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(techPassword, 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'GCC Admin',
      email: 'admin@gcc-web.id',
      phone: '6281200000001',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const technicianSeed = [
    {
      name: 'Budi Santoso',
      email: 'budi@gcc-web.id',
      phone: '6281200000002',
      zone: 'Jakarta Selatan · Kebayoran, Cilandak, Pasar Minggu',
      specialties: ['Cuci AC', 'Isi freon', 'Bongkar pasang AC'],
      capacityPerDay: 4,
    },
    {
      name: 'Rizky Pratama',
      email: 'rizky@gcc-web.id',
      phone: '6281200000003',
      zone: 'Jakarta Pusat · Menteng, Tanah Abang, Kemayoran',
      specialties: ['Kulkas', 'Mesin cuci', 'Freon R32 & R410A'],
      capacityPerDay: 3,
    },
    {
      name: 'Dedi Kurniawan',
      email: 'dedi@gcc-web.id',
      phone: '6281200000004',
      zone: 'Depok · Beji, Margonda, Cinere',
      specialties: ['AC', 'TV LED', 'Instalasi listrik rumah'],
      capacityPerDay: 4,
    },
    {
      name: 'Agus Setiawan',
      email: 'agus@gcc-web.id',
      phone: '6281200000005',
      zone: 'Tangerang Selatan · BSD, Bintaro, Pamulang',
      specialties: ['AC cassette', 'Kulkas dua pintu', 'Mesin cuci front loading'],
      capacityPerDay: 3,
      isAvailable: false,
    },
  ];

  const technicians = [];
  for (const entry of technicianSeed) {
    const user = await prisma.user.create({
      data: {
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        passwordHash: techHash,
        role: 'TECHNICIAN',
        technician: {
          create: {
            zone: entry.zone,
            specialties: entry.specialties,
            capacityPerDay: entry.capacityPerDay,
            isAvailable: entry.isAvailable ?? true,
          },
        },
      },
    });
    technicians.push(user);
  }

  console.log('Membuat katalog layanan…');
  const acCategory = await prisma.serviceCategory.create({
    data: {
      slug: 'servis-ac',
      name: 'Servis & Perawatan AC',
      description:
        'Cuci AC, isi freon, dan bongkar pasang untuk AC split, cassette, dan floor standing.',
      sortOrder: 1,
    },
  });

  const electronicsCategory = await prisma.serviceCategory.create({
    data: {
      slug: 'elektronik-rumah',
      name: 'Elektronik Rumah',
      description:
        'Perbaikan kulkas, mesin cuci, dan TV dengan pemeriksaan di tempat dan garansi pekerjaan.',
      sortOrder: 2,
    },
  });

  const cuciAc = await prisma.service.create({
    data: {
      categoryId: acCategory.id,
      slug: 'cuci-ac',
      name: 'Cuci AC',
      shortDescription:
        'Pembersihan indoor dan outdoor, cek tekanan freon, dan uji aliran udara setelah servis.',
      description:
        'Udara AC yang tidak dingin sering kali bukan karena freon habis, melainkan karena debu yang menumpuk di evaporator, blower, dan filter. Teknisi kami membongkar unit indoor, mencuci evaporator dan blower, membersihkan saluran pembuangan, mengecek tekanan freon, lalu menguji suhu keluaran. Pekerjaan dilakukan dengan penutup lantai dan kain pelindung agar ruangan tetap bersih. Setiap servis mendapat garansi kebersihan dan fungsi selama 7 hari.',
      basePrice: 75000,
      unit: 'UNIT',
      durationMinutes: 60,
      warrantyDays: 7,
      isFeatured: true,
      sortOrder: 1,
      variants: {
        create: [
          { name: 'AC 0,5–1 PK', price: 75000, durationMinutes: 60, sortOrder: 1 },
          { name: 'AC 1,5–2 PK', price: 95000, durationMinutes: 75, sortOrder: 2 },
          { name: 'Cassette / Floor Standing', price: 150000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
    },
  });

  const isiFreon = await prisma.service.create({
    data: {
      categoryId: acCategory.id,
      slug: 'isi-freon-ac',
      name: 'Isi Freon AC',
      shortDescription:
        'Pengisian freon sesuai jenis refrigeran unit, didahului deteksi kebocoran.',
      description:
        'Pengisian freon tanpa pemeriksaan kebocoran hanya menyelesaikan gejala. Teknisi kami mengukur tekanan kerja, memeriksa sambungan dan pipa, lalu mengisi refrigeran yang sesuai. Untuk kebocoran yang ditemukan, tindakan perbaikan disepakati lebih dulu sebelum pekerjaan dilanjutkan. Kami membawa R32, R410A, dan R22 sesuai kebutuhan unit.',
      basePrice: 250000,
      unit: 'UNIT',
      durationMinutes: 90,
      warrantyDays: 30,
      isFeatured: true,
      sortOrder: 2,
      variants: {
        create: [
          { name: 'Freon R32', price: 250000, durationMinutes: 90, sortOrder: 1 },
          { name: 'Freon R410A', price: 300000, durationMinutes: 90, sortOrder: 2 },
          { name: 'Freon R22', price: 275000, durationMinutes: 90, sortOrder: 3 },
        ],
      },
    },
  });

  const bongkarPasang = await prisma.service.create({
    data: {
      categoryId: acCategory.id,
      slug: 'bongkar-pasang-ac',
      name: 'Bongkar Pasang AC',
      shortDescription:
        'Pindahan unit, pemasangan unit baru, atau bongkar untuk renovasi. Termasuk vakum pipa.',
      description:
        'Pemasangan yang rapi menentukan umur pemakaian AC. Kami mengukur jalur pipa, memasang bracket dengan jarak yang benar, melakukan vakum sebelum unit dinyalakan, dan merapikan jalur pipa serta kabel. Untuk bongkar, refrigeran dikumpulkan terlebih dahulu agar tidak terbuang dan unit tetap siap dipasang kembali di lokasi baru.',
      basePrice: 350000,
      unit: 'UNIT',
      durationMinutes: 180,
      warrantyDays: 30,
      isFeatured: true,
      sortOrder: 3,
      variants: {
        create: [
          { name: 'Pasang unit baru', price: 350000, durationMinutes: 180, sortOrder: 1 },
          { name: 'Bongkar unit lama', price: 200000, durationMinutes: 90, sortOrder: 2 },
          { name: 'Bongkar + pasang', price: 500000, durationMinutes: 240, sortOrder: 3 },
        ],
      },
    },
  });

  const perbaikanKulkas = await prisma.service.create({
    data: {
      categoryId: electronicsCategory.id,
      slug: 'perbaikan-kulkas',
      name: 'Perbaikan Kulkas',
      shortDescription:
        'Diagnosa tidak dingin, berisik, bocor, atau bunga es. Biaya pemeriksaan transparan.',
      description:
        'Kulkas yang tidak dingin bisa disebabkan oleh thermostat, kompresor, kebocoran freon, atau saluran pembuangan yang tersumbat. Kami memeriksa kelistrikan dan sistem pendingin di lokasi, menjelaskan penyebab serta pilihan tindakan, dan baru melanjutkan pekerjaan setelah Anda setuju. Suku cadang yang diganti dicatat pada nota servis.',
      basePrice: 150000,
      unit: 'UNIT',
      durationMinutes: 90,
      warrantyDays: 30,
      isFeatured: true,
      sortOrder: 1,
      variants: {
        create: [
          { name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { name: 'Perbaikan kebocoran freon', price: 450000, durationMinutes: 120, sortOrder: 2 },
          { name: 'Ganti kompresor', price: 900000, durationMinutes: 180, sortOrder: 3 },
        ],
      },
    },
  });

  const perbaikanMesinCuci = await prisma.service.create({
    data: {
      categoryId: electronicsCategory.id,
      slug: 'perbaikan-mesin-cuci',
      name: 'Perbaikan Mesin Cuci',
      shortDescription:
        'Mesin tidak berputar, tidak menguras, bergetar, atau berhenti di tengah siklus.',
      description:
        'Masalah mesin cuci dapat berasal dari modul elektronik, karet pintu, pompa pembuangan, atau bantalan tabung. Teknisi memeriksa komponen satu per satu dan menguji seluruh siklus sebelum meninggalkan lokasi. Untuk mesin front loading, kami membawa alat khusus untuk membuka tabung tanpa merusak seal.',
      basePrice: 150000,
      unit: 'UNIT',
      durationMinutes: 90,
      warrantyDays: 30,
      isFeatured: true,
      sortOrder: 2,
      variants: {
        create: [
          { name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { name: 'Perbaikan tabung & seal', price: 400000, durationMinutes: 150, sortOrder: 2 },
          { name: 'Ganti modul / board', price: 550000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
    },
  });

  const perbaikanTv = await prisma.service.create({
    data: {
      categoryId: electronicsCategory.id,
      slug: 'perbaikan-tv',
      name: 'Perbaikan TV',
      shortDescription:
        'Layar gelap, garis, tanpa suara, atau tidak menyala. Pemeriksaan di rumah.',
      description:
        'Untuk TV LED, kerusakan sering berada di backlight, power supply, atau mainboard. Teknisi memeriksa di tempat; bila unit perlu dibawa ke workshop, kami menjelaskan perkiraan waktu dan biaya sebelum membawa unit. Kami tidak mengganti panel bila biayanya melebihi nilai wajar unit.',
      basePrice: 150000,
      unit: 'UNIT',
      durationMinutes: 90,
      warrantyDays: 30,
      isFeatured: true,
      sortOrder: 3,
      variants: {
        create: [
          { name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { name: 'TV LED 32–43 inci', price: 200000, durationMinutes: 90, sortOrder: 2 },
          { name: 'TV LED 50 inci ke atas', price: 350000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
    },
  });

  console.log('Membuat pelanggan…');
  const customers = [];
  for (const entry of [
    {
      name: 'Ayu Lestari',
      phone: '6281311110001',
      email: 'ayu.lestari@example.com',
      address: 'Jl. Melati No. 12, RT 03/RW 05',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12130',
    },
    {
      name: 'Dimas Nugroho',
      phone: '6281311110002',
      email: 'dimas.nugroho@example.com',
      address: 'Apartemen Green Park View Tower B, Lantai 17',
      city: 'Jakarta Barat',
      district: 'Kembangan',
      postalCode: '11610',
    },
    {
      name: 'Sari Wulandari',
      phone: '6281311110003',
      email: 'sari.wulandari@example.com',
      address: 'Jl. Kenanga Raya No. 8',
      city: 'Depok',
      district: 'Beji',
      postalCode: '16421',
    },
    {
      name: 'Hendra Saputra',
      phone: '6281311110004',
      email: null,
      address: 'Ruko Boulevard Raya Blok C No. 5',
      city: 'Tangerang Selatan',
      district: 'BSD Serpong',
      postalCode: '15310',
    },
    {
      name: 'Maya Ramadhani',
      phone: '6281311110005',
      email: 'maya.ramadhani@example.com',
      address: 'Jl. Cempaka Putih Tengah No. 21',
      city: 'Jakarta Pusat',
      district: 'Cempaka Putih',
      postalCode: '10510',
    },
    {
      name: 'Fajar Hidayat',
      phone: '6281311110006',
      email: 'fajar.hidayat@example.com',
      address: 'Jl. Margonda Raya No. 45, Gang Dahlia',
      city: 'Depok',
      district: 'Beji',
      postalCode: '16423',
    },
  ]) {
    customers.push(await prisma.customer.create({ data: entry }));
  }

  console.log('Membuat jadwal dan pesanan…');
  const cuciVariants = await prisma.serviceVariant.findMany({ where: { serviceId: cuciAc.id } });
  const freonVariants = await prisma.serviceVariant.findMany({ where: { serviceId: isiFreon.id } });
  const pasangVariants = await prisma.serviceVariant.findMany({
    where: { serviceId: bongkarPasang.id },
  });
  const kulkasVariants = await prisma.serviceVariant.findMany({
    where: { serviceId: perbaikanKulkas.id },
  });
  const mesinVariants = await prisma.serviceVariant.findMany({
    where: { serviceId: perbaikanMesinCuci.id },
  });
  const tvVariants = await prisma.serviceVariant.findMany({
    where: { serviceId: perbaikanTv.id },
  });

  const variant = (
    list: Array<{ id: string; name: string; price: unknown; durationMinutes: number }>,
    name: string,
  ) => {
    const found = list.find((entry) => entry.name === name);
    if (!found) throw new Error(`Varian tidak ditemukan: ${name}`);
    return found;
  };

  type BookingInput = {
    codeSuffix: string;
    offsetDays: number;
    slot: '08:00-10:00' | '10:00-12:00' | '13:00-15:00' | '15:00-17:00';
    customerIndex: number;
    serviceId: string;
    variantId?: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    technicianIndex?: number;
    unitCount?: number;
    basePrice: number;
    propertyType?: PropertyType;
    notes?: string;
    paid?: boolean;
    completed?: boolean;
    createdOffsetDays?: number;
  };

  const createdBookings = [];

  for (const [index, input] of (
    [
      {
        codeSuffix: 'D001',
        offsetDays: 0,
        slot: '08:00-10:00',
        customerIndex: 0,
        serviceId: cuciAc.id,
        variantId: variant(cuciVariants, 'AC 0,5–1 PK').id,
        status: 'IN_PROGRESS',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        technicianIndex: 0,
        unitCount: 2,
        basePrice: 150000,
        paid: true,
        createdOffsetDays: -2,
        notes: 'Gate kompleks, hubungi sebelum masuk.',
      },
      {
        codeSuffix: 'D002',
        offsetDays: 0,
        slot: '10:00-12:00',
        customerIndex: 1,
        serviceId: isiFreon.id,
        variantId: variant(freonVariants, 'Freon R32').id,
        status: 'ASSIGNED',
        paymentStatus: 'UNPAID',
        technicianIndex: 1,
        basePrice: 250000,
        propertyType: 'APARTEMEN',
        createdOffsetDays: -1,
        notes: 'AC kamar utama kurang dingin sejak seminggu terakhir.',
      },
      {
        codeSuffix: 'D003',
        offsetDays: 0,
        slot: '13:00-15:00',
        customerIndex: 2,
        serviceId: bongkarPasang.id,
        variantId: variant(pasangVariants, 'Bongkar + pasang').id,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        basePrice: 500000,
        createdOffsetDays: -1,
        notes: 'Pindah unit dari kamar belakang ke ruang tamu.',
      },
      {
        codeSuffix: 'D004',
        offsetDays: 0,
        slot: '15:00-17:00',
        customerIndex: 3,
        serviceId: perbaikanKulkas.id,
        variantId: variant(kulkasVariants, 'Pemeriksaan & diagnosa').id,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        basePrice: 150000,
        propertyType: 'RUKO',
        createdOffsetDays: 0,
        notes: 'Kulkas showroom, mohon bawa alat ukur freon.',
      },
      {
        codeSuffix: 'D005',
        offsetDays: 1,
        slot: '08:00-10:00',
        customerIndex: 4,
        serviceId: cuciAc.id,
        variantId: variant(cuciVariants, 'AC 1,5–2 PK').id,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        basePrice: 285000,
        unitCount: 3,
        createdOffsetDays: 0,
      },
      {
        codeSuffix: 'D006',
        offsetDays: 1,
        slot: '10:00-12:00',
        customerIndex: 5,
        serviceId: perbaikanMesinCuci.id,
        variantId: variant(mesinVariants, 'Ganti modul / board').id,
        status: 'ASSIGNED',
        paymentStatus: 'UNPAID',
        technicianIndex: 2,
        basePrice: 550000,
        createdOffsetDays: -2,
        notes: 'Mesin cuci front loading berhenti di tengah siklus.',
      },
      {
        codeSuffix: 'D007',
        offsetDays: 2,
        slot: '08:00-10:00',
        customerIndex: 0,
        serviceId: perbaikanTv.id,
        variantId: variant(tvVariants, 'TV LED 50 inci ke atas').id,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        basePrice: 350000,
        createdOffsetDays: -1,
      },
      {
        codeSuffix: 'D008',
        offsetDays: -1,
        slot: '10:00-12:00',
        customerIndex: 1,
        serviceId: cuciAc.id,
        variantId: variant(cuciVariants, 'AC 0,5–1 PK').id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        technicianIndex: 0,
        unitCount: 2,
        basePrice: 150000,
        paid: true,
        completed: true,
        createdOffsetDays: -4,
      },
      {
        codeSuffix: 'D009',
        offsetDays: -3,
        slot: '13:00-15:00',
        customerIndex: 2,
        serviceId: isiFreon.id,
        variantId: variant(freonVariants, 'Freon R410A').id,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        technicianIndex: 1,
        basePrice: 300000,
        paid: true,
        completed: true,
        createdOffsetDays: -5,
      },
      {
        codeSuffix: 'D010',
        offsetDays: -4,
        slot: '15:00-17:00',
        customerIndex: 3,
        serviceId: bongkarPasang.id,
        variantId: variant(pasangVariants, 'Bongkar unit lama').id,
        status: 'CANCELLED',
        paymentStatus: 'UNPAID',
        basePrice: 200000,
        createdOffsetDays: -6,
        notes: 'Pelanggan menunda renovasi.',
      },
    ] satisfies BookingInput[]
  ).entries()) {
    const scheduledAt = slotToDate(dateAt(input.offsetDays), input.slot);
    const createdAt = dayjs().tz(TZ).subtract(Math.abs(input.createdOffsetDays ?? 2), 'day').toDate();
    const technician = input.technicianIndex !== undefined ? technicians[input.technicianIndex] : null;
    const statusChain: BookingStatus[] = ['PENDING'];
    if (['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)) {
      statusChain.push('CONFIRMED');
    }
    if (['ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)) {
      statusChain.push('ASSIGNED');
    }
    if (['EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(input.status)) {
      statusChain.push('EN_ROUTE');
    }
    if (['IN_PROGRESS', 'COMPLETED'].includes(input.status)) {
      statusChain.push('IN_PROGRESS');
    }
    if (input.status === 'COMPLETED') statusChain.push('COMPLETED');
    if (input.status === 'CANCELLED') statusChain.push('CANCELLED');

    const notesByStatus: Partial<Record<BookingStatus, string>> = {
      PENDING: 'Pesanan dibuat melalui website.',
      CONFIRMED: 'Jadwal dikonfirmasi admin.',
      ASSIGNED: technician ? `Ditugaskan kepada ${technician.name}.` : 'Teknisi ditugaskan.',
      EN_ROUTE: 'Teknisi dalam perjalanan ke lokasi.',
      IN_PROGRESS: 'Teknisi tiba dan mulai bekerja.',
      COMPLETED: 'Pekerjaan selesai dan diuji bersama pelanggan.',
      CANCELLED: 'Pelanggan menjadwalkan ulang.',
    };

    const booking = await prisma.booking.create({
      data: {
        code: `GCC-${dayjs(scheduledAt).tz(TZ).format('YYMMDD')}-${input.codeSuffix}`,
        customerId: customers[input.customerIndex].id,
        serviceId: input.serviceId,
        variantId: input.variantId,
        technicianId: technician?.id,
        status: input.status,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        source: index % 3 === 0 ? 'WEBSITE' : index % 3 === 1 ? 'WHATSAPP' : 'PHONE',
        scheduledAt,
        slotLabel: input.slot,
        durationMinutes: 90,
        propertyType: input.propertyType ?? 'RUMAH',
        address: customers[input.customerIndex].address,
        city: customers[input.customerIndex].city,
        district: customers[input.customerIndex].district,
        postalCode: customers[input.customerIndex].postalCode,
        notes: input.notes,
        unitCount: input.unitCount ?? 1,
        basePrice: input.basePrice,
        addOnTotal: 0,
        discount: 0,
        total: input.basePrice,
        paidAt: input.paid ? atNoon(input.offsetDays) : null,
        completedAt: input.completed ? atNoon(input.offsetDays) : null,
        createdAt,
        statusHistory: {
          create: statusChain.map((status, order) => ({
            status,
            note: notesByStatus[status],
            changedById: admin.id,
            createdAt: new Date(createdAt.getTime() + order * 6 * 60 * 60 * 1000),
          })),
        },
      },
    });
    createdBookings.push(booking);
  }

  console.log('Membuat stok…');
  const inventory = [
    ['FRN-R32', 'Freon R32', 'Freon', 'kg', 8, 3, 95000],
    ['FRN-R410A', 'Freon R410A', 'Freon', 'kg', 6, 3, 120000],
    ['FRN-R22', 'Freon R22', 'Freon', 'kg', 4, 4, 110000],
    ['CAP-25', 'Kapasitor AC 25 µF', 'Sparepart', 'pcs', 10, 5, 45000],
    ['CAP-35', 'Kapasitor AC 35 µF', 'Sparepart', 'pcs', 5, 4, 55000],
    ['PIPA-14', 'Pipa tembaga 1/4 inci', 'Bahan', 'meter', 25, 10, 38000],
    ['PIPA-38', 'Pipa tembaga 3/8 inci', 'Bahan', 'meter', 18, 8, 52000],
    ['SELANG-AC', 'Selang drainase AC', 'Bahan', 'meter', 15, 5, 12000],
    ['FLT-DRY', 'Filter dryer', 'Sparepart', 'pcs', 6, 3, 65000],
    ['RM-AC', 'Remote AC universal', 'Sparepart', 'pcs', 3, 5, 85000],
    ['KABEL-315', 'Kabel 3×1,5 mm', 'Bahan', 'meter', 40, 15, 18000],
    ['PCB-MC', 'Modul mesin cuci universal', 'Sparepart', 'pcs', 2, 2, 310000],
    ['BRN-AC', 'Bracket outdoor AC', 'Sparepart', 'set', 7, 4, 95000],
    ['TOOL-VAC', 'Vacuum pump 1/4 PK', 'Peralatan', 'unit', 2, 1, 1850000],
  ] as const;

  for (const [sku, name, category, unit, quantity, minQuantity, costPrice] of inventory) {
    await prisma.inventoryItem.create({
      data: { sku, name, category, unit, quantity, minQuantity, costPrice },
    });
  }

  console.log('Membuat testimoni…');
  const completedBooking = createdBookings[7];
  await prisma.testimonial.create({
    data: {
      bookingId: completedBooking.id,
      serviceId: cuciAc.id,
      customerName: 'Dimas Nugroho',
      customerMeta: 'Kembangan, Jakarta Barat · Cuci AC',
      rating: 5,
      content:
        'Teknisi datang tepat waktu, memasang penutup lantai sebelum bekerja, dan menjelaskan kondisi unit. Setelah dicuci, AC kamar jauh lebih dingin dan tidak berbau.',
      isPublished: true,
      isFeatured: true,
    },
  });

  const testimonials: Array<{
    customerName: string;
    customerMeta: string;
    serviceId: string;
    rating: number;
    content: string;
    isFeatured: boolean;
    isPublished?: boolean;
  }> = [
    {
      customerName: 'Sari Wulandari',
      customerMeta: 'Beji, Depok · Cuci AC',
      serviceId: cuciAc.id,
      rating: 5,
      content:
        'Pesan lewat website jam sembilan pagi, sorenya sudah dikonfirmasi untuk besok. Hasil cuci AC rapi, air tidak menetes lagi ke dinding.',
      isFeatured: true,
    },
    {
      customerName: 'Maya Ramadhani',
      customerMeta: 'Cempaka Putih, Jakarta Pusat · Bongkar Pasang AC',
      serviceId: bongkarPasang.id,
      rating: 5,
      content:
        'Bongkar pasang dua unit untuk pindahan. Pipa dan kabel dirapikan, vakum dilakukan sebelum dinyalakan. Biaya sesuai yang dijanjikan di awal.',
      isFeatured: true,
    },
    {
      customerName: 'Hendra Saputra',
      customerMeta: 'BSD Serpong, Tangerang Selatan · Perbaikan Kulkas',
      serviceId: perbaikanKulkas.id,
      rating: 4,
      content:
        'Kulkas showroom sempat mati total. Penjelasan penyebabnya jelas dan sparepart yang diganti ditunjukkan. Perlu satu hari menunggu part, tapi komunikasinya bagus.',
      isFeatured: false,
    },
    {
      customerName: 'Andi Prakoso',
      customerMeta: 'Menteng, Jakarta Pusat · Isi Freon AC',
      serviceId: isiFreon.id,
      rating: 5,
      content:
        'Freon R410A diisi setelah dicek kebocorannya. Tidak langsung diisi begitu saja, jadi lebih tenang. Sudah sebulan dan masih dingin.',
      isFeatured: false,
    },
    {
      customerName: 'Rina Kartika',
      customerMeta: 'Pamulang, Tangerang Selatan · Perbaikan Mesin Cuci',
      serviceId: perbaikanMesinCuci.id,
      rating: 5,
      content:
        'Hanya menunggu satu hari setelah booking. Modul diganti dan mesin diuji sampai selesai satu siklus sebelum teknisinya pulang.',
      isPublished: false,
      isFeatured: false,
    },
  ];

  for (const entry of testimonials) {
    await prisma.testimonial.create({
      data: { ...entry, isPublished: entry.isPublished ?? true },
    });
  }

  console.log('Menyimpan pengaturan…');
  await prisma.setting.createMany({
    data: [
      {
        key: 'business',
        value: {
          name: 'GCC Web',
          tagline: 'Servis AC dan elektronik rumah, dikerjakan rapi dan bergaransi.',
          phone: '0812-3456-7890',
          whatsapp: '6281234567890',
          email: 'halo@gcc-web.id',
          address: 'Jl. Contoh Raya No. 1',
          city: 'Jakarta Selatan',
          district: 'Kebayoran Baru',
          serviceAreas: [
            'Jakarta Selatan',
            'Jakarta Pusat',
            'Jakarta Barat',
            'Depok',
            'Tangerang Selatan',
          ],
          hours: 'Senin–Sabtu, 08.00–17.00',
          instagram: '',
        },
      },
      {
        key: 'payment',
        value: {
          bankName: 'BCA',
          bankAccount: '0000000000',
          accountName: 'GCC Web',
          note: 'Konfirmasi bukti transfer melalui WhatsApp agar pesanan segera diproses.',
        },
      },
    ],
  });

  console.log('');
  console.log('Seed selesai.');
  console.log(`Admin     : admin@gcc-web.id / ${adminPassword}`);
  console.log(`Teknisi   : budi@gcc-web.id / ${techPassword}`);
  console.log(`Pesanan   : ${createdBookings.length} contoh, kode ${createdBookings[0].code}`);
  console.log('Catatan   : nama, nomor telepon, dan testimoni adalah placeholder.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
