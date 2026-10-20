import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { QuickBooking } from '@/components/booking/QuickBooking';
import { Reveal } from '@/components/ui/Reveal';
import { SectionIntro } from '@/components/ui/SectionIntro';
import { Stars } from '@/components/ui/Stars';
import { ArrowRight, ArrowUpRight, PlusMark, WhatsAppMark } from '@/components/ui/Icons';
import { loadCatalogue, loadTestimonialFeed } from '@/lib/content';
import {
  FAQS,
  SERVICE_AREAS,
  SITE_NAME,
  SITE_URL,
  waLink,
} from '@/lib/site';
import {
  formatRupiah,
  getUpcomingDates,
  TIMELINE_STEPS,
} from '@/lib/format';
import { startingPrice } from '@/lib/service-utils';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Servis AC & Elektronik Rumah` },
  description:
    'Servis AC, isi freon, bongkar pasang, serta perbaikan kulkas, mesin cuci, dan TV. Pilih slot, lihat estimasi harga, dan lacak teknisi dari satu tiket. Jakarta, Depok, Tangerang Selatan.',
  alternates: { canonical: '/' },
};

const TRUST_NOTES = [
  { term: 'Garansi 7–30 hari', detail: 'Tertulis di tiket servis.' },
  { term: 'Slot dua jam', detail: 'Pilih jam kedatangan sendiri.' },
  { term: 'Harga dari tiket', detail: 'Bukan taksiran lewat chat.' },
  { term: 'Bayar setelah uji', detail: 'Tunai, transfer, atau QRIS.' },
];

export default async function HomePage() {
  const [catalogue, testimonialFeed] = await Promise.all([
    loadCatalogue(),
    loadTestimonialFeed(3),
  ]);

  const services = catalogue.flatMap((category) => category.services);
  const featuredServices = services.slice(0, 6);
  const testimonials = testimonialFeed.items;
  const heroDates = getUpcomingDates(5);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Layanan GCC Web',
    itemListElement: featuredServices.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.shortDescription,
        url: `${SITE_URL}/layanan/${service.slug}`,
        offers: {
          '@type': 'Offer',
          price: startingPrice(service),
          priceCurrency: 'IDR',
        },
      },
    })),
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="frame grid gap-12 pb-14 pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-16 xl:pb-24 xl:pt-20">
          <div className="flex flex-col justify-between lg:col-span-7 lg:pr-6 xl:pr-14">
            <div>
              <h1 className="display max-w-[12ch] text-ink">
                Servis AC,
                <br />
                <span className="text-teal">dingin lagi.</span>
              </h1>
              <p className="mt-7 max-w-[46ch] text-[1.02rem] leading-relaxed text-muted sm:text-[1.1rem]">
                Cuci AC, isi freon, bongkar pasang, sampai kulkas, mesin cuci, dan TV.
                Pilih slot, lihat estimasi sebelum memesan, lalu ikuti status teknisi
                dari satu tiket.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/booking" className="btn btn-primary px-5">
                  Buat tiket servis
                  <span className="btn-icon">
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
                <Link href="/layanan" className="link-underline px-1 py-2 text-[0.9rem]">
                  Lihat layanan &amp; harga
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <p className="mt-8 max-w-[52ch] text-[0.78rem] leading-relaxed text-muted">
                Jakarta Selatan, Jakarta Pusat, Jakarta Barat, Depok, dan Tangerang
                Selatan. Senin–Sabtu, 08.00–17.00.
              </p>
            </div>

            <div className="mt-14 border-t border-line pt-5 lg:mt-20">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="meta text-muted">Konfirmasi</p>
                  <p className="mt-2 text-[0.9rem] leading-snug">
                    Pada hari kerja, lewat WhatsApp.
                  </p>
                </div>
                <div>
                  <p className="meta text-muted">Sebelum kerja</p>
                  <p className="mt-2 text-[0.9rem] leading-snug">
                    Temuan dan biaya tambahan disepakati.
                  </p>
                </div>
                <div>
                  <p className="meta text-muted">Setelah kerja</p>
                  <p className="mt-2 text-[0.9rem] leading-snug">
                    Unit diuji bersama, garansi aktif.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-8 xl:pl-10">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <p className="meta text-muted">Pesan langsung</p>
              <p className="text-[0.68rem] text-muted">Slot minggu ini</p>
            </div>
            <Reveal delay={80}>
              <QuickBooking services={services} dates={heroDates} />
            </Reveal>
            <p className="mt-3 max-w-[40ch] text-[0.68rem] leading-relaxed text-muted">
              Tanpa akun. Nomor WhatsApp hanya dipakai untuk konfirmasi jadwal dan
              pembaruan pekerjaan.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan layanan" className="border-b border-line bg-paper">
        <div className="frame">
          <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {TRUST_NOTES.map((item) => (
              <div key={item.term} className="bg-paper py-5 pr-4 md:px-5 md:first:pl-0">
                <dt className="text-[0.84rem] font-bold tracking-[-0.01em]">{item.term}</dt>
                <dd className="mt-1.5 text-[0.73rem] leading-relaxed text-muted">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="frame pb-20 pt-16 lg:pb-28 lg:pt-24">
        <SectionIntro
          index="01 / Layanan"
          title={
            <>
              Enam pekerjaan.
              <br />
              Satu standar.
            </>
          }
          description="Harga awal per unit. Varian dan biaya tambahan disepakati sebelum pekerjaan dimulai."
        />

        <div className="mt-10 border-t border-line">
          {featuredServices.map((service, index) => (
            <Link
              key={service.id}
              href={`/layanan/${service.slug}`}
              className="group grid grid-cols-12 items-start gap-x-4 gap-y-3 border-b border-line py-6 transition-colors duration-500 hover:bg-paper md:items-center md:py-7"
            >
              <span className="meta col-span-2 pt-1 text-muted md:col-span-1">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="col-span-10 md:col-span-5">
                <h3 className="text-[1.22rem] font-bold tracking-[-0.025em] md:text-[1.35rem]">
                  {service.name}
                </h3>
                <p className="mt-1.5 max-w-[48ch] text-[0.83rem] leading-relaxed text-muted">
                  {service.shortDescription}
                </p>
              </div>
              <div className="col-span-8 col-start-3 md:col-span-4 md:col-start-auto">
                <p className="tabular text-[0.95rem] font-semibold">
                  Mulai {formatRupiah(startingPrice(service))}
                </p>
                <p className="mt-1 text-[0.7rem] text-muted">
                  {service.variants.length} varian · {service.durationMinutes} menit ·
                  garansi {service.warrantyDays} hari
                </p>
              </div>
              <span className="col-span-4 flex justify-end md:col-span-2">
                <span className="flex h-10 w-10 items-center justify-center border border-line transition-all duration-500 ease-stage group-hover:border-ink group-hover:bg-ink group-hover:text-bone">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8rem] text-muted">
          <p>Belum yakin layanan yang dibutuhkan?</p>
          <a
            href={waLink('Halo GCC Web, saya ingin bertanya layanan yang cocok untuk masalah perangkat saya.')}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-ink"
          >
            <WhatsAppMark className="h-3.5 w-3.5" />
            Tanya lewat WhatsApp
          </a>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="lg:col-span-6 lg:order-2 lg:flex lg:flex-col lg:justify-center">
            <p className="meta text-muted">02 / Diagnosis</p>
            <h2 className="statement mt-4 max-w-[14ch]">
              Masalahnya sering bukan freon.
            </h2>
            <p className="mt-6 max-w-[48ch] text-[0.96rem] leading-relaxed text-muted">
              AC yang tidak dingin bisa berarti evaporator kotor, kapasitor melemah,
              atau ada kebocoran. Mengisi freon tanpa mencari penyebabnya hanya
              memindahkan biaya ke bulan depan.
            </p>

            <ul className="mt-9 max-w-[50ch] divide-y divide-line border-y border-line">
              {[
                ['Tekanan kerja diukur', 'Bukan ditebak dari suhu keluaran.'],
                ['Kebocoran dicari lebih dulu', 'Sebelum refrigeran ditambahkan.'],
                ['Temuan dijelaskan', 'Anda setuju sebelum pekerjaan tambahan.'],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-4 py-4">
                  <span className="meta pt-1 text-teal">0{index + 1}</span>
                  <div>
                    <p className="text-[0.92rem] font-semibold">{title}</p>
                    <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link href="/layanan/isi-freon-ac" className="link-underline mt-8 self-start">
              Cara kami menangani isi freon
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <figure className="lg:col-span-6 lg:order-1">
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              <div className="relative col-span-3 aspect-[3/4] overflow-hidden bg-ink/10">
                <Image
                  src="/images/manifold-gauge.svg"
                  alt="Ilustrasi teknis manifold gauge untuk mengukur tekanan kerja AC"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 28vw, 55vw"
                  className="object-cover"
                />
              </div>
              <div className="relative col-span-2 mt-10 aspect-[3/5] overflow-hidden bg-ink/10 sm:mt-14">
                <Image
                  src="/images/ac-cleaning.svg"
                  alt="Ilustrasi potongan unit AC indoor: saringan, evaporator, blower, dan talang air"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 19vw, 38vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className="mt-3 flex items-start justify-between gap-4 text-[0.67rem] leading-relaxed text-muted">
              <span>Ilustrasi teknis pengukuran tekanan dan pencucian evaporator.</span>
              <span className="shrink-0 text-muted/70">Ilustrasi: GCC Web</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="proses" className="frame pb-20 pt-16 lg:pb-28 lg:pt-24">
        <SectionIntro
          index="03 / Alur"
          title={
            <>
              Satu tiket,
              <br />
              enam pembaruan.
            </>
          }
          description="Setiap perubahan status tercatat dan dapat Anda periksa. Tidak perlu menelepon untuk tahu teknisi sudah di mana."
        />

        <ol className="mt-10 grid border-t border-line sm:grid-cols-2 lg:grid-cols-6">
          {TIMELINE_STEPS.map((step, index) => (
            <li
              key={step.status}
              className="border-b border-line py-5 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0 lg:py-6"
            >
              <div className="flex items-center justify-between">
                <span className="ticket-code text-[0.6rem] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="h-1.5 w-1.5 bg-teal" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-[0.97rem] font-bold leading-tight">{step.title}</h3>
              <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[56ch] text-[0.82rem] leading-relaxed text-muted">
            Simpan kode tiket yang dikirim ke WhatsApp. Kode itu yang dipakai untuk
            melacak pesanan kapan saja.
          </p>
          <Link href="/lacak" className="btn btn-ghost">
            Lacak pesanan
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="relative border-y border-line">
        <div className="relative h-[52vh] min-h-[340px] max-h-[600px]">
          <Image
            src="/images/outdoor-unit.svg"
            alt="Ilustrasi unit outdoor AC terpasang pada braket dinding rumah"
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-field/50" aria-hidden="true" />
          <div className="frame relative flex h-full flex-col justify-end pb-9 lg:pb-12">
            <p className="meta text-bone/65">Di lokasi</p>
            <p className="statement mt-4 max-w-[22ch] text-bone">
              Rapi adalah bagian dari pekerjaan.
            </p>
            <p className="mt-4 max-w-[46ch] text-[0.87rem] leading-relaxed text-bone/80">
              Penutup lantai dipasang, pipa dirapikan, dan sisa pekerjaan
              dibersihkan sebelum teknisi pulang.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-field text-bone">
        <div className="frame grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="lg:col-span-7">
            <p className="meta text-bone/50">04 / Garansi</p>
            <h2 className="statement mt-4 max-w-[13ch]">
              Garansi bukan kalimat di brosur.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[0.95rem] leading-relaxed text-bone/70">
              Kalau keluhan yang sama kembali dalam masa garansi, kami memeriksa ulang
              tanpa biaya jasa kunjungan. Suku cadang mengikuti garansi distributor,
              dan masa berlaku tertulis pada tiket serta nota servis.
            </p>

            <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-px border border-bone/20 bg-bone/20">
              <div className="bg-field p-5">
                <dt className="meta text-bone/50">Cuci AC</dt>
                <dd className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.04em]">
                  7 <span className="text-[0.9rem] font-medium tracking-normal">hari</span>
                </dd>
                <p className="mt-2 text-[0.72rem] leading-relaxed text-bone/60">
                  Kebersihan dan fungsi unit.
                </p>
              </div>
              <div className="bg-field p-5">
                <dt className="meta text-bone/50">Perbaikan</dt>
                <dd className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.04em]">
                  30 <span className="text-[0.9rem] font-medium tracking-normal">hari</span>
                </dd>
                <p className="mt-2 text-[0.72rem] leading-relaxed text-bone/60">
                  Keluhan yang sama, jasa kunjungan.
                </p>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <div className="relative mx-auto max-w-sm border border-bone/30 bg-bone p-5 text-ink sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="meta text-teal">Lembar garansi</p>
                  <p className="mt-1 text-[0.68rem] text-muted">Salinan pelanggan</p>
                </div>
                <span className="ticket-code border border-line px-2 py-1 text-[0.6rem] text-muted">
                  GCC — GRN
                </span>
              </div>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <dl className="space-y-3 text-[0.8rem]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Masa berlaku</dt>
                  <dd className="font-semibold">7–30 hari</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Berlaku untuk</dt>
                  <dd className="text-right font-semibold">Keluhan yang sama</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Kunjungan ulang</dt>
                  <dd className="text-right font-semibold">Tanpa biaya jasa</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Suku cadang</dt>
                  <dd className="text-right font-semibold">Garansi distributor</dd>
                </div>
              </dl>
              <div className="ticket-rule my-5" aria-hidden="true" />
              <p className="text-[0.65rem] leading-relaxed text-muted">
                Simpan nota servis. Kode tiket adalah bukti pekerjaan dan dasar klaim
                garansi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="frame pb-20 pt-16 lg:pb-28 lg:pt-24">
          <SectionIntro
            index="05 / Catatan pelanggan"
            title={
              <>
                Yang tersisa setelah
                <br />
                teknisi pulang.
              </>
            }
            description="Bukan sekadar dingin. Kerapian, komunikasi, dan kesesuaian biaya adalah bagian dari penilaian."
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-6">
              <figure className="flex h-full flex-col justify-between border-t border-ink pt-5">
                <div>
                  <Stars rating={testimonials[0].rating} />
                  <blockquote className="mt-5 max-w-[28ch] text-[1.45rem] font-semibold leading-[1.25] tracking-[-0.025em] sm:text-[1.7rem]">
                    “{testimonials[0].content}”
                  </blockquote>
                </div>
                <figcaption className="mt-8 border-t border-line pt-4">
                  <p className="text-[0.9rem] font-semibold">{testimonials[0].customerName}</p>
                  <p className="mt-1 text-[0.72rem] text-muted">
                    {testimonials[0].customerMeta ?? testimonials[0].service?.name}
                  </p>
                </figcaption>
              </figure>
            </Reveal>

            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-6">
              {testimonials.slice(1, 3).map((testimonial, index) => (
                <Reveal key={testimonial.id} delay={120 + index * 100}>
                  <figure className="flex h-full flex-col justify-between border-t border-line pt-5">
                    <div>
                      <Stars rating={testimonial.rating} />
                      <blockquote className="mt-4 text-[0.94rem] leading-relaxed text-ink/90">
                        “{testimonial.content}”
                      </blockquote>
                    </div>
                    <figcaption className="mt-6 border-t border-line pt-3">
                      <p className="text-[0.84rem] font-semibold">
                        {testimonial.customerName}
                      </p>
                      <p className="mt-1 text-[0.68rem] text-muted">
                        {testimonial.customerMeta ?? testimonial.service?.name}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>

          {testimonialFeed.source === 'sample' ? (
            <p className="mt-8 text-[0.68rem] leading-relaxed text-muted">
              Catatan di atas adalah contoh tampilan. Ulasan pelanggan asli muncul di
              sini setelah pesanan selesai dan dimoderasi.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="border-y border-line bg-surface">
        <div className="frame grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <figure className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden bg-ink/10 sm:aspect-[16/10]">
              <Image
                src="/images/jakarta-street.svg"
                alt="Ilustrasi jalan lingkungan hunian dengan rumah, pagar, pohon, dan kabel listrik"
                fill
                unoptimized
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-start justify-between gap-4 text-[0.67rem] leading-relaxed text-muted">
              <span>Ilustrasi kawasan hunian yang menjadi area kerja harian kami.</span>
              <span className="shrink-0 text-muted/70">Ilustrasi: GCC Web</span>
            </figcaption>
          </figure>

          <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
            <p className="meta text-muted">06 / Area</p>
            <h2 className="h2 mt-4 max-w-[14ch]">Kami tahu jalanannya.</h2>
            <p className="mt-5 max-w-[44ch] text-[0.93rem] leading-relaxed text-muted">
              Lima wilayah kerja utama, dengan jadwal yang sama di setiap kota. Pilih
              area untuk melihat cakupan kelurahan dan catatan aksesnya.
            </p>

            <ul className="mt-8 border-t border-line">
              {SERVICE_AREAS.map((area) => (
                <li key={area.slug} className="border-b border-line">
                  <Link
                    href={`/area/${area.slug}`}
                    className="group flex items-center justify-between gap-4 py-3.5"
                  >
                    <span>
                      <span className="block text-[0.92rem] font-semibold">{area.city}</span>
                      <span className="mt-0.5 block text-[0.7rem] text-muted">{area.short}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-500 ease-stage group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="frame pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="meta text-muted">07 / Pertanyaan</p>
            <h2 className="h2 mt-4 max-w-[12ch]">Sebelum memesan.</h2>
            <p className="mt-5 max-w-[36ch] text-[0.92rem] leading-relaxed text-muted">
              Hal-hal yang paling sering ditanyakan sebelum teknisi datang. Bila
              pertanyaan Anda belum terjawab, kirim pesan langsung.
            </p>
            <a
              href={waLink('Halo GCC Web, saya punya pertanyaan sebelum memesan servis.')}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-6"
            >
              <WhatsAppMark className="h-3.5 w-3.5" />
              Tanya lewat WhatsApp
            </a>
          </div>

          <div className="lg:col-span-8">
            {FAQS.map((item, index) => (
              <details key={item.question} className="faq" open={index === 0}>
                <summary>
                  <span>{item.question}</span>
                  <PlusMark className="faq-mark h-3.5 w-3.5 shrink-0" />
                </summary>
                <div className="faq-answer">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-teal text-bone">
        <div className="frame grid gap-8 py-14 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-20">
          <div className="lg:col-span-8">
            <p className="meta text-bone/60">Sisa slot minggu ini</p>
            <h2 className="statement mt-4 max-w-[17ch]">
              Pilih jam yang masih kosong.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[0.92rem] leading-relaxed text-bone/75">
              Ketersediaan terlihat sebelum Anda mengisi data. Konfirmasi dikirim ke
              WhatsApp, dan kode tiket langsung bisa dipakai untuk melacak pesanan.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-4">
            <Link href="/booking" className="btn btn-bone w-full px-5">
              Buat tiket servis
              <span className="btn-icon">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
            <a
              href={waLink('Halo GCC Web, saya ingin bertanya tentang jadwal servis.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full border border-bone/35 px-5 text-bone hover:border-bone hover:bg-bone/5"
            >
              <WhatsAppMark className="h-4 w-4" />
              Tanya jadwal
            </a>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
    </>
  );
}
