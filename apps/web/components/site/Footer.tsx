import Link from 'next/link';
import { CONTACT, SERVICE_AREAS, waLink } from '@/lib/site';
import { demoServices } from '@/lib/demo-data';
import { TicketMark, WhatsAppMark } from '@/components/ui/Icons';

export function Footer() {
  const year = 2026;
  return (
    <footer className="bg-ink text-bone">
      <div className="frame pb-8 pt-16 md:pt-20">
        <div className="grid gap-12 border-b border-bone/15 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="GCC Web">
              <TicketMark className="h-9 w-9 text-bone" />
              <span className="flex items-baseline gap-2 text-[1.55rem] tracking-[-0.045em]">
                <span className="font-extrabold">gcc</span>
                <span className="font-medium text-bone/55">web</span>
              </span>
            </Link>
            <p className="mt-6 max-w-[30ch] text-[1.15rem] font-medium leading-snug tracking-[-0.02em] text-bone/90">
              Servis AC dan elektronik rumah yang tercatat dari tiket pertama sampai garansi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/booking" className="btn btn-bone px-4">
                Pesan jadwal
              </Link>
              <a
                href={waLink('Halo GCC Web, saya ingin bertanya tentang servis.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-bone/30 px-4 text-bone hover:border-bone hover:bg-bone/5"
              >
                <WhatsAppMark className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="meta text-bone/45">Layanan</p>
              <ul className="mt-4 space-y-2.5 text-[0.88rem] text-bone/75">
                {demoServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/layanan/${service.slug}`}
                      className="transition-colors hover:text-bone"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="meta text-bone/45">Area</p>
              <ul className="mt-4 space-y-2.5 text-[0.88rem] text-bone/75">
                {SERVICE_AREAS.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/area/${area.slug}`}
                      className="transition-colors hover:text-bone"
                    >
                      {area.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="meta text-bone/45">Hubungi</p>
              <address className="mt-4 space-y-2.5 text-[0.88rem] not-italic leading-relaxed text-bone/75">
                <p>
                  {CONTACT.address}
                  <br />
                  {CONTACT.city}
                </p>
                <p>
                  <a href={CONTACT.phoneHref} className="tabular transition-colors hover:text-bone">
                    {CONTACT.phone}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-bone">
                    {CONTACT.email}
                  </a>
                </p>
                <p className="text-bone/50">{CONTACT.hours}</p>
              </address>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 py-7 text-[0.72rem] text-bone/45 md:flex-row md:items-center md:justify-between">
          <p>© {year} GCC Web. Seluruh hak cipta dilindungi.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privasi" className="transition-colors hover:text-bone">
              Privasi & data
            </Link>
            <Link href="/kontak" className="transition-colors hover:text-bone">
              Kontak
            </Link>
            <Link href="/lacak" className="transition-colors hover:text-bone">
              Lacak pesanan
            </Link>
            <Link href="/admin/login" className="transition-colors hover:text-bone">
              Admin
            </Link>
            <span className="text-bone/30">Tunai · Transfer · QRIS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
