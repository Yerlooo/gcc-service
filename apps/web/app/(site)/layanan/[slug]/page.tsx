import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ArrowRight, ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';
import { demoCategories } from '@/lib/demo-data';
import { loadCatalogue, loadService } from '@/lib/content';
import { getServiceContent } from '@/lib/service-content';
import { formatRupiah, TIMELINE_STEPS, UNIT_LABEL } from '@/lib/format';
import { longestDuration, startingPrice } from '@/lib/service-utils';
import { FAQS, SITE_NAME, SITE_URL, waLink } from '@/lib/site';

export const revalidate = 300;

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return demoCategories.flatMap((category) =>
    category.services.map((service) => ({ slug: service.slug })),
  );
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await loadService(slug);
  if (!service) return { title: 'Layanan tidak ditemukan' };

  const price = startingPrice(service);
  return {
    title: `${service.name} — mulai ${formatRupiah(price)}`,
    description: `${service.shortDescription} Harga mulai ${formatRupiah(price)} per ${UNIT_LABEL[service.unit]}, garansi ${service.warrantyDays} hari. Melayani Jakarta, Depok, dan Tangerang Selatan.`,
    alternates: { canonical: `/layanan/${service.slug}` },
    openGraph: {
      title: `${service.name} · ${SITE_NAME}`,
      description: service.shortDescription,
      url: `${SITE_URL}/layanan/${service.slug}`,
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const [service, catalogue] = await Promise.all([
    loadService(slug),
    loadCatalogue(),
  ]);
  if (!service) notFound();

  const category = catalogue.find((item) =>
    item.services.some((entry) => entry.id === service.id),
  );
  const content = getServiceContent(service.slug);
  const price = startingPrice(service);
  const related = catalogue
    .flatMap((item) => item.services)
    .filter((item) => item.id !== service.id)
    .slice(0, 3);

  const variants = service.variants.length
    ? service.variants
    : [
        {
          id: service.id,
          name: 'Tarif dasar',
          price: service.basePrice,
          durationMinutes: service.durationMinutes,
          sortOrder: 0,
        },
      ];
  const highestPrice = Math.max(...variants.map((variant) => variant.price));

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.name,
    url: `${SITE_URL}/layanan/${service.slug}`,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: ['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Depok', 'Tangerang Selatan'].map(
      (city) => ({ '@type': 'City', name: city }),
    ),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      lowPrice: price,
      highPrice: highestPrice,
      offerCount: variants.length,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Layanan & harga', item: `${SITE_URL}/layanan` },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.name,
        item: `${SITE_URL}/layanan/${service.slug}`,
      },
    ],
  };

  const relevantFaqs = FAQS.slice(0, 5);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: relevantFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs
          items={[
            { label: 'Layanan & harga', href: '/layanan' },
            { label: service.name },
          ]}
        />
      </div>

      <section className="border-b border-line">
        <div className="frame grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-7">
            <p className="meta text-muted">{category?.name ?? 'Layanan'}</p>
            <h1 className="statement mt-4 max-w-[15ch]">{service.name}</h1>
            <p className="mt-6 max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">
              {service.shortDescription}
            </p>

            <dl className="mt-9 grid max-w-xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Mulai</dt>
                <dd className="tabular mt-2 text-[1.05rem] font-bold leading-tight">
                  {formatRupiah(price)}
                </dd>
              </div>
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Durasi</dt>
                <dd className="mt-2 text-[1.05rem] font-bold leading-tight">
                  ± {longestDuration(service)} mnt
                </dd>
              </div>
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Garansi</dt>
                <dd className="mt-2 text-[1.05rem] font-bold leading-tight">
                  {service.warrantyDays} hari
                </dd>
              </div>
              <div className="bg-bone p-4">
                <dt className="meta text-muted">Satuan</dt>
                <dd className="mt-2 text-[1.05rem] font-bold leading-tight">
                  Per {UNIT_LABEL[service.unit]}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={`/booking?service=${service.slug}`} className="btn btn-primary px-5">
                Pesan layanan ini
                <span className="btn-icon">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
              <a
                href={waLink(`Halo GCC Web, saya ingin bertanya tentang ${service.name}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline py-2"
              >
                <WhatsAppMark className="h-3.5 w-3.5" />
                Tanya tentang layanan ini
              </a>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="ticket p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="meta text-teal">Daftar harga</p>
                  <p className="mt-1 text-[0.7rem] text-muted">{service.name}</p>
                </div>
                <span className="ticket-code border border-line px-2 py-1 text-[0.6rem] text-muted">
                  GCC — PRC
                </span>
              </div>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <dl className="divide-y divide-line">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <dt>
                      <span className="block text-[0.88rem] font-medium">{variant.name}</span>
                      <span className="mt-0.5 block text-[0.68rem] text-muted">
                        ± {variant.durationMinutes} menit
                      </span>
                    </dt>
                    <dd className="tabular shrink-0 text-[0.9rem] font-semibold">
                      {formatRupiah(variant.price)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <p className="text-[0.7rem] leading-relaxed text-muted">
                Harga per {UNIT_LABEL[service.unit]} dan belum termasuk suku cadang.
                Biaya tambahan disepakati sebelum pekerjaan lanjut.
              </p>
              <Link
                href={`/booking?service=${service.slug}`}
                className="btn btn-accent mt-5 w-full"
              >
                Cek jadwal tersedia
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="frame py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Tentang pekerjaan</p>
            <h2 className="h2 mt-4 max-w-[18ch]">Apa yang dikerjakan.</h2>
            <p className="mt-5 max-w-[62ch] text-[0.94rem] leading-relaxed text-muted">
              {service.description}
            </p>

            {content ? (
              <div className="mt-9 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="meta text-muted">Termasuk</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {content.includes.map((item) => (
                      <li key={item} className="py-2.5 text-[0.86rem] leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="meta text-muted">Cocok bila</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {content.signs.map((item) => (
                      <li key={item} className="py-2.5 text-[0.86rem] leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {content ? (
              <p className="mt-8 border-l-2 border-teal bg-teal-soft/45 px-4 py-3 text-[0.82rem] leading-relaxed text-ink/80">
                {content.note}
              </p>
            ) : null}
          </div>

          <div className="lg:col-span-5">
            <p className="meta text-muted">Alur pesanan</p>
            <ol className="mt-4 border-t border-line">
              {TIMELINE_STEPS.map((step, index) => (
                <li
                  key={step.status}
                  className="flex gap-4 border-b border-line py-3.5"
                >
                  <span className="ticket-code pt-0.5 text-[0.62rem] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-[0.86rem] font-semibold">{step.title}</p>
                    <p className="mt-1 text-[0.74rem] leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-4">
            <p className="meta text-muted">Pertanyaan</p>
            <h2 className="h2 mt-4 max-w-[12ch]">Sebelum memesan.</h2>
            <Link href="/kontak" className="link-underline mt-6">
              Hubungi kami
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="lg:col-span-8">
            {relevantFaqs.map((item, index) => (
              <details key={item.question} className="faq" open={index === 0}>
                <summary>
                  <span>{item.question}</span>
                  <span className="faq-mark" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="faq-answer">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="frame py-14 lg:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink pt-5">
          <div>
            <p className="meta text-muted">Layanan lain</p>
            <h2 className="h2 mt-3">Masih ada yang perlu diperiksa?</h2>
          </div>
          <Link href="/layanan" className="link-underline">
            Semua layanan
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/layanan/${item.slug}`}
              className="group bg-bone p-5 transition-colors duration-500 hover:bg-paper"
            >
              <p className="meta text-muted">Mulai {formatRupiah(startingPrice(item))}</p>
              <h3 className="mt-3 text-[1.02rem] font-bold">{item.name}</h3>
              <p className="mt-1.5 text-[0.78rem] leading-relaxed text-muted">
                {item.shortDescription}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.76rem] font-semibold">
                Lihat layanan
                <ArrowUpRight className="h-3 w-3 transition-transform duration-500 ease-stage group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
