export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
).replace(/\/$/, '');

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'REQUEST_FAILED',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
  error?: { code: string; message: string; details?: unknown };
}

let refreshPromise: Promise<boolean> | null = null;

/** Rotate the refresh cookie once, shared by every request that hits a 401. */
function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const body = (await response.json().catch(() => null)) as Envelope<unknown> | null;
        return Boolean(body?.success);
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function sendRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  let response: Response;
  try {
    response = await sendRequest(path, init);
    const canRefresh =
      !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh');
    if (response.status === 401 && canRefresh && (await refreshAccessToken())) {
      response = await sendRequest(path, init);
    }
  } catch {
    throw new ApiError(
      0,
      'Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.',
      'NETWORK_ERROR',
    );
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(
      response.status,
      body?.error?.message ?? 'Permintaan tidak dapat diproses.',
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.details,
    );
  }

  return body;
}

export async function apiGet<T>(path: string): Promise<T> {
  const body = await request<T>(path, { method: 'GET', cache: 'no-store' });
  return body.data;
}

export async function apiGetPaginated<T>(
  path: string,
): Promise<{ data: T; meta: Envelope<T>['meta'] }> {
  const body = await request<T>(path, { method: 'GET', cache: 'no-store' });
  return { data: body.data, meta: body.meta };
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  data?: unknown,
): Promise<T> {
  const body = await request<T>(path, {
    method,
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return body.data;
}
