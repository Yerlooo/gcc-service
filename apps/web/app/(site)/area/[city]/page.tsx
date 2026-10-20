import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ArrowRight, ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';
import { loadCatalogue } from '@/lib/content';
import { formatRupiah, UNIT_LABEL } from '@/lib/format';
import { longestDuration, startingPrice } from '@/lib/service-utils';
import {
  findArea,
  SERVICE_AREAS,
  SITE_NAME,
  SITE_URL,
  waLink,
} from '@/lib/site';

export const revalidate = 300;

interface AreaPageProps {
  params: Promise<{ city: string }>;
}

export function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ city: area.slug }));
}

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { city } = await params;
  const area = findArea(city);
  if (!area) return { title: 'Area tidak ditemukan' };

  return {
    title: `Servis AC ${area.city} — jadwal teknisi`,
    description: `Servis AC, isi freon, bongkar pasang, dan perbaikan elektronik rumah di ${area.city}. Melayani ${area.neighbourhoods.slice(0, 4).join(', ')}, dan sekitarnya. Cek harga dan pilih jadwal.`,
    alternates: { canonical: `/area/${area.slug}` },
    openGraph: {
      title: `Servis AC ${area.city} · ${SITE_NAME}`,
      description: `Jadwal teknisi dan harga layanan GCC Web untuk ${area.city}.`,
      url: `${SITE_URL}/area/${area.slug}`,
    },
  };
}

export default async function AreaDetailPage({ params }: AreaPageProps) {
  const { city } = await params;
  const area = findArea(city);
  if (!area) notFound();

  const catalogue = await loadCatalogue();
  const services = catalogue.flatMap((category) => category.services);
  const nearest = SERVICE_AREAS.filter((item) => item.slug !== area.slug);

  const lowest = services.length
    ? Math.min(...services.map((service) => startingPrice(service)))
    : 0;

  const areaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Servis AC dan elektronik rumah di ${area.city}`,
    serviceType: 'Servis AC, isi freon, bongkar pasang, perbaikan elektronik rumah',
    description: area.intro,
    url: `${SITE_URL}/area/${area.slug}`,
    areaServed: {
      '@type': 'City',
      name: area.city,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Jabodetabek' },
    },
    provider: { '@id': `${SITE_URL}/#business` },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      lowPrice: lowest,
      offerCount: services.length,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Area layanan', item: `${SITE_URL}/area` },
      {
        '@type': 'ListItem',
        position: 3,
        name: area.city,
        item: `${SITE_URL}/area/${area.slug}`,
      },
    ],
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs
          items={[
            { label: 'Area layanan', href: '/area' },
            { label: area.city },
          ]}
        />
      </div>

      <section className="border-b border-line">
        <div className="frame grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Area layanan</p>
            <h1 className="statement mt-4 max-w-[16ch]">Servis AC di {area.city}.</h1>
            <p className="mt-6 max-w-[54ch] text-[1rem] leading-relaxed text-muted">
              {area.intro}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/booking" className="btn btn-primary px-5">
                Pesan jadwal di {area.city}
                <span className="btn-icon">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
              <a
                href={waLink(`Halo GCC Web, saya ingin bertanya tentang servis di ${area.city}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline py-2"
              >
                <WhatsAppMark className="h-3.5 w-3.5" />
                Tanya ketersediaan
              </a>
            </div>

            <dl className="mt-9 grid max-w-xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Harga mulai</dt>
                <dd className="tabular mt-2 text-[1.05rem] font-bold">
                  {formatRupiah(lowest)}
                </dd>
              </div>
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Slot</dt>
                <dd className="mt-2 text-[1.05rem] font-bold">08–17</dd>
              </div>
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Garansi</dt>
                <dd className="mt-2 text-[1.05rem] font-bold">7–30 hari</dd>
              </div>
            </dl>
          </div>

          <aside className="lg:col-span-5">
            <div className="ticket p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="meta text-teal">Cakupan wilayah</p>
                  <p className="mt-1 text-[0.76rem] text-muted">{area.city}</p>
                </div>
                <span className="ticket-code border border-line px-2 py-1 text-[0.56rem] text-muted">
                  GCC — AREA
                </span>
              </div>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <ul className="grid grid-cols-2 gap-x-4">
                {area.neighbourhoods.map((neighbourhood) => (
                  <li
                    key={neighbourhood}
                    className="border-b border-line py-2 text-[0.78rem] last:border-b-0"
                  >
                    {neighbourhood}
                  </li>
                ))}
              </ul>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <p className="text-[0.74rem] leading-relaxed text-muted">{area.note}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="frame py-12 lg:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink pt-5">
          <div>
            <p className="meta text-muted">Layanan di {area.city}</p>
            <h2 className="h2 mt-3">Harga awal, semua layanan.</h2>
          </div>
          <Link href="/layanan" className="link-underline">
            Daftar harga lengkap
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-7 border-t border-line">
          {services.map((service, index) => (
            <article
              key={service.id}
              className="grid gap-3 border-b border-line py-4 sm:grid-cols-12 sm:items-center sm:gap-5"
            >
              <div className="sm:col-span-1">
                <span className="meta text-muted">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="sm:col-span-5">
                <h3 className="text-[0.95rem] font-semibold">
                  <Link href={`/layanan/${service.slug}`} className="hover:text-teal">
                    {service.name}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-1 text-[0.74rem] text-muted">
                  {service.shortDescription}
                </p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-[0.7rem] text-muted">
                  ± {longestDuration(service)} menit · per{' '}
                  {UNIT_LABEL[service.unit]} · garansi {service.warrantyDays} hari
                </p>
              </div>
              <div className="sm:col-span-2 sm:text-right">
                <p className="text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                  Mulai
                </p>
                <p className="tabular text-[0.9rem] font-semibold">
                  {formatRupiah(startingPrice(service))}
                </p>
              </div>
              <div className="sm:col-span-1 sm:text-right">
                <Link
                  href={`/booking?service=${service.slug}`}
                  aria-label={`Pesan ${service.name} di ${area.city}`}
                  className="inline-flex h-8 w-8 items-center justify-center border border-line transition-colors hover:border-teal hover:text-teal"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 max-w-[70ch] text-[0.72rem] leading-relaxed text-muted">
          Harga per unit dan belum termasuk suku cadang. Biaya tambahan—misalnya
          pengisian freon atau penggantian komponen—dijelaskan sebelum pekerjaan
          dilanjutkan.
        </p>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-8 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-4">
            <p className="meta text-muted">Catatan setempat</p>
            <h2 className="h2 mt-3 max-w-[14ch]">Agar hari kerja tidak terpotong.</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[64ch] border-l-2 border-teal bg-teal-soft/45 px-4 py-4 text-[0.9rem] leading-relaxed">
              {area.note}
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: 'Alamat yang jelas',
                  body: 'Sertakan nama gedung, nomor unit, lantai, dan patokan. Teknisi menghubungi sebelum berangkat.',
                },
                {
                  title: 'Akses unit',
                  body: 'Pastikan stopkontak, balkon, dan area kerja dapat dijangkau. Untuk unit tinggi, beri tahu saat memesan.',
                },
                {
                  title: 'Konfirmasi perubahan',
                  body: 'Perubahan jadwal minimal 2 jam sebelum slot lewat WhatsApp dengan kode tiket.',
                },
              ].map((item) => (
                <div key={item.title} className="border-t border-line pt-3">
                  <h3 className="text-[0.84rem] font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {nearest.length > 0 ? (
        <section className="frame py-12 lg:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-line pt-5">
            <div>
              <p className="meta text-muted">Wilayah lain</p>
              <h2 className="h2 mt-3">Tetap di sekitar Anda.</h2>
            </div>
            <Link href="/area" className="link-underline">
              Semua area
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {nearest.map((item) => (
              <Link
                key={item.slug}
                href={`/area/${item.slug}`}
                className="group bg-bone p-4 transition-colors duration-500 hover:bg-paper"
              >
                <p className="meta text-muted">{item.neighbourhoods.length} kecamatan</p>
                <h3 className="mt-2 text-[0.95rem] font-bold">{item.city}</h3>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                  {item.short}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold">
                  Lihat area
                  <ArrowUpRight className="h-3 w-3 transition-transform duration-500 ease-stage group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="frame pb-16">
        <div className="flex flex-col items-start justify-between gap-5 bg-teal p-6 text-bone sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="meta text-bone/60">Jadwal {area.city}</p>
            <h2 className="mt-2 text-[1.35rem] font-bold tracking-[-0.02em] sm:text-[1.6rem]">
              Pilih slot, kami konfirmasi.
            </h2>
            <p className="mt-2 max-w-[48ch] text-[0.82rem] leading-relaxed text-bone/75">
              Slot ditampilkan per tanggal. Bila semua penuh, kirim pesan untuk
              masuk daftar tunggu.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/booking" className="btn bg-bone px-5 text-ink hover:bg-paper">
              Pesan jadwal
              <span className="btn-icon bg-ink/5">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
            <a
              href={waLink(`Halo GCC Web, saya ingin bertanya tentang jadwal di ${area.city}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-bone/30 px-4 text-bone hover:bg-bone/10"
            >
              <WhatsAppMark className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(areaJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
