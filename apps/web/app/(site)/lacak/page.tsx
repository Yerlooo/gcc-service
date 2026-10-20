import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackBooking } from '@/components/booking/TrackBooking';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Lacak tiket servis',
  description:
    'Cek status pekerjaan servis AC atau elektronik dengan kode tiket GCC. Lihat jadwal, teknisi, dan progres tanpa perlu menelepon.',
  alternates: { canonical: '/lacak' },
  openGraph: {
    title: `Lacak tiket servis · ${SITE_NAME}`,
    description:
      'Masukkan kode tiket untuk melihat status, jadwal, teknisi, dan rincian pesanan.',
    url: `${SITE_URL}/lacak`,
  },
};

export default function TrackPage() {
  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Lacak tiket' }]} />
      </div>

      <header className="border-b border-line">
        <div className="frame grid gap-6 py-10 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-12">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Lacak pesanan</p>
            <h1 className="statement mt-3 max-w-[20ch] text-[2.1rem] sm:text-[2.6rem]">
              Status pekerjaan, tanpa menelepon.
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-[44ch] text-[0.88rem] leading-relaxed text-muted">
              Satu kode untuk melihat jadwal, teknisi yang ditugaskan, dan progres
              pekerjaan. Data alamat hanya terbuka setelah nomor WhatsApp cocok.
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<TrackSkeleton />}>
        <TrackBooking />
      </Suspense>
    </>
  );
}

function TrackSkeleton() {
  return (
    <section className="frame py-8 lg:py-12" aria-label="Memuat formulir pelacakan">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="border border-line bg-paper p-5 sm:p-7">
            <div className="h-2.5 w-24 animate-pulse bg-line" />
            <div className="mt-4 h-6 w-64 max-w-full animate-pulse bg-line" />
            <div className="mt-3 h-3 w-80 max-w-full animate-pulse bg-line" />
            <div className="mt-7 h-2.5 w-20 animate-pulse bg-line" />
            <div className="mt-2 h-11 w-full border border-line bg-bone" />
            <div className="mt-5 h-2.5 w-32 animate-pulse bg-line" />
            <div className="mt-2 h-11 w-full border border-line bg-bone" />
            <div className="mt-6 h-10 w-32 bg-surface" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-full min-h-[18rem] bg-ink/90" />
        </div>
      </div>
    </section>
  );
}
