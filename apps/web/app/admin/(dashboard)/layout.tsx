'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminUser } from '@/lib/admin-auth';
import type { AdminUser } from '@/lib/types';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getAdminUser()
      .then((result) => {
        if (!active) return;
        if (!result) {
          router.replace('/admin/login');
          return;
        }
        setUser(result);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bone px-6">
        <div className="w-full max-w-sm border border-line bg-paper p-6" aria-live="polite">
          <p className="ticket-code text-[0.6rem] text-muted">GCC · ADMIN</p>
          <p className="mt-3 text-[0.95rem] font-semibold">Memeriksa sesi…</p>
          <div className="mt-4 h-1 w-full overflow-hidden bg-line">
            <div className="h-full w-1/3 animate-pulse bg-teal" />
          </div>
          <p className="mt-3 text-[0.72rem] text-muted">
            Panel ini hanya dapat dibuka oleh staf terautentikasi.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AdminShell user={user}>{children}</AdminShell>;
}
