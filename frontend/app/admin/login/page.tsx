'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, auth, ClientApiError } from '@/lib/client-api';
import { Logo } from '@/components/site/Logo';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in → go straight to the dashboard
  useEffect(() => {
    if (auth.get()) {
      api('/admin-auth/me', { admin: true })
        .then(() => router.replace(next && next.startsWith('/admin') ? next : '/admin'))
        .catch(() => auth.clear());
    }
  }, [router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) fe.email = 'Enter a valid email address.';
    if (!password) fe.password = 'Enter your password.';
    setErrors(fe);
    setError('');
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      const r = await api<{ token: string }>('/admin-auth/login', { method: 'POST', body: { email: email.trim(), password } });
      auth.set(r.token);
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      const ce = err as ClientApiError;
      setError(ce.message);
      setErrors(ce.errors || {});
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="login-card">
      <Logo href="/" />
      <span className="eyebrow eyebrow--muted">STAFF ONLY</span>
      <h1 style={{ margin: 0, fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-.035em', color: 'var(--ink)' }}>Management console</h1>
      <p className="body" style={{ fontSize: 15, lineHeight: 1.6 }}>
        Sign in to review leads, manage solutions, case studies and insights, and edit website content.
      </p>
      {error && (
        <div role="alert" className="alert-err">
          <strong>{error}</strong>
        </div>
      )}
      <div className="field">
        <label htmlFor="l-email">Email</label>
        <input id="l-email" type="email" autoComplete="username" className="control" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'l-email-err' : undefined} />
        {errors.email && (
          <p id="l-email-err" className="field-err">
            {errors.email}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="l-pass">Password</label>
        <input id="l-pass" type="password" autoComplete="current-password" className="control" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? 'l-pass-err' : undefined} />
        {errors.password && (
          <p id="l-pass-err" className="field-err">
            {errors.password}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-dark" disabled={busy} aria-disabled={busy}>
        {busy && <span className="spinner" aria-hidden="true" />}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <Link href="/" className="small" style={{ alignSelf: 'flex-start' }}>
        ← Back to website
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div aria-hidden="true" className="grid-lines-dark" />
      <Suspense fallback={<div className="login-card" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
