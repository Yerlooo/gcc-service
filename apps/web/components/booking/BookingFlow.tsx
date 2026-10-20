'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, API_URL, DEMO_MODE, apiSend } from '@/lib/api';
import { getDemoAvailability } from '@/lib/demo-data';
import { saveDemoBooking } from '@/lib/demo-store';
import {
  addDaysISO,
  cn,
  formatDate,
  formatDateTime,
  formatRupiah,
  jakartaTodayISO,
  slotLabel,
  UNIT_LABEL,
  type DateOption,
} from '@/lib/format';
import { startingPrice } from '@/lib/service-utils';
import { SERVICE_AREAS, waLink } from '@/lib/site';
import type {
  AvailabilityResponse,
  CreatedBooking,
  PropertyType,
  Service,
  ServiceCategory,
  TrackedBooking,
} from '@/lib/types';
import { StatusChip } from '@/components/ui/StatusChip';
import { ArrowRight, ArrowUpRight, WhatsAppMark } from '@/components/ui/Icons';

type Step = 1 | 2 | 3 | 4;
type Source = 'api' | 'demo' | 'fallback';

interface BookingFlowProps {
  categories: ServiceCategory[];
  dates: DateOption[];
}

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  propertyType: PropertyType;
  notes: string;
  consent: boolean;
}

const STEPS: Array<{ step: Step; label: string; hint: string }> = [
  { step: 1, label: 'Layanan', hint: 'Jenis dan jumlah unit' },
  { step: 2, label: 'Jadwal', hint: 'Tanggal dan jam datang' },
  { step: 3, label: 'Data', hint: 'Kontak dan alamat' },
  { step: 4, label: 'Konfirmasi', hint: 'Periksa sebelum kirim' },
];

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: 'RUMAH', label: 'Rumah' },
  { value: 'APARTEMEN', label: 'Apartemen' },
  { value: 'KANTOR', label: 'Kantor' },
  { value: 'RUKO', label: 'Ruko' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const EMPTY_CUSTOMER: CustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
  postalCode: '',
  propertyType: 'RUMAH',
  notes: '',
  consent: false,
};

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function isValidPhone(value: string): boolean {
  return /^628[1-9][0-9]{6,11}$/.test(normalizePhone(value));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function clampUnits(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(20, Math.max(1, Math.round(value)));
}

function getSlotDisplay(slot: string): string {
  return slotLabel(slot);
}

export function BookingFlow({ categories, dates }: BookingFlowProps) {
  const searchParams = useSearchParams();
  const services = useMemo(
    () => categories.flatMap((category) => category.services),
    [categories],
  );

  const paramServiceSlug = searchParams.get('service');
  const paramVariantId = searchParams.get('variant');
  const paramDate = searchParams.get('date');
  const paramSlot = searchParams.get('slot');
  const paramUnits = Number(searchParams.get('units'));

  const initialService =
    services.find((service) => service.slug === paramServiceSlug) ?? services[0];
  const initialComplete = Boolean(paramServiceSlug && paramDate && paramSlot);

  const [serviceId, setServiceId] = useState(initialService?.id ?? '');
  const [variantId, setVariantId] = useState(
    initialService?.variants.find((variant) => variant.id === paramVariantId)?.id ??
      initialService?.variants[0]?.id ??
      '',
  );
  const [date, setDate] = useState(
    dates.find((option) => option.iso === paramDate)?.iso ?? dates[0]?.iso ?? '',
  );
  const [slot, setSlot] = useState(paramSlot ?? '');
  const [units, setUnits] = useState(clampUnits(paramUnits || 1));
  const [step, setStep] = useState<Step>(initialComplete ? 3 : 1);
  const [maxStep, setMaxStep] = useState<Step>(initialComplete ? 3 : 1);
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilitySource, setAvailabilitySource] = useState<Source>(
    DEMO_MODE ? 'demo' : 'api',
  );
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedBooking | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const variant = service?.variants.find((item) => item.id === variantId) ?? null;
  const unitPrice = variant?.price ?? service?.basePrice ?? 0;
  const total = unitPrice * units;
  const duration = variant?.durationMinutes ?? service?.durationMinutes ?? 60;
  const unitNoun = UNIT_LABEL[service?.unit ?? 'UNIT'];
  const localMode = DEMO_MODE || !isUuid(service?.id ?? '');

  const selectedDate = dates.find((option) => option.iso === date);
  const selectedDateLabel =
    selectedDate?.full ??
    (date
      ? formatDate(new Date(`${date}T12:00:00+07:00`), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—');
  const slotAvailable = Boolean(
    availability?.slots.find((item) => item.id === slot && item.available),
  );

  const loadAvailability = useCallback(async (targetDate: string) => {
    setLoadingAvailability(true);
    setAvailability(null);
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
      setAvailabilitySource('api');
    } catch {
      setAvailability(getDemoAvailability(targetDate));
      setAvailabilitySource(DEMO_MODE ? 'demo' : 'fallback');
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    void loadAvailability(date);
  }, [date, loadAvailability]);

  useEffect(() => {
    if (!availability) return;
    setSlot((current) => {
      const stillAvailable = availability.slots.find(
        (item) => item.id === current && item.available,
      );
      return stillAvailable ? current : '';
    });
  }, [availability]);

  function updateCustomer<K extends keyof CustomerForm>(field: K, value: CustomerForm[K]) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleServiceChange(nextId: string) {
    const nextService = services.find((item) => item.id === nextId);
    setServiceId(nextId);
    setVariantId(nextService?.variants[0]?.id ?? '');
    setErrors((current) => {
      const next = { ...current };
      delete next.service;
      return next;
    });
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setSlot('');
    setErrors((current) => {
      const next = { ...current };
      delete next.slot;
      return next;
    });
  }

  function scrollToForm() {
    const node = formRef.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function goTo(next: Step) {
    if (next > maxStep) return;
    setStep(next);
    window.setTimeout(scrollToForm, 0);
  }

  function collectErrors(target: Step): Record<string, string> {
    const next: Record<string, string> = {};

    if (target >= 1) {
      if (!service) next.service = 'Pilih layanan terlebih dahulu.';
    }

    if (target >= 2) {
      if (!date) next.date = 'Pilih tanggal kedatangan.';
      if (!slot) next.slot = 'Pilih jam kedatangan.';
      else if (!slotAvailable) next.slot = 'Jam ini tidak tersedia. Pilih jam lain.';
    }

    if (target >= 3) {
      if (customer.name.trim().length < 2) {
        next.name = 'Nama minimal 2 karakter.';
      }
      if (!isValidPhone(customer.phone)) {
        next.phone = 'Gunakan nomor WhatsApp Indonesia, contoh 0812 3456 7890.';
      }
      if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
        next.email = 'Format email tidak valid.';
      }
      if (customer.address.trim().length < 10) {
        next.address = 'Alamat terlalu singkat. Sertakan jalan, nomor, dan patokan.';
      }
      if (customer.city.trim().length < 2) next.city = 'Isi kota atau kabupaten.';
      if (customer.district.trim().length < 2) next.district = 'Isi kecamatan.';
      if (customer.postalCode.trim() && !/^\d{5}$/.test(customer.postalCode.trim())) {
        next.postalCode = 'Kode pos harus 5 digit.';
      }
      if (!customer.consent) {
        next.consent = 'Setujui penggunaan data untuk memproses pesanan.';
      }
    }

    return next;
  }

  function validateStep(target: Step): boolean {
    const next = collectErrors(target);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    const next = Math.min(4, step + 1) as Step;
    setStep(next);
    setMaxStep((current) => (next > current ? next : current));
    window.setTimeout(scrollToForm, 0);
  }

  function goBack() {
    if (step === 1) return;
    const next = (step - 1) as Step;
    setStep(next);
    window.setTimeout(scrollToForm, 0);
  }

  async function handleSubmit() {
    if (!service) return;
    const nextErrors = collectErrors(3);
    setErrors(nextErrors);
    if (nextErrors.service) {
      setStep(1);
      window.setTimeout(scrollToForm, 0);
      return;
    }
    if (nextErrors.date || nextErrors.slot) {
      setStep(2);
      window.setTimeout(scrollToForm, 0);
      return;
    }
    if (Object.keys(nextErrors).length > 0) {
      setStep(3);
      window.setTimeout(scrollToForm, 0);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const scheduledAt = new Date(`${date}T${slot.split('-')[0]}:00+07:00`).toISOString();
    const createdAt = new Date().toISOString();

    try {
      let tracked: TrackedBooking;

      if (localMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        const stamp = date.slice(2).replace(/-/g, '');
        const suffix = Math.random()
          .toString(36)
          .replace(/[^a-z0-9]/gi, '')
          .slice(0, 4)
          .toUpperCase()
          .padEnd(4, '0');
        const code = `GCC-${stamp}-${suffix}`;
        tracked = {
          code,
          status: 'PENDING',
          statusLabel: 'Menunggu konfirmasi',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
          scheduledAt,
          slotLabel: getSlotDisplay(slot),
          createdAt,
          total,
          city: customer.city.trim(),
          district: customer.district.trim(),
          service: { name: service.name, slug: service.slug },
          variant: variant ? { name: variant.name } : null,
          technician: null,
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            address: customer.address.trim(),
            postalCode: customer.postalCode.trim() || null,
          },
          notes: customer.notes.trim() || null,
          verified: true,
          history: [
            {
              status: 'PENDING',
              label: 'Menunggu konfirmasi',
              note: 'Pesanan dibuat melalui website.',
              createdAt,
            },
          ],
        };
        saveDemoBooking(tracked);
      } else {
        const payload = {
          serviceId: service.id,
          ...(variant ? { variantId: variant.id } : {}),
          scheduledDate: date,
          slot,
          propertyType: customer.propertyType,
          unitCount: units,
          notes: customer.notes.trim() || undefined,
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim() || undefined,
            address: customer.address.trim(),
            city: customer.city.trim(),
            district: customer.district.trim(),
            postalCode: customer.postalCode.trim() || undefined,
          },
        };
        const created = await apiSend<CreatedBooking>('/bookings', 'POST', payload);
        tracked = {
          code: created.code,
          status: created.status,
          statusLabel: created.statusLabel ?? 'Menunggu konfirmasi',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
          scheduledAt: created.scheduledAt,
          slotLabel: created.slotLabel,
          createdAt,
          total: created.total,
          city: customer.city.trim(),
          district: customer.district.trim(),
          service: {
            name: created.service.name,
            slug: created.service.slug ?? service.slug,
          },
          variant: created.variant ? { name: created.variant.name } : null,
          technician: null,
          customer: {
            name: created.customer.name,
            phone: created.customer.phone,
            address: customer.address.trim(),
            postalCode: customer.postalCode.trim() || null,
          },
          notes: customer.notes.trim() || null,
          verified: true,
          history: [
            {
              status: 'PENDING',
              label: 'Menunggu konfirmasi',
              note: 'Pesanan dibuat melalui website.',
              createdAt,
            },
          ],
        };
      }

      setResult(tracked);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Pesanan belum dapat dikirim. Periksa koneksi lalu coba lagi.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return <BookingSuccess booking={result} demo={localMode} />;
  }

  const stepTitle =
    step === 1
      ? 'Pilih layanan dan jumlah unit'
      : step === 2
        ? 'Tentukan tanggal dan jam'
        : step === 3
          ? 'Kontak dan alamat layanan'
          : 'Periksa pesanan Anda';

  return (
    <section className="frame py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <ol className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 lg:grid-cols-1">
              {STEPS.map((item) => {
                const active = item.step === step;
                const reachable = item.step <= maxStep;
                const complete = item.step < step;
                return (
                  <li key={item.step} className="bg-bone">
                    <button
                      type="button"
                      onClick={() => goTo(item.step)}
                      disabled={!reachable}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-300',
                        active ? 'bg-paper' : reachable ? 'hover:bg-paper/70' : 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center border text-[0.65rem] font-semibold',
                          active
                            ? 'border-teal bg-teal text-bone'
                            : complete
                              ? 'border-teal/40 bg-teal-soft text-teal'
                              : 'border-line text-muted',
                        )}
                      >
                        {complete ? '✓' : String(item.step).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            'block text-[0.8rem] font-semibold',
                            !reachable && 'text-muted',
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="mt-0.5 hidden text-[0.66rem] text-muted lg:block">
                          {item.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="ticket mt-6 hidden p-4 lg:block">
              <div className="flex items-start justify-between gap-3">
                <p className="meta text-teal">Ringkasan</p>
                <span className="ticket-code border border-line px-1.5 py-0.5 text-[0.56rem] text-muted">
                  GCC — DRAF
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[0.92rem] font-bold leading-snug">
                  {service?.name ?? 'Pilih layanan'}
                </p>
                <p className="mt-1 text-[0.7rem] text-muted">
                  {variant?.name ?? 'Tarif dasar'}
                </p>
              </div>
              <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[0.7rem]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Tanggal</dt>
                  <dd className="text-right font-medium">{selectedDateLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Jam</dt>
                  <dd className="text-right font-medium">
                    {slot ? getSlotDisplay(slot) : '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Jumlah</dt>
                  <dd className="text-right font-medium">
                    {units} {unitNoun}
                  </dd>
                </div>
              </dl>
              <div className="ticket-rule my-3" aria-hidden="true" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.72rem] text-muted">Estimasi</span>
                <span className="tabular text-[1.05rem] font-bold">{formatRupiah(total)}</span>
              </div>
              <p className="mt-2 text-[0.62rem] leading-relaxed text-muted">
                Harga akhir dikonfirmasi sebelum pekerjaan dimulai.
              </p>
            </div>
          </div>
        </aside>

        <form
          ref={formRef}
          className="scroll-mt-6 lg:col-span-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 4) void handleSubmit();
            else goNext();
          }}
          noValidate
        >
          <div className="border border-line bg-paper">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
              <div>
                <p className="meta text-muted">
                  Langkah {step} dari 4
                </p>
                <h2 className="mt-1 text-[1.2rem] font-bold tracking-[-0.02em] sm:text-[1.35rem]">
                  {stepTitle}
                </h2>
              </div>
              <div className="shrink-0 text-right lg:hidden">
                <p className="meta text-muted">Estimasi</p>
                <p className="tabular mt-1 text-[1.05rem] font-bold">{formatRupiah(total)}</p>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7">
              {step === 1 ? (
                <StepService
                  categories={categories}
                  serviceId={serviceId}
                  variantId={variantId}
                  units={units}
                  unitNoun={unitNoun}
                  service={service}
                  onServiceChange={handleServiceChange}
                  onVariantChange={setVariantId}
                  onUnitsChange={(value) => setUnits(clampUnits(value))}
                  errors={errors}
                />
              ) : null}

              {step === 2 ? (
                <StepSchedule
                  dates={dates}
                  date={date}
                  slot={slot}
                  availability={availability}
                  loading={loadingAvailability}
                  source={availabilitySource}
                  onDateChange={handleDateChange}
                  onSlotChange={(value) => {
                    setSlot(value);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.slot;
                      return next;
                    });
                  }}
                  errors={errors}
                />
              ) : null}

              {step === 3 ? (
                <StepCustomer
                  customer={customer}
                  units={units}
                  unitNoun={unitNoun}
                  onUpdate={updateCustomer}
                  errors={errors}
                />
              ) : null}

              {step === 4 ? (
                <StepReview
                  service={service}
                  variant={variant}
                  dateLabel={selectedDateLabel}
                  slot={slot}
                  units={units}
                  unitNoun={unitNoun}
                  unitPrice={unitPrice}
                  total={total}
                  duration={duration}
                  customer={customer}
                  submitError={submitError}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="btn btn-ghost px-4 disabled:opacity-40"
              >
                Kembali
              </button>

              {step < 4 ? (
                <button type="submit" className="btn btn-primary px-5">
                  Lanjut ke {STEPS[step].label.toLowerCase()}
                  <span className="btn-icon">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn btn-accent px-5">
                  {submitting ? 'Mengirim pesanan…' : 'Kirim permintaan'}
                  {!submitting ? (
                    <span className="btn-icon">
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 max-w-[70ch] text-[0.7rem] leading-relaxed text-muted">
            Dengan mengirim permintaan, Anda setuju data dipakai untuk memproses
            pesanan dan konfirmasi jadwal. Tidak ada pembayaran yang diambil di
            halaman ini.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ── Step 1 ───────────────────────────────────────────────── */

function StepService({
  categories,
  serviceId,
  variantId,
  units,
  unitNoun,
  service,
  onServiceChange,
  onVariantChange,
  onUnitsChange,
  errors,
}: {
  categories: ServiceCategory[];
  serviceId: string;
  variantId: string;
  units: number;
  unitNoun: string;
  service?: Service;
  onServiceChange: (value: string) => void;
  onVariantChange: (value: string) => void;
  onUnitsChange: (value: number) => void;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <div className="space-y-6">
        {categories.map((category) => (
          <fieldset key={category.id}>
            <legend className="meta text-muted">{category.name}</legend>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {category.services.map((item) => {
                const checked = item.id === serviceId;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'cursor-pointer border p-3.5 transition-colors duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal',
                      checked
                        ? 'border-teal bg-teal-soft/55'
                        : 'border-line bg-bone hover:border-ink/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="serviceId"
                      value={item.id}
                      checked={checked}
                      onChange={() => onServiceChange(item.id)}
                      className="sr-only"
                    />
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[0.88rem] font-semibold leading-snug">
                        {item.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-1 h-2 w-2 shrink-0 border',
                          checked ? 'border-teal bg-teal' : 'border-line bg-transparent',
                        )}
                      />
                    </span>
                    <span className="mt-1.5 block text-[0.68rem] text-muted">
                      Mulai {formatRupiah(startingPrice(item))} · ±{' '}
                      {item.durationMinutes} menit
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {errors.service ? (
        <p className="field-error" role="alert">
          {errors.service}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {service && service.variants.length > 0 ? (
          <div>
            <label htmlFor="variant" className="field-label">
              Varian
            </label>
            <select
              id="variant"
              className="field-input"
              value={variantId}
              onChange={(event) => onVariantChange(event.target.value)}
            >
              {service.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} — {formatRupiah(variant.price)}
                </option>
              ))}
            </select>
            <p className="field-hint">Waktu kerja mengikuti varian yang dipilih.</p>
          </div>
        ) : null}

        <div>
          <span className="field-label">Jumlah {unitNoun}</span>
          <div className="flex items-center border border-line bg-bone">
            <button
              type="button"
              aria-label="Kurangi jumlah"
              className="flex h-11 w-11 items-center justify-center text-lg transition-colors hover:bg-surface disabled:opacity-35"
              onClick={() => onUnitsChange(units - 1)}
              disabled={units <= 1}
            >
              −
            </button>
            <span className="tabular flex-1 text-center text-[1rem] font-semibold">{units}</span>
            <button
              type="button"
              aria-label="Tambah jumlah"
              className="flex h-11 w-11 items-center justify-center text-lg transition-colors hover:bg-surface disabled:opacity-35"
              onClick={() => onUnitsChange(units + 1)}
              disabled={units >= 20}
            >
              +
            </button>
          </div>
          <p className="field-hint">Maksimal 20 {unitNoun} per pesanan.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2 ───────────────────────────────────────────────── */

function StepSchedule({
  dates,
  date,
  slot,
  availability,
  loading,
  source,
  onDateChange,
  onSlotChange,
  errors,
}: {
  dates: DateOption[];
  date: string;
  slot: string;
  availability: AvailabilityResponse | null;
  loading: boolean;
  source: Source;
  onDateChange: (value: string) => void;
  onSlotChange: (value: string) => void;
  errors: Record<string, string>;
}) {
  const sourceNote =
    source === 'demo'
      ? 'Mode demo: ketersediaan slot adalah contoh, bukan jadwal sebenarnya.'
      : source === 'fallback'
        ? 'Ketersediaan langsung belum termuat. Anda tetap bisa mengirim permintaan; admin akan mengonfirmasi jam.'
        : null;

  return (
    <div>
      <div>
        <span className="field-label">Tanggal kedatangan</span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {dates.map((option) => {
            const active = option.iso === date;
            return (
              <button
                key={option.iso}
                type="button"
                onClick={() => onDateChange(option.iso)}
                aria-pressed={active}
                className={cn(
                  'flex min-h-[4.2rem] flex-col items-center justify-center border px-1 py-2 transition-colors duration-300',
                  active
                    ? 'border-ink bg-ink text-bone'
                    : 'border-line bg-bone text-ink hover:border-ink/40',
                )}
              >
                <span className="text-[0.6rem] uppercase tracking-[0.08em] opacity-65">
                  {option.weekday}
                </span>
                <span className="tabular mt-0.5 text-[1.1rem] font-semibold leading-none">
                  {option.day}
                </span>
                <span className="mt-1 text-[0.58rem] uppercase tracking-[0.06em] opacity-60">
                  {option.month}
                </span>
              </button>
            );
          })}
        </div>
        {errors.date ? (
          <p className="field-error" role="alert">
            {errors.date}
          </p>
        ) : null}

        <div className="mt-3">
          <label htmlFor="booking-date" className="field-label">
            Tanggal lain <span className="font-normal normal-case tracking-normal">(hingga 60 hari)</span>
          </label>
          <input
            id="booking-date"
            type="date"
            className="field-input tabular max-w-[15rem]"
            value={date}
            min={dates[0]?.iso ?? jakartaTodayISO()}
            max={addDaysISO(jakartaTodayISO(), 60)}
            onChange={(event) => {
              if (event.target.value) onDateChange(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="field-label mb-0">Jam kedatangan</span>
          <span className="text-[0.68rem] text-muted">
            {loading ? 'Memeriksa ketersediaan…' : 'Jendela kedatangan, bukan jam pasti'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(availability?.slots ?? []).map((item) => {
            const active = item.id === slot;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.available}
                onClick={() => onSlotChange(item.id)}
                aria-pressed={active}
                className={cn(
                  'flex min-h-[3.8rem] items-center justify-between gap-3 border px-3 py-2 text-left transition-colors duration-300',
                  active
                    ? 'border-teal bg-teal-soft'
                    : item.available
                      ? 'border-line bg-bone hover:border-teal/60'
                      : 'cursor-not-allowed border-line/60 bg-transparent text-muted/55',
                )}
              >
                <span className="tabular text-[0.9rem] font-semibold">{item.label}</span>
                <span className="text-right text-[0.6rem] uppercase leading-tight tracking-[0.05em] opacity-70">
                  {item.available
                    ? item.remaining <= 1
                      ? 'Sisa 1'
                      : `Sisa ${item.remaining}`
                    : item.reason?.toLowerCase().includes('lewat')
                      ? 'Lewat'
                      : 'Penuh'}
                </span>
              </button>
            );
          })}
          {loading && !availability ? (
            <p className="col-span-2 py-4 text-[0.82rem] text-muted">Memuat slot…</p>
          ) : null}
        </div>
        {!loading && availability && !availability.slots.some((item) => item.available) ? (
          <p className="mt-3 border border-amber/30 bg-amber/10 px-3 py-2 text-[0.78rem] leading-relaxed text-ink">
            Semua slot pada tanggal ini sudah lewat atau penuh. Pilih tanggal lain.
          </p>
        ) : null}
        {errors.slot ? (
          <p className="field-error" role="alert">
            {errors.slot}
          </p>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-4 text-[0.78rem] leading-relaxed text-muted">
        <p>
          Slot menunjukkan jendela kedatangan. Teknisi akan menghubungi Anda sebelum
          berangkat untuk memastikan waktu dan akses lokasi.
        </p>
        {sourceNote ? <p className="mt-2 text-[0.7rem]">{sourceNote}</p> : null}
      </div>
    </div>
  );
}

/* ── Step 3 ───────────────────────────────────────────────── */

function StepCustomer({
  customer,
  units,
  unitNoun,
  onUpdate,
  errors,
}: {
  customer: CustomerForm;
  units: number;
  unitNoun: string;
  onUpdate: <K extends keyof CustomerForm>(field: K, value: CustomerForm[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="customer-name" className="field-label">
          Nama lengkap
        </label>
        <input
          id="customer-name"
          className="field-input"
          value={customer.name}
          onChange={(event) => onUpdate('name', event.target.value)}
          autoComplete="name"
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
          required
        />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="customer-phone" className="field-label">
          Nomor WhatsApp
        </label>
        <input
          id="customer-phone"
          type="tel"
          inputMode="tel"
          className="field-input"
          value={customer.phone}
          onChange={(event) => onUpdate('phone', event.target.value)}
          placeholder="0812 3456 7890"
          autoComplete="tel"
          maxLength={20}
          aria-invalid={Boolean(errors.phone)}
          required
        />
        {errors.phone ? <p className="field-error">{errors.phone}</p> : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="customer-email" className="field-label">
          Email <span className="font-normal normal-case tracking-normal">(opsional)</span>
        </label>
        <input
          id="customer-email"
          type="email"
          className="field-input"
          value={customer.email}
          onChange={(event) => onUpdate('email', event.target.value)}
          autoComplete="email"
          maxLength={120}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="field-error">{errors.email}</p> : null}
      </div>

      <div>
        <label htmlFor="property-type" className="field-label">
          Jenis properti
        </label>
        <select
          id="property-type"
          className="field-input"
          value={customer.propertyType}
          onChange={(event) => onUpdate('propertyType', event.target.value as PropertyType)}
        >
          {PROPERTY_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="field-label">Jumlah unit</span>
        <div className="flex min-h-[2.9rem] items-center justify-between border border-line bg-surface px-3">
          <span className="text-[0.9rem] font-semibold">
            {units} {unitNoun}
          </span>
          <span className="text-[0.66rem] text-muted">Ubah di langkah 1</span>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="customer-address" className="field-label">
          Alamat lengkap
        </label>
        <textarea
          id="customer-address"
          className="field-input min-h-[5.4rem] resize-y"
          value={customer.address}
          onChange={(event) => onUpdate('address', event.target.value)}
          placeholder="Jalan, nomor rumah, RT/RW, nama gedung, lantai, dan patokan"
          autoComplete="street-address"
          maxLength={300}
          rows={3}
          aria-invalid={Boolean(errors.address)}
          required
        />
        {errors.address ? <p className="field-error">{errors.address}</p> : null}
      </div>

      <div>
        <label htmlFor="customer-city" className="field-label">
          Kota / kabupaten
        </label>
        <input
          id="customer-city"
          className="field-input"
          list="booking-cities"
          value={customer.city}
          onChange={(event) => onUpdate('city', event.target.value)}
          autoComplete="address-level2"
          maxLength={80}
          aria-invalid={Boolean(errors.city)}
          required
        />
        <datalist id="booking-cities">
          {SERVICE_AREAS.map((area) => (
            <option key={area.slug} value={area.city} />
          ))}
        </datalist>
        {errors.city ? <p className="field-error">{errors.city}</p> : null}
      </div>

      <div>
        <label htmlFor="customer-district" className="field-label">
          Kecamatan
        </label>
        <input
          id="customer-district"
          className="field-input"
          value={customer.district}
          onChange={(event) => onUpdate('district', event.target.value)}
          autoComplete="address-level3"
          maxLength={80}
          aria-invalid={Boolean(errors.district)}
          required
        />
        {errors.district ? <p className="field-error">{errors.district}</p> : null}
      </div>

      <div>
        <label htmlFor="customer-postal" className="field-label">
          Kode pos <span className="font-normal normal-case tracking-normal">(opsional)</span>
        </label>
        <input
          id="customer-postal"
          className="field-input"
          inputMode="numeric"
          value={customer.postalCode}
          onChange={(event) =>
            onUpdate('postalCode', event.target.value.replace(/\D/g, '').slice(0, 5))
          }
          autoComplete="postal-code"
          maxLength={5}
          aria-invalid={Boolean(errors.postalCode)}
        />
        {errors.postalCode ? <p className="field-error">{errors.postalCode}</p> : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="customer-notes" className="field-label">
          Catatan untuk teknisi <span className="font-normal normal-case tracking-normal">(opsional)</span>
        </label>
        <textarea
          id="customer-notes"
          className="field-input min-h-[4.8rem] resize-y"
          value={customer.notes}
          onChange={(event) => onUpdate('notes', event.target.value)}
          placeholder="Kondisi unit, akses lokasi, atau kebutuhan khusus"
          maxLength={600}
          rows={3}
        />
        <p className="field-hint">{customer.notes.length}/600 karakter</p>
      </div>

      <div className="sm:col-span-2">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={customer.consent}
            onChange={(event) => onUpdate('consent', event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
          />
          <span>
            Saya setuju data ini digunakan untuk memproses pesanan dan konfirmasi
            jadwal lewat WhatsApp. Baca{' '}
            <Link href="/privasi" className="underline decoration-line underline-offset-2 hover:text-ink">
              kebijakan privasi
            </Link>
            .
          </span>
        </label>
        {errors.consent ? <p className="field-error">{errors.consent}</p> : null}
      </div>
    </div>
  );
}

/* ── Step 4 ───────────────────────────────────────────────── */

function StepReview({
  service,
  variant,
  dateLabel,
  slot,
  units,
  unitNoun,
  unitPrice,
  total,
  duration,
  customer,
  submitError,
}: {
  service?: Service;
  variant: Service['variants'][number] | null;
  dateLabel: string;
  slot: string;
  units: number;
  unitNoun: string;
  unitPrice: number;
  total: number;
  duration: number;
  customer: CustomerForm;
  submitError: string | null;
}) {
  const rows: Array<[string, string]> = [
    ['Layanan', service?.name ?? '—'],
    ['Varian', variant?.name ?? 'Tarif dasar'],
    ['Tanggal', dateLabel],
    ['Jam kedatangan', slot ? getSlotDisplay(slot) : '—'],
    ['Jumlah', `${units} ${unitNoun} · ± ${duration} menit`],
    [
      'Alamat',
      `${customer.address}, ${customer.district}, ${customer.city}${customer.postalCode ? ` ${customer.postalCode}` : ''}`,
    ],
    ['Kontak', `${customer.name} · ${customer.phone}`],
  ];
  if (customer.notes.trim()) rows.push(['Catatan', customer.notes.trim()]);

  return (
    <div className="space-y-6">
      <div className="border border-line">
        <dl className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"
            >
              <dt className="text-[0.68rem] uppercase tracking-[0.1em] text-muted">{label}</dt>
              <dd className="text-[0.84rem] leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-surface p-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="meta text-muted">Estimasi biaya</p>
            <p className="mt-1 text-[0.72rem] text-muted">
              {units} × {formatRupiah(unitPrice)} · di luar biaya tambahan
            </p>
          </div>
          <p className="tabular text-[1.5rem] font-bold">{formatRupiah(total)}</p>
        </div>
      </div>

      <div className="border-t border-line pt-4 text-[0.78rem] leading-relaxed text-muted">
        <p>
          Pembayaran dilakukan setelah pekerjaan selesai dan diuji: tunai, transfer
          bank, atau QRIS. Biaya tambahan disampaikan sebelum dikerjakan.
        </p>
        <p className="mt-2">
          Perubahan jadwal dapat dilakukan minimal 2 jam sebelum slot melalui
          WhatsApp dengan menyertakan kode tiket.
        </p>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="border border-rust/30 bg-rust/5 px-4 py-3 text-[0.82rem] leading-relaxed text-rust"
        >
          {submitError}
        </p>
      ) : null}
    </div>
  );
}

/* ── Success ──────────────────────────────────────────────── */

function BookingSuccess({ booking, demo }: { booking: TrackedBooking; demo: boolean }) {
  const waMessage = `Halo GCC Web, saya baru membuat pesanan ${booking.code} untuk ${booking.service.name} pada ${formatDateTime(booking.scheduledAt)}. Mohon konfirmasinya.`;

  return (
    <section className="frame max-w-3xl py-10 lg:py-16">
      <p className="meta text-teal">Pesanan diterima</p>
      <h1 className="statement mt-4 max-w-[16ch]">Tiket Anda sudah terbit.</h1>
      <p className="mt-5 max-w-[54ch] text-[0.95rem] leading-relaxed text-muted">
        Pesanan tercatat dengan kode di bawah. Admin akan mengonfirmasi jadwal lewat
        WhatsApp <strong className="text-ink">{booking.customer.phone}</strong> pada jam
        kerja. Simpan kode tiket untuk melacak pekerjaan.
      </p>

      <div className="ticket relative mt-8 p-5 sm:p-7">
        <span className="ticket-notch ticket-notch-left" aria-hidden="true" />
        <span className="ticket-notch ticket-notch-right" aria-hidden="true" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="meta text-muted">Kode tiket</p>
            <p className="ticket-code mt-1 text-[1.25rem] font-bold tracking-[0.1em]">
              {booking.code}
            </p>
          </div>
          <StatusChip status={booking.status} long />
        </div>

        <div className="ticket-rule my-5" aria-hidden="true" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="meta text-muted">Layanan</p>
            <p className="mt-1.5 text-[0.95rem] font-semibold">{booking.service.name}</p>
            <p className="mt-1 text-[0.8rem] text-muted">{booking.variant?.name ?? 'Tarif dasar'}</p>
          </div>
          <div>
            <p className="meta text-muted">Jadwal</p>
            <p className="mt-1.5 text-[0.95rem] font-semibold">
              {formatDateTime(booking.scheduledAt)} WIB
            </p>
            <p className="mt-1 text-[0.8rem] text-muted">{booking.slotLabel}</p>
          </div>
          <div>
            <p className="meta text-muted">Lokasi</p>
            <p className="mt-1.5 text-[0.88rem] leading-relaxed">
              {booking.customer.address}
              <br />
              {booking.district}, {booking.city}
              {booking.customer.postalCode ? ` ${booking.customer.postalCode}` : ''}
            </p>
          </div>
          <div>
            <p className="meta text-muted">Total estimasi</p>
            <p className="tabular mt-1.5 text-[1.35rem] font-bold">
              {formatRupiah(booking.total)}
            </p>
            <p className="mt-1 text-[0.72rem] text-muted">
              {formatDate(booking.createdAt, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="ticket-rule my-5" aria-hidden="true" />
        <p className="text-[0.72rem] leading-relaxed text-muted">
          Pembayaran belum diambil. Bayar setelah pekerjaan selesai dan diuji.
          Hubungi kami dengan kode tiket bila ada perubahan jadwal.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/lacak?code=${encodeURIComponent(booking.code)}`} className="btn btn-primary px-5">
          Lacak tiket
          <span className="btn-icon">
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
        <a
          href={waLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost px-4"
        >
          <WhatsAppMark className="h-4 w-4" />
          Konfirmasi via WhatsApp
        </a>
        <button type="button" onClick={() => window.print()} className="btn btn-ghost px-4 no-print">
          Cetak tiket
        </button>
      </div>

      {demo ? (
        <p className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-relaxed text-muted">
          Mode demo: pesanan ini hanya tersimpan di tab browser dan tidak masuk ke
          database. Matikan <code>NEXT_PUBLIC_DEMO_MODE</code> dan jalankan API untuk
          mengaktifkan penyimpanan nyata.
        </p>
      ) : null}
    </section>
  );
}
