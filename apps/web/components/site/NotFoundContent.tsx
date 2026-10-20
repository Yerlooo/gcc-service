import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@/components/ui/Icons';

export function NotFoundContent() {
  return (
    <section className="frame py-14 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <p className="meta text-muted">Kesalahan 404</p>
          <h1 className="statement mt-4 max-w-[16ch]">Halaman ini tidak ada di tiket.</h1>
          <p className="mt-5 max-w-[50ch] text-[0.95rem] leading-relaxed text-muted">
            Alamat yang Anda buka mungkin sudah berubah atau salah ketik. Gunakan
            tautan di bawah untuk kembali ke layanan, jadwal, atau pelacakan pesanan.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-primary px-5">
              Kembali ke beranda
              <span className="btn-icon">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
            <Link href="/layanan" className="btn btn-ghost px-4">
              Layanan & harga
            </Link>
            <Link href="/booking" className="btn btn-ghost px-4">
              Pesan jadwal
            </Link>
          </div>

          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              {
                href: '/lacak',
                label: 'Lacak pesanan',
                note: 'Cek status dengan kode tiket.',
              },
              {
                href: '/area',
                label: 'Area layanan',
                note: 'Lima wilayah kerja dan kecamatannya.',
              },
              {
                href: '/kontak',
                label: 'Kontak',
                note: 'WhatsApp, telepon, dan jam kerja.',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-bone p-4 transition-colors duration-500 hover:bg-paper"
              >
                <p className="text-[0.82rem] font-semibold">{item.label}</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
                  {item.note}
                </p>
                <ArrowRight className="mt-4 h-3.5 w-3.5 text-muted transition-transform duration-500 ease-stage group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="ticket p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="meta text-teal">Tiket tidak ditemukan</p>
                <p className="ticket-code mt-2 text-[1.6rem] font-bold tracking-[0.14em]">
                  404
                </p>
              </div>
              <span className="ticket-code border border-line px-2 py-1 text-[0.56rem] text-muted">
                GCC — ERR
              </span>
            </div>
            <div className="ticket-rule my-6" aria-hidden="true" />
            <dl className="space-y-3 text-[0.78rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Rute</dt>
                <dd className="text-right font-medium">Tidak terdaftar</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Tindakan</dt>
                <dd className="text-right font-medium">Pilih tautan yang tersedia</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Bantuan</dt>
                <dd className="text-right font-medium">WhatsApp admin</dd>
              </div>
            </dl>
            <div className="ticket-rule my-6" aria-hidden="true" />
            <p className="text-[0.72rem] leading-relaxed text-muted">
              Bila tautan dari pesan WhatsApp Anda mengarah ke halaman ini, salin kode
              tiket lalu buka halaman pelacakan.
            </p>
            <Link href="/lacak" className="btn btn-accent mt-5 w-full">
              Buka pelacakan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
