'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, DEMO_MODE } from '@/lib/api';
import { DEMO_CREDENTIALS, getAdminUser, loginAdmin } from '@/lib/admin-auth';
import { ArrowUpRight } from '@/components/ui/Icons';

const DESK_ITEMS = [
  ['01', 'Pesanan', 'Konfirmasi jadwal, tugaskan teknisi, catat pembayaran.'],
  ['02', 'Harga', 'Kelola layanan, varian, dan tarif yang tampil di situs.'],
  ['03', 'Stok', 'Pantau freon, kapasitor, dan mutasi barang masuk-keluar.'],
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    getAdminUser().then((user) => {
      if (user) router.replace('/admin');
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Tidak dapat masuk saat ini. Coba lagi beberapa saat lagi.',
      );
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  }

  return (
    <div className="grid min-h-dvh bg-bone lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink px-10 py-9 text-bone lg:flex">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[1.15rem] font-extrabold tracking-[-0.04em]">gcc</span>
          <span className="text-[1.15rem] font-light tracking-[-0.02em]">web</span>
          <span className="ml-auto text-[0.58rem] uppercase tracking-[0.16em] text-bone/35">
            Panel operasi
          </span>
        </div>

        <div className="max-w-[30rem]">
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-teal-soft">
            Akses terbatas · Staf GCC Web
          </p>
          <h1 className="mt-4 text-[2.6rem] font-bold leading-[1.04] tracking-[-0.045em]">
            Meja kerja
            <br />
            hari ini.
          </h1>
          <p className="mt-4 max-w-[36ch] text-[0.88rem] leading-relaxed text-bone/55">
            Satu tempat untuk jadwal kunjungan, beban teknisi, harga layanan, dan stok
            yang menipis.
          </p>

          <dl className="mt-9 border-t border-bone/15">
            {DESK_ITEMS.map(([code, label, body]) => (
              <div key={code} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-bone/10 py-3.5">
                <dt className="ticket-code pt-0.5 text-[0.58rem] text-bone/30">{code}</dt>
                <div>
                  <dt className="text-[0.8rem] font-semibold">{label}</dt>
                  <dd className="mt-0.5 text-[0.72rem] leading-relaxed text-bone/45">{body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex items-end justify-between gap-6 border-t border-bone/15 pt-5">
          <p className="max-w-[32ch] text-[0.66rem] leading-relaxed text-bone/40">
            Sesi berakhir otomatis. Jangan bagikan tautan panel kepada pelanggan.
          </p>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] text-bone/55 transition-colors hover:text-bone"
          >
            Kembali ke situs
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-baseline justify-between lg:hidden">
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="text-[1.05rem] font-extrabold tracking-[-0.04em]">gcc</span>
            <span className="text-[1.05rem] font-light tracking-[-0.02em]">web</span>
          </Link>
          <Link href="/" className="text-[0.68rem] text-muted">
            Situs utama
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-10">
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-muted">Masuk panel</p>
          <h2 className="mt-3 text-[1.65rem] font-bold tracking-[-0.035em]">Selamat datang.</h2>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
            Gunakan akun admin yang diberikan. Teknisi tidak menggunakan panel ini.
          </p>

          {DEMO_MODE ? (
            <div className="mt-6 border border-teal/25 bg-teal-soft/40 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-teal">
                  Kredensial demo
                </p>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="border border-teal/30 bg-paper px-2 py-1 text-[0.62rem] font-semibold text-teal transition-colors hover:bg-teal hover:text-bone"
                >
                  Isi otomatis
                </button>
              </div>
              <dl className="mt-2.5 grid grid-cols-[4.2rem_1fr] gap-x-2 gap-y-1 text-[0.72rem]">
                <dt className="text-muted">Email</dt>
                <dd className="ticket-code text-ink">{DEMO_CREDENTIALS.email}</dd>
                <dt className="text-muted">Sandi</dt>
                <dd className="ticket-code text-ink">{DEMO_CREDENTIALS.password}</dd>
              </dl>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="field-label">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
                inputMode="email"
                placeholder="nama@gcc-web.id"
                className="field"
                aria-invalid={Boolean(error)}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="field-label">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="field pr-16"
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 px-3 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? 'Tutup' : 'Lihat'}
                </button>
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="border border-rust/30 bg-rust/5 px-3 py-2 text-[0.74rem] leading-relaxed text-rust"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="group flex w-full items-center justify-between border border-ink bg-ink px-4 py-3 text-[0.8rem] font-semibold text-bone transition-colors duration-300 hover:bg-teal hover:border-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{submitting ? 'Memeriksa…' : 'Masuk ke panel'}</span>
              <span className="flex h-6 w-6 items-center justify-center border border-bone/25 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </form>

          <p className="mt-6 border-t border-line pt-4 text-[0.68rem] leading-relaxed text-muted">
            Lupa kata sandi? Hubungi pemilik sistem. Demi keamanan, jangan menyimpan
            kredensial di catatan publik.
          </p>
        </div>

        <p className="text-[0.62rem] text-muted lg:text-right">
          © {new Date().getFullYear()} GCC Web · gcc-web.id
        </p>
      </section>
    </div>
  );
}
