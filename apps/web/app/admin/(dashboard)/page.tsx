'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, DEMO_MODE } from '@/lib/api';
import { getDemoDashboard } from '@/lib/demo-data';
import {
  cn,
  dateFromISO,
  formatDate,
  formatRelativeDay,
  formatRupiah,
  initials,
  jakartaTodayISO,
} from '@/lib/format';
import type { BookingStatus, DashboardData } from '@/lib/types';
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

const STATUS_BAR: Record<BookingStatus, string> = {
  PENDING: 'bg-amber',
  CONFIRMED: 'bg-teal/50',
  ASSIGNED: 'bg-teal/70',
  EN_ROUTE: 'bg-teal',
  IN_PROGRESS: 'bg-ink',
  COMPLETED: 'bg-ink/50',
  CANCELLED: 'bg-line',
};

function Kpi({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={cn('border p-4', accent ? 'border-teal bg-teal-soft/40' : 'border-line bg-paper')}>
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-muted">{label}</p>
      <p className="mt-2 text-[1.5rem] font-bold leading-none tracking-[-0.04em] tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[0.68rem] leading-relaxed text-muted">{note}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [source, setSource] = useState<DataSource>('api');

  useEffect(() => {
    let active = true;
    setData(null);
    const load = DEMO_MODE
      ? Promise.resolve(getDemoDashboard(range)).then((demo) => {
          setSource('demo');
          return demo;
        })
      : apiGet<DashboardData>(`/admin/dashboard?range=${range}`).catch(() => {
          if (active) setSource('fallback');
          return getDemoDashboard(range);
        });

    load.then((result) => {
      if (active) setData(result);
    });

    return () => {
      active = false;
    };
  }, [range]);

  if (!data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Ringkasan" title="Operasi hari ini" />
        <AdminLoading label="Menyiapkan ringkasan operasi…" />
      </div>
    );
  }

  const totalBookings = data.trend.reduce((sum, point) => sum + point.bookings, 0);
  const totalRevenue = data.trend.reduce((sum, point) => sum + point.revenue, 0);
  const maxBookings = Math.max(1, ...data.trend.map((point) => point.bookings));
  const totalStatus = Math.max(
    1,
    data.statusBreakdown.reduce((sum, item) => sum + item.count, 0),
  );
  const todayIso = jakartaTodayISO();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ringkasan"
        title={
          <>
            Operasi hari ini,{' '}
            <span className="font-light italic">
              {formatDate(new Date(), { day: 'numeric', month: 'long' })}
            </span>
          </>
        }
        description="Pantau pesanan masuk, jadwal kunjungan, beban teknisi, dan stok yang perlu dibeli."
        actions={
          <>
            <div className="flex border border-line bg-paper" role="group" aria-label="Rentang data">
              {(['7d', '30d'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  aria-pressed={range === option}
                  className={cn(
                    'px-3 py-2 text-[0.7rem] font-semibold transition-colors duration-300',
                    range === option ? 'bg-ink text-bone' : 'text-muted hover:text-ink',
                  )}
                >
                  {option === '7d' ? '7 hari' : '30 hari'}
                </button>
              ))}
            </div>
            <Link
              href="/booking"
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:bg-teal hover:border-teal"
            >
              Buat pesanan
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </>
        }
      />

      <SourceNotice source={source} />

      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Pesanan hari ini"
          value={String(data.kpis.bookingsToday)}
          note={`Kapasitas ${data.kpis.slotCapacity} pesanan per slot`}
          accent
        />
        <Kpi
          label="Menunggu konfirmasi"
          value={String(data.kpis.pendingConfirmations)}
          note="Perlu dihubungi dan dijadwalkan"
        />
        <Kpi
          label="Pekerjaan aktif"
          value={String(data.kpis.activeJobs)}
          note="Dikonfirmasi hingga sedang dikerjakan"
        />
        <Kpi
          label="Pendapatan bulan ini"
          value={formatRupiah(data.kpis.revenueThisMonth)}
          note={`${data.kpis.completedThisMonth} pekerjaan selesai`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="border border-line bg-paper p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Tren pesanan</h2>
              <p className="mt-1 text-[0.7rem] text-muted">
                {range === '7d' ? 'Tujuh hari terakhir' : 'Tiga puluh hari terakhir'} ·{' '}
                {totalBookings} pesanan tercatat
              </p>
            </div>
            <p className="text-right">
              <span className="block text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                Nilai pesanan
              </span>
              <span className="text-[0.95rem] font-semibold tabular-nums">
                {formatRupiah(totalRevenue)}
              </span>
            </p>
          </div>

          <div className="mt-6">
            <div
              className="flex h-40 items-end gap-[3px] border-b border-line"
              role="img"
              aria-label={`Grafik pesanan per hari, ${totalBookings} pesanan dalam ${range === '7d' ? '7' : '30'} hari`}
            >
              {data.trend.map((point) => {
                const height = Math.max(6, Math.round((point.bookings / maxBookings) * 100));
                return (
                  <div
                    key={point.date}
                    className="group flex h-full flex-1 items-end"
                    title={`${formatDate(dateFromISO(point.date))}: ${point.bookings} pesanan · ${formatRupiah(point.revenue)}`}
                  >
                    <div
                      className={cn(
                        'w-full transition-colors duration-300',
                        point.date === todayIso ? 'bg-teal' : 'bg-ink/25 group-hover:bg-ink/50',
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[0.58rem] text-muted">
              <span>{formatDate(dateFromISO(data.trend[0].date), { day: 'numeric', month: 'short' })}</span>
              <span>Hari ini</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="border border-line bg-paper p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Stok menipis</h2>
                <p className="mt-1 text-[0.7rem] text-muted"> Pada atau di bawah batas minimum.</p>
              </div>
              <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-teal hover:underline"
              >
                Kelola
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="mt-4 border border-dashed border-line px-3 py-5 text-center text-[0.74rem] text-muted">
                Tidak ada stok di bawah minimum.
              </p>
            ) : (
              <ul className="mt-3">
                {data.lowStock.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 border-b border-line/70 py-2.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.76rem] font-medium">{item.name}</span>
                      <span className="ticket-code text-[0.58rem] text-muted">{item.sku}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[0.76rem] font-semibold tabular-nums text-rust">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="block text-[0.58rem] text-muted">min. {item.minQuantity}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex items-center justify-between gap-4 border border-teal/25 bg-teal-soft/45 p-4 sm:p-5">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-teal">
                Moderasi testimoni
              </p>
              <p className="mt-1.5 text-[0.8rem] leading-relaxed">
                {data.pendingTestimonials > 0
                  ? `${data.pendingTestimonials} testimoni menunggu ditinjau sebelum tampil di situs.`
                  : 'Semua testimoni sudah ditinjau.'}
              </p>
            </div>
            <Link
              href="/admin/testimonials"
              className="shrink-0 border border-teal/30 bg-paper px-2.5 py-2 text-[0.66rem] font-semibold text-teal transition-colors hover:bg-teal hover:text-bone"
            >
              Tinjau
            </Link>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="border border-line bg-paper">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Jadwal hari ini</h2>
              <p className="mt-0.5 text-[0.7rem] text-muted">
                {formatRelativeDay(todayIso)} · {data.todaySchedule.length} kunjungan
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-teal hover:underline"
            >
              Semua pesanan
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {data.todaySchedule.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Belum ada kunjungan hari ini"
                body="Pesanan baru akan muncul di sini setelah pelanggan memilih jadwal."
              />
            </div>
          ) : (
            <ul>
              {data.todaySchedule.map((item) => (
                <li key={item.id} className="border-b border-line/70 last:border-b-0">
                  <Link
                    href={`/admin/bookings/${item.id}`}
                    className="group grid gap-2 px-4 py-3.5 transition-colors hover:bg-surface/60 sm:grid-cols-[5.4rem_1fr_auto] sm:items-center sm:gap-4 sm:px-5"
                  >
                    <div>
                      <p className="ticket-code text-[0.65rem] font-semibold">{item.slot}</p>
                      <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.08em] text-muted">
                        {item.code}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[0.8rem] font-semibold">
                        {item.customer.name}
                        <span className="font-normal text-muted"> · {item.customer.district}</span>
                      </p>
                      <p className="mt-0.5 truncate text-[0.68rem] text-muted">
                        {item.service}
                        {item.variant ? ` — ${item.variant}` : ''} · {item.technician ?? 'Belum ada teknisi'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <StatusChip status={item.status} />
                      <PaymentBadge status={item.paymentStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-line bg-paper">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Beban teknisi</h2>
              <p className="mt-0.5 text-[0.7rem] text-muted">Kapasitas kunjungan per hari.</p>
            </div>
            <Link
              href="/admin/technicians"
              className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-teal hover:underline"
            >
              Atur
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-line/70">
            {data.technicians.map((tech) => {
              const percent = tech.capacity > 0 ? Math.round((tech.workload / tech.capacity) * 100) : 0;
              return (
                <li key={tech.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-line text-[0.56rem] font-semibold">
                      {initials(tech.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.78rem] font-semibold">{tech.name}</p>
                      <p className="truncate text-[0.62rem] text-muted">{tech.zone}</p>
                    </div>
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        tech.isAvailable ? 'bg-teal' : 'bg-line',
                      )}
                      title={tech.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-surface">
                      <div
                        className={cn('h-full', percent >= 90 ? 'bg-rust' : 'bg-teal')}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <span className="text-[0.6rem] tabular-nums text-muted">
                      {tech.workload}/{tech.capacity}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="border border-line bg-paper">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Pesanan terbaru</h2>
              <p className="mt-0.5 text-[0.7rem] text-muted">Enam entri terakhir lintas status.</p>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-teal hover:underline"
            >
              Lihat semua
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-2 font-semibold sm:px-5">Tiket</th>
                  <th className="px-3 py-2 font-semibold">Pelanggan</th>
                  <th className="px-3 py-2 font-semibold">Layanan</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold sm:px-5">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-line/60 last:border-b-0">
                    <td className="px-4 py-2.5 sm:px-5">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="ticket-code text-[0.65rem] font-semibold text-teal hover:underline"
                      >
                        {booking.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[0.74rem]">{booking.customer}</td>
                    <td className="px-3 py-2.5 text-[0.72rem] text-muted">
                      {booking.service}
                      {booking.technician ? (
                        <span className="block text-[0.6rem]">Teknisi: {booking.technician}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusChip status={booking.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-[0.72rem] tabular-nums sm:px-5">
                      {formatRupiah(booking.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-line bg-paper p-4 sm:p-5">
          <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Komposisi status</h2>
          <p className="mt-0.5 text-[0.7rem] text-muted">Seluruh pesanan di data saat ini.</p>
          <div className="mt-4 flex h-2 overflow-hidden bg-surface" aria-hidden="true">
            {data.statusBreakdown.map((item) =>
              item.count > 0 ? (
                <span
                  key={item.status}
                  className={STATUS_BAR[item.status]}
                  style={{ width: `${(item.count / totalStatus) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-4 space-y-2">
            {data.statusBreakdown.map((item) => (
              <li key={item.status} className="flex items-center gap-2 text-[0.72rem]">
                <span className={cn('h-2 w-2 shrink-0', STATUS_BAR[item.status])} aria-hidden="true" />
                <span className="flex-1 text-muted">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-muted">
              Testimoni terbaru
            </h3>
            {data.latestTestimonials.length === 0 ? (
              <p className="mt-2 text-[0.72rem] text-muted">Tidak ada testimoni baru.</p>
            ) : (
              <ul className="mt-2 space-y-2.5">
                {data.latestTestimonials.slice(0, 2).map((item) => (
                  <li key={item.id} className="border-l-2 border-amber pl-2.5">
                    <p className="text-[0.7rem] font-semibold">
                      {item.customerName}{' '}
                      <span className="font-normal text-amber">{'★'.repeat(item.rating)}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.66rem] leading-relaxed text-muted">
                      {item.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
