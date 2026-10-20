import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { loadCatalogue } from '@/lib/content';
import { getUpcomingDates } from '@/lib/format';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pesan jadwal servis',
  description:
    'Pilih layanan, tanggal, dan jam kedatangan teknisi AC atau elektronik rumah. Isi alamat, kirim permintaan, lalu konfirmasi lewat WhatsApp.',
  alternates: { canonical: '/booking' },
  openGraph: {
    title: `Pesan jadwal servis · ${SITE_NAME}`,
    description:
      'Formulir pesanan GCC Web: layanan, jadwal, alamat, dan estimasi biaya dalam satu alur.',
    url: `${SITE_URL}/booking`,
  },
  robots: { index: true, follow: true },
};

export default async function BookingPage() {
  const [categories, dates] = await Promise.all([
    loadCatalogue(),
    Promise.resolve(getUpcomingDates(7)),
  ]);

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Pesan jadwal' }]} />
      </div>

      <header className="border-b border-line">
        <div className="frame grid gap-6 py-10 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-12">
          <div className="lg:col-span-8">
            <p className="meta text-muted">Quick booking</p>
            <h1 className="statement mt-3 max-w-[22ch] text-[2.1rem] sm:text-[2.6rem]">
              Pilih layanan, lalu jadwal.
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="max-w-[40ch] text-[0.88rem] leading-relaxed text-muted">
              Empat langkah singkat. Harga awal terlihat sejak awal, dan admin
              mengonfirmasi ketersediaan teknisi lewat WhatsApp.
            </p>
            <p className="mt-3 text-[0.7rem] text-muted">
              Estimasi dikirim tanpa pembayaran di muka.
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<BookingSkeleton />}>
        <BookingFlow categories={categories} dates={dates} />
      </Suspense>
    </>
  );
}

function BookingSkeleton() {
  return (
    <section className="frame py-8 lg:py-12" aria-label="Memuat formulir pesanan">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 lg:grid-cols-1">
            {['Layanan', 'Jadwal', 'Data', 'Konfirmasi'].map((label, index) => (
              <div key={label} className="flex items-center gap-3 bg-bone px-3 py-3">
                <span className="flex h-7 w-7 items-center justify-center border border-line text-[0.65rem] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[0.8rem] text-muted">{label}</span>
              </div>
            ))}
          </div>
          <div className="ticket mt-6 hidden p-4 lg:block">
            <div className="h-2.5 w-20 animate-pulse bg-line" />
            <div className="mt-5 h-4 w-32 animate-pulse bg-line" />
            <div className="mt-3 h-3 w-24 animate-pulse bg-line" />
            <div className="mt-6 space-y-3">
              <div className="h-3 w-full animate-pulse bg-line" />
              <div className="h-3 w-5/6 animate-pulse bg-line" />
              <div className="h-3 w-2/3 animate-pulse bg-line" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="border border-line bg-paper">
            <div className="border-b border-line px-5 py-5 sm:px-7">
              <div className="h-2.5 w-24 animate-pulse bg-line" />
              <div className="mt-3 h-5 w-64 max-w-full animate-pulse bg-line" />
            </div>
            <div className="space-y-4 px-5 py-7 sm:px-7">
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-20 border border-line bg-bone" />
                ))}
              </div>
              <div className="h-11 w-full border border-line bg-bone" />
            </div>
            <div className="flex justify-between border-t border-line px-5 py-4 sm:px-7">
              <div className="h-9 w-20 bg-surface" />
              <div className="h-9 w-32 bg-surface" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
