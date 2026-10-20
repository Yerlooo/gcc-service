'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoTechnicians } from '@/lib/demo-data';
import { cn, initials, jakartaTodayISO } from '@/lib/format';
import type { Technician } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  EmptyState,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';

interface ApiTechnician extends Technician {
  technician?: {
    zone?: string;
    specialties?: string[];
    capacityPerDay?: number;
    isAvailable?: boolean;
    notes?: string | null;
  } | null;
  createdAt?: string;
}

function normalizeTechnician(row: ApiTechnician): Technician {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isActive: row.isActive,
    zone: row.zone ?? row.technician?.zone ?? '—',
    specialties: row.specialties ?? row.technician?.specialties ?? [],
    capacityPerDay: row.capacityPerDay ?? row.technician?.capacityPerDay ?? 4,
    isAvailable: row.isAvailable ?? row.technician?.isAvailable ?? false,
    notes: row.notes ?? row.technician?.notes ?? null,
    workload: row.workload ?? null,
    remaining: row.remaining ?? null,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Tindakan tidak dapat diproses.';
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  zone: '',
  specialties: '',
  capacityPerDay: '4',
  notes: '',
};

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const today = jakartaTodayISO();

  useEffect(() => {
    let active = true;
    if (DEMO_MODE) {
      setTechnicians(demoTechnicians);
      setSource('demo');
      setLoading(false);
      return;
    }

    apiGet<ApiTechnician[]>(`/admin/technicians?date=${today}`)
      .then((rows) => {
        if (active) setTechnicians(rows.map(normalizeTechnician));
      })
      .catch(() => {
        if (!active) return;
        setTechnicians(demoTechnicians);
        setSource('fallback');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [today]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        zone: form.zone.trim(),
        specialties: form.specialties
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        capacityPerDay: Number(form.capacityPerDay),
        isAvailable: true,
        notes: form.notes.trim() || undefined,
      };

      if (DEMO_MODE || source === 'fallback') {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        const created: Technician = {
          id: `tech-demo-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          phone: payload.phone ?? null,
          isActive: true,
          zone: payload.zone,
          specialties: payload.specialties,
          capacityPerDay: payload.capacityPerDay,
          isAvailable: true,
          notes: payload.notes ?? null,
          workload: 0,
          remaining: payload.capacityPerDay,
        };
        setTechnicians((current) => [...current, created]);
        setNotice('Teknisi demo ditambahkan. Data hanya berlaku di layar ini.');
      } else {
        const created = await apiSend<ApiTechnician>('/admin/technicians', 'POST', payload);
        setTechnicians((current) => [...current, normalizeTechnician(created)]);
        setNotice(`${created.name} ditambahkan. Kata sandi dapat diberikan kepada teknisi.`);
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(technician: Technician) {
    setError(null);
    setNotice(null);
    setBusyId(technician.id);
    const next = !technician.isAvailable;
    try {
      if (DEMO_MODE || source === 'fallback') {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      } else {
        await apiSend<ApiTechnician>(`/admin/technicians/${technician.id}`, 'PATCH', {
          isAvailable: next,
        });
      }
      setTechnicians((current) =>
        current.map((row) =>
          row.id === technician.id ? { ...row, isAvailable: next } : row,
        ),
      );
      setNotice(
        `${technician.name} ditandai ${next ? 'tersedia' : 'tidak tersedia'} untuk penugasan baru.`,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function deactivate(technician: Technician) {
    if (
      !window.confirm(
        `Nonaktifkan ${technician.name}? Teknisi tidak dapat ditugaskan dan sesi loginnya dicabut.`,
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusyId(technician.id);
    try {
      if (DEMO_MODE || source === 'fallback') {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      } else {
        await apiSend<{ id: string; isActive: boolean }>(
          `/admin/technicians/${technician.id}`,
          'DELETE',
        );
      }
      setTechnicians((current) =>
        current.map((row) =>
          row.id === technician.id ? { ...row, isActive: false, isAvailable: false } : row,
        ),
      );
      setNotice(`${technician.name} dinonaktifkan.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const active = technicians.filter((technician) => technician.isActive !== false);
  const available = active.filter((technician) => technician.isAvailable);
  const capacity = active.reduce((sum, technician) => sum + technician.capacityPerDay, 0);
  const workload = active.reduce((sum, technician) => sum + (technician.workload ?? 0), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknisi"
        title="Tim lapangan"
        description="Kelola ketersediaan, zona kerja, keahlian, dan kapasitas harian teknisi."
        actions={
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError(null);
            }}
            className="border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal"
          >
            {showForm ? 'Tutup formulir' : 'Tambah teknisi'}
          </button>
        }
      />

      <SourceNotice source={source} />
      {(DEMO_MODE || source === 'fallback') && !loading ? <DemoActionNote /> : null}

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

      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Teknisi aktif</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{active.length}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Tersedia</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">{available.length}</p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Beban hari ini</p>
          <p className="mt-1 text-[1.2rem] font-bold tabular-nums">
            {workload}/{capacity}
          </p>
        </div>
        <div className="bg-paper px-4 py-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-muted">Tanggal acuan</p>
          <p className="mt-1 text-[0.9rem] font-semibold">{today}</p>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="border border-line bg-paper p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Teknisi baru</h2>
              <p className="mt-1 text-[0.7rem] text-muted">
                Akun ini memakai peran TECHNICIAN dan tidak dapat membuka panel admin.
              </p>
            </div>
            <span className="border border-line px-2 py-1 text-[0.58rem] uppercase tracking-[0.08em] text-muted">
              Wajib
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="tech-name" className="field-label">
                Nama lengkap
              </label>
              <input
                id="tech-name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="tech-email" className="field-label">
                Email login
              </label>
              <input
                id="tech-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="field"
                placeholder="nama@gcc-web.id"
              />
            </div>
            <div>
              <label htmlFor="tech-phone" className="field-label">
                WhatsApp <span className="font-normal normal-case text-muted">(opsional)</span>
              </label>
              <input
                id="tech-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="field"
                placeholder="0812 3456 7890"
                inputMode="tel"
              />
            </div>
            <div>
              <label htmlFor="tech-password" className="field-label">
                Kata sandi awal
              </label>
              <input
                id="tech-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="field"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="tech-zone" className="field-label">
                Zona kerja
              </label>
              <input
                id="tech-zone"
                required
                minLength={2}
                maxLength={120}
                value={form.zone}
                onChange={(event) => setForm({ ...form, zone: event.target.value })}
                className="field"
                placeholder="Jakarta Selatan · Kebayoran, Cilandak"
              />
            </div>
            <div>
              <label htmlFor="tech-specialties" className="field-label">
                Keahlian <span className="font-normal normal-case text-muted">(pisahkan koma)</span>
              </label>
              <input
                id="tech-specialties"
                value={form.specialties}
                onChange={(event) => setForm({ ...form, specialties: event.target.value })}
                className="field"
                placeholder="Cuci AC, Isi freon, Kulkas"
              />
            </div>
            <div>
              <label htmlFor="tech-capacity" className="field-label">
                Kapasitas per hari
              </label>
              <input
                id="tech-capacity"
                type="number"
                min={1}
                max={12}
                required
                value={form.capacityPerDay}
                onChange={(event) => setForm({ ...form, capacityPerDay: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="tech-notes" className="field-label">
                Catatan <span className="font-normal normal-case text-muted">(opsional)</span>
              </label>
              <input
                id="tech-notes"
                maxLength={300}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="field"
                placeholder="Mis. membawa tangga sendiri"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="border border-line px-3 py-2 text-[0.7rem] font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="border border-ink bg-ink px-3 py-2 text-[0.7rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
            >
              {submitting ? 'Menyimpan…' : 'Simpan teknisi'}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <AdminLoading label="Memuat data teknisi…" />
      ) : technicians.length === 0 ? (
        <EmptyState
          title="Belum ada teknisi"
          body="Tambahkan akun teknisi agar pesanan dapat ditugaskan dan dipantau."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {technicians.map((technician) => {
            const isActive = technician.isActive !== false;
            const load = technician.workload ?? 0;
            const percent =
              technician.capacityPerDay > 0
                ? Math.round((load / technician.capacityPerDay) * 100)
                : 0;
            const busy = busyId === technician.id;

            return (
              <article
                key={technician.id}
                className={cn(
                  'border bg-paper',
                  isActive ? 'border-line' : 'border-line/60 opacity-70',
                )}
              >
                <div className="flex items-start gap-3 border-b border-line px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-surface text-[0.66rem] font-semibold">
                    {initials(technician.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[0.86rem] font-bold tracking-[-0.02em]">
                        {technician.name}
                      </h3>
                      <span
                        className={cn(
                          'flex items-center gap-1 border px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.08em]',
                          !isActive
                            ? 'border-line bg-surface text-muted'
                            : technician.isAvailable
                              ? 'border-teal/25 bg-teal-soft text-teal'
                              : 'border-amber/30 bg-amber/10 text-amber',
                        )}
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                        {!isActive ? 'Nonaktif' : technician.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[0.66rem] text-muted">
                      {technician.email ?? 'Tanpa email'}
                      {technician.phone ? ` · ${technician.phone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-3">
                  <div>
                    <p className="text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-muted">
                      Zona
                    </p>
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed">{technician.zone}</p>
                  </div>

                  {technician.specialties.length > 0 ? (
                    <div>
                      <p className="text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-muted">
                        Keahlian
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {technician.specialties.map((item) => (
                          <span
                            key={item}
                            className="border border-line bg-surface/60 px-1.5 py-0.5 text-[0.6rem]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-muted">
                        Beban hari ini
                      </p>
                      <p className="text-[0.64rem] tabular-nums text-muted">
                        {load}/{technician.capacityPerDay} kunjungan
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-surface">
                      <div
                        className={cn('h-full', percent >= 90 ? 'bg-rust' : 'bg-teal')}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleAvailability(technician)}
                    disabled={!isActive || busy}
                    className="border border-line px-2 py-1 text-[0.62rem] font-semibold transition-colors hover:border-ink disabled:opacity-40"
                  >
                    {busy
                      ? 'Menyimpan…'
                      : technician.isAvailable
                        ? 'Tandai tidak tersedia'
                        : 'Tandai tersedia'}
                  </button>
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => deactivate(technician)}
                      disabled={busy}
                      className="text-[0.62rem] text-muted transition-colors hover:text-rust disabled:opacity-40"
                    >
                      Nonaktifkan
                    </button>
                  ) : (
                    <span className="text-[0.62rem] text-muted">Tidak dapat ditugaskan</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
