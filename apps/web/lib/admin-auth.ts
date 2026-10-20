import { ApiError, DEMO_MODE, apiGet, apiSend } from './api';
import type { AdminUser } from './types';

const DEMO_KEY = 'gcc:demo-admin';

export const DEMO_CREDENTIALS = {
  email: 'admin@gcc-web.id',
  password: 'Admin#12345',
};

function readDemoUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    return parsed?.role === 'ADMIN' && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  if (DEMO_MODE) {
    if (
      email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      const user: AdminUser = {
        id: 'demo-admin',
        name: 'GCC Admin',
        email: DEMO_CREDENTIALS.email,
        role: 'ADMIN',
      };
      window.sessionStorage.setItem(DEMO_KEY, JSON.stringify(user));
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      return user;
    }
    throw new ApiError(
      401,
      'Email atau kata sandi demo tidak cocok. Gunakan kredensial yang tertera.',
      'INVALID_CREDENTIALS',
    );
  }

  const result = await apiSend<{ user: AdminUser; expiresAt: string }>(
    '/auth/login',
    'POST',
    { email: email.trim(), password },
  );

  // `/auth/login` is shared with technicians. The browser panel is admin-only,
  // so revoke the fresh session instead of letting a technician through.
  if (result.user.role !== 'ADMIN') {
    await apiSend('/auth/logout', 'POST').catch(() => undefined);
    throw new ApiError(
      403,
      'Akun ini tidak memiliki akses ke panel admin.',
      'FORBIDDEN',
    );
  }

  return result.user;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  if (DEMO_MODE) return readDemoUser();
  try {
    const user = await apiGet<AdminUser>('/auth/me');
    return user.role === 'ADMIN' ? user : null;
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<void> {
  if (DEMO_MODE) {
    window.sessionStorage.removeItem(DEMO_KEY);
    return;
  }
  try {
    await apiSend<{ message: string }>('/auth/logout', 'POST');
  } catch {
    // Clear the local view even if the network call fails.
  }
}

export function isDemoAdmin(): boolean {
  return DEMO_MODE || Boolean(readDemoUser());
}
