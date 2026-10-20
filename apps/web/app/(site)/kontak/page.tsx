import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ContactForm } from '@/components/site/ContactForm';
import { ArrowRight, ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';
import { DEMO_MODE } from '@/lib/api';
import { loadSettings } from '@/lib/content';
import { FAQS, SERVICE_AREAS, SITE_NAME, SITE_URL } from '@/lib/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Kontak & area layanan',
  description:
    'Hubungi GCC Web lewat WhatsApp, telepon, atau email. Lihat jam kerja, metode pembayaran, dan lima area layanan servis AC serta elektronik rumah.',
  alternates: { canonical: '/kontak' },
  openGraph: {
    title: `Kontak & area layanan · ${SITE_NAME}`,
    description:
      'Jalur komunikasi, jam kerja, pembayaran, dan cakupan wilayah GCC Web.',
    url: `${SITE_URL}/kontak`,
  },
};

export default async function ContactPage() {
  const settings = await loadSettings();
  const { business, payment } = settings;
  const whatsappDigits = business.whatsapp.replace(/\D/g, '');

  const waHref = (message: string) =>
    `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;

  const contactFaqs = [FAQS[2], FAQS[4], FAQS[7]];

  const contactMethods: Array<{
    label: string;
    value: string;
    href?: string;
    note: string;
    external?: boolean;
  }> = [
    {
      label: 'WhatsApp',
      value: business.phone,
      href: waHref('Halo GCC Web, saya ingin bertanya tentang servis.'),
      note: 'Jalur tercepat untuk pertanyaan dan konfirmasi jadwal.',
      external: true,
    },
    {
      label: 'Telepon',
      value: business.phone,
      href: `tel:${business.phone.replace(/[^\d+]/g, '')}`,
      note: 'Senin–Sabtu pada jam kerja.',
    },
    {
      label: 'Email',
      value: business.email,
      href: `mailto:${business.email}`,
      note: 'Untuk penawaran, kerja sama, atau dokumen.',
    },
    {
      label: 'Jam kerja',
      value: business.hours,
      note: 'Pesanan di luar jam kerja diproses pada hari kerja berikutnya.',
    },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Kontak', item: `${SITE_URL}/kontak` },
    ],
  };

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Kontak ${SITE_NAME}`,
    url: `${SITE_URL}/kontak`,
    mainEntity: { '@id': `${SITE_URL}/#business` },
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Kontak' }]} />
      </div>

      <header className="border-b border-line">
        <div className="frame grid gap-8 py-10 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-14">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Kontak</p>
            <h1 className="statement mt-3 max-w-[18ch] text-[2.2rem] sm:text-[2.8rem]">
              Bicara dengan orang, bukan bot.
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
              Jelaskan kebutuhan dan lokasi Anda. Kami membalas pada jam kerja,
              biasanya dalam 15 menit. Untuk jadwal pasti, gunakan formulir pesanan
              agar slot langsung tercatat.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <a
                href={waHref('Halo GCC Web, saya ingin bertanya tentang layanan servis.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary px-4"
              >
                <WhatsAppMark className="h-4 w-4" />
                WhatsApp
              </a>
              <a href={`tel:${business.phone.replace(/[^\d+]/g, '')}`} className="link-underline py-2">
                {business.phone}
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="frame py-12 lg:py-16">
        <div className="grid gap-9 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside className="lg:col-span-5">
            <div className="border-t border-ink">
              {contactMethods.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-line py-4"
                >
                  <p className="meta pt-1 text-muted">{item.label}</p>
                  <div>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold hover:text-teal"
                      >
                        {item.value}
                        {item.external ? <ArrowUpRight className="h-3 w-3" /> : null}
                      </a>
                    ) : (
                      <p className="text-[0.9rem] font-semibold">{item.value}</p>
                    )}
                    <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-ink p-5 text-bone">
              <p className="meta text-bone/55">Sebelum menulis</p>
              <h2 className="mt-2 text-[1.1rem] font-semibold leading-snug">
                Dua hal yang bisa selesai tanpa menunggu balasan.
              </h2>
              <div className="mt-4 divide-y divide-bone/15 border-y border-bone/15">
                <Link
                  href="/booking"
                  className="flex items-center justify-between gap-4 py-3 text-[0.82rem] transition-colors hover:text-teal-soft"
                >
                  Pesan jadwal dan lihat slot tersedia
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
                <Link
                  href="/lacak"
                  className="flex items-center justify-between gap-4 py-3 text-[0.82rem] transition-colors hover:text-teal-soft"
                >
                  Lacak status pesanan dengan kode tiket
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
              <p className="mt-4 text-[0.7rem] leading-relaxed text-bone/60">
                Untuk kebocoran air atau unit yang berasap, matikan listrik unit lalu
                telepon kami. Jangan menyalakan ulang sebelum diperiksa.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-9 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-5">
            <p className="meta text-muted">Pembayaran</p>
            <h2 className="h2 mt-3 max-w-[15ch]">Bayar setelah pekerjaan diuji.</h2>
            <p className="mt-4 max-w-[46ch] text-[0.88rem] leading-relaxed text-muted">
              Tidak ada pembayaran di muka dari website. Setelah pekerjaan selesai,
              Anda memeriksa hasilnya bersama teknisi, lalu memilih metode
              pembayaran. Rincian biaya tambahan disepakati sebelum dikerjakan.
            </p>
            <dl className="mt-6 space-y-2 border-t border-line pt-4 text-[0.8rem]">
              {[
                ['Tunai', 'Dibayarkan langsung kepada teknisi.'],
                ['Transfer bank', 'Gunakan nomor rekening yang tertera di tiket.'],
                ['QRIS', 'Pindai kode pada perangkat teknisi.'],
                ['Midtrans', 'Tersedia untuk pesanan tertentu bila diaktifkan.'],
              ].map(([method, note]) => (
                <div key={method} className="flex justify-between gap-4">
                  <dt className="font-medium">{method}</dt>
                  <dd className="text-right text-muted">{note}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="ticket relative p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="meta text-teal">Transfer bank</p>
                  <p className="mt-2 text-[1.2rem] font-bold">{payment.bankName}</p>
                </div>
                <span className="ticket-code border border-line px-2 py-1 text-[0.56rem] text-muted">
                  GCC — PAY
                </span>
              </div>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="meta text-muted">Nomor rekening</dt>
                  <dd className="ticket-code mt-1.5 text-[1.2rem] font-semibold tracking-[0.08em]">
                    {payment.bankAccount}
                  </dd>
                </div>
                <div>
                  <dt className="meta text-muted">Atas nama</dt>
                  <dd className="mt-1.5 text-[0.9rem] font-semibold">
                    {payment.accountName}
                  </dd>
                </div>
              </dl>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <p className="text-[0.76rem] leading-relaxed text-muted">{payment.note}</p>
              {DEMO_MODE ? (
                <p className="mt-3 border border-amber/35 bg-amber/10 px-3 py-2 text-[0.7rem] leading-relaxed">
                  Mode demo: nomor rekening ini adalah contoh. Jangan melakukan
                  transfer sebelum nomor dikonfirmasi admin melalui WhatsApp.
                </p>
              ) : null}
            </div>
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted">
              Selalu cocokkan nama penerima dengan nama bisnis pada tiket. Kami tidak
              pernah meminta kode OTP atau kata sandi melalui telepon.
            </p>
          </div>
        </div>
      </section>

      <section className="frame py-12 lg:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-ink pt-5">
          <div>
            <p className="meta text-muted">Area layanan</p>
            <h2 className="h2 mt-3">Lima wilayah, satu alur pesanan.</h2>
          </div>
          <p className="max-w-[36ch] text-[0.8rem] leading-relaxed text-muted">
            Di luar daftar ini, kirim lokasi lewat WhatsApp. Kami konfirmasi apakah
            jadwal dan biaya perjalanan memungkinkan.
          </p>
        </div>

        <div className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {SERVICE_AREAS.map((area, index) => (
            <Link
              key={area.slug}
              href={`/area/${area.slug}`}
              className="group flex flex-col justify-between bg-bone p-4 transition-colors duration-500 hover:bg-paper"
            >
              <div>
                <p className="meta text-muted">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 text-[0.92rem] font-bold leading-snug">{area.city}</h3>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                  {area.short}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold">
                Lihat area
                <ArrowUpRight className="h-3 w-3 transition-transform duration-500 ease-stage group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="frame pb-16">
        <div className="grid gap-8 border-t border-line pt-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="meta text-muted">Pertanyaan singkat</p>
            <h2 className="h2 mt-3 max-w-[12ch]">Sebelum menghubungi.</h2>
          </div>
          <div className="lg:col-span-8">
            {contactFaqs.map((item, index) => (
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
    </>
  );
}
