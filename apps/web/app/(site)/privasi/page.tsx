import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kebijakan privasi',
  description:
    'Cara GCC Web mengumpulkan, memakai, menyimpan, dan melindungi data pelanggan: kontak, alamat, pesanan, pembayaran, dan hak Anda.',
  alternates: { canonical: '/privasi' },
  openGraph: {
    title: `Kebijakan privasi · ${SITE_NAME}`,
    description:
      'Data apa yang dikumpulkan, mengapa, berapa lama disimpan, dan bagaimana meminta akses atau penghapusan.',
    url: `${SITE_URL}/privasi`,
  },
};

const SECTIONS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'data', label: 'Data yang dikumpulkan' },
  { id: 'tujuan', label: 'Tujuan penggunaan' },
  { id: 'dasar', label: 'Dasar pemrosesan' },
  { id: 'berbagi', label: 'Pihak ketiga' },
  { id: 'penyimpanan', label: 'Penyimpanan' },
  { id: 'cookie', label: 'Cookie & penyimpanan lokal' },
  { id: 'keamanan', label: 'Keamanan' },
  { id: 'hak', label: 'Hak Anda' },
  { id: 'anak', label: 'Anak & remaja' },
  { id: 'perubahan', label: 'Perubahan kebijakan' },
  { id: 'kontak', label: 'Kontak' },
];

export default function PrivacyPage() {
  const updated = '21 Oktober 2026';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Kebijakan privasi', item: `${SITE_URL}/privasi` },
    ],
  };

  return (
    <>
      <div className="frame pt-4">
        <Breadcrumbs items={[{ label: 'Kebijakan privasi' }]} />
      </div>

      <header className="border-b border-line">
        <div className="frame grid gap-8 py-10 lg:grid-cols-12 lg:items-end lg:gap-10 lg:py-14">
          <div className="lg:col-span-7">
            <p className="meta text-muted">Privasi</p>
            <h1 className="statement mt-3 max-w-[15ch] text-[2.2rem] sm:text-[2.8rem]">
              Data Anda, secukupnya.
            </h1>
          </div>
          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-[0.92rem] leading-relaxed text-muted">
              Kami hanya meminta informasi yang dipakai untuk mengerjakan pesanan,
              menghubungi Anda, dan menepati garansi. Halaman ini menjelaskan
              rinciannya.
            </p>
            <p className="mt-4 text-[0.7rem] text-muted">Terakhir diperbarui: {updated}</p>
          </div>
        </div>
      </header>

      <div className="frame grid gap-10 py-12 lg:grid-cols-12 lg:gap-14 lg:py-16">
        <aside className="lg:col-span-3">
          <nav aria-label="Daftar bagian kebijakan privasi" className="lg:sticky lg:top-8">
            <p className="meta text-muted">Isi halaman</p>
            <ol className="mt-4 border-t border-line">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-baseline gap-3 border-b border-line py-2.5 text-[0.8rem] transition-colors hover:text-teal"
                  >
                    <span className="ticket-code text-[0.6rem] text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
            <Link href="/kontak" className="link-underline mt-6 text-[0.8rem]">
              Ada pertanyaan? Hubungi kami
            </Link>
          </nav>
        </aside>

        <article className="space-y-10 lg:col-span-9">
          <section id="ringkasan" className="scroll-mt-24">
            <div className="border-l-2 border-teal bg-teal-soft/45 p-5">
              <p className="meta text-teal">Ringkasan</p>
              <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed">
                <li>
                  Kami mengumpulkan nama, nomor WhatsApp, alamat, dan rincian
                  pesanan untuk mengerjakan servis.
                </li>
                <li>
                  Nomor WhatsApp dipakai untuk konfirmasi jadwal, pembaruan status,
                  dan klaim garansi.
                </li>
                <li>
                  Data tidak dijual. Alamat lengkap hanya dibuka kepada teknisi yang
                  ditugaskan dan tidak tampil di halaman pelacakan tanpa verifikasi.
                </li>
                <li>
                  Anda dapat meminta akses, koreksi, atau penghapusan melalui{' '}
                  <a href="mailto:halo@gcc-web.id" className="underline underline-offset-2">
                    halo@gcc-web.id
                  </a>
                  .
                </li>
              </ul>
            </div>
          </section>

          <Section id="data" index="01" title="Data yang dikumpulkan">
            <p>
              Kami mengumpulkan data yang Anda berikan saat memesan, menghubungi
              kami, atau menggunakan halaman pelacakan. Jenisnya:
            </p>
            <ul>
              <li>
                <strong>Identitas dan kontak:</strong> nama, nomor WhatsApp, dan email
                bila Anda mengisinya.
              </li>
              <li>
                <strong>Alamat layanan:</strong> alamat lengkap, kota/kabupaten,
                kecamatan, kode pos, jenis properti, serta catatan akses atau kondisi
                unit.
              </li>
              <li>
                <strong>Rincian pesanan:</strong> layanan dan varian, jumlah unit,
                tanggal dan slot kedatangan, teknisi yang ditugaskan, riwayat status,
                serta catatan pekerjaan.
              </li>
              <li>
                <strong>Pembayaran:</strong> status pembayaran, metode, dan jumlah.
                Kami tidak menyimpan nomor kartu atau kredensial perbankan Anda.
                Pembayaran online diproses oleh penyedia pembayaran.
              </li>
              <li>
                <strong>Data teknis:</strong> alamat IP, jenis perangkat, dan log akses
                yang diperlukan untuk menjaga keamanan situs serta mencegah
                penyalahgunaan.
              </li>
            </ul>
            <p>
              Kolom email, kode pos, dan catatan bersifat opsional, kecuali catatan
              alamat yang diperlukan agar teknisi menemukan lokasi.
            </p>
          </Section>

          <Section id="tujuan" index="02" title="Tujuan penggunaan">
            <p>Data dipakai untuk:</p>
            <ul>
              <li>Memproses dan menjadwalkan pesanan, termasuk menghubungi Anda.</li>
              <li>Menugaskan teknisi, mengirim pembaruan status, dan menepati garansi.</li>
              <li>Mencatat pembayaran dan menyelesaikan pertanyaan atau keluhan.</li>
              <li>Mencegah pesanan palsu, penyalahgunaan formulir, dan akses tidak sah.</li>
              <li>
                Menyusun ringkasan operasional tanpa identitas untuk memperbaiki
                layanan, misalnya jumlah pekerjaan per wilayah.
              </li>
            </ul>
            <p>
              Kami tidak memakai data pelanggan untuk iklan pihak ketiga dan tidak
              mengirim pesan promosi tanpa persetujuan terpisah.
            </p>
          </Section>

          <Section id="dasar" index="03" title="Dasar pemrosesan">
            <p>
              Pemrosesan dilakukan karena diperlukan untuk memenuhi pesanan yang Anda
              minta, berdasarkan persetujuan yang Anda berikan saat mengirim formulir,
              serta untuk kepentingan sah seperti keamanan sistem dan pencatatan
              transaksi. Anda dapat menarik persetujuan untuk pemrosesan yang
              tidak wajib tanpa memengaruhi pesanan yang sedang berjalan.
            </p>
          </Section>

          <Section id="berbagi" index="04" title="Pihak ketiga">
            <p>Data dapat dibagikan hanya sejauh diperlukan kepada:</p>
            <ul>
              <li>
                <strong>Teknisi yang ditugaskan</strong> — menerima nama, nomor
                WhatsApp, alamat, dan rincian pekerjaan untuk menyelesaikan servis.
              </li>
              <li>
                <strong>Penyedia pesan WhatsApp</strong> — nomor dan isi pesan
                konfirmasi diproses untuk mengirim pembaruan pesanan.
              </li>
              <li>
                <strong>Penyedia pembayaran</strong> — bila pembayaran online
                diaktifkan, data transaksi diproses oleh penyedia seperti Midtrans
                sesuai kebijakan privasi mereka.
              </li>
              <li>
                <strong>Penyedia hosting dan infrastruktur</strong> — menyimpan situs,
                basis data, dan log akses dengan kewajiban kerahasiaan.
              </li>
              <li>
                <strong>Otoritas yang berwenang</strong> — bila diwajibkan oleh hukum
                atau perintah yang sah.
              </li>
            </ul>
            <p>
              Kami tidak menjual, menyewakan, atau memperdagangkan data pelanggan
              kepada pihak lain.
            </p>
          </Section>

          <Section id="penyimpanan" index="05" title="Penyimpanan">
            <p>
              Data pesanan aktif disimpan selama pekerjaan berlangsung. Setelah
              selesai, data disimpan hingga 24 bulan untuk keperluan garansi,
              penyelesaian sengketa, dan pelayanan pelanggan. Catatan transaksi dapat
              disimpan lebih lama bila diwajibkan oleh ketentuan akuntansi atau pajak
              yang berlaku.
            </p>
            <p>
              Setelah masa simpan berakhir, data dihapus atau dianonimkan sehingga
              tidak lagi dapat dikaitkan dengan Anda. Data yang sedang diperlukan
              untuk pemeriksaan keamanan atau sengketa dapat disimpan sampai proses
              tersebut selesai.
            </p>
          </Section>

          <Section id="cookie" index="06" title="Cookie & penyimpanan lokal">
            <p>
              Situs publik tidak memakai cookie iklan atau pelacak lintas situs.
              Cookie yang digunakan bersifat teknis dan hanya untuk sesi admin:
              cookie akses dan refresh yang ditandai <code>HttpOnly</code> agar
              halaman pengelolaan tetap aman. Cookie tersebut tidak dipakai oleh
              pengunjung biasa.
            </p>
            <p>
              Dalam mode demo, tiket yang Anda buat dapat disimpan di{' '}
              <code>sessionStorage</code> browser agar dapat dilacak pada tab yang
              sama. Data ini terhapus saat tab ditutup dan tidak dikirim ke server.
            </p>
          </Section>

          <Section id="keamanan" index="07" title="Keamanan">
            <p>
              Kami memakai kata sandi yang di-hash, cookie akses <code>HttpOnly</code>,
              pembatasan percobaan permintaan, pembatasan akses berdasarkan peran, dan
              pencatatan tindakan admin. Halaman pelacakan menyamarkan nama dan nomor
              serta menyembunyikan alamat sampai nomor WhatsApp cocok.
            </p>
            <p>
              Tidak ada sistem yang sepenuhnya bebas risiko. Bila Anda menemukan celah
              atau menerima pesan mencurigakan yang mengaku dari kami, hubungi{' '}
              <a href="mailto:halo@gcc-web.id" className="underline underline-offset-2">
                halo@gcc-web.id
              </a>{' '}
              agar dapat kami periksa.
            </p>
          </Section>

          <Section id="hak" index="08" title="Hak Anda">
            <p>Anda berhak untuk:</p>
            <ul>
              <li>Meminta salinan data pribadi yang kami simpan tentang Anda.</li>
              <li>Meminta koreksi data yang tidak akurat atau tidak lengkap.</li>
              <li>
                Meminta penghapusan data bila tidak lagi diperlukan, dengan
                memperhatikan kewajiban penyimpanan transaksi dan garansi.
              </li>
              <li>Menolak atau menarik persetujuan untuk pemrosesan tertentu.</li>
              <li>Mengajukan keberatan atas pemrosesan yang Anda anggap tidak wajar.</li>
            </ul>
            <p>
              Kirim permintaan ke{' '}
              <a href="mailto:halo@gcc-web.id" className="underline underline-offset-2">
                halo@gcc-web.id
              </a>{' '}
              dengan nama dan nomor WhatsApp yang dipakai saat memesan. Kami dapat
              meminta verifikasi sebelum memproses permintaan dan berupaya menanggapinya
              dalam 14 hari kerja.
            </p>
          </Section>

          <Section id="anak" index="09" title="Anak & remaja">
            <p>
              Layanan ini ditujukan untuk pemilik atau penghuni yang dapat membuat
              pesanan. Kami tidak sengaja mengumpulkan data anak-anak. Bila data anak
              tercatat sebagai bagian dari alamat atau kebutuhan layanan, data tersebut
              hanya dipakai untuk menyelesaikan pekerjaan dan mengikuti ketentuan pada
              halaman ini.
            </p>
          </Section>

          <Section id="perubahan" index="10" title="Perubahan kebijakan">
            <p>
              Kebijakan ini dapat diperbarui bila layanan, penyedia, atau kewajiban
              hukum berubah. Versi terbaru selalu tersedia di halaman ini dengan
              tanggal pembaruan. Perubahan yang memengaruhi cara kami memakai data
              akan dijelaskan melalui kanal kontak yang Anda berikan bila diperlukan.
            </p>
          </Section>

          <Section id="kontak" index="11" title="Kontak">
            <p>
              Pertanyaan tentang privasi dapat dikirim ke{' '}
              <a href="mailto:halo@gcc-web.id" className="underline underline-offset-2">
                halo@gcc-web.id
              </a>{' '}
              atau melalui WhatsApp pada halaman{' '}
              <Link href="/kontak" className="underline underline-offset-2">
                kontak
              </Link>
              . Sertakan kode tiket bila pertanyaan menyangkut pesanan tertentu.
            </p>
          </Section>

          <div className="border-t border-line pt-5 text-[0.7rem] leading-relaxed text-muted">
            Halaman ini menjelaskan praktik privasi GCC Web. Halaman ini bukan nasihat
            hukum. Untuk kebutuhan kepatuhan tertentu, mintalah tinjauan penasihat
            hukum.
          </div>
        </article>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-5">
      <div className="flex items-baseline gap-3">
        <span className="ticket-code text-[0.62rem] text-muted">{index}</span>
        <h2 className="text-[1.2rem] font-bold tracking-[-0.02em] sm:text-[1.35rem]">
          {title}
        </h2>
      </div>
      <div className="mt-4 max-w-[68ch] space-y-3 text-[0.88rem] leading-relaxed text-muted [&_a]:text-ink [&_code]:text-[0.78rem] [&_code]:text-ink [&_li]:pl-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
