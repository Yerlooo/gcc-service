'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, DEMO_MODE } from '@/lib/api';
import { getDemoAvailability } from '@/lib/demo-data';
import {
  cn,
  formatRupiah,
  UNIT_LABEL,
  type DateOption,
} from '@/lib/format';
import type { AvailabilityResponse, Service } from '@/lib/types';
import { ArrowUpRight } from '@/components/ui/Icons';

interface QuickBookingProps {
  services: Service[];
  dates: DateOption[];
  initialServiceSlug?: string;
}

type Source = 'api' | 'demo' | 'fallback';

export function QuickBooking({ services, dates, initialServiceSlug }: QuickBookingProps) {
  const initialService =
    services.find((service) => service.slug === initialServiceSlug) ?? services[0];
  const [serviceId, setServiceId] = useState(initialService?.id ?? '');
  const [variantId, setVariantId] = useState(initialService?.variants[0]?.id ?? '');
  const [date, setDate] = useState(dates[0]?.iso ?? '');
  const [slot, setSlot] = useState('');
  const [units, setUnits] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source>(DEMO_MODE ? 'demo' : 'api');
  const autoAdvanced = useRef(false);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const variant = service?.variants.find((item) => item.id === variantId) ?? null;
  const unitPrice = variant?.price ?? service?.basePrice ?? 0;
  const total = unitPrice * units;
  const duration = variant?.durationMinutes ?? service?.durationMinutes ?? 60;

  const loadAvailability = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      if (DEMO_MODE) throw new Error('demo');
      const response = await fetch(`${API_URL}/bookings/availability?date=${targetDate}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as {
        success: boolean;
        data: AvailabilityResponse;
      };
      if (!response.ok || !body.success) throw new Error('availability unavailable');
      setAvailability(body.data);
      setSource('api');
    } catch {
      setAvailability(getDemoAvailability(targetDate));
      setSource(DEMO_MODE ? 'demo' : 'fallback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    void loadAvailability(date);
  }, [date, loadAvailability]);

  useEffect(() => {
    if (!availability) return;

    const hasAvailable = availability.slots.some((item) => item.available);
    if (
      !hasAvailable &&
      date === dates[0]?.iso &&
      dates[1] &&
      !autoAdvanced.current
    ) {
      autoAdvanced.current = true;
      setDate(dates[1].iso);
      return;
    }

    setSlot((current) => {
      const stillAvailable = availability.slots.find(
        (item) => item.id === current && item.available,
      );
      if (stillAvailable) return current;
      return availability.slots.find((item) => item.available)?.id ?? '';
    });
  }, [availability, date, dates]);

  const variants = service?.variants ?? [];
  const slotAvailable = Boolean(
    availability?.slots.find((item) => item.id === slot && item.available),
  );

  const href = useMemo(() => {
    if (!service || !date || !slot) return '/booking';
    const params = new URLSearchParams({
      service: service.slug,
      date,
      slot,
      units: String(units),
    });
    if (variant) params.set('variant', variant.id);
    return `/booking?${params.toString()}`;
  }, [service, date, slot, units, variant]);

  function handleServiceChange(nextId: string) {
    setServiceId(nextId);
    const nextService = services.find((item) => item.id === nextId);
    setVariantId(nextService?.variants[0]?.id ?? '');
  }

  const sourceNote =
    source === 'demo'
      ? 'Mode demo: ketersediaan slot adalah contoh.'
      : source === 'fallback'
        ? 'Ketersediaan langsung belum termuat; admin akan mengonfirmasi slot.'
        : null;

  return (
    <div className="ticket p-5 sm:p-6">
      <span className="ticket-notch ticket-notch-left" aria-hidden="true" />
      <span className="ticket-notch ticket-notch-right" aria-hidden="true" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="meta text-teal">Tiket servis</p>
          <p className="mt-1 text-[0.7rem] text-muted">Belum diterbitkan</p>
        </div>
        <div className="border border-line px-2 py-1">
          <span className="ticket-code text-[0.62rem] text-muted">GCC — DRAF</span>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="quick-service" className="field-label">
            Layanan
          </label>
          <select
            id="quick-service"
            className="field-input"
            value={serviceId}
            onChange={(event) => handleServiceChange(event.target.value)}
          >
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {variants.length > 0 ? (
          <div>
            <label htmlFor="quick-variant" className="field-label">
              Varian
            </label>
            <select
              id="quick-variant"
              className="field-input"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {variants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatRupiah(item.price)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <span className="field-label">Tanggal</span>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 pt-0.5">
            {dates.map((option) => {
              const active = option.iso === date;
              return (
                <button
                  key={option.iso}
                  type="button"
                  onClick={() => setDate(option.iso)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-w-[3.55rem] shrink-0 flex-col items-center border px-2 py-2 transition-colors duration-300',
                    active
                      ? 'border-ink bg-ink text-bone'
                      : 'border-line bg-paper text-ink hover:border-ink/45',
                  )}
                >
                  <span className="text-[0.6rem] uppercase tracking-[0.09em] opacity-65">
                    {option.weekday}
                  </span>
                  <span className="tabular mt-0.5 text-[1.05rem] font-semibold leading-none">
                    {option.day}
                  </span>
                  <span className="mt-1 text-[0.58rem] uppercase tracking-[0.06em] opacity-60">
                    {option.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="field-label mb-0">Jam kedatangan</span>
            <span className="text-[0.65rem] text-muted">
              {loading ? 'Memeriksa…' : 'Sisa slot hari itu'}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(availability?.slots ?? []).map((item) => {
              const active = item.id === slot;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.available}
                  onClick={() => setSlot(item.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-[3.1rem] items-center justify-between gap-2 border px-2.5 py-2 text-left transition-colors duration-300',
                    active
                      ? 'border-teal bg-teal-soft text-ink'
                      : item.available
                        ? 'border-line bg-paper hover:border-teal/60'
                        : 'cursor-not-allowed border-line/60 bg-transparent text-muted/55',
                  )}
                >
                  <span className="tabular text-[0.82rem] font-semibold">{item.label}</span>
                  <span className="text-right text-[0.57rem] uppercase leading-tight tracking-[0.06em] opacity-70">
                    {item.available ? (item.remaining <= 1 ? 'Sisa 1' : `Sisa ${item.remaining}`) : 'Penuh'}
                  </span>
                </button>
              );
            })}
            {loading && !availability ? (
              <div className="col-span-2 py-3 text-[0.8rem] text-muted">Memuat slot…</div>
            ) : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="field-label">Jumlah {UNIT_LABEL[service?.unit ?? 'UNIT']}</span>
            <div className="mt-1 flex items-center border border-line bg-paper">
              <button
                type="button"
                aria-label="Kurangi jumlah"
                className="flex h-10 w-10 items-center justify-center text-lg transition-colors hover:bg-surface disabled:opacity-35"
                onClick={() => setUnits((value) => Math.max(1, value - 1))}
                disabled={units <= 1}
              >
                −
              </button>
              <span className="tabular w-9 text-center text-[0.95rem] font-semibold">{units}</span>
              <button
                type="button"
                aria-label="Tambah jumlah"
                className="flex h-10 w-10 items-center justify-center text-lg transition-colors hover:bg-surface disabled:opacity-35"
                onClick={() => setUnits((value) => Math.min(10, value + 1))}
                disabled={units >= 10}
              >
                +
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.63rem] uppercase tracking-[0.1em] text-muted">Estimasi</p>
            <p className="tabular mt-0.5 text-[1.55rem] font-bold leading-none tracking-[-0.03em]">
              {formatRupiah(total)}
            </p>
            <p className="mt-1 text-[0.62rem] text-muted">
              {units} × {formatRupiah(unitPrice)}
            </p>
          </div>
        </div>
      </div>

      <div className="ticket-rule my-5" aria-hidden="true" />

      <Link
        href={href}
        aria-disabled={!slotAvailable}
        tabIndex={slotAvailable ? 0 : -1}
        className={cn('btn btn-accent w-full', !slotAvailable && 'pointer-events-none opacity-45')}
      >
        Lanjutkan pesanan
        <span className="btn-icon">
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.63rem] text-muted">
        <span>Garansi {service?.warrantyDays ?? 30} hari</span>
        <span>± {duration} menit</span>
        <span>Harga dikonfirmasi sebelum kerja</span>
      </div>

      {sourceNote ? (
        <p className="mt-3 border-t border-line pt-3 text-[0.65rem] leading-relaxed text-muted">
          {sourceNote}
        </p>
      ) : null}
    </div>
  );
}
