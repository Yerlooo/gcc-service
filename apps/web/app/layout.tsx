import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SITE_NAME, SITE_TAGLINE, SITE_URL, CONTACT, SERVICE_AREAS } from '@/lib/site';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Servis AC & Elektronik Rumah`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    'Servis AC, isi freon, bongkar pasang, serta perbaikan kulkas, mesin cuci, dan TV. Pilih slot, lihat estimasi harga, dan lacak status pesanan. Melayani Jakarta dan sekitarnya.',
  keywords: [
    'servis AC Jakarta',
    'cuci AC',
    'isi freon AC',
    'bongkar pasang AC',
    'perbaikan kulkas',
    'perbaikan mesin cuci',
    'perbaikan TV',
    'teknisi AC Jakarta Selatan',
    'GCC Web',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Home Services',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Servis AC & Elektronik Rumah`,
    description:
      'Harga terlihat sebelum memesan, jadwal bisa dipilih, dan setiap tahap kerja tercatat. Servis AC dan elektronik rumah di Jakarta, Depok, dan Tangerang Selatan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Servis AC & Elektronik Rumah`,
    description:
      'Pilih slot servis, lihat estimasi harga, dan lacak teknisi dari satu tiket.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#F4F1EA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    description:
      'Layanan servis AC dan perbaikan elektronik rumah dengan pemesanan online, harga transparan, dan pelacakan status pekerjaan.',
    url: SITE_URL,
    telephone: CONTACT.phone,
    email: CONTACT.email,
    priceRange: 'Rp',
    image: `${SITE_URL}/icon.svg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.address,
      addressLocality: CONTACT.city,
      addressRegion: 'DKI Jakarta',
      postalCode: '12130',
      addressCountry: 'ID',
    },
    areaServed: SERVICE_AREAS.map((area) => ({
      '@type': 'City',
      name: area.city,
    })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Layanan GCC Web',
      itemListElement: [
        'Cuci AC',
        'Isi Freon AC',
        'Bongkar Pasang AC',
        'Perbaikan Kulkas',
        'Perbaikan Mesin Cuci',
        'Perbaikan TV',
      ].map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
    slogan: SITE_TAGLINE,
  };

  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        <a className="skip-link" href="#konten">
          Lewati ke konten
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
