'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, downloadCsv, ClientApiError } from '@/lib/client-api';
import type { Lead } from '@/lib/types';
import { formatDateTime, STATUS_LABEL } from '@/lib/format';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, LoadingRows, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

interface Stats {
  counts: Record<string, number>;
  last30: number;
  byInterest: { label: string; count: number }[];
  recent: Lead[];
  expired: number;
  notificationsConfigured: boolean;
}

export default function DashboardPage() {
  const { toast, refreshCounts } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [purge, setPurge] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setError('');
    setStats(null);
    api<Stats>('/inquiries/stats', { admin: true })
      .then(setStats)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv('/inquiries/export.csv', `mercer-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      toast('Export downloaded.');
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setExporting(false);
    }
  };

  const tiles: [string, number][] = stats
    ? [
        ['New leads', stats.counts.new || 0],
        ['Contacted', stats.counts.contacted || 0],
        ['Qualified', stats.counts.qualified || 0],
        ['Last 30 days', stats.last30],
      ]
    : [];

  return (
    <>
      <AdminHeader eyebrow="OVERVIEW" title="Dashboard">
        <button type="button" className="btn btn--sm btn-outline" onClick={exportCsv} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export leads (CSV)'}
        </button>
        <Link href="/admin/leads" className="btn btn--sm btn-dark">
          All leads
        </Link>
        <Link href="/admin/content" className="btn btn--sm btn-outline">
          Edit site content
        </Link>
      </AdminHeader>

      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : !stats ? (
        <div className="adm-panel">
          <LoadingRows />
        </div>
      ) : (
        <div className="col" style={{ gap: 20 }}>
          {!stats.notificationsConfigured && (
            <div role="status" className="alert-warn" style={{ padding: 14 }}>
              Email notifications are not configured — set the SMTP_* variables in backend/.env so new leads are emailed to you.
            </div>
          )}
          <div className="grid-auto" style={{ ['--min' as string]: '180px', ['--gap' as string]: '12px' }}>
            {tiles.map(([label, n]) => (
              <div key={label} className="adm-panel adm-pad">
                <p className="eyebrow eyebrow--muted">{label.toUpperCase()}</p>
                <p className="h-card" style={{ fontSize: 34, marginTop: 6 }}>
                  {n}
                </p>
              </div>
            ))}
          </div>

          {stats.expired > 0 && (
            <div className="adm-panel adm-pad flex-wrap" style={{ gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {stats.expired} lead{stats.expired === 1 ? ' has' : 's have'} passed the retention period.
              </span>
              <button type="button" className="btn btn--sm btn-danger" onClick={() => setPurge(true)}>
                Delete expired leads
              </button>
            </div>
          )}

          <div className="adm-split">
            <section className="adm-panel l" aria-labelledby="recent-h">
              <h2 id="recent-h" className="h-card adm-pad" style={{ fontSize: 18, borderBottom: '1px solid var(--line)' }}>
                Recent leads
              </h2>
              {stats.recent.length === 0 ? (
                <EmptyBox>No leads yet. Submissions from the contact form appear here.</EmptyBox>
              ) : (
                stats.recent.map((l) => (
                  <div key={l.id} className="flex-wrap" style={{ gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                    <div className="col min0" style={{ flex: '1 1 220px', gap: 4 }}>
                      <strong style={{ fontWeight: 600 }}>
                        {l.name} · {l.company}
                      </strong>
                      <span className="small">
                        {l.reference} · {l.interestLabel} · {formatDateTime(l.createdAt)}
                      </span>
                      <a href={`mailto:${l.email}?subject=${encodeURIComponent(`Your enquiry ${l.reference}`)}`} className="small">
                        {l.email}
                      </a>
                    </div>
                    <StatusTag kind={l.status === 'new' ? 'new' : undefined}>{STATUS_LABEL[l.status]}</StatusTag>
                  </div>
                ))
              )}
            </section>
            <section className="adm-panel adm-pad" style={{ flex: '1 1 280px' }} aria-labelledby="int-h">
              <h2 id="int-h" className="h-card" style={{ fontSize: 18, marginBottom: 12 }}>
                By area of interest
              </h2>
              {stats.byInterest.length === 0 ? (
                <p className="small">No data yet.</p>
              ) : (
                <dl className="dl">
                  {stats.byInterest.map((b) => (
                    <div key={b.label} style={{ display: 'contents' }}>
                      <dt>{b.count}</dt>
                      <dd>{b.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </div>
        </div>
      )}

      {purge && (
        <ConfirmDialog
          title="Delete expired leads?"
          message="Leads past their retention date will be permanently deleted. Export them first if you need a copy."
          onCancel={() => setPurge(false)}
          onConfirm={async () => {
            try {
              const r = await api<{ deleted: number }>('/inquiries/admin/purge-expired', { method: 'POST', admin: true });
              toast(`${r.deleted} lead${r.deleted === 1 ? '' : 's'} deleted.`);
              setPurge(false);
              refreshCounts();
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}
