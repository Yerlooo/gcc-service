'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoTestimonials } from '@/lib/demo-data';
import { cn, formatDate } from '@/lib/format';
import type { Testimonial } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  EmptyState,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';

interface AdminTestimonial extends Testimonial {
  isPublished: boolean;
  isFeatured: boolean;
  booking?: { id: string; code: string; status: string } | null;
}

type Filter = 'all' | 'pending' | 'published' | 'featured';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Tindakan tidak dapat diproses.';
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (DEMO_MODE) {
      setItems(demoTestimonials as AdminTestimonial[]);
      setSource('demo');
      setLoading(false);
      return;
    }

    apiGet<AdminTestimonial[]>('/admin/testimonials')
      .then((rows) => {
        if (active) setItems(rows);
      })
      .catch(() => {
        if (!active) return;
        setItems(demoTestimonials as AdminTestimonial[]);
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

  const counts = useMemo(
    () => ({
      pending: items.filter((item) => !item.isPublished).length,
      published: items.filter((item) => item.isPublished).length,
      featured: items.filter((item) => item.isPublished && item.isFeatured).length,
    }),
    [items],
  );

  const filtered = items.filter((item) => {
    if (filter === 'pending') return !item.isPublished;
    if (filter === 'published') return item.isPublished;
    if (filter === 'featured') return item.isPublished && item.isFeatured;
    return true;
  });

  async function patchItem(
    item: AdminTestimonial,
    data: { isPublished?: boolean; isFeatured?: boolean },
    message: string,
  ) {
    setError(null);
    setNotice(null);
    setBusyId(item.id);
    try {
      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      } else {
        await apiSend<AdminTestimonial>(`/admin/testimonials/${item.id}`, 'PATCH', data);
      }
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, ...data } : row)),
      );
      setNotice(message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: AdminTestimonial) {
    if (!window.confirm(`Hapus testimoni dari ${item.customerName}? Tindakan ini permanen.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusyId(item.id);
    try {
      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      } else {
        await apiSend<{ id: string }>(`/admin/testimonials/${item.id}`, 'DELETE');
      }
      setItems((current) => current.filter((row) => row.id !== item.id));
      setNotice('Testimoni dihapus.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Testimoni"
        title="Moderasi ulasan"
        description="Testimoni dari pelanggan masuk sebagai draf. Tinjau isinya sebelum ditampilkan di situs."
      />

      <SourceNotice source={source} />
      {simulate && !DEMO_MODE ? (
        <DemoActionNote>
          API tidak terhubung. Moderasi di bawah hanya mengubah data di layar ini.
        </DemoActionNote>
      ) : null}

      {error ? (
        <p role="alert" className="border border-rust/30 bg-rust/5 px-3 py-2 text-[0.74rem] text-rust">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="border border-teal/25 bg-teal-soft/50 px-3 py-2 text-[0.74rem]">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Menunggu tinjauan</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{counts.pending}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Tampil di situs</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{counts.published}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Unggulan</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{counts.featured}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-2">
        {(
          [
            ['all', `Semua (${items.length})`],
            ['pending', `Menunggu (${counts.pending})`],
            ['published', `Tampil (${counts.published})`],
            ['featured', `Unggulan (${counts.featured})`],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              'border px-2.5 py-1.5 text-[0.68rem] font-semibold transition-colors',
              filter === value
                ? 'border-ink bg-ink text-bone'
                : 'border-line bg-paper text-muted hover:border-ink hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <AdminLoading label="Memuat testimoni…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada testimoni di bagian ini"
          body="Testimoni baru akan muncul setelah pelanggan mengirimkannya dengan kode pesanan yang sudah selesai."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((item) => {
            const busy = busyId === item.id;
            return (
              <article key={item.id} className="flex flex-col border border-line bg-paper">
                <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[0.82rem] font-semibold">{item.customerName}</p>
                    <p className="mt-0.5 text-[0.64rem] text-muted">
                      {item.customerMeta ?? item.service?.name ?? 'Tanpa layanan'} ·{' '}
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[0.7rem] tracking-[0.08em] text-amber" aria-label={`${item.rating} dari 5`}>
                      {'★'.repeat(item.rating)}
                      <span className="text-line">{'★'.repeat(5 - item.rating)}</span>
                    </span>
                    <span
                      className={cn(
                        'border px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.08em]',
                        item.isPublished
                          ? 'border-teal/25 bg-teal-soft text-teal'
                          : 'border-amber/30 bg-amber/10 text-amber',
                      )}
                    >
                      {item.isPublished ? 'Tampil' : 'Draf'}
                    </span>
                  </div>
                </div>

                <blockquote className="flex-1 px-4 py-3">
                  <p className="text-[0.78rem] leading-relaxed text-ink/90">“{item.content}”</p>
                  <footer className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] text-muted">
                    <span>{item.service?.name ?? 'Layanan tidak dicatat'}</span>
                    {item.booking?.code ? (
                      <span className="ticket-code">{item.booking.code}</span>
                    ) : (
                      <span>Tanpa kode pesanan</span>
                    )}
                    {item.isFeatured ? (
                      <span className="font-semibold text-teal">Unggulan</span>
                    ) : null}
                  </footer>
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        patchItem(
                          item,
                          { isPublished: !item.isPublished },
                          item.isPublished
                            ? 'Testimoni disembunyikan dari situs.'
                            : 'Testimoni ditampilkan di situs.',
                        )
                      }
                      disabled={busy}
                      className="border border-line px-2 py-1 text-[0.62rem] font-semibold transition-colors hover:border-ink disabled:opacity-40"
                    >
                      {item.isPublished ? 'Sembunyikan' : 'Terbitkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchItem(
                          item,
                          { isFeatured: !item.isFeatured, isPublished: true },
                          item.isFeatured
                            ? 'Testimoni dikeluarkan dari unggulan.'
                            : 'Testimoni ditandai unggulan dan diterbitkan.',
                        )
                      }
                      disabled={busy}
                      className="border border-line px-2 py-1 text-[0.62rem] font-semibold transition-colors hover:border-ink disabled:opacity-40"
                    >
                      {item.isFeatured ? 'Lepas unggulan' : 'Jadikan unggulan'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    disabled={busy}
                    className="text-[0.62rem] text-muted transition-colors hover:text-rust disabled:opacity-40"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
