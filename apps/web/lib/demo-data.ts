import type {
  AdminBooking,
  AvailabilityResponse,
  DashboardData,
  InventoryItem,
  Service,
  ServiceCategory,
  SiteSettings,
  StockMovement,
  Technician,
  Testimonial,
  TrackedBooking,
} from './types';
import { addDaysISO, jakartaISOFromDate, jakartaTodayISO, slotLabel, STATUS_LABEL, TIME_SLOT_LABEL } from './format';

const cat = (id: string) => id;

export const demoCategories: ServiceCategory[] = [
  {
    id: cat('cat-servis-ac'),
    slug: 'servis-ac',
    name: 'Servis & Perawatan AC',
    description:
      'Cuci AC, isi freon, dan bongkar pasang untuk AC split, cassette, dan floor standing.',
    services: [
      {
        id: 'svc-cuci-ac',
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
        variants: [
          { id: 'var-cuci-1pk', name: 'AC 0,5–1 PK', price: 75000, durationMinutes: 60, sortOrder: 1 },
          { id: 'var-cuci-15pk', name: 'AC 1,5–2 PK', price: 95000, durationMinutes: 75, sortOrder: 2 },
          { id: 'var-cuci-cassette', name: 'Cassette / Floor Standing', price: 150000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
      {
        id: 'svc-isi-freon',
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
        variants: [
          { id: 'var-freon-r32', name: 'Freon R32', price: 250000, durationMinutes: 90, sortOrder: 1 },
          { id: 'var-freon-r410', name: 'Freon R410A', price: 300000, durationMinutes: 90, sortOrder: 2 },
          { id: 'var-freon-r22', name: 'Freon R22', price: 275000, durationMinutes: 90, sortOrder: 3 },
        ],
      },
      {
        id: 'svc-bongkar-pasang',
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
        variants: [
          { id: 'var-pasang-baru', name: 'Pasang unit baru', price: 350000, durationMinutes: 180, sortOrder: 1 },
          { id: 'var-bongkar', name: 'Bongkar unit lama', price: 200000, durationMinutes: 90, sortOrder: 2 },
          { id: 'var-bongkar-pasang', name: 'Bongkar + pasang', price: 500000, durationMinutes: 240, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: cat('cat-elektronik'),
    slug: 'elektronik-rumah',
    name: 'Elektronik Rumah',
    description:
      'Perbaikan kulkas, mesin cuci, dan TV dengan pemeriksaan di tempat dan garansi pekerjaan.',
    services: [
      {
        id: 'svc-kulkas',
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
        variants: [
          { id: 'var-kulkas-diagnosa', name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { id: 'var-kulkas-bocor', name: 'Perbaikan kebocoran freon', price: 450000, durationMinutes: 120, sortOrder: 2 },
          { id: 'var-kulkas-kompresor', name: 'Ganti kompresor', price: 900000, durationMinutes: 180, sortOrder: 3 },
        ],
      },
      {
        id: 'svc-mesin-cuci',
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
        variants: [
          { id: 'var-mesin-diagnosa', name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { id: 'var-mesin-seal', name: 'Perbaikan tabung & seal', price: 400000, durationMinutes: 150, sortOrder: 2 },
          { id: 'var-mesin-modul', name: 'Ganti modul / board', price: 550000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
      {
        id: 'svc-tv',
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
        variants: [
          { id: 'var-tv-diagnosa', name: 'Pemeriksaan & diagnosa', price: 150000, durationMinutes: 60, sortOrder: 1 },
          { id: 'var-tv-32', name: 'TV LED 32–43 inci', price: 200000, durationMinutes: 90, sortOrder: 2 },
          { id: 'var-tv-50', name: 'TV LED 50 inci ke atas', price: 350000, durationMinutes: 120, sortOrder: 3 },
        ],
      },
    ],
  },
];

export const demoServices: Service[] = demoCategories.flatMap((category) => category.services);

export function findDemoService(slug: string): Service | undefined {
  return demoServices.find((service) => service.slug === slug);
}

export const demoTestimonials: Testimonial[] = [
  {
    id: 't-1',
    customerName: 'Dimas Nugroho',
    customerMeta: 'Kembangan, Jakarta Barat · Cuci AC',
    rating: 5,
    content:
      'Teknisi datang tepat waktu, memasang penutup lantai sebelum bekerja, dan menjelaskan kondisi unit. Setelah dicuci, AC kamar jauh lebih dingin dan tidak berbau.',
    createdAt: '2026-10-20T04:00:00.000Z',
    service: { name: 'Cuci AC', slug: 'cuci-ac' },
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 't-2',
    customerName: 'Sari Wulandari',
    customerMeta: 'Beji, Depok · Cuci AC',
    rating: 5,
    content:
      'Pesan lewat website jam sembilan pagi, sorenya sudah dikonfirmasi untuk besok. Hasil cuci AC rapi, air tidak menetes lagi ke dinding.',
    createdAt: '2026-10-11T04:00:00.000Z',
    service: { name: 'Cuci AC', slug: 'cuci-ac' },
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 't-3',
    customerName: 'Maya Ramadhani',
    customerMeta: 'Cempaka Putih, Jakarta Pusat · Bongkar Pasang AC',
    rating: 5,
    content:
      'Bongkar pasang dua unit untuk pindahan. Pipa dan kabel dirapikan, vakum dilakukan sebelum dinyalakan. Biaya sesuai yang dijanjikan di awal.',
    createdAt: '2026-09-28T04:00:00.000Z',
    service: { name: 'Bongkar Pasang AC', slug: 'bongkar-pasang-ac' },
    isPublished: true,
    isFeatured: true,
  },
  {
    id: 't-4',
    customerName: 'Hendra Saputra',
    customerMeta: 'BSD Serpong, Tangerang Selatan · Perbaikan Kulkas',
    rating: 4,
    content:
      'Kulkas showroom sempat mati total. Penjelasan penyebabnya jelas dan sparepart yang diganti ditunjukkan. Perlu satu hari menunggu part, tapi komunikasinya bagus.',
    createdAt: '2026-09-19T04:00:00.000Z',
    service: { name: 'Perbaikan Kulkas', slug: 'perbaikan-kulkas' },
    isPublished: true,
    isFeatured: false,
  },
  {
    id: 't-5',
    customerName: 'Andi Prakoso',
    customerMeta: 'Menteng, Jakarta Pusat · Isi Freon AC',
    rating: 5,
    content:
      'Freon R410A diisi setelah dicek kebocorannya. Tidak langsung diisi begitu saja, jadi lebih tenang. Sudah sebulan dan masih dingin.',
    createdAt: '2026-09-02T04:00:00.000Z',
    service: { name: 'Isi Freon AC', slug: 'isi-freon-ac' },
    isPublished: true,
    isFeatured: false,
  },
  {
    id: 't-6',
    customerName: 'Rina Kartika',
    customerMeta: 'Pamulang, Tangerang Selatan · Perbaikan Mesin Cuci',
    rating: 5,
    content:
      'Hanya menunggu satu hari setelah booking. Modul diganti dan mesin diuji sampai selesai satu siklus sebelum teknisinya pulang.',
    createdAt: '2026-10-18T04:00:00.000Z',
    service: { name: 'Perbaikan Mesin Cuci', slug: 'perbaikan-mesin-cuci' },
    isPublished: false,
    isFeatured: false,
  },
];

export const demoTechnicians: Technician[] = [
  {
    id: 'tech-budi',
    name: 'Budi Santoso',
    email: 'budi@gcc-web.id',
    phone: '6281200000002',
    isActive: true,
    zone: 'Jakarta Selatan · Kebayoran, Cilandak, Pasar Minggu',
    specialties: ['Cuci AC', 'Isi freon', 'Bongkar pasang AC'],
    capacityPerDay: 4,
    isAvailable: true,
    workload: 2,
    remaining: 2,
  },
  {
    id: 'tech-rizky',
    name: 'Rizky Pratama',
    email: 'rizky@gcc-web.id',
    phone: '6281200000003',
    isActive: true,
    zone: 'Jakarta Pusat · Menteng, Tanah Abang, Kemayoran',
    specialties: ['Kulkas', 'Mesin cuci', 'Freon R32 & R410A'],
    capacityPerDay: 3,
    isAvailable: true,
    workload: 1,
    remaining: 2,
  },
  {
    id: 'tech-dedi',
    name: 'Dedi Kurniawan',
    email: 'dedi@gcc-web.id',
    phone: '6281200000004',
    isActive: true,
    zone: 'Depok · Beji, Margonda, Cinere',
    specialties: ['AC', 'TV LED', 'Instalasi listrik rumah'],
    capacityPerDay: 4,
    isAvailable: true,
    workload: 2,
    remaining: 2,
  },
  {
    id: 'tech-agus',
    name: 'Agus Setiawan',
    email: 'agus@gcc-web.id',
    phone: '6281200000005',
    isActive: true,
    zone: 'Tangerang Selatan · BSD, Bintaro, Pamulang',
    specialties: ['AC cassette', 'Kulkas dua pintu', 'Mesin cuci front loading'],
    capacityPerDay: 3,
    isAvailable: false,
    workload: 0,
    remaining: 3,
  },
];

export const demoInventory: InventoryItem[] = [
  { id: 'inv-1', sku: 'FRN-R32', name: 'Freon R32', category: 'Freon', unit: 'kg', quantity: 8, minQuantity: 3, costPrice: 95000, isActive: true },
  { id: 'inv-2', sku: 'FRN-R410A', name: 'Freon R410A', category: 'Freon', unit: 'kg', quantity: 6, minQuantity: 3, costPrice: 120000, isActive: true },
  { id: 'inv-3', sku: 'FRN-R22', name: 'Freon R22', category: 'Freon', unit: 'kg', quantity: 4, minQuantity: 4, costPrice: 110000, isActive: true },
  { id: 'inv-4', sku: 'CAP-25', name: 'Kapasitor AC 25 µF', category: 'Sparepart', unit: 'pcs', quantity: 10, minQuantity: 5, costPrice: 45000, isActive: true },
  { id: 'inv-5', sku: 'CAP-35', name: 'Kapasitor AC 35 µF', category: 'Sparepart', unit: 'pcs', quantity: 5, minQuantity: 4, costPrice: 55000, isActive: true },
  { id: 'inv-6', sku: 'PIPA-14', name: 'Pipa tembaga 1/4 inci', category: 'Bahan', unit: 'meter', quantity: 25, minQuantity: 10, costPrice: 38000, isActive: true },
  { id: 'inv-7', sku: 'PIPA-38', name: 'Pipa tembaga 3/8 inci', category: 'Bahan', unit: 'meter', quantity: 18, minQuantity: 8, costPrice: 52000, isActive: true },
  { id: 'inv-8', sku: 'SELANG-AC', name: 'Selang drainase AC', category: 'Bahan', unit: 'meter', quantity: 15, minQuantity: 5, costPrice: 12000, isActive: true },
  { id: 'inv-9', sku: 'FLT-DRY', name: 'Filter dryer', category: 'Sparepart', unit: 'pcs', quantity: 6, minQuantity: 3, costPrice: 65000, isActive: true },
  { id: 'inv-10', sku: 'RM-AC', name: 'Remote AC universal', category: 'Sparepart', unit: 'pcs', quantity: 3, minQuantity: 5, costPrice: 85000, isActive: true },
  { id: 'inv-11', sku: 'KABEL-315', name: 'Kabel 3×1,5 mm', category: 'Bahan', unit: 'meter', quantity: 40, minQuantity: 15, costPrice: 18000, isActive: true },
  { id: 'inv-12', sku: 'PCB-MC', name: 'Modul mesin cuci universal', category: 'Sparepart', unit: 'pcs', quantity: 2, minQuantity: 2, costPrice: 310000, isActive: true },
  { id: 'inv-13', sku: 'BRN-AC', name: 'Bracket outdoor AC', category: 'Sparepart', unit: 'set', quantity: 7, minQuantity: 4, costPrice: 95000, isActive: true },
  { id: 'inv-14', sku: 'TOOL-VAC', name: 'Vacuum pump 1/4 PK', category: 'Peralatan', unit: 'unit', quantity: 2, minQuantity: 1, costPrice: 1850000, isActive: true },
].map((item) => ({ ...item, isLowStock: item.quantity <= item.minQuantity }));

export const demoStockMovements: StockMovement[] = [
  { id: 'sm-1', type: 'OUT', quantity: -2, note: 'Dipakai untuk pesanan GCC-DEMO-D001', createdAt: new Date().toISOString(), createdBy: { name: 'GCC Admin' }, booking: { code: 'GCC-DEMO-D001' } },
  { id: 'sm-2', type: 'IN', quantity: 10, note: 'Pembelian dari supplier', createdAt: new Date(Date.now() - 86400000).toISOString(), createdBy: { name: 'GCC Admin' } },
  { id: 'sm-3', type: 'ADJUSTMENT', quantity: -1, note: 'Stok opname mingguan', createdAt: new Date(Date.now() - 172800000).toISOString(), createdBy: { name: 'GCC Admin' } },
];

export const demoSettings: SiteSettings = {
  business: {
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
  payment: {
    bankName: 'BCA',
    bankAccount: '0000000000',
    accountName: 'GCC Web',
    note: 'Konfirmasi bukti transfer melalui WhatsApp agar pesanan segera diproses.',
  },
};

function demoBooking(
  id: string,
  codeSuffix: string,
  offsetDays: number,
  slot: string,
  customer: { name: string; phone: string; address: string; city: string; district: string },
  service: string,
  variant: string | null,
  status: AdminBooking['status'],
  paymentStatus: AdminBooking['paymentStatus'],
  technician: string | null,
  total: number,
  extra: Partial<AdminBooking> = {},
): AdminBooking {
  const dateISO = addDaysISO(jakartaTodayISO(), offsetDays);
  const start = slot.split('-')[0];
  const scheduledAt = new Date(`${dateISO}T${start}:00+07:00`).toISOString();
  return {
    id,
    code: `GCC-${dateISO.slice(2).replace(/-/g, '')}-${codeSuffix}`,
    status,
    paymentStatus,
    paymentMethod: paymentStatus === 'PAID' ? 'TRANSFER' : null,
    source: 'WEBSITE',
    scheduledAt,
    slotLabel: slot,
    durationMinutes: 90,
    propertyType: 'RUMAH',
    address: customer.address,
    city: customer.city,
    district: customer.district,
    postalCode: null,
    notes: null,
    unitCount: 1,
    basePrice: total,
    addOnTotal: 0,
    discount: 0,
    total,
    paymentRef: null,
    paidAt: paymentStatus === 'PAID' ? scheduledAt : null,
    completedAt: status === 'COMPLETED' ? scheduledAt : null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      district: customer.district,
    },
    service: { name: service },
    variant: variant ? { name: variant } : null,
    technician: technician
      ? { id: demoTechnicians.find((tech) => tech.name === technician)?.id ?? 'tech-budi', name: technician }
      : null,
    history: [
      {
        status: 'PENDING',
        note: 'Pesanan dibuat melalui website.',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        changedBy: { name: 'GCC Admin' },
      },
    ],
    ...extra,
  };
}

export function getDemoBookings(): AdminBooking[] {
  const bookings = [
    demoBooking(
      'bk-001',
      'D001',
      0,
      '08:00-10:00',
      {
        name: 'Ayu Lestari',
        phone: '6281311110001',
        address: 'Jl. Melati No. 12, RT 03/RW 05',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
      'Cuci AC',
      'AC 0,5–1 PK',
      'IN_PROGRESS',
      'PAID',
      'Budi Santoso',
      150000,
      { unitCount: 2, paymentMethod: 'CASH', notes: 'Gate kompleks, hubungi sebelum masuk.' },
    ),
    demoBooking(
      'bk-002',
      'D002',
      0,
      '10:00-12:00',
      {
        name: 'Dimas Nugroho',
        phone: '6281311110002',
        address: 'Apartemen Green Park View Tower B, Lantai 17',
        city: 'Jakarta Barat',
        district: 'Kembangan',
      },
      'Isi Freon AC',
      'Freon R32',
      'ASSIGNED',
      'UNPAID',
      'Rizky Pratama',
      250000,
      { propertyType: 'APARTEMEN', notes: 'AC kamar utama kurang dingin sejak seminggu terakhir.' },
    ),
    demoBooking(
      'bk-003',
      'D003',
      0,
      '13:00-15:00',
      {
        name: 'Sari Wulandari',
        phone: '6281311110003',
        address: 'Jl. Kenanga Raya No. 8',
        city: 'Depok',
        district: 'Beji',
      },
      'Bongkar Pasang AC',
      'Bongkar + pasang',
      'CONFIRMED',
      'UNPAID',
      null,
      500000,
      { notes: 'Pindah unit dari kamar belakang ke ruang tamu.' },
    ),
    demoBooking(
      'bk-004',
      'D004',
      0,
      '15:00-17:00',
      {
        name: 'Hendra Saputra',
        phone: '6281311110004',
        address: 'Ruko Boulevard Raya Blok C No. 5',
        city: 'Tangerang Selatan',
        district: 'BSD Serpong',
      },
      'Perbaikan Kulkas',
      'Pemeriksaan & diagnosa',
      'PENDING',
      'UNPAID',
      null,
      150000,
      { propertyType: 'RUKO', notes: 'Kulkas showroom, mohon bawa alat ukur freon.' },
    ),
    demoBooking(
      'bk-005',
      'D005',
      1,
      '08:00-10:00',
      {
        name: 'Maya Ramadhani',
        phone: '6281311110005',
        address: 'Jl. Cempaka Putih Tengah No. 21',
        city: 'Jakarta Pusat',
        district: 'Cempaka Putih',
      },
      'Cuci AC',
      'AC 1,5–2 PK',
      'PENDING',
      'UNPAID',
      null,
      285000,
      { unitCount: 3 },
    ),
    demoBooking(
      'bk-006',
      'D006',
      1,
      '10:00-12:00',
      {
        name: 'Fajar Hidayat',
        phone: '6281311110006',
        address: 'Jl. Margonda Raya No. 45, Gang Dahlia',
        city: 'Depok',
        district: 'Beji',
      },
      'Perbaikan Mesin Cuci',
      'Ganti modul / board',
      'ASSIGNED',
      'UNPAID',
      'Dedi Kurniawan',
      550000,
      { notes: 'Mesin cuci front loading berhenti di tengah siklus.' },
    ),
    demoBooking(
      'bk-007',
      'D007',
      2,
      '08:00-10:00',
      {
        name: 'Ayu Lestari',
        phone: '6281311110001',
        address: 'Jl. Melati No. 12, RT 03/RW 05',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
      'Perbaikan TV',
      'TV LED 50 inci ke atas',
      'CONFIRMED',
      'UNPAID',
      null,
      350000,
    ),
    demoBooking(
      'bk-008',
      'D008',
      -1,
      '10:00-12:00',
      {
        name: 'Dimas Nugroho',
        phone: '6281311110002',
        address: 'Apartemen Green Park View Tower B, Lantai 17',
        city: 'Jakarta Barat',
        district: 'Kembangan',
      },
      'Cuci AC',
      'AC 0,5–1 PK',
      'COMPLETED',
      'PAID',
      'Budi Santoso',
      150000,
      { unitCount: 2 },
    ),
    demoBooking(
      'bk-009',
      'D009',
      -3,
      '13:00-15:00',
      {
        name: 'Sari Wulandari',
        phone: '6281311110003',
        address: 'Jl. Kenanga Raya No. 8',
        city: 'Depok',
        district: 'Beji',
      },
      'Isi Freon AC',
      'Freon R410A',
      'COMPLETED',
      'PAID',
      'Rizky Pratama',
      300000,
      { paymentMethod: 'CASH' },
    ),
    demoBooking(
      'bk-010',
      'D010',
      -4,
      '15:00-17:00',
      {
        name: 'Hendra Saputra',
        phone: '6281311110004',
        address: 'Ruko Boulevard Raya Blok C No. 5',
        city: 'Tangerang Selatan',
        district: 'BSD Serpong',
      },
      'Bongkar Pasang AC',
      'Bongkar unit lama',
      'CANCELLED',
      'UNPAID',
      null,
      200000,
      { notes: 'Pelanggan menunda renovasi.' },
    ),
  ];

  return bookings.map((booking) => {
    if (booking.status === 'IN_PROGRESS') {
      booking.history = [
        { status: 'PENDING', note: 'Pesanan dibuat melalui website.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'CONFIRMED', note: 'Jadwal dikonfirmasi admin.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'ASSIGNED', note: `Ditugaskan kepada ${booking.technician?.name}.`, createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'EN_ROUTE', note: 'Teknisi dalam perjalanan ke lokasi.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'IN_PROGRESS', note: 'Teknisi tiba dan mulai bekerja.', createdAt: new Date().toISOString(), changedBy: { name: 'GCC Admin' } },
      ];
    }
    if (booking.status === 'COMPLETED') {
      booking.history = [
        { status: 'PENDING', note: 'Pesanan dibuat melalui website.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'CONFIRMED', note: 'Jadwal dikonfirmasi admin.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'ASSIGNED', note: `Ditugaskan kepada ${booking.technician?.name}.`, createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'COMPLETED', note: 'Pekerjaan selesai dan diuji bersama pelanggan.', createdAt: booking.completedAt ?? booking.scheduledAt, changedBy: { name: 'GCC Admin' } },
      ];
    }
    if (booking.status === 'CANCELLED') {
      booking.history = [
        { status: 'PENDING', note: 'Pesanan dibuat melalui website.', createdAt: booking.createdAt, changedBy: { name: 'GCC Admin' } },
        { status: 'CANCELLED', note: 'Pelanggan menjadwalkan ulang.', createdAt: new Date().toISOString(), changedBy: { name: 'GCC Admin' } },
      ];
    }
    return booking;
  });
}

export function getDemoDashboard(range: '7d' | '30d' = '7d'): DashboardData {
  const bookings = getDemoBookings();
  const today = jakartaTodayISO();
  const days = range === '30d' ? 30 : 7;
  const todayBookings = bookings.filter(
    (booking) => jakartaISOFromDate(booking.scheduledAt) === today,
  );
  const todayRevenue = todayBookings
    .filter((booking) => booking.paymentStatus === 'PAID')
    .reduce((sum, booking) => sum + booking.total, 0);
  const dates = Array.from({ length: days }, (_, index) => addDaysISO(today, index - days + 1));
  return {
    generatedAt: new Date().toISOString(),
    range,
    kpis: {
      bookingsToday: todayBookings.length,
      pendingConfirmations: bookings.filter((booking) => booking.status === 'PENDING').length,
      activeJobs: bookings.filter((booking) =>
        ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'].includes(booking.status),
      ).length,
      completedThisMonth: bookings.filter((booking) => booking.status === 'COMPLETED').length,
      revenueThisMonth: bookings
        .filter((booking) => booking.paymentStatus === 'PAID')
        .reduce((sum, booking) => sum + booking.total, 0),
      slotCapacity: 3,
    },
    todaySchedule: todayBookings.map((booking) => ({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      statusLabel: STATUS_LABEL[booking.status],
      paymentStatus: booking.paymentStatus,
      slot: slotLabel(booking.slotLabel),
      scheduledAt: booking.scheduledAt,
      customer: {
        name: booking.customer.name,
        phone: booking.customer.phone,
        district: booking.customer.district,
      },
      service: booking.service.name,
      variant: booking.variant?.name ?? null,
      technician: booking.technician?.name ?? null,
      total: booking.total,
    })),
    recentBookings: bookings.slice(0, 6).map((booking) => ({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      statusLabel: STATUS_LABEL[booking.status],
      paymentStatus: booking.paymentStatus,
      customer: booking.customer.name,
      service: booking.service.name,
      technician: booking.technician?.name ?? null,
      total: booking.total,
      createdAt: booking.createdAt,
    })),
    statusBreakdown: (['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(
      (status) => ({
        status,
        label: STATUS_LABEL[status],
        count: bookings.filter((booking) => booking.status === status).length,
      }),
    ),
    trend: dates.map((date, index) => {
      if (index === dates.length - 1) {
        return { date, bookings: todayBookings.length, revenue: todayRevenue };
      }
      const day = Number(date.slice(-2));
      return {
        date,
        bookings: (day % 5) + 2,
        revenue: 180000 + ((day * 137000) % 820000),
      };
    }),
    lowStock: demoInventory.filter((item) => item.quantity <= item.minQuantity).slice(0, 6),
    pendingTestimonials: demoTestimonials.filter((item) => !item.isPublished).length,
    latestTestimonials: demoTestimonials
      .filter((item) => !item.isPublished)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        customerName: item.customerName,
        rating: item.rating,
        content: item.content,
        createdAt: item.createdAt,
        service: item.service,
      })),
    technicians: demoTechnicians.map((tech) => ({
      id: tech.id,
      name: tech.name,
      zone: tech.zone,
      isAvailable: tech.isAvailable,
      workload: tech.workload ?? 0,
      capacity: tech.capacityPerDay,
    })),
  };
}

export function getDemoAvailability(dateISO: string): AvailabilityResponse {
  const day = Number(dateISO.slice(-2));
  const now = new Date();
  const today = jakartaTodayISO();
  const slots = Object.entries(TIME_SLOT_LABEL).map(([id, label], index) => {
    const capacity = 3;
    const booked = day % 3 === 0 ? (index + day) % 4 : (index + day) % 3;
    const safeBooked = Math.min(booked, capacity);
    const remaining = Math.max(0, capacity - safeBooked);
    const startHour = Number(id.slice(0, 2));
    const isPast =
      dateISO < today ||
      (dateISO === today &&
        (now.getHours() > startHour || (now.getHours() === startHour && now.getMinutes() > 0)));
    return {
      id,
      label,
      start: id.slice(0, 5),
      end: id.slice(6),
      capacity,
      booked: safeBooked,
      remaining,
      available: remaining > 0 && !isPast,
      reason: isPast ? 'Jam ini sudah lewat.' : remaining === 0 ? 'Slot penuh.' : undefined,
    };
  });
  return { date: dateISO, slots };
}

export function demoTrackCode(): string {
  const today = jakartaTodayISO();
  return `GCC-${today.slice(2).replace(/-/g, '')}-D001`;
}

export function getDemoTrackedBooking(code: string): TrackedBooking | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized.endsWith('D001')) return null;
  const booking = getDemoBookings()[0];
  return {
    code: normalized,
    status: 'IN_PROGRESS',
    statusLabel: 'Sedang dikerjakan',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    scheduledAt: booking.scheduledAt,
    slotLabel: slotLabel(booking.slotLabel),
    createdAt: booking.createdAt,
    total: booking.total,
    city: booking.city,
    district: booking.district,
    service: { name: booking.service.name, slug: 'cuci-ac' },
    variant: booking.variant,
    technician: booking.technician ? { name: booking.technician.name.split(' ')[0] } : null,
    customer: {
      name: booking.customer.name,
      phone: booking.customer.phone,
      address: booking.address,
      postalCode: booking.postalCode,
    },
    notes: booking.notes,
    verified: true,
    history: booking.history.map((entry) => ({
      status: entry.status,
      label: STATUS_LABEL[entry.status],
      note: entry.note,
      createdAt: entry.createdAt,
    })),
  };
}
