'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, DEMO_MODE, apiGet } from '@/lib/api';
import { getDemoTrackedBooking } from '@/lib/demo-data';
import { findDemoBooking } from '@/lib/demo-store';
import {
  cn,
  formatDateTime,
  formatRupiah,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  TIMELINE_STEPS,
} from '@/lib/format';
import { waLink } from '@/lib/site';
import type { TrackedBooking } from '@/lib/types';
import { StatusChip } from '@/components/ui/StatusChip';
import { ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function rememberCode(code: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('code', code);
  window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
}

export function TrackBooking() {
  const searchParams = useSearchParams();
  // `kode` was used by older WhatsApp templates; accept both so old links work.
  const initialCode = (
    searchParams.get('code') ??
    searchParams.get('kode') ??
    ''
  ).toUpperCase();
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockPhone, setUnlockPhone] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const autoRan = useRef(false);

  const lookup = useCallback(async (rawCode: string, rawPhone: string) => {
    const normalized = rawCode.trim().toUpperCase();
    if (normalized.length < 5) {
      setError('Masukkan kode tiket yang tertera di WhatsApp atau halaman pesanan.');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);
    setCode(normalized);

    const saved = findDemoBooking(normalized);
    if (saved) {
      await wait(250);
      setBooking(saved);
      rememberCode(normalized);
      setLoading(false);
      return;
    }

    if (DEMO_MODE) {
      await wait(450);
      const demo = getDemoTrackedBooking(normalized);
      if (demo) {
        setBooking(demo);
        rememberCode(normalized);
      } else {
        setError(
          'Tiket tidak ditemukan di mode demo. Gunakan tiket yang baru dibuat di tab ini.',
        );
      }
      setLoading(false);
      return;
    }

    try {
      const query = rawPhone.trim()
        ? `?phone=${encodeURIComponent(rawPhone.trim())}`
        : '';
      const data = await apiGet<TrackedBooking>(
        `/bookings/track/${encodeURIComponent(normalized)}${query}`,
      );
      setBooking(data);
      rememberCode(normalized);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Tiket belum dapat dicari. Periksa koneksi lalu coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRan.current) return;
    const fromUrl = searchParams.get('code');
    if (!fromUrl) return;
    autoRan.current = true;
    void lookup(fromUrl, '');
  }, [searchParams, lookup]);

  async function handleUnlock() {
    if (!booking || !unlockPhone.trim()) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const saved = findDemoBooking(booking.code);
      if (saved) {
        setBooking(saved);
        return;
      }
      if (DEMO_MODE) {
        await wait(350);
        const demo = getDemoTrackedBooking(booking.code);
        if (!demo) throw new Error('Tiket demo tidak ditemukan.');
        setBooking(demo);
        return;
      }
      const data = await apiGet<TrackedBooking>(
        `/bookings/track/${encodeURIComponent(booking.code)}?phone=${encodeURIComponent(
          unlockPhone.trim(),
        )}`,
      );
      setBooking(data);
      setUnlockPhone('');
    } catch (caught) {
      setUnlockError(
        caught instanceof ApiError
          ? caught.message
          : 'Nomor belum dapat diverifikasi. Periksa kembali nomor WhatsApp Anda.',
      );
    } finally {
      setUnlocking(false);
    }
  }

  function reset() {
    setBooking(null);
    setError(null);
    setCode('');
    setPhone('');
    setUnlockPhone('');
    setUnlockError(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/lacak');
    }
  }

  if (loading) {
    return (
      <section className="frame py-8 lg:py-12" aria-live="polite">
        <div className="border border-line bg-paper">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <span className="h-2 w-2 animate-pulse bg-teal" aria-hidden="true" />
            <p className="text-[0.82rem] text-muted">Mencari tiket {code}…</p>
          </div>
          <div className="space-y-5 p-5 sm:p-7">
            <div className="h-7 w-52 max-w-full animate-pulse bg-line" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse bg-surface" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (booking) {
    return (
      <ResultView
        booking={booking}
        onReset={reset}
        unlockPhone={unlockPhone}
        setUnlockPhone={setUnlockPhone}
        unlocking={unlocking}
        unlockError={unlockError}
        onUnlock={handleUnlock}
      />
    );
  }

  return (
    <section className="frame py-8 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void lookup(code, phone);
            }}
            className="border border-line bg-paper p-5 sm:p-7"
            noValidate
          >
            <p className="meta text-teal">Cari pesanan</p>
            <h2 className="mt-2 text-[1.35rem] font-bold tracking-[-0.02em]">
              Masukkan kode tiket Anda.
            </h2>
            <p className="mt-2 max-w-[52ch] text-[0.82rem] leading-relaxed text-muted">
              Kode berformat <span className="ticket-code text-ink">GCC-YYMMDD-XXXX</span>{' '}
              dan dikirim setelah pesanan dibuat.
            </p>

            <div className="mt-6">
              <label htmlFor="track-code" className="field-label">
                Kode tiket
              </label>
              <input
                id="track-code"
                className="field-input ticket-code text-[1rem] uppercase tracking-[0.08em]"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="GCC-261021-A1B2"
                autoComplete="off"
                spellCheck={false}
                maxLength={24}
                required
              />
            </div>

            <div className="mt-5">
              <label htmlFor="track-phone" className="field-label">
                Nomor WhatsApp{' '}
                <span className="font-normal normal-case tracking-normal">(opsional)</span>
              </label>
              <input
                id="track-phone"
                type="tel"
                inputMode="tel"
                className="field-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0812 3456 7890"
                autoComplete="tel"
                maxLength={20}
              />
              <p className="field-hint">
                Diperlukan untuk membuka alamat lengkap dan catatan pesanan.
              </p>
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-4 border border-rust/30 bg-rust/5 px-3 py-2.5 text-[0.8rem] leading-relaxed text-rust"
              >
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-accent mt-6 w-full sm:w-auto">
              Cari tiket
              <span className="btn-icon">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </button>
          </form>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-ink p-5 text-bone sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="meta text-bone/55">Panduan singkat</p>
                <p className="mt-2 text-[1.05rem] font-semibold">Di mana kode saya?</p>
              </div>
              <span className="ticket-code border border-bone/25 px-2 py-1 text-[0.56rem] text-bone/60">
                GCC — TRK
              </span>
            </div>
            <ol className="mt-6 space-y-4">
              {[
                'Kode tercantum pada pesan konfirmasi WhatsApp setelah pesanan dikirim.',
                'Salin kode lengkap, termasuk empat karakter terakhir.',
                'Cari tiket untuk melihat status, teknisi, dan jadwal.',
                'Tambahkan nomor WhatsApp untuk membuka alamat dan catatan.',
              ].map((item, index) => (
                <li key={item} className="flex gap-3 text-[0.8rem] leading-relaxed text-bone/75">
                  <span className="ticket-code pt-0.5 text-[0.62rem] text-bone/40">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <div className="mt-6 border-t border-bone/20 pt-4">
              <a
                href={waLink('Halo GCC Web, saya tidak menemukan kode tiket pesanan saya.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.78rem] font-semibold transition-colors hover:text-teal-soft"
              >
                <WhatsAppMark className="h-4 w-4" />
                Tidak menemukan kode? Hubungi kami
              </a>
            </div>
          </div>

          <div className="mt-5 border border-line p-5">
            <p className="meta text-muted">Privasi</p>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-muted">
              Tanpa verifikasi nomor, halaman ini hanya menampilkan nama yang
              disamarkan, status, dan jadwal. Alamat lengkap tidak dibuka.
            </p>
            <Link href="/privasi" className="link-underline mt-4 text-[0.76rem]">
              Kebijakan privasi
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ResultView({
  booking,
  onReset,
  unlockPhone,
  setUnlockPhone,
  unlocking,
  unlockError,
  onUnlock,
}: {
  booking: TrackedBooking;
  onReset: () => void;
  unlockPhone: string;
  setUnlockPhone: (value: string) => void;
  unlocking: boolean;
  unlockError: string | null;
  onUnlock: () => void;
}) {
  const activeIndex = TIMELINE_STEPS.findIndex((step) => step.status === booking.status);
  const cancelled = booking.status === 'CANCELLED';
  const historyByStatus = new Map(
    booking.history.map((entry) => [entry.status, entry] as const),
  );
  const paymentMethod = booking.paymentMethod
    ? PAYMENT_METHOD_LABEL[booking.paymentMethod]
    : null;
  const waMessage = `Halo GCC Web, saya ingin menanyakan tiket ${booking.code} untuk ${booking.service.name}. Status saat ini: ${STATUS_LABEL[booking.status]}.`;

  return (
    <section className="frame py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-5">
        <div>
          <p className="meta text-muted">Hasil pelacakan</p>
          <h2 className="mt-2 text-[1.5rem] font-bold tracking-[-0.025em] sm:text-[1.8rem]">
            Tiket {booking.code}
          </h2>
        </div>
        <button type="button" onClick={onReset} className="btn btn-ghost px-4 no-print">
          Lacak kode lain
        </button>
      </div>

      <div className="ticket relative mt-7 p-5 sm:p-7">
        <span className="ticket-notch ticket-notch-left" aria-hidden="true" />
        <span className="ticket-notch ticket-notch-right" aria-hidden="true" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="meta text-muted">Kode tiket</p>
            <p className="ticket-code mt-1 text-[1.25rem] font-bold tracking-[0.1em]">
              {booking.code}
            </p>
            <p className="mt-2 text-[0.7rem] text-muted">
              Dibuat {formatDateTime(booking.createdAt)} WIB
            </p>
          </div>
          <div className="text-left sm:text-right">
            <StatusChip status={booking.status} long />
            <p className="mt-2 text-[0.7rem] text-muted">
              {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
              {paymentMethod ? ` · ${paymentMethod}` : ''}
            </p>
          </div>
        </div>

        <div className="ticket-rule my-5" aria-hidden="true" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="meta text-muted">Layanan</p>
            <p className="mt-1.5 text-[0.95rem] font-semibold">{booking.service.name}</p>
            <p className="mt-1 text-[0.78rem] text-muted">
              {booking.variant?.name ?? 'Tarif dasar'}
            </p>
          </div>
          <div>
            <p className="meta text-muted">Jadwal</p>
            <p className="mt-1.5 text-[0.95rem] font-semibold">
              {formatDateTime(booking.scheduledAt)} WIB
            </p>
            <p className="mt-1 text-[0.78rem] text-muted">{booking.slotLabel}</p>
          </div>
          <div>
            <p className="meta text-muted">Teknisi</p>
            <p className="mt-1.5 text-[0.9rem] font-semibold">
              {booking.technician?.name ?? 'Belum ditugaskan'}
            </p>
            <p className="mt-1 text-[0.78rem] text-muted">
              Nama lengkap tersedia saat status penugasan.
            </p>
          </div>
          <div>
            <p className="meta text-muted">Total estimasi</p>
            <p className="tabular mt-1.5 text-[1.2rem] font-bold">
              {formatRupiah(booking.total)}
            </p>
            <p className="mt-1 text-[0.78rem] text-muted">
              Pembayaran setelah pekerjaan diuji.
            </p>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-5 border border-rust/30 bg-rust/5 px-3.5 py-3">
            <p className="text-[0.82rem] font-semibold text-rust">Pesanan dibatalkan.</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-rust/85">
              Hubungi kami lewat WhatsApp bila pembatalan ini tidak Anda ajukan atau
              ingin menjadwalkan ulang.
            </p>
          </div>
        ) : null}

        {!booking.verified ? (
          <div className="mt-5 border border-amber/35 bg-amber/10 p-4">
            <p className="text-[0.82rem] font-semibold">Sebagian data disembunyikan.</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-ink/75">
              Masukkan nomor WhatsApp yang dipakai saat memesan untuk membuka alamat
              lengkap dan catatan.
            </p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                onUnlock();
              }}
            >
              <label htmlFor="unlock-phone" className="sr-only">
                Nomor WhatsApp
              </label>
              <input
                id="unlock-phone"
                type="tel"
                inputMode="tel"
                className="field-input bg-paper"
                value={unlockPhone}
                onChange={(event) => setUnlockPhone(event.target.value)}
                placeholder="0812 3456 7890"
                autoComplete="tel"
                maxLength={20}
              />
              <button
                type="submit"
                className="btn btn-primary shrink-0 px-4"
                disabled={unlocking || !unlockPhone.trim()}
              >
                {unlocking ? 'Memeriksa…' : 'Buka data'}
              </button>
            </form>
            {unlockError ? (
              <p role="alert" className="mt-2 text-[0.76rem] text-rust">
                {unlockError}
              </p>
            ) : null}
          </div>
        ) : null}

        {booking.notes ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="meta text-muted">Catatan pesanan</p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">{booking.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-9 grid gap-9 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <p className="meta text-muted">Progres pekerjaan</p>
          <ol className="mt-4">
            {TIMELINE_STEPS.map((step, index) => {
              const entry = historyByStatus.get(step.status);
              const isCurrent =
                index === activeIndex &&
                booking.status !== 'COMPLETED' &&
                booking.status !== 'CANCELLED';
              const isDone =
                (index < activeIndex && !cancelled) ||
                (index === activeIndex && booking.status === 'COMPLETED') ||
                (cancelled && Boolean(entry));
              return (
                <li
                  key={step.status}
                  className={cn(
                    'relative pb-6 pl-10 last:pb-0',
                    index === TIMELINE_STEPS.length - 1 && 'pb-0',
                  )}
                >
                  {index < TIMELINE_STEPS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-line"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 top-0 flex h-7 w-7 items-center justify-center border text-[0.62rem] font-semibold',
                      isCurrent
                        ? 'border-teal bg-teal text-bone'
                        : isDone
                          ? 'border-teal/35 bg-teal-soft text-teal'
                          : 'border-line bg-bone text-muted',
                    )}
                  >
                    {isDone ? '✓' : String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'text-[0.88rem] font-semibold',
                        !isCurrent && !isDone && 'text-muted',
                      )}
                    >
                      {step.title}
                    </p>
                    {entry ? (
                      <time
                        dateTime={entry.createdAt}
                        className="text-[0.64rem] text-muted"
                      >
                        {formatDateTime(entry.createdAt)}
                      </time>
                    ) : null}
                  </div>
                  <p className="mt-1 max-w-[52ch] text-[0.76rem] leading-relaxed text-muted">
                    {step.description}
                  </p>
                  {entry?.note ? (
                    <p className="mt-1.5 border-l border-line pl-3 text-[0.72rem] leading-relaxed text-ink/70">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-surface p-5">
            <p className="meta text-muted">Rincian pesanan</p>
            <dl className="mt-4 divide-y divide-line/80 text-[0.8rem]">
              <div className="flex items-start justify-between gap-5 py-2.5">
                <dt className="text-muted">Pelanggan</dt>
                <dd className="text-right font-medium">{booking.customer.name}</dd>
              </div>
              <div className="flex items-start justify-between gap-5 py-2.5">
                <dt className="text-muted">WhatsApp</dt>
                <dd className="text-right font-medium">{booking.customer.phone}</dd>
              </div>
              <div className="flex items-start justify-between gap-5 py-2.5">
                <dt className="shrink-0 text-muted">Alamat</dt>
                <dd className="text-right font-medium">
                  {booking.customer.address ?? 'Disembunyikan'}
                  {booking.customer.address ? (
                    <>
                      <br />
                      {booking.district}, {booking.city}
                      {booking.customer.postalCode
                        ? ` ${booking.customer.postalCode}`
                        : ''}
                    </>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-5 py-2.5">
                <dt className="text-muted">Pembayaran</dt>
                <dd className="text-right font-medium">
                  {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
                  {paymentMethod ? ` · ${paymentMethod}` : ''}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 no-print">
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary px-4"
            >
              <WhatsAppMark className="h-4 w-4" />
              Tanya via WhatsApp
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-ghost px-4"
            >
              Cetak
            </button>
            <Link href="/booking" className="link-underline py-2 text-[0.8rem]">
              Pesan layanan lain
            </Link>
          </div>

          <p className="mt-4 text-[0.7rem] leading-relaxed text-muted">
            Perubahan jadwal dapat diajukan minimal 2 jam sebelum slot dengan
            menyertakan kode tiket.
          </p>
        </aside>
      </div>
    </section>
  );
}
