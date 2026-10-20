export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gcc-web.id'
).replace(/\/$/, '');

export const SITE_NAME = 'GCC Web';
export const SITE_TAGLINE = 'Servis AC & elektronik rumah';

export const CONTACT = {
  phone: '0812-3456-7890',
  phoneHref: 'tel:+6281234567890',
  whatsapp: '6281234567890',
  email: 'halo@gcc-web.id',
  address: 'Jl. Contoh Raya No. 1, Kebayoran Baru',
  city: 'Jakarta Selatan',
  hours: 'Senin–Sabtu, 08.00–17.00',
};

export function waLink(message: string): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: '/layanan', label: 'Layanan & harga' },
  { href: '/booking', label: 'Pesan jadwal' },
  { href: '/lacak', label: 'Lacak pesanan' },
  { href: '/area/jakarta-selatan', label: 'Area layanan' },
  { href: '/kontak', label: 'Kontak' },
];

export interface ServiceArea {
  slug: string;
  city: string;
  short: string;
  intro: string;
  neighbourhoods: string[];
  note: string;
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: 'jakarta-selatan',
    city: 'Jakarta Selatan',
    short: 'Kebayoran, Cilandak, Pasar Minggu, Tebet',
    intro:
      'Kantor dan rumah di Jakarta Selatan sering memakai AC hampir sepanjang hari. Debu jalan, polusi, dan pemakaian terus-menerus membuat evaporator cepat kotor. Kami melayani pencucian, pengisian freon, dan bongkar pasang di kawasan ini dengan jadwal yang bisa dipilih langsung dari tiket pemesanan.',
    neighbourhoods: ['Kebayoran Baru', 'Kebayoran Lama', 'Cilandak', 'Pasar Minggu', 'Tebet', 'Mampang Prapatan', 'Pancoran', 'Jagakarsa'],
    note:
      'Untuk apartemen dan perkantoran, tuliskan nama gedung, tower, dan nomor unit pada catatan pesanan agar teknisi tidak tertahan di resepsionis.',
  },
  {
    slug: 'jakarta-pusat',
    city: 'Jakarta Pusat',
    short: 'Menteng, Cempaka Putih, Tanah Abang, Kemayoran',
    intro:
      'Banyak bangunan di Jakarta Pusat memiliki jalur pipa AC yang panjang dan unit outdoor di balkon atau atap. Pemasangan yang tidak vakum dengan benar membuat unit cepat kehilangan performa. Kami memeriksa jalur pipa dan tekanan kerja sebelum menawarkan tindakan, termasuk untuk unit cassette dan floor standing.',
    neighbourhoods: ['Menteng', 'Cempaka Putih', 'Tanah Abang', 'Kemayoran', 'Senen', 'Johar Baru', 'Gambir', 'Sawah Besar'],
    note:
      'Untuk ruko dan kantor, mohon info jam operasional agar teknisi datang saat area kerja sudah bisa diakses.',
  },
  {
    slug: 'jakarta-barat',
    city: 'Jakarta Barat',
    short: 'Kembangan, Kebon Jeruk, Grogol, Cengkareng',
    intro:
      'Wilayah Jakarta Barat banyak dihuni keluarga dengan lebih dari satu unit AC dan peralatan elektronik yang sudah berumur. Selain servis AC, kami menerima perbaikan kulkas, mesin cuci, dan TV di rumah. Pemeriksaan dilakukan di lokasi; bila unit perlu dibawa, estimasi waktu dan biaya dijelaskan lebih dulu.',
    neighbourhoods: ['Kembangan', 'Kebon Jeruk', 'Grogol Petamburan', 'Cengkareng', 'Kalideres', 'Palmerah', 'Taman Sari', 'Tambora'],
    note:
      'Untuk kawasan padat, tuliskan patokan seperti gang, masjid, atau minimarket terdekat. Teknisi akan mengonfirmasi sebelum berangkat.',
  },
  {
    slug: 'depok',
    city: 'Depok',
    short: 'Beji, Margonda, Cinere, Sukmajaya',
    intro:
      'Rumah-rumah di Depok sering memiliki AC yang menyala hanya pada malam hari. Pola pemakaian seperti ini tetap membuat filter dan blower kotor, terutama bila ventilasi ruangan terbatas. Kami melayani cuci AC, isi freon, dan perbaikan elektronik rumah di Beji, Margonda, Cinere, dan sekitarnya.',
    neighbourhoods: ['Beji', 'Margonda', 'Cinere', 'Sukmajaya', 'Pancoran Mas', 'Cimanggis', 'Sawangan', 'Limo'],
    note:
      'Jadwal sore dan akhir pekan lebih cepat penuh. Memesan satu hingga dua hari sebelumnya memberi pilihan slot yang lebih luas.',
  },
  {
    slug: 'tangerang-selatan',
    city: 'Tangerang Selatan',
    short: 'BSD, Bintaro, Pamulang, Serpong',
    intro:
      'Di BSD, Bintaro, dan Pamulang, banyak unit AC dipasang pada rumah baru atau hasil renovasi. Kami membantu pemasangan unit baru, bongkar pasang saat pindahan, serta perawatan rutin. Untuk perumahan dengan akses terbatas, koordinasi dengan petugas keamanan dapat diatur lewat catatan pesanan.',
    neighbourhoods: ['BSD Serpong', 'Bintaro', 'Pamulang', 'Ciputat', 'Serpong Utara', 'Pondok Aren', 'Setu', 'Kranggan'],
    note:
      'Untuk cluster, sertakan nama cluster dan nomor rumah. Bila perlu surat izin masuk, siapkan di resepsionis agar waktu kerja tidak terpotong.',
  },
];

export function findArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((area) => area.slug === slug);
}

export const FAQS = [
  {
    question: 'Berapa lama pengerjaan cuci AC?',
    answer:
      'Satu unit AC split biasanya membutuhkan 45–90 menit, tergantung ukuran dan kondisi unit. Pencucian cassette atau floor standing bisa lebih lama karena bongkar panel dan penampungan air lebih luas. Durasi per varian tertera di halaman layanan, tetapi kondisi di lokasi dapat menambah waktu.',
  },
  {
    question: 'Apakah harga cuci AC sudah termasuk freon?',
    answer:
      'Belum. Cuci AC adalah pekerjaan pembersihan; pengisian freon dihitung terpisah sesuai jenis refrigeran dan jumlah yang dibutuhkan. Sebelum menambah freon, teknisi mengukur tekanan kerja dan memeriksa kebocoran, lalu menjelaskan biayanya untuk Anda setujui.',
  },
  {
    question: 'Bagaimana cara membayar?',
    answer:
      'Pembayaran dapat dilakukan tunai, transfer bank, atau QRIS setelah pekerjaan selesai dan diuji. Untuk pesanan tertentu tersedia pembayaran online melalui Midtrans; bila belum diaktifkan, tiket akan menampilkan opsi transfer manual. Rincian rekening ada di halaman kontak dan pada pesan konfirmasi.',
  },
  {
    question: 'Apa yang dijamin dari pekerjaan ini?',
    answer:
      'Cuci AC bergaransi 7 hari untuk kebersihan dan fungsi, sementara perbaikan kulkas, mesin cuci, dan TV bergaransi 30 hari untuk pekerjaan yang sama. Suku cadang mengikuti garansi distributor. Jika masalah yang sama muncul kembali dalam masa garansi, kami memeriksa ulang tanpa biaya jasa kunjungan.',
  },
  {
    question: 'Bisakah saya mengubah jadwal?',
    answer:
      'Bisa. Hubungi WhatsApp dengan menyertakan kode pesanan dan waktu baru yang diinginkan, minimal 2 jam sebelum slot dimulai. Perubahan tergantung ketersediaan slot pada tanggal tersebut. Anda juga dapat memeriksa status pesanan di halaman lacak.',
  },
  {
    question: 'Bagaimana jika teknisi menemukan kerusakan lain?',
    answer:
      'Teknisi menjelaskan temuan dan biaya tambahan sebelum melanjutkan. Anda bebas menolak pekerjaan tambahan; pekerjaan awal tetap diselesaikan sesuai kesepakatan. Tidak ada biaya yang dinaikkan tanpa persetujuan Anda.',
  },
  {
    question: 'Apakah teknisi membawa tangga dan alat kerja?',
    answer:
      'Ya. Teknisi membawa alat servis, penutup lantai, dan tangga standar. Untuk unit dengan ketinggian di atas 3 meter atau akses yang memerlukan gondola, beri tahu kami saat memesan agar tim dan peralatan disiapkan dengan tepat.',
  },
  {
    question: 'Area mana saja yang dilayani?',
    answer:
      'Area utama kami adalah Jakarta Selatan, Jakarta Pusat, Jakarta Barat, Depok, dan Tangerang Selatan. Jika alamat Anda berada di luar daftar tersebut, kirim lokasi lewat WhatsApp; kami akan mengonfirmasi apakah jadwal dan biaya perjalanan memungkinkan.',
  },
];

export const PAYMENT_METHODS = ['Tunai', 'Transfer bank', 'QRIS', 'Midtrans'];
