'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiGet, apiSend, DEMO_MODE } from '@/lib/api';
import { demoSettings } from '@/lib/demo-data';
import type { SiteSettings } from '@/lib/types';
import {
  AdminLoading,
  AdminPageHeader,
  DemoActionNote,
  SourceNotice,
  type DataSource,
} from '@/components/admin/AdminUI';
import { ArrowUpRight } from '@/components/ui/Icons';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Pengaturan tidak dapat disimpan.';
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [areasText, setAreasText] = useState('');
  const [source, setSource] = useState<DataSource>('api');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (DEMO_MODE) {
      setSettings(demoSettings);
      setForm(demoSettings);
      setAreasText(demoSettings.business.serviceAreas.join('\n'));
      setSource('demo');
      setLoading(false);
      return;
    }

    apiGet<SiteSettings>('/admin/settings')
      .then((result) => {
        if (!active) return;
        setSettings(result);
        setForm(result);
        setAreasText(result.business.serviceAreas.join('\n'));
      })
      .catch(() => {
        if (!active) return;
        setSettings(demoSettings);
        setForm(demoSettings);
        setAreasText(demoSettings.business.serviceAreas.join('\n'));
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

  function updateBusiness<K extends keyof SiteSettings['business']>(
    key: K,
    value: SiteSettings['business'][K],
  ) {
    setForm((current) =>
      current ? { ...current, business: { ...current.business, [key]: value } } : current,
    );
    setNotice(null);
  }

  function updatePayment<K extends keyof SiteSettings['payment']>(
    key: K,
    value: SiteSettings['payment'][K],
  ) {
    setForm((current) =>
      current ? { ...current, payment: { ...current.payment, [key]: value } } : current,
    );
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setNotice(null);

    const payload: SiteSettings = {
      business: {
        ...form.business,
        serviceAreas: areasText
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean),
      },
      payment: form.payment,
    };

    setSaving(true);
    try {
      if (simulate) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        setSettings(payload);
        setForm(payload);
        setAreasText(payload.business.serviceAreas.join('\n'));
        setNotice('Pengaturan demo diperbarui. Data tidak dikirim ke database.');
      } else {
        const updated = await apiSend<SiteSettings>('/admin/settings', 'PUT', payload);
        setSettings(updated);
        setForm(updated);
        setAreasText(updated.business.serviceAreas.join('\n'));
        setNotice('Pengaturan tersimpan dan langsung dipakai situs publik.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Pengaturan" title="Identitas & pembayaran" />
        <AdminLoading label="Memuat pengaturan…" />
      </div>
    );
  }

  const areaDraft = areasText
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const dirty =
    JSON.stringify(settings) !== JSON.stringify(form) ||
    JSON.stringify(settings?.business.serviceAreas ?? []) !== JSON.stringify(areaDraft);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pengaturan"
        title="Identitas & pembayaran"
        description="Perubahan ini dipakai di halaman kontak, footer, pesan WhatsApp, dan instruksi transfer."
        actions={
          <a
            href={`https://wa.me/${form.business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-line bg-paper px-3 py-2 text-[0.7rem] font-semibold transition-colors hover:border-ink"
          >
            Uji nomor WhatsApp
            <ArrowUpRight className="h-3 w-3" />
          </a>
        }
      />

      <SourceNotice source={source} />
      {simulate && !DEMO_MODE ? (
        <DemoActionNote>
          API tidak terhubung. Formulir berisi data contoh dan tidak akan tersimpan ke database.
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

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="border border-line bg-paper p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Identitas usaha</h2>
              <span className="text-[0.58rem] uppercase tracking-[0.1em] text-muted">Publik</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-name" className="field-label">
                  Nama usaha
                </label>
                <input
                  id="settings-name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.business.name}
                  onChange={(event) => updateBusiness('name', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="field-label">
                  Email publik
                </label>
                <input
                  id="settings-email"
                  type="email"
                  required
                  maxLength={120}
                  value={form.business.email}
                  onChange={(event) => updateBusiness('email', event.target.value)}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-tagline" className="field-label">
                  Tagline
                </label>
                <input
                  id="settings-tagline"
                  maxLength={160}
                  value={form.business.tagline}
                  onChange={(event) => updateBusiness('tagline', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-phone" className="field-label">
                  Telepon
                </label>
                <input
                  id="settings-phone"
                  maxLength={30}
                  value={form.business.phone}
                  onChange={(event) => updateBusiness('phone', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-whatsapp" className="field-label">
                  WhatsApp (format 62…)
                </label>
                <input
                  id="settings-whatsapp"
                  maxLength={30}
                  value={form.business.whatsapp}
                  onChange={(event) => updateBusiness('whatsapp', event.target.value)}
                  className="field"
                  placeholder="6281234567890"
                  inputMode="tel"
                />
                <p className="field-hint">Tanpa tanda +, spasi, atau angka 0 di depan.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-address" className="field-label">
                  Alamat
                </label>
                <input
                  id="settings-address"
                  maxLength={200}
                  value={form.business.address}
                  onChange={(event) => updateBusiness('address', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-city" className="field-label">
                  Kota
                </label>
                <input
                  id="settings-city"
                  maxLength={80}
                  value={form.business.city}
                  onChange={(event) => updateBusiness('city', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-district" className="field-label">
                  Kecamatan
                </label>
                <input
                  id="settings-district"
                  maxLength={80}
                  value={form.business.district}
                  onChange={(event) => updateBusiness('district', event.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="settings-hours" className="field-label">
                  Jam operasional
                </label>
                <input
                  id="settings-hours"
                  maxLength={120}
                  value={form.business.hours}
                  onChange={(event) => updateBusiness('hours', event.target.value)}
                  className="field"
                  placeholder="Senin–Sabtu, 08.00–17.00"
                />
              </div>
              <div>
                <label htmlFor="settings-instagram" className="field-label">
                  Instagram <span className="font-normal normal-case text-muted">(opsional)</span>
                </label>
                <input
                  id="settings-instagram"
                  maxLength={120}
                  value={form.business.instagram}
                  onChange={(event) => updateBusiness('instagram', event.target.value)}
                  className="field"
                  placeholder="https://instagram.com/…"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-areas" className="field-label">
                  Area layanan <span className="font-normal normal-case text-muted">(satu per baris)</span>
                </label>
                <textarea
                  id="settings-areas"
                  rows={5}
                  value={areasText}
                  onChange={(event) => {
                    setAreasText(event.target.value);
                    setNotice(null);
                  }}
                  className="field resize-y"
                  placeholder={'Jakarta Selatan\nJakarta Pusat\nDepok'}
                />
                <p className="field-hint">Maksimal 20 area. Tampil di beranda dan halaman kontak.</p>
              </div>
            </div>
          </section>

          <section className="border border-line bg-paper p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[0.95rem] font-bold tracking-[-0.02em]">Pembayaran manual</h2>
              <span className="text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                Transfer bank
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-bank" className="field-label">
                  Nama bank
                </label>
                <input
                  id="settings-bank"
                  maxLength={60}
                  value={form.payment.bankName}
                  onChange={(event) => updatePayment('bankName', event.target.value)}
                  className="field"
                  placeholder="BCA"
                />
              </div>
              <div>
                <label htmlFor="settings-account" className="field-label">
                  Nomor rekening
                </label>
                <input
                  id="settings-account"
                  maxLength={40}
                  value={form.payment.bankAccount}
                  onChange={(event) => updatePayment('bankAccount', event.target.value)}
                  className="field ticket-code"
                  placeholder="1234567890"
                  inputMode="numeric"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-account-name" className="field-label">
                  Nama pemilik rekening
                </label>
                <input
                  id="settings-account-name"
                  maxLength={80}
                  value={form.payment.accountName}
                  onChange={(event) => updatePayment('accountName', event.target.value)}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-payment-note" className="field-label">
                  Catatan pembayaran
                </label>
                <textarea
                  id="settings-payment-note"
                  rows={3}
                  maxLength={300}
                  value={form.payment.note}
                  onChange={(event) => updatePayment('note', event.target.value)}
                  className="field resize-y"
                />
              </div>
            </div>

            {form.payment.bankAccount === '0000000000' ? (
              <p className="mt-3 border border-amber/35 bg-amber/10 px-3 py-2 text-[0.7rem] leading-relaxed">
                Nomor rekening masih berupa contoh. Ganti dengan rekening usaha yang benar
                sebelum situs dipublikasikan.
              </p>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-4 py-3">
            <p className="text-[0.66rem] text-muted">
              {dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="border border-ink bg-ink px-4 py-2 text-[0.72rem] font-semibold text-bone transition-colors hover:border-teal hover:bg-teal disabled:opacity-50"
            >
              {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="border border-line bg-paper p-4">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Pratinjau kontak
            </p>
            <p className="mt-2 text-[1.05rem] font-bold tracking-[-0.03em]">
              {form.business.name || 'Nama usaha'}
            </p>
            <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
              {form.business.tagline || 'Tagline akan tampil di sini.'}
            </p>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[0.7rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Telepon</dt>
                <dd className="text-right">{form.business.phone || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">WhatsApp</dt>
                <dd className="text-right">{form.business.whatsapp || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Email</dt>
                <dd className="text-right">{form.business.email || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jam</dt>
                <dd className="text-right">{form.business.hours || '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[0.68rem] leading-relaxed text-muted">
              {form.business.address || 'Alamat belum diisi'}
              {form.business.district ? `, ${form.business.district}` : ''}
              {form.business.city ? `, ${form.business.city}` : ''}
            </p>
          </section>

          <section className="border border-line bg-surface/50 p-4">
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Catatan operasional
            </p>
            <ul className="mt-2 space-y-2 text-[0.68rem] leading-relaxed text-muted">
              <li>
                Nomor WhatsApp dipakai untuk tautan pemesanan, pelacakan, dan konfirmasi admin.
              </li>
              <li>
                Perubahan area layanan memengaruhi halaman area, sitemap, dan struktur data SEO.
              </li>
              <li>
                Rekening hanya untuk instruksi transfer manual; integrasi Midtrans dikelola
                terpisah melalui variabel lingkungan server.
              </li>
            </ul>
          </section>
        </aside>
      </form>
    </div>
  );
}
