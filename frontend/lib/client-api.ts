'use client';

/**
 * Browser-side API helper. Calls go to same-origin /api/* (proxied to NestJS by
 * next.config.js). Admin calls attach the JWT from sessionStorage.
 */

const TOKEN_KEY = 'mts-admin-token';

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const auth = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  admin?: boolean;
  timeoutMs?: number;
  form?: FormData;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...(opts.headers || {}) };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.admin) {
    const t = auth.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method || 'GET',
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    throw new ClientApiError(0, aborted ? 'The request timed out. Please try again.' : 'Network error — check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && opts.admin) {
    auth.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const d = (data || {}) as { message?: string | string[]; errors?: Record<string, string> };
    const msg = Array.isArray(d.message) ? d.message[0] : d.message || `Request failed (${res.status})`;
    if (res.status === 429) throw new ClientApiError(429, 'Too many requests. Please wait a minute and try again.');
    throw new ClientApiError(res.status, msg, d.errors || {});
  }
  return data as T;
}

/** Upload an image (admin). Returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const r = await api<{ url: string }>('/uploads/admin', { method: 'POST', form, admin: true, timeoutMs: 60000 });
  return r.url;
}

/** Download a CSV (admin) using the bearer token. */
export async function downloadCsv(path: string, filename: string) {
  const t = auth.get();
  const res = await fetch(`/api${path}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
  if (!res.ok) throw new ClientApiError(res.status, 'Export failed. Please try again.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
