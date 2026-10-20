import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';
import { SERVICE_AREAS, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Area layanan',
  description:
    'Area layanan GCC Web: Jakarta Selatan, Jakarta Pusat, Jakarta Barat, Depok, dan Tangerang Selatan. Cek kecamatan yang dijangkau dan jadwal teknisi.',
  alternates: { canonical: '/area' },
  openGraph: {
    title: `Area layanan · ${SITE_NAME}`,
    description:
      'Lima wilayah kerja untuk servis AC, isi freon, bongkar pasang, dan perbaikan elektronik rumah.',
    url: `${SITE_URL}/area`,
  },
};

export default function AreasPage() {
  const totalNeighbourhoods = SERVICE_AREAS.reduce(
    (sum, area) => sum + area.neighbourhoods.length,
    0,
  );

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Area layanan ${SITE_NAME}`,
    numberOfItems: SERVICE_AREAS.length,
    itemListElement: SERVICE_AREAS.map((area, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: area.city,
      url: `${SITE_URL}/area/${area.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Area layanan', item: `${SITE_URL}/area` },
    ],
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Area layanan' }]} />
      </div>

      <header className="border-b border-line">
        <div className="frame grid gap-8 py-10 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-14">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Wilayah kerja</p>
            <h1 className="statement mt-3 max-w-[17ch] text-[2.2rem] sm:text-[2.8rem]">
              Lima wilayah, satu standar kerja.
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
              Teknisi berangkat dari titik yang berbeda di setiap wilayah. Jadwal
              yang Anda pilih sudah memperhitungkan jarak, sehingga kedatangan tidak
              bergantung pada antrean di sisi lain kota.
            </p>
            <p className="mt-4 text-[0.72rem] text-muted">
              {SERVICE_AREAS.length} kota · {totalNeighbourhoods} kecamatan tercatat
            </p>
          </div>
        </div>
      </header>

      <section className="frame py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-8">
              <p className="meta text-muted">Cara memilih</p>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-muted">
                Pilih wilayah yang paling dekat dengan alamat Anda. Halaman wilayah
                memuat kecamatan yang dijangkau, layanan yang tersedia, dan catatan
                akses setempat.
              </p>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-[0.75rem] font-semibold">Di luar daftar?</p>
                <p className="mt-1.5 text-[0.74rem] leading-relaxed text-muted">
                  Kirim lokasi lewat WhatsApp. Kami konfirmasi biaya perjalanan
                  sebelum jadwal dibuat.
                </p>
              </div>
              <Link href="/booking" className="btn btn-primary mt-5 w-full px-4 text-[0.8rem]">
                Pesan jadwal
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="border-t border-ink">
              {SERVICE_AREAS.map((area, index) => (
                <Link
                  key={area.slug}
                  href={`/area/${area.slug}`}
                  className="group grid gap-4 border-b border-line py-6 transition-colors duration-500 hover:bg-paper sm:grid-cols-12 sm:items-start sm:gap-6 sm:px-2"
                >
                  <div className="sm:col-span-1">
                    <span className="meta text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="sm:col-span-4">
                    <h2 className="text-[1.3rem] font-bold tracking-[-0.025em] group-hover:text-teal">
                      {area.city}
                    </h2>
                    <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                      {area.neighbourhoods.length} kecamatan
                    </p>
                  </div>
                  <div className="sm:col-span-6">
                    <p className="text-[0.82rem] leading-relaxed text-muted">
                      {area.short}
                    </p>
                    <p className="mt-2 line-clamp-2 max-w-[54ch] text-[0.74rem] leading-relaxed text-muted/85">
                      {area.intro}
                    </p>
                  </div>
                  <div className="flex sm:col-span-1 sm:justify-end">
                    <ArrowRight className="mt-1 h-4 w-4 text-muted transition-transform duration-500 ease-stage group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 grid gap-5 bg-surface p-5 sm:grid-cols-3 sm:p-6">
              <div>
                <p className="meta text-muted">Slot</p>
                <p className="mt-2 text-[0.85rem] font-semibold">08.00–17.00</p>
                <p className="mt-1 text-[0.7rem] text-muted">Empat jendela per hari</p>
              </div>
              <div>
                <p className="meta text-muted">Konfirmasi</p>
                <p className="mt-2 text-[0.85rem] font-semibold">Lewat WhatsApp</p>
                <p className="mt-1 text-[0.7rem] text-muted">Sebelum teknisi berangkat</p>
              </div>
              <div>
                <p className="meta text-muted">Pembayaran</p>
                <p className="mt-2 text-[0.85rem] font-semibold">Setelah diuji</p>
                <p className="mt-1 text-[0.7rem] text-muted">Tunai, transfer, atau QRIS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
