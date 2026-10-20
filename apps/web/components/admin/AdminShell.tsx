'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DEMO_MODE } from '@/lib/api';
import { logoutAdmin } from '@/lib/admin-auth';
import { cn, formatDate, initials } from '@/lib/format';
import type { AdminUser } from '@/lib/types';
import { ArrowUpRight } from '@/components/ui/Icons';

const NAV = [
  { href: '/admin', label: 'Ringkasan', code: '01' },
  { href: '/admin/bookings', label: 'Pesanan', code: '02' },
  { href: '/admin/services', label: 'Layanan & harga', code: '03' },
  { href: '/admin/technicians', label: 'Teknisi', code: '04' },
  { href: '/admin/testimonials', label: 'Testimoni', code: '05' },
  { href: '/admin/inventory', label: 'Stok', code: '06' },
  { href: '/admin/settings', label: 'Pengaturan', code: '07' },
];

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  async function handleLogout() {
    setLoggingOut(true);
    await logoutAdmin();
    router.replace('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav aria-label="Navigasi admin" className="border-t border-bone/15">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 border-b border-bone/10 py-2.5 pl-3 pr-3 text-[0.82rem] transition-colors duration-300',
              active
                ? 'border-l-2 border-l-teal bg-bone/10 text-bone'
                : 'border-l-2 border-l-transparent text-bone/60 hover:bg-bone/5 hover:text-bone',
            )}
          >
            <span
              className={cn(
                'ticket-code text-[0.58rem]',
                active ? 'text-teal-soft' : 'text-bone/30',
              )}
            >
              {item.code}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bone lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink px-4 py-5 text-bone lg:flex">
        <Link href="/admin" className="flex items-baseline gap-1.5 px-1" aria-label="GCC Web admin">
          <span className="text-[1.15rem] font-extrabold tracking-[-0.04em]">gcc</span>
          <span className="text-[1.15rem] font-light tracking-[-0.02em]">web</span>
          <span className="ml-auto text-[0.55rem] uppercase tracking-[0.15em] text-bone/35">
            Admin
          </span>
        </Link>
        <p className="mt-1 px-1 text-[0.6rem] uppercase tracking-[0.14em] text-bone/35">
          Panel operasi
        </p>

        <div className="mt-7">{nav}</div>

        <div className="mt-auto border-t border-bone/15 pt-4">
          {DEMO_MODE ? (
            <p className="mb-3 inline-flex border border-amber/40 bg-amber/15 px-2 py-1 text-[0.58rem] uppercase tracking-[0.1em] text-amber">
              Mode demo
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-bone/20 text-[0.7rem] font-semibold">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.78rem] font-semibold">{user.name}</p>
              <p className="truncate text-[0.64rem] text-bone/45">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[0.66rem] text-bone/55 transition-colors hover:text-bone"
            >
              Buka situs
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-[0.66rem] text-bone/55 transition-colors hover:text-rust disabled:opacity-50"
            >
              {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-line bg-bone/95 px-4 py-3 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              className="flex items-center gap-2 border border-line px-2.5 py-1.5 text-[0.72rem] font-semibold lg:hidden"
            >
              <span className="flex w-3.5 flex-col gap-1" aria-hidden="true">
                <span
                  className={cn(
                    'h-px w-full bg-ink transition-transform duration-300',
                    open && 'translate-y-[2.5px] rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'h-px w-full bg-ink transition-transform duration-300',
                    open && '-translate-y-[2.5px] -rotate-45',
                  )}
                />
              </span>
              {open ? 'Tutup' : 'Menu'}
            </button>
            <div className="lg:hidden">
              <Link href="/admin" className="text-[0.95rem] font-extrabold tracking-[-0.03em]">
                gcc<span className="font-light">web</span>
              </Link>
            </div>
            <p className="hidden text-[0.75rem] text-muted lg:block">
              {formatDate(new Date(), {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {DEMO_MODE ? (
              <span className="hidden border border-amber/40 bg-amber/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.1em] text-amber sm:inline-flex">
                Demo
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="hidden text-right sm:block">
                <span className="block text-[0.72rem] font-semibold leading-tight">
                  {user.name}
                </span>
                <span className="block text-[0.6rem] text-muted">Administrator</span>
              </span>
              <span className="flex h-8 w-8 items-center justify-center border border-line bg-paper text-[0.62rem] font-semibold">
                {initials(user.name)}
              </span>
            </div>
          </div>
        </header>

        {open ? (
          <div
            id="admin-mobile-nav"
            className="fixed inset-x-0 bottom-0 top-[3.55rem] z-30 overflow-y-auto bg-ink px-4 py-5 text-bone lg:hidden"
          >
            {nav}
            <div className="mt-5 border-t border-bone/15 pt-4">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[0.76rem] text-bone/65"
              >
                Buka situs
                <ArrowUpRight className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-4 block text-[0.76rem] text-bone/65 disabled:opacity-50"
              >
                {loggingOut ? 'Keluar…' : 'Keluar dari panel'}
              </button>
            </div>
          </div>
        ) : null}

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
