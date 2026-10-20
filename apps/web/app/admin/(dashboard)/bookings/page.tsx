'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiGetPaginated, DEMO_MODE } from '@/lib/api';
import { getDemoBookings } from '@/lib/demo-data';
import {
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  formatDateTime,
  formatRupiah,
  cn,
} from '@/lib/format';
import type { AdminBooking, BookingStatus, PaymentStatus } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  EmptyState,
  PaymentBadge,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';
import { StatusChip } from '@/components/ui/StatusChip';
import { ArrowUpRight } from '@/components/ui/Icons';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ASSIGNED',
  'EN_ROUTE',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const PAYMENT_OPTIONS: PaymentStatus[] = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [paymentStatus, setPaymentStatus] = useState<'' | PaymentStatus>('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);

    const loadDemo = () => {
      const all = getDemoBookings().filter((booking) => {
        if (status && booking.status !== status) return false;
        if (paymentStatus && booking.paymentStatus !== paymentStatus) return false;
        if (query) {
          const haystack = `${booking.code} ${booking.customer.name} ${booking.customer.phone} ${booking.customer.district}`.toLowerCase();
          if (!haystack.includes(query.toLowerCase())) return false;
        }
        return true;
      });
      const start = (page - 1) * PAGE_SIZE;
      return {
        data: all.slice(start, start + PAGE_SIZE),
        meta: {
          page,
          limit: PAGE_SIZE,
          total: all.length,
          totalPages: Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
        },
      };
    };

    const load = DEMO_MODE
      ? Promise.resolve(loadDemo()).then((result) => {
          if (active) setSource('demo');
          return result;
        })
      : apiGetPaginated<AdminBooking[]>(`/admin/bookings?${params.toString()}`).catch(() => {
          if (active) setSource('fallback');
          return loadDemo();
        });

    load
      .then((result) => {
        if (!active) return;
        setRows(result.data ?? []);
        if (result.meta) {
          setMeta({
            page: result.meta.page,
            limit: result.meta.limit,
            total: result.meta.total,
            totalPages: result.meta.totalPages,
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, query, status, paymentStatus]);

  const demoCounts = useMemo(() => {
    if (!DEMO_MODE) return null;
    const all = getDemoBookings();
    return {
      pending: all.filter((booking) => booking.status === 'PENDING').length,
      active: all.filter((booking) =>
        ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS'].includes(booking.status),
      ).length,
      total: all.length,
    };
  }, []);

  const filtersActive = Boolean(query || status || paymentStatus);

  function resetFilters() {
    setSearchTerm('');
    setQuery('');
    setStatus('');
    setPaymentStatus('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pesanan"
        title="Semua tiket masuk"
        description="Cari pesanan, tinjau detail, konfirmasi jadwal, dan tugaskan teknisi."
        actions={
          <Link
            href="/booking"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal"
          >
            Pesanan baru
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />

      <SourceNotice source={source} />

      {demoCounts ? (
        <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
          <div className="bg-paper px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">Menunggu konfirmasi</p>
            <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{demoCounts.pending}</p>
          </div>
          <div className="bg-paper px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">Pekerjaan aktif</p>
            <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{demoCounts.active}</p>
          </div>
          <div className="bg-paper px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">Total tiket</p>
            <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{demoCounts.total}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 border border-line bg-paper p-3 sm:grid-cols-[1fr_10rem_11rem]">
        <div>
          <label htmlFor="booking-search" className="field-label">
            Cari
          </label>
          <input
            id="booking-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Kode, nama, WhatsApp, atau kecamatan"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="booking-status" className="field-label">
            Status
          </label>
          <select
            id="booking-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | BookingStatus);
              setPage(1);
            }}
            className="field"
          >
            <option value="">Semua status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="booking-payment" className="field-label">
            Pembayaran
          </label>
          <select
            id="booking-payment"
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value as '' | PaymentStatus);
              setPage(1);
            }}
            className="field"
          >
            <option value="">Semua</option>
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PAYMENT_STATUS_LABEL[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <AdminLoading label="Memuat pesanan…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan yang cocok"
          body={
            filtersActive
              ? 'Ubah kata kunci atau filter status untuk melihat pesanan lain.'
              : 'Pesanan baru akan muncul di sini setelah pelanggan menyelesaikan formulir booking.'
          }
          action={
            filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="border border-line px-3 py-2 text-[0.72rem] font-semibold transition-colors hover:border-ink"
              >
                Reset filter
              </button>
            ) : undefined
          }
        />
      ) : (
        <section className="border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-2.5 font-semibold">Tiket</th>
                  <th className="px-3 py-2.5 font-semibold">Pelanggan</th>
                  <th className="px-3 py-2.5 font-semibold">Layanan</th>
                  <th className="px-3 py-2.5 font-semibold">Jadwal</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Bayar</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-line/60 transition-colors last:border-b-0 hover:bg-surface/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="ticket-code text-[0.68rem] font-semibold text-teal hover:underline"
                      >
                        {booking.code}
                      </Link>
                      <p className="mt-1 text-[0.58rem] text-muted">
                        {booking.source === 'WEBSITE' ? 'Web' : booking.source === 'WHATSAPP' ? 'WhatsApp' : 'Telepon'}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-[0.76rem] font-semibold">{booking.customer.name}</p>
                      <p className="ticket-code mt-0.5 text-[0.62rem] text-muted">
                        {booking.customer.phone}
                      </p>
                      <p className="mt-0.5 text-[0.62rem] text-muted">{booking.customer.district}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-[0.72rem]">{booking.service.name}</p>
                      <p className="mt-0.5 text-[0.62rem] text-muted">
                        {booking.variant?.name ?? '—'} · {booking.unitCount} unit
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-[0.7rem]">{formatDateTime(booking.scheduledAt)}</p>
                      <p className="mt-0.5 text-[0.62rem] text-muted">{booking.slotLabel}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <StatusChip status={booking.status} />
                      <p className="mt-1.5 text-[0.6rem] text-muted">
                        {booking.technician?.name ?? 'Belum ditugaskan'}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <PaymentBadge status={booking.paymentStatus} />
                    </td>
                    <td className="px-3 py-3 text-right align-top text-[0.72rem] tabular-nums">
                      {formatRupiah(booking.total)}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1 border border-line px-2 py-1.5 text-[0.62rem] font-semibold transition-colors hover:border-ink"
                      >
                        Buka
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[0.68rem] text-muted">
              Menampilkan{' '}
              <span className="font-semibold text-ink">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              dari {meta.total} pesanan
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={meta.page <= 1}
                className="border border-line px-2.5 py-1.5 text-[0.66rem] font-semibold transition-colors hover:border-ink disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-[0.66rem] tabular-nums text-muted">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(meta.totalPages, value + 1))}
                disabled={meta.page >= meta.totalPages}
                className={cn(
                  'border border-line px-2.5 py-1.5 text-[0.66rem] font-semibold transition-colors hover:border-ink disabled:opacity-40',
                )}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
