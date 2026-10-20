import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GCC Web — Servis AC & Elektronik Rumah',
    short_name: 'GCC Web',
    description:
      'Pesan servis AC dan perbaikan elektronik rumah, lihat harga, dan lacak status pekerjaan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F1EA',
    theme_color: '#0B5D4F',
    lang: 'id',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
