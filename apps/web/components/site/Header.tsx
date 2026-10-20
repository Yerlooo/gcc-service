'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONTACT, NAV_LINKS, waLink } from '@/lib/site';
import { cn } from '@/lib/format';
import { ArrowUpRight, TicketMark, WhatsAppMark } from '@/components/ui/Icons';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="relative z-40 border-b border-line bg-bone">
        <div className="bg-ink text-bone">
          <div className="frame flex h-9 items-center justify-between gap-4 text-[0.68rem] tracking-wide">
            <p className="truncate text-bone/75">
              Melayani Jabodetabek · Senin–Sabtu, 08.00–17.00
            </p>
            <div className="hidden items-center gap-5 sm:flex">
              <a href={CONTACT.phoneHref} className="tabular transition-colors hover:text-teal-soft">
                {CONTACT.phone}
              </a>
              <a
                href={waLink('Halo GCC Web, saya ingin bertanya tentang servis.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-teal-soft"
              >
                <WhatsAppMark className="h-3 w-3" />
                WhatsApp
              </a>
              <Link href="/lacak" className="transition-colors hover:text-teal-soft">
                Lacak tiket
              </Link>
            </div>
          </div>
        </div>

        <div className="frame flex h-[76px] items-center justify-between gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GCC Web — beranda">
            <TicketMark className="h-8 w-8 text-ink" />
            <span className="flex items-baseline gap-1.5 text-[1.2rem] tracking-[-0.045em]">
              <span className="font-extrabold">gcc</span>
              <span className="font-medium text-muted">web</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative py-2 text-[0.84rem] font-medium tracking-[-0.01em] text-muted transition-colors hover:text-ink',
                  isActive(link.href) && 'text-ink',
                )}
              >
                {link.label}
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-teal transition-transform duration-500 ease-stage',
                    isActive(link.href) && 'scale-x-100',
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/booking" className="btn btn-primary hidden px-4 sm:inline-flex">
              Pesan jadwal
              <span className="btn-icon">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>

            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center border border-line lg:hidden"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={cn(
                    'absolute left-0 top-0 h-px w-5 bg-ink transition-transform duration-500 ease-stage',
                    open && 'top-1.5 rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-1.5 h-px w-5 bg-ink transition-transform duration-500 ease-stage',
                    open && 'top-1.5 -rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-3 h-px w-5 bg-ink transition-all duration-500 ease-stage',
                    open && 'top-1.5 w-0 opacity-0',
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-bone transition-[opacity,visibility] duration-500 ease-stage lg:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <div className="frame flex h-[76px] shrink-0 items-center justify-between border-b border-line">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <TicketMark className="h-8 w-8 text-ink" />
            <span className="flex items-baseline gap-1.5 text-[1.2rem] tracking-[-0.045em]">
              <span className="font-extrabold">gcc</span>
              <span className="font-medium text-muted">web</span>
            </span>
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center border border-line text-xl"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="frame flex flex-1 flex-col justify-center gap-1 py-8" aria-label="Navigasi seluler">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-baseline justify-between border-b border-line py-4 text-[1.65rem] font-semibold tracking-[-0.035em] transition-all duration-700 ease-stage',
                open ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
              )}
              style={{ transitionDelay: open ? `${80 + index * 45}ms` : '0ms' }}
            >
              <span>{link.label}</span>
              <span className="meta text-muted">0{index + 1}</span>
            </Link>
          ))}
        </nav>

        <div className="frame shrink-0 border-t border-line py-6">
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full"
          >
            Pesan jadwal
            <span className="btn-icon">
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
          <div className="mt-4 flex items-center justify-between text-[0.82rem] text-muted">
            <a href={CONTACT.phoneHref} className="tabular hover:text-ink">
              {CONTACT.phone}
            </a>
            <a
              href={waLink('Halo GCC Web, saya ingin bertanya tentang servis.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <WhatsAppMark className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
