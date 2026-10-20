import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { PageIntro } from '@/components/site/PageIntro';
import { ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';
import { formatRupiah, UNIT_LABEL } from '@/lib/format';
import { loadCatalogue } from '@/lib/content';
import { startingPrice, longestDuration } from '@/lib/service-utils';
import { SITE_NAME, SITE_URL, waLink } from '@/lib/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Layanan & harga',
  description:
    'Daftar harga cuci AC, isi freon, bongkar pasang AC, serta perbaikan kulkas, mesin cuci, dan TV. Harga per unit dan varian terlihat sebelum memesan.',
  alternates: { canonical: '/layanan' },
  openGraph: {
    title: `Layanan & harga · ${SITE_NAME}`,
    description:
      'Harga awal per unit, varian lengkap, dan masa garansi untuk setiap layanan GCC Web.',
    url: `${SITE_URL}/layanan`,
  },
};

export default async function ServicesPage() {
  const catalogue = await loadCatalogue();
  const services = catalogue.flatMap((category) => category.services);
  const totalVariants = services.reduce((sum, service) => sum + service.variants.length, 0);
  const lowestPrice = services.length
    ? Math.min(...services.map((service) => startingPrice(service)))
    : 0;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Layanan & harga', item: `${SITE_URL}/layanan` },
    ],
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Layanan & harga' }]} />
      </div>

      <PageIntro
        index="Layanan & harga"
        title={
          <>
            Harga di depan,
            <br />
            sebelum alat dibuka.
          </>
        }
        description={
          <p>
            Setiap layanan punya harga awal per unit dan varian yang bisa dipilih.
            Biaya tambahan—termasuk pengisian freon atau suku cadang—dijelaskan dan
            disetujui sebelum dikerjakan.
          </p>
        }
        actions={
          <>
            <Link href="/booking" className="btn btn-primary px-5">
              Pilih jadwal
              <span className="btn-icon">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
            <a
              href={waLink('Halo GCC Web, saya ingin bertanya tentang layanan dan harga.')}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline py-2"
            >
              <WhatsAppMark className="h-3.5 w-3.5" />
              Tanya dulu
            </a>
          </>
        }
        aside={
          <div className="ticket p-5">
            <p className="meta text-teal">Indeks harga</p>
            <dl className="mt-5 space-y-3 text-[0.82rem]">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-muted">Layanan</dt>
                <dd className="tabular font-semibold">{services.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-muted">Varian harga</dt>
                <dd className="tabular font-semibold">{totalVariants}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-muted">Harga terendah</dt>
                <dd className="tabular font-semibold">{formatRupiah(lowestPrice)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Garansi</dt>
                <dd className="font-semibold">7–30 hari</dd>
              </div>
            </dl>
            <div className="ticket-rule my-4" aria-hidden="true" />
            <p className="text-[0.68rem] leading-relaxed text-muted">
              Harga per unit, belum termasuk suku cadang dan biaya tambahan yang
              disepakati di lokasi.
            </p>
          </div>
        }
      />

      <div className="frame grid gap-12 py-12 lg:grid-cols-12 lg:gap-14 lg:py-20">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-8">
            <p className="meta text-muted">Kategori</p>
            <nav aria-label="Kategori layanan" className="mt-4 border-t border-line">
              {catalogue.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.slug}`}
                  className="flex items-center justify-between gap-4 border-b border-line py-3 text-[0.86rem] transition-colors hover:text-teal"
                >
                  <span>{category.name}</span>
                  <span className="tabular text-[0.68rem] text-muted">
                    {String(category.services.length).padStart(2, '0')}
                  </span>
                </a>
              ))}
            </nav>

            <div className="mt-8 bg-surface p-4">
              <p className="meta text-muted">Cara membaca harga</p>
              <ul className="mt-3 space-y-2.5 text-[0.74rem] leading-relaxed text-muted">
                <li>Harga awal adalah tarif dasar per unit.</li>
                <li>Varian menunjukkan ukuran atau tingkat pekerjaan.</li>
                <li>Biaya tambahan disetujui sebelum dikerjakan.</li>
                <li>Pembayaran setelah pekerjaan diuji.</li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="space-y-16 lg:col-span-9">
          {catalogue.map((category, categoryIndex) => (
            <section key={category.id} id={category.slug} className="scroll-mt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink pt-5">
                <div>
                  <p className="meta text-muted">
                    {String(categoryIndex + 1).padStart(2, '0')} / Kategori
                  </p>
                  <h2 className="h2 mt-3">{category.name}</h2>
                </div>
                <p className="max-w-[38ch] text-[0.82rem] leading-relaxed text-muted">
                  {category.description}
                </p>
              </div>

              <div>
                {category.services.map((service, serviceIndex) => (
                  <article
                    key={service.id}
                    className="grid gap-6 border-b border-line py-8 md:grid-cols-12 md:gap-8"
                  >
                    <div className="md:col-span-7">
                      <div className="flex items-baseline gap-3">
                        <span className="meta text-muted">
                          {String(categoryIndex + 1)}.{serviceIndex + 1}
                        </span>
                        <h3 className="text-[1.3rem] font-bold tracking-[-0.025em]">
                          <Link href={`/layanan/${service.slug}`} className="hover:text-teal">
                            {service.name}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-2 max-w-[52ch] text-[0.86rem] leading-relaxed text-muted">
                        {service.shortDescription}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.7rem] text-muted">
                        <span>± {longestDuration(service)} menit</span>
                        <span>Garansi {service.warrantyDays} hari</span>
                        <span>Per {UNIT_LABEL[service.unit]}</span>
                      </div>
                      <Link
                        href={`/layanan/${service.slug}`}
                        className="link-underline mt-5 text-[0.8rem]"
                      >
                        Detail pekerjaan
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="md:col-span-5">
                      <div className="border border-line bg-paper">
                        <p className="border-b border-line px-4 py-2.5 text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                          Varian &amp; harga
                        </p>
                        <dl className="divide-y divide-line px-4">
                          {(service.variants.length
                            ? service.variants
                            : [
                                {
                                  id: service.id,
                                  name: 'Tarif dasar',
                                  price: service.basePrice,
                                  durationMinutes: service.durationMinutes,
                                },
                              ]
                          ).map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-baseline justify-between gap-4 py-3"
                            >
                              <dt>
                                <span className="block text-[0.8rem] font-medium">
                                  {variant.name}
                                </span>
                                <span className="mt-0.5 block text-[0.65rem] text-muted">
                                  ± {variant.durationMinutes} menit
                                </span>
                              </dt>
                              <dd className="tabular shrink-0 text-[0.84rem] font-semibold">
                                {formatRupiah(variant.price)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <div className="border-t border-line p-3">
                          <Link
                            href={`/booking?service=${service.slug}`}
                            className="btn btn-primary w-full text-[0.8rem]"
                          >
                            Pesan layanan ini
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-8 py-12 md:grid-cols-3 lg:py-16">
          {[
            {
              title: 'Harga awal, bukan harga akhir yang disembunyikan',
              body: 'Biaya tambahan hanya muncul bila ada temuan di lokasi. Anda menerima penjelasannya sebelum pekerjaan lanjut.',
            },
            {
              title: 'Varian sesuai ukuran unit',
              body: 'AC 0,5–1 PK berbeda waktu kerja dengan cassette. Pilih varian agar estimasi dan durasi lebih akurat.',
            },
            {
              title: 'Bayar setelah diuji',
              body: 'Pekerjaan diselesaikan dan diuji bersama Anda. Pembayaran tunai, transfer, atau QRIS dicatat pada tiket.',
            },
          ].map((item, index) => (
            <div key={item.title} className="border-t border-line pt-4">
              <span className="meta text-muted">0{index + 1}</span>
              <h3 className="mt-3 text-[1.02rem] font-bold leading-snug">{item.title}</h3>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
