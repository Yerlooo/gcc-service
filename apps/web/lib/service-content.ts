export interface ServiceContent {
  includes: string[];
  signs: string[];
  note: string;
}

export const SERVICE_CONTENT: Record<string, ServiceContent> = {
  'cuci-ac': {
    includes: [
      'Pembongkaran panel dan filter',
      'Pencucian evaporator dan blower',
      'Pembersihan saluran pembuangan',
      'Pengukuran tekanan kerja',
      'Uji suhu dan aliran udara',
    ],
    signs: [
      'Udara kurang dingin',
      'Bau apek saat AC menyala',
      'Air menetes dari unit indoor',
      'AC berisik atau bergetar',
    ],
    note:
      'Untuk unit cassette dan floor standing, waktu kerja lebih lama karena panel dan penampungan air lebih luas. Slot sore lebih cepat penuh.',
  },
  'isi-freon-ac': {
    includes: [
      'Pencocokan jenis refrigeran',
      'Pengukuran tekanan kerja',
      'Pemeriksaan sambungan dan pipa',
      'Pengisian sesuai kebutuhan',
      'Pencatatan jumlah pengisian',
    ],
    signs: [
      'AC menyala tetapi tidak dingin',
      'Pipa tembaga berembun atau membeku',
      'Kompresor bekerja terus-menerus',
      'Freon habis berulang kali',
    ],
    note:
      'Kebocoran yang ditemukan diperbaiki lebih dulu. Tanpa itu, freon baru akan kembali habis dalam waktu singkat.',
  },
  'bongkar-pasang-ac': {
    includes: [
      'Pengukuran jalur dan posisi unit',
      'Pemasangan bracket dan pipa',
      'Vakum pipa sebelum start',
      'Perapian pipa, kabel, dan drainase',
      'Uji operasi unit',
    ],
    signs: [
      'Pindahan rumah atau kantor',
      'Renovasi ruangan',
      'Unit baru belum dipasang',
      'Posisi unit ingin dipindahkan',
    ],
    note:
      'Bongkar dan pasang di hari yang sama dapat dilakukan bila jalur baru sudah siap. Beri tahu bila ada akses khusus di lokasi.',
  },
  'perbaikan-kulkas': {
    includes: [
      'Pemeriksaan kelistrikan dan termostat',
      'Pemeriksaan kompresor dan relay',
      'Deteksi kebocoran freon',
      'Perbaikan atau penggantian komponen',
      'Uji suhu setelah perbaikan',
    ],
    signs: [
      'Tidak dingin sama sekali',
      'Bunga es menumpuk',
      'Kompresor berbunyi terus',
      'Air menetes di bagian bawah',
    ],
    note:
      'Suku cadang tertentu perlu dipesan lebih dulu. Teknisi akan memperkirakan waktu sebelum unit dibongkar.',
  },
  'perbaikan-mesin-cuci': {
    includes: [
      'Pemeriksaan modul dan panel',
      'Pemeriksaan pompa pembuangan',
      'Pemeriksaan karet pintu dan seal',
      'Uji seluruh siklus',
      'Penggantian komponen bila diperlukan',
    ],
    signs: [
      'Tidak berputar atau berhenti di tengah',
      'Air tidak menguras',
      'Bergetar keras saat memutar',
      'Bunyi kasar dari tabung',
    ],
    note:
      'Untuk front loading, alat khusus dipakai agar seal dan tabung tidak rusak saat dibuka.',
  },
  'perbaikan-tv': {
    includes: [
      'Pemeriksaan power supply',
      'Pemeriksaan backlight dan panel',
      'Pemeriksaan mainboard',
      'Perbaikan jalur suara atau gambar',
      'Uji gambar dan suara',
    ],
    signs: [
      'Layar gelap tetapi ada suara',
      'Garis atau bercak di layar',
      'Tidak menyala sama sekali',
      'Suara hilang atau pecah',
    ],
    note:
      'Bila biaya panel melebihi nilai wajar unit, kami akan mengatakannya sebelum pekerjaan dilakukan.',
  },
};

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICE_CONTENT[slug];
}
