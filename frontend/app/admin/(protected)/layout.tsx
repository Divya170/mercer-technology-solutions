'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, auth } from '@/lib/client-api';
import { AdminProvider } from '@/components/admin/AdminContext';
import { Logo } from '@/components/site/Logo';

const NAV: { href: string; label: string; badge?: boolean }[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/leads', label: 'Leads', badge: true },
  { href: '/admin/solutions', label: 'Solutions' },
  { href: '/admin/case-studies', label: 'Case studies' },
  { href: '/admin/insights', label: 'Insights' },
  { href: '/admin/content', label: 'Site content & photos' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/account', label: 'Account' },
];

type Admin = { id: number; email: string; name: string };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '/admin';
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!auth.get()) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    api<Admin>('/admin-auth/me', { admin: true })
      .then((a) => {
        setAdmin(a);
        setChecking(false);
      })
      .catch(() => {
        auth.clear();
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCounts = useCallback(() => {
    api<{ counts: Record<string, number> }>('/inquiries/stats', { admin: true })
      .then((s) => setNewCount(s.counts.new || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!admin) return;
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000); // keep the "new" badge fresh
    return () => clearInterval(t);
  }, [admin, refreshCounts]);

  useEffect(() => setOpen(false), [pathname]);

  const signOut = () => {
    auth.clear();
    router.replace('/admin/login');
  };

  if (checking) {
    return (
      <div className="login-wrap" aria-busy="true">
        <div className="login-card" style={{ alignItems: 'center' }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
          <span className="small">Checking your session…</span>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <AdminProvider admin={admin} newCount={newCount} refreshCounts={refreshCounts}>
      <div className="adm">
        <div className="adm-top">
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 20 }}>Mercer · Admin</span>
          <button type="button" className="adm-menubtn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="adm-side">
            Menu
          </button>
        </div>
        <aside id="adm-side" className={`adm-side${open ? ' is-open' : ''}`} aria-label="Admin navigation">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo href="/admin" sub="Admin" />
            {open && (
              <button type="button" className="adm-menubtn" onClick={() => setOpen(false)} aria-label="Close menu">
                ✕
              </button>
            )}
          </div>
          <nav>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
                <span>{n.label}</span>
                {n.badge && newCount > 0 && <span className="badge">{newCount} new</span>}
              </Link>
            ))}
          </nav>
          <div className="adm-side__foot">
            <span>Signed in as {admin?.name}</span>
            <span style={{ overflowWrap: 'anywhere' }}>{admin?.email}</span>
            <a href="/" target="_blank" rel="noreferrer">
              View website ↗
            </a>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="adm-main" id="main">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}
