'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoCategories } from '@/lib/demo-data';
import { UNIT_LABEL, cn, formatRupiah } from '@/lib/format';
import type { Service, ServiceCategory, ServiceVariant } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  EmptyState,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';
import { ArrowUpRight } from '@/components/ui/Icons';

interface AdminService extends Omit<Service, 'variants'> {
  isActive: boolean;
  category: { id: string; name: string; slug: string };
  variants: Array<ServiceVariant & { isActive?: boolean }>;
  _count?: { bookings: number };
}

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive?: boolean;
  _count?: { services: number };
}

function fromDemo(): { services: AdminService[]; categories: AdminCategory[] } {
  const services: AdminService[] = demoCategories.flatMap((category) =>
    category.services.map((service) => ({
      ...service,
      isActive: true,
      category: { id: category.id, name: category.name, slug: category.slug },
      variants: service.variants.map((variant) => ({ ...variant, isActive: true })),
    })),
  );
  const categories: AdminCategory[] = demoCategories.map((category, index) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder ?? index,
    isActive: true,
    _count: { services: category.services.length },
  }));
  return { services, categories };
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Perubahan tidak dapat disimpan.';
}

/** Prisma Decimal arrives as a string; normalise before editing. */
function normalizeService(row: AdminService): AdminService {
  return {
    ...row,
    basePrice: Number(row.basePrice),
    variants: (row.variants ?? []).map((variant) => ({
      ...variant,
      price: Number(variant.price),
    })),
  };
}

function ServiceEditor({
  service,
  simulate,
  onSaved,
  onToggleActive,
}: {
  service: AdminService;
  simulate: boolean;
  onSaved: (basePrice: number, variants: Record<string, number>) => void;
  onToggleActive: (isActive: boolean) => void;
}) {
  const [basePrice, setBasePrice] = useState(String(service.basePrice));
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(service.variants.map((variant) => [variant.id, String(variant.price)])),
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBasePrice(String(service.basePrice));
    setVariantPrices(
      Object.fromEntries(service.variants.map((variant) => [variant.id, String(variant.price)])),
    );
    setSaved(false);
  }, [service]);

  const baseNumber = Number(basePrice);
  const baseDirty = Number.isFinite(baseNumber) && baseNumber !== service.basePrice;
  const changedVariants = service.variants.filter((variant) => {
    const value = Number(variantPrices[variant.id]);
    return Number.isFinite(value) && value !== variant.price;
  });
  const dirty = baseDirty || changedVariants.length > 0;

  async function handleSave() {
    setError(null);
    setSaved(false);

    const values = [baseNumber, ...service.variants.map((variant) => Number(variantPrices[variant.id]))];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Harga harus berupa angka 0 atau lebih.');
      return;
    }

    setSaving(true);
    try {
      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
      } else {
        if (baseDirty) {
          await apiSend<AdminService>(`/admin/services/${service.id}`, 'PATCH', {
            basePrice: baseNumber,
          });
        }
        for (const variant of changedVariants) {
          await apiSend<ServiceVariant>(
            `/admin/services/${service.id}/variants/${variant.id}`,
            'PATCH',
            { price: Number(variantPrices[variant.id]) },
          );
        }
      }

      onSaved(
        baseNumber,
        Object.fromEntries(
          service.variants.map((variant) => [variant.id, Number(variantPrices[variant.id])]),
        ),
      );
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setError(null);
    setSaved(false);
    setToggling(true);
    try {
      if (!simulate) {
        await apiSend<AdminService>(`/admin/services/${service.id}`, 'PATCH', {
          isActive: !service.isActive,
        });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      onToggleActive(!service.isActive);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setToggling(false);
    }
  }

  return (
    <article className={cn('border bg-paper', service.isActive ? 'border-line' : 'border-line/70 bg-surface/30')}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[0.88rem] font-bold tracking-[-0.02em]">{service.name}</h3>
            <span
              className={cn(
                'border px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.08em]',
                service.isActive
                  ? 'border-teal/25 bg-teal-soft text-teal'
                  : 'border-line bg-surface text-muted',
              )}
            >
              {service.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
            {service.shortDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling || saving}
          className="shrink-0 border border-line px-2 py-1 text-[0.62rem] font-semibold transition-colors hover:border-ink disabled:opacity-50"
        >
          {toggling ? 'Menyimpan…' : service.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Harga dasar / {UNIT_LABEL[service.unit]}</span>
          <div className="flex">
            <span className="flex items-center border border-r-0 border-line bg-surface px-2 text-[0.68rem] text-muted">
              Rp
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={basePrice}
              onChange={(event) => {
                setBasePrice(event.target.value);
                setSaved(false);
              }}
              className="field border-l-0"
            />
          </div>
          <span className="field-hint">
            {Number.isFinite(baseNumber) ? formatRupiah(baseNumber) : 'Masukkan angka'} ·{' '}
            {service.durationMinutes} menit · garansi {service.warrantyDays} hari
          </span>
        </label>

        <div className="border border-line/70 bg-surface/30 px-3 py-2">
          <p className="text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-muted">
            Info operasional
          </p>
          <p className="mt-1.5 text-[0.7rem]">
            {service._count ? `${service._count.bookings} pesanan terkait` : 'Data demo'}
          </p>
          <p className="mt-0.5 text-[0.64rem] text-muted">
            Varian: {service.variants.length || 'tidak ada'}
            {service.isFeatured ? ' · tampil di beranda' : ''}
          </p>
        </div>
      </div>

      {service.variants.length > 0 ? (
        <div className="border-t border-line/70 px-4 py-3">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-muted">
            Harga varian
          </p>
          <div className="mt-2 space-y-2">
            {service.variants.map((variant) => (
              <div key={variant.id} className="grid grid-cols-[1fr_8rem] items-center gap-3">
                <div>
                  <p className="text-[0.72rem] font-medium">{variant.name}</p>
                  <p className="text-[0.6rem] text-muted">
                    {variant.durationMinutes} menit
                    {variant.isActive === false ? ' · nonaktif' : ''}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={variantPrices[variant.id] ?? ''}
                  onChange={(event) => {
                    setVariantPrices((current) => ({
                      ...current,
                      [variant.id]: event.target.value,
                    }));
                    setSaved(false);
                  }}
                  aria-label={`Harga ${variant.name}`}
                  className="field py-1.5 text-right tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mx-4 mb-2 border border-rust/30 bg-rust/5 px-2.5 py-2 text-[0.68rem] text-rust">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-[0.64rem] text-muted">
          {saved ? (
            <span className="font-medium text-teal">Perubahan tersimpan.</span>
          ) : dirty ? (
            'Ada perubahan belum disimpan.'
          ) : (
            'Harga sesuai data saat ini.'
          )}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving || toggling}
          className="border border-ink bg-ink px-3 py-1.5 text-[0.66rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-40"
        >
          {saving ? 'Menyimpan…' : 'Simpan harga'}
        </button>
      </div>
    </article>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const demo = fromDemo();

    if (DEMO_MODE) {
      setServices(demo.services);
      setCategories(demo.categories);
      setSource('demo');
      setLoading(false);
      return;
    }

    Promise.all([
      apiGet<AdminService[]>('/admin/services'),
      apiGet<AdminCategory[]>('/admin/categories'),
    ])
      .then(([serviceRows, categoryRows]) => {
        if (!active) return;
        setServices(serviceRows.map(normalizeService));
        setCategories(categoryRows);
      })
      .catch(() => {
        if (!active) return;
        setServices(demo.services);
        setCategories(demo.categories);
        setSource('fallback');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const simulate = source !== 'api';
  const activeCount = services.filter((service) => service.isActive).length;
  const variantCount = services.reduce((sum, service) => sum + service.variants.length, 0);

  function handleSaved(serviceId: string, basePrice: number, variants: Record<string, number>) {
    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              basePrice,
              variants: service.variants.map((variant) => ({
                ...variant,
                price: variants[variant.id] ?? variant.price,
              })),
            }
          : service,
      ),
    );
  }

  function handleToggle(serviceId: string, isActive: boolean) {
    setServices((current) =>
      current.map((service) => (service.id === serviceId ? { ...service, isActive } : service)),
    );
  }

  const grouped = categories
    .map((category) => ({
      category,
      items: services.filter((service) => service.category.id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Layanan & harga"
        title="Katalog dan tarif"
        description="Perbarui harga dasar dan harga varian. Perubahan langsung dipakai untuk perhitungan pesanan baru."
        actions={
          <Link
            href="/layanan"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-line bg-paper px-3 py-2 text-[0.7rem] font-semibold transition-colors hover:border-ink"
          >
            Lihat katalog publik
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />

      <SourceNotice source={source} />
      {simulate && !DEMO_MODE ? (
        <DemoActionNote>
          API tidak dapat dihubungi. Harga di bawah berasal dari data contoh dan perubahan
          hanya tersimpan di layar.
        </DemoActionNote>
      ) : null}

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Layanan</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{services.length}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Aktif</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{activeCount}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Varian harga</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{variantCount}</p>
        </div>
      </div>

      {loading ? (
        <AdminLoading label="Memuat katalog…" />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="Katalog masih kosong"
          body="Tambahkan kategori dan layanan melalui API admin atau seed database."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }, index) => (
            <section key={category.id}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
                <div>
                  <p className="ticket-code text-[0.58rem] text-muted">
                    {String(index + 1).padStart(2, '0')} · {category.slug}
                  </p>
                  <h2 className="mt-0.5 text-[1.05rem] font-bold tracking-[-0.025em]">
                    {category.name}
                  </h2>
                </div>
                <p className="text-[0.66rem] text-muted">
                  {items.length} layanan · {items.filter((item) => item.isActive).length} aktif
                </p>
              </div>
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                {items.map((service) => (
                  <ServiceEditor
                    key={service.id}
                    service={service}
                    simulate={simulate}
                    onSaved={(basePrice, variants) => handleSaved(service.id, basePrice, variants)}
                    onToggleActive={(isActive) => handleToggle(service.id, isActive)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
