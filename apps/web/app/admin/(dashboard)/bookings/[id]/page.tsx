'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoTechnicians, getDemoBookings } from '@/lib/demo-data';
import {
  ALLOWED_TRANSITIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  STATUS_ACTION_LABEL,
  STATUS_LABEL,
  dateFromISO,
  formatDate,
  formatDateTime,
  formatRupiah,
  slotLabel,
} from '@/lib/format';
import type {
  AdminBooking,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Technician,
} from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  PaymentBadge,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';
import { StatusChip } from '@/components/ui/StatusChip';
import { ArrowUpRight } from '@/components/ui/Icons';

const PROPERTY_LABEL: Record<AdminBooking['propertyType'], string> = {
  RUMAH: 'Rumah',
  APARTEMEN: 'Apartemen',
  KANTOR: 'Kantor',
  RUKO: 'Ruko',
  LAINNYA: 'Lainnya',
};

const PAYMENT_OPTIONS: PaymentStatus[] = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'TRANSFER', 'QRIS', 'EWALLET', 'MIDTRANS'];

type ApiTechnician = Technician & {
  technician?: {
    zone?: string;
    specialties?: string[];
    capacityPerDay?: number;
    isAvailable?: boolean;
  } | null;
};

function normalizeTechnician(row: ApiTechnician): Technician {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isActive: row.isActive,
    zone: row.zone ?? row.technician?.zone ?? '—',
    specialties: row.specialties ?? row.technician?.specialties ?? [],
    capacityPerDay: row.capacityPerDay ?? row.technician?.capacityPerDay ?? 0,
    isAvailable: row.isAvailable ?? row.technician?.isAvailable ?? false,
    workload: row.workload ?? null,
    remaining: row.remaining ?? null,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Tindakan tidak dapat diproses. Coba lagi.';
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const localMode = DEMO_MODE || Boolean(id?.startsWith('bk-'));

  const [nextStatus, setNextStatus] = useState<BookingStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [saving, setSaving] = useState<'status' | 'assign' | 'payment' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    if (localMode) {
      const found = getDemoBookings().find((row) => row.id === id);
      setBooking(found ?? null);
      setSource('demo');
      setLoadError(found ? null : 'Pesanan demo tidak ditemukan.');
      setLoading(false);
      setTechnicians(demoTechnicians);
      return;
    }

    apiGet<AdminBooking>(`/admin/bookings/${id}`)
      .then((result) => {
        if (active) setBooking(result);
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    apiGet<ApiTechnician[]>('/admin/technicians')
      .then((rows) => {
        if (active) setTechnicians(rows.map(normalizeTechnician));
      })
      .catch(() => {
        if (active) setTechnicians([]);
      });

    return () => {
      active = false;
    };
  }, [id, localMode]);

  // Track the fields the form mirrors individually so saving one panel does not
  // wipe the others; depending on the whole booking object would reset every field.
  const bookingStatus = booking?.status;
  const bookingTechnicianId = booking?.technician?.id;
  const bookingPaymentMethod = booking?.paymentMethod;
  const bookingPaymentRef = booking?.paymentRef;

  useEffect(() => {
    if (!bookingStatus) return;
    setNextStatus(ALLOWED_TRANSITIONS[bookingStatus][0] ?? '');
    setTechnicianId(bookingTechnicianId ?? '');
    setPaymentStatus('');
    setPaymentMethod(bookingPaymentMethod ?? 'CASH');
    setPaymentRef(bookingPaymentRef ?? '');
  }, [bookingStatus, bookingTechnicianId, bookingPaymentMethod, bookingPaymentRef]);

  const allowedNext = booking ? ALLOWED_TRANSITIONS[booking.status] : [];
  const activeTechnicians = useMemo(
    () => technicians.filter((tech) => tech.isActive !== false && tech.isAvailable !== false),
    [technicians],
  );

  const waHref = useMemo(() => {
    if (!booking) return '#';
    const digits = booking.customer.phone.replace(/\D/g, '');
    const phone = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    const text = `Halo ${booking.customer.name}, kami dari GCC Web. Menindaklanjuti pesanan ${booking.code}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [booking]);

  function appendHistory(current: AdminBooking, status: BookingStatus, note: string): AdminBooking {
    return {
      ...current,
      status,
      completedAt:
        status === 'COMPLETED' ? new Date().toISOString() : current.completedAt,
      history: [
        ...current.history,
        {
          status,
          note: note || null,
          createdAt: new Date().toISOString(),
          changedBy: { name: 'GCC Admin (demo)' },
        },
      ],
    };
  }

  async function handleStatus() {
    if (!booking || !nextStatus) return;
    if (
      !booking.technician &&
      ['ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(nextStatus)
    ) {
      setActionError('Tugaskan teknisi terlebih dahulu sebelum memakai status ini.');
      return;
    }
    setActionError(null);
    setActionDone(null);
    setSaving('status');
    try {
      if (localMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        setBooking(appendHistory(booking, nextStatus, statusNote));
        setStatusNote('');
        setActionDone(`Status demo diubah ke "${STATUS_LABEL[nextStatus]}".`);
      } else {
        const updated = await apiSend<AdminBooking>(
          `/admin/bookings/${booking.id}/status`,
          'PATCH',
          { status: nextStatus, note: statusNote.trim() || undefined },
        );
        setBooking(updated);
        setStatusNote('');
        setActionDone(`Status diperbarui ke "${STATUS_LABEL[nextStatus]}".`);
      }
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSaving(null);
    }
  }

  async function handleAssign() {
    if (!booking || !technicianId) return;
    setActionError(null);
    setActionDone(null);
    setSaving('assign');
    try {
      const technician = technicians.find((row) => row.id === technicianId);
      if (localMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        const next =
          booking.status === 'PENDING' || booking.status === 'CONFIRMED'
            ? 'ASSIGNED'
            : booking.status;
        setBooking({
          ...appendHistory(
            booking,
            next,
            `Dikonfirmasi dan ditugaskan kepada ${technician?.name ?? 'teknisi'}.`,
          ),
          technician: technician ? { id: technician.id, name: technician.name } : null,
        });
        setActionDone(`Teknisi demo ditugaskan: ${technician?.name ?? '—'}.`);
      } else {
        const updated = await apiSend<AdminBooking>(
          `/admin/bookings/${booking.id}/assign`,
          'PATCH',
          { technicianId, note: undefined },
        );
        setBooking(updated);
        setActionDone(`Teknisi ditugaskan: ${updated.technician?.name ?? '—'}.`);
      }
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSaving(null);
    }
  }

  async function handlePayment() {
    if (!booking || !paymentStatus) return;
    setActionError(null);
    setActionDone(null);
    setSaving('payment');
    try {
      if (localMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        setBooking({
          ...booking,
          paymentStatus,
          paymentMethod: paymentMethod,
          paymentRef: paymentRef.trim() || booking.paymentRef,
          paidAt:
            paymentStatus === 'PAID' ? new Date().toISOString() : booking.paidAt,
        });
        setActionDone(`Pembayaran demo ditandai "${PAYMENT_STATUS_LABEL[paymentStatus]}".`);
      } else {
        const updated = await apiSend<AdminBooking>(
          `/admin/bookings/${booking.id}/payment`,
          'PATCH',
          {
            status: paymentStatus,
            method: paymentMethod,
            reference: paymentRef.trim() || undefined,
            note: paymentNote.trim() || undefined,
          },
        );
        setBooking(updated);
        setActionDone(`Pembayaran diperbarui: ${PAYMENT_STATUS_LABEL[paymentStatus]}.`);
      }
      setPaymentStatus('');
      setPaymentNote('');
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Pesanan" title="Memuat tiket…" />
        <AdminLoading />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Pesanan"
          title="Tiket tidak ditemukan"
          description={loadError ?? 'Pesanan mungkin sudah dihapus atau tautannya tidak valid.'}
          actions={
            <Link
              href="/admin/bookings"
              className="border border-line px-3 py-2 text-[0.72rem] font-semibold hover:border-ink"
            >
              Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const assignLocked = ['COMPLETED', 'CANCELLED', 'EN_ROUTE', 'IN_PROGRESS'].includes(
    booking.status,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          <>
            <Link href="/admin/bookings" className="hover:text-ink">
              Pesanan
            </Link>{' '}
            / {booking.code}
          </>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {booking.code}
            <StatusChip status={booking.status} />
            <PaymentBadge status={booking.paymentStatus} />
          </span>
        }
        description={`Dibuat ${formatDateTime(booking.createdAt)} · ${PROPERTY_LABEL[booking.propertyType]}`}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-line bg-paper px-3 py-2 text-[0.7rem] font-semibold transition-colors hover:border-ink"
            >
              Cetak
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal"
            >
              Hubungi pelanggan
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </>
        }
      />

      <SourceNotice source={source} />

      {actionError ? (
        <p role="alert" className="border border-rust/30 bg-rust/5 px-3 py-2 text-[0.74rem] text-rust">
          {actionError}
        </p>
      ) : null}
      {actionDone ? (
        <p role="status" className="border border-teal/25 bg-teal-soft/50 px-3 py-2 text-[0.74rem]">
          {actionDone}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="grid gap-px border border-line bg-line sm:grid-cols-2">
            <div className="bg-paper p-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Pelanggan
              </p>
              <p className="mt-1.5 text-[0.92rem] font-semibold">{booking.customer.name}</p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ticket-code mt-0.5 inline-block text-[0.7rem] text-teal hover:underline"
              >
                {booking.customer.phone}
              </a>
              {booking.customer.email ? (
                <p className="mt-0.5 text-[0.68rem] text-muted">{booking.customer.email}</p>
              ) : null}
            </div>
            <div className="bg-paper p-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Layanan
              </p>
              <p className="mt-1.5 text-[0.92rem] font-semibold">{booking.service.name}</p>
              <p className="mt-0.5 text-[0.7rem] text-muted">
                {booking.variant?.name ?? 'Tanpa varian'} · {booking.unitCount} unit ·{' '}
                {booking.durationMinutes} menit
              </p>
            </div>
            <div className="bg-paper p-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Jadwal kunjungan
              </p>
              <p className="mt-1.5 text-[0.92rem] font-semibold">
                {formatDate(dateFromISO(booking.scheduledAt.slice(0, 10)), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-muted">{slotLabel(booking.slotLabel)} WIB</p>
            </div>
            <div className="bg-paper p-4">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Teknisi
              </p>
              <p className="mt-1.5 text-[0.92rem] font-semibold">
                {booking.technician?.name ?? 'Belum ditugaskan'}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-muted">
                {booking.technician ? 'Bertanggung jawab atas kunjungan' : 'Tugaskan melalui panel kanan'}
              </p>
            </div>
          </section>

          <section className="border border-line bg-paper p-4 sm:p-5">
            <h2 className="text-[0.92rem] font-bold tracking-[-0.02em]">Alamat & catatan</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Alamat layanan
                </p>
                <p className="mt-1 text-[0.78rem] leading-relaxed">{booking.address}</p>
                <p className="mt-1 text-[0.72rem] text-muted">
                  {booking.district}, {booking.city}
                  {booking.postalCode ? ` ${booking.postalCode}` : ''}
                </p>
              </div>
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Catatan pelanggan
                </p>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">
                  {booking.notes?.trim() || 'Tidak ada catatan tambahan.'}
                </p>
              </div>
            </div>
          </section>

          <section className="border border-line bg-paper">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-bold tracking-[-0.02em]">Rincian biaya</h2>
            </div>
            <dl className="px-4 py-3 text-[0.76rem] sm:px-5">
              <div className="flex items-baseline justify-between border-b border-line/60 py-2">
                <dt className="text-muted">Harga dasar</dt>
                <dd className="tabular-nums">{formatRupiah(booking.basePrice)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-line/60 py-2">
                <dt className="text-muted">Tambahan</dt>
                <dd className="tabular-nums">{formatRupiah(booking.addOnTotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-line/60 py-2">
                <dt className="text-muted">Diskon</dt>
                <dd className="tabular-nums">−{formatRupiah(booking.discount)}</dd>
              </div>
              <div className="flex items-baseline justify-between py-3">
                <dt className="text-[0.82rem] font-semibold">Total</dt>
                <dd className="text-[1.02rem] font-bold tabular-nums">{formatRupiah(booking.total)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-[0.68rem] text-muted sm:px-5">
              <span>
                Metode:{' '}
                <span className="font-medium text-ink">
                  {booking.paymentMethod ? PAYMENT_METHOD_LABEL[booking.paymentMethod] : '—'}
                </span>
              </span>
              <span>
                Referensi:{' '}
                <span className="ticket-code font-medium text-ink">{booking.paymentRef ?? '—'}</span>
              </span>
              {booking.paidAt ? <span>Dibayar {formatDateTime(booking.paidAt)}</span> : null}
            </div>
          </section>

          <section className="border border-line bg-paper">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-bold tracking-[-0.02em]">Riwayat status</h2>
            </div>
            <ol className="px-4 py-4 sm:px-5">
              {booking.history.map((entry, index) => (
                <li key={`${entry.status}-${entry.createdAt}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="relative flex w-4 shrink-0 justify-center">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal" />
                    {index < booking.history.length - 1 ? (
                      <span className="absolute top-3.5 bottom-0 w-px bg-line" />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.76rem] font-semibold">{STATUS_LABEL[entry.status]}</p>
                    <p className="mt-0.5 text-[0.66rem] text-muted">
                      {formatDateTime(entry.createdAt)}
                      {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ''}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">{entry.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          {localMode ? <DemoActionNote /> : null}

          <section className="border border-line bg-paper p-4">
            <h2 className="text-[0.86rem] font-bold tracking-[-0.02em]">Ubah status</h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
              Hanya transisi yang diizinkan yang ditampilkan.
            </p>
            {allowedNext.length === 0 ? (
              <p className="mt-3 border border-dashed border-line px-3 py-3 text-[0.72rem] text-muted">
                Status ini bersifat final dan tidak dapat diubah.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="next-status" className="field-label">
                    Status berikutnya
                  </label>
                  <select
                    id="next-status"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as BookingStatus)}
                    className="field"
                  >
                    {allowedNext.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_ACTION_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status-note" className="field-label">
                    Catatan <span className="font-normal normal-case text-muted">(opsional)</span>
                  </label>
                  <textarea
                    id="status-note"
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    maxLength={300}
                    rows={2}
                    className="field resize-y"
                    placeholder="Contoh: pelanggan minta datang setelah jam 13.00."
                  />
                </div>
                {!booking.technician &&
                ['ASSIGNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'].includes(nextStatus) ? (
                  <p className="border border-amber/35 bg-amber/10 px-2.5 py-2 text-[0.68rem] leading-relaxed">
                    Tugaskan teknisi terlebih dahulu sebelum memakai status ini.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleStatus}
                  disabled={saving !== null || !nextStatus}
                  className="w-full border border-ink bg-ink px-3 py-2.5 text-[0.72rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
                >
                  {saving === 'status' ? 'Menyimpan…' : 'Simpan status'}
                </button>
              </div>
            )}
          </section>

          <section className="border border-line bg-paper p-4">
            <h2 className="text-[0.86rem] font-bold tracking-[-0.02em]">Teknisi</h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
              Penugasan mengubah status menjadi “Ditugaskan” bila masih menunggu konfirmasi.
            </p>
            {assignLocked ? (
              <p className="mt-3 border border-dashed border-line px-3 py-3 text-[0.72rem] text-muted">
                Teknisi tidak dapat diubah pada status ini.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="technician-id" className="field-label">
                    Pilih teknisi
                  </label>
                  <select
                    id="technician-id"
                    value={technicianId}
                    onChange={(event) => setTechnicianId(event.target.value)}
                    className="field"
                  >
                    <option value="">Belum ditugaskan</option>
                    {activeTechnicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} · {tech.zone}
                        {tech.remaining !== null ? ` (sisa ${tech.remaining})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={saving !== null || !technicianId || technicianId === booking.technician?.id}
                  className="w-full border border-ink bg-ink px-3 py-2.5 text-[0.72rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
                >
                  {saving === 'assign' ? 'Menugaskan…' : 'Tugaskan teknisi'}
                </button>
                {activeTechnicians.length === 0 && !localMode ? (
                  <p className="text-[0.66rem] text-muted">
                    Tidak ada teknisi aktif. Tambahkan melalui menu Teknisi.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="border border-line bg-paper p-4">
            <h2 className="text-[0.86rem] font-bold tracking-[-0.02em]">Pembayaran</h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
              Saat ini: {PAYMENT_STATUS_LABEL[booking.paymentStatus]}.
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="payment-status" className="field-label">
                  Status baru
                </label>
                <select
                  id="payment-status"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | '')}
                  className="field"
                >
                  <option value="">Pilih status</option>
                  {PAYMENT_OPTIONS.filter((option) => option !== booking.paymentStatus).map(
                    (option) => (
                      <option key={option} value={option}>
                        {PAYMENT_STATUS_LABEL[option]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="payment-method" className="field-label">
                  Metode
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="field"
                >
                  {METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {PAYMENT_METHOD_LABEL[option]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="payment-ref" className="field-label">
                  Referensi <span className="font-normal normal-case text-muted">(opsional)</span>
                </label>
                <input
                  id="payment-ref"
                  value={paymentRef}
                  onChange={(event) => setPaymentRef(event.target.value)}
                  maxLength={120}
                  className="field"
                  placeholder="No. transaksi / bukti transfer"
                />
              </div>
              <div>
                <label htmlFor="payment-note" className="field-label">
                  Catatan <span className="font-normal normal-case text-muted">(opsional)</span>
                </label>
                <input
                  id="payment-note"
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  maxLength={300}
                  className="field"
                  placeholder="Contoh: transfer BCA terverifikasi"
                />
              </div>
              <button
                type="button"
                onClick={handlePayment}
                disabled={saving !== null || !paymentStatus}
                className="w-full border border-ink bg-ink px-3 py-2.5 text-[0.72rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
              >
                {saving === 'payment' ? 'Menyimpan…' : 'Simpan pembayaran'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
