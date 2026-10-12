'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ClientApiError, downloadCsv } from '@/lib/client-api';
import type { Lead, LeadOptions, LeadStatus } from '@/lib/types';
import { formatDateTime, NOTIFY_LABEL, STATUS_LABEL } from '@/lib/format';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, LoadingRows, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

interface ListResp {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts: Record<string, number>;
  notificationsConfigured: boolean;
}
interface Draft {
  status: LeadStatus;
  assignedTo: string;
  notes: string;
}

const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
];
const STATUS_VALUES: LeadStatus[] = ['new', 'contacted', 'qualified', 'closed', 'spam'];
const VALID_FILTERS = new Set(STATUSES.map((s) => s.value));

const draftOf = (l: Lead): Draft => ({ status: l.status, assignedTo: l.assignedTo, notes: l.notes });
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function LeadsInner() {
  const { toast, refreshCounts } = useAdmin();
  const params = useSearchParams();
  const initialStatus = params.get('status') || 'all';

  const [status, setStatus] = useState(VALID_FILTERS.has(initialStatus) ? initialStatus : 'all');
  const [interest, setInterest] = useState('all');
  const [assigned, setAssigned] = useState('all');
  const [sort, setSort] = useState('newest');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResp | null>(null);
  const [options, setOptions] = useState<LeadOptions | null>(null);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [detailError, setDetailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [del, setDel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const loadSeq = useRef(0);

  const dirty = !!detail && !!draft && (draft.status !== detail.status || draft.assignedTo.trim() !== detail.assignedTo || draft.notes !== detail.notes);

  // Interest names for the filter (public endpoint).
  useEffect(() => {
    api<LeadOptions>('/inquiries/options')
      .then(setOptions)
      .catch(() => {});
  }, []);

  // Search box -> debounced filter
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(() => {
    const seq = ++loadSeq.current;
    setError('');
    const p = new URLSearchParams({ page: String(page), limit: '20', sort });
    if (status !== 'all') p.set('status', status);
    if (interest !== 'all') p.set('interest', interest);
    if (assigned === 'unassigned') p.set('assigned', 'unassigned');
    if (q) p.set('q', q);
    api<ListResp>(`/inquiries?${p}`, { admin: true })
      .then((r) => {
        if (seq === loadSeq.current) setData(r);
      })
      .catch((e: ClientApiError) => {
        if (seq === loadSeq.current) setError(e.message);
      });
  }, [page, sort, status, interest, assigned, q]);
  useEffect(load, [load]);

  const confirmDiscard = () => !dirty || window.confirm('You have unsaved changes to this lead. Discard them?');

  const select = async (id: string) => {
    if (id === selectedId) return;
    if (!confirmDiscard()) return;
    setSelectedId(id);
    setDetail(null);
    setDraft(null);
    setDetailError('');
    try {
      const l = await api<Lead>(`/inquiries/${id}`, { admin: true });
      setDetail(l);
      setDraft(draftOf(l));
    } catch (e) {
      setDetailError((e as ClientApiError).message);
    }
  };

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const save = async () => {
    if (!detail || !draft) return;
    setSaving(true);
    try {
      const l = await api<Lead>(`/inquiries/${detail.id}`, {
        method: 'PATCH',
        admin: true,
        body: { status: draft.status, assignedTo: draft.assignedTo.trim(), notes: draft.notes },
      });
      setDetail(l);
      setDraft(draftOf(l));
      toast('Lead saved.');
      refreshCounts();
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    if (!detail) return;
    setResending(true);
    try {
      const l = await api<Lead>(`/inquiries/${detail.id}/notify`, { method: 'POST', admin: true });
      setDetail((d) => (d ? { ...d, notificationStatus: l.notificationStatus, notificationError: l.notificationError } : d));
      toast(l.notificationStatus === 'sent' ? 'Notification email sent.' : 'The email could not be sent — see the details.', l.notificationStatus !== 'sent');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setResending(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = status !== 'all' ? `?status=${status}` : '';
      await downloadCsv(`/inquiries/export.csv${qs}`, `mercer-leads-${status}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast('Export downloaded.');
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setExporting(false);
    }
  };

  const counts = data?.counts;

  return (
    <>
      <AdminHeader eyebrow="LEADS" title="Leads">
        <button type="button" className="btn btn--sm btn-outline" onClick={exportCsv} disabled={exporting}>
          {exporting ? 'Exporting…' : `Export ${status === 'all' ? 'all' : STATUS_LABEL[status as LeadStatus].toLowerCase()} (CSV)`}
        </button>
      </AdminHeader>

      {data && !data.notificationsConfigured && (
        <div role="status" className="alert-warn" style={{ padding: 14, marginBottom: 16 }}>
          Email notifications are not configured — set the SMTP_* variables in backend/.env so new leads are emailed to you.
        </div>
      )}

      <div className="adm-chips" role="group" aria-label="Filter by status">
        {STATUSES.map((s) => (
          <button key={s.value} type="button" className="chipbtn" aria-pressed={status === s.value} onClick={() => changeFilter(() => setStatus(s.value))}>
            {s.label}
            {counts ? ` (${s.value === 'all' ? counts.all : counts[s.value] || 0})` : ''}
          </button>
        ))}
      </div>

      <div className="adm-filters" style={{ alignItems: 'flex-end' }}>
        <label className="searchbox">
          Search
          <input className="input" type="search" placeholder="Name, email, company, phone, reference" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </label>
        <label className="searchbox" style={{ flex: '0 1 220px' }}>
          Area of interest
          <select className="input" value={interest} onChange={(e) => changeFilter(() => setInterest(e.target.value))}>
            <option value="all">All areas</option>
            {(options?.interests || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="searchbox" style={{ flex: '0 1 180px' }}>
          Assigned
          <select className="input" value={assigned} onChange={(e) => changeFilter(() => setAssigned(e.target.value))}>
            <option value="all">Anyone</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <label className="searchbox" style={{ flex: '0 1 160px' }}>
          Sort
          <select className="input" value={sort} onChange={(e) => changeFilter(() => setSort(e.target.value))}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div className="adm-split">
        <section className="adm-panel l" aria-label="Lead list">
          {error ? (
            <ErrorBox message={error} onRetry={load} />
          ) : !data ? (
            <LoadingRows />
          ) : data.items.length === 0 ? (
            <EmptyBox>{q || interest !== 'all' || assigned !== 'all' || status !== 'all' ? 'No leads match these filters.' : 'No leads yet. Submissions from the contact form appear here.'}</EmptyBox>
          ) : (
            <>
              {data.items.map((l) => (
                <button key={l.id} type="button" className={`adm-row${l.status === 'new' ? ' is-urgent' : ''}`} aria-pressed={l.id === selectedId} onClick={() => select(l.id)}>
                  <span className="col min0" style={{ gap: 4 }}>
                    <span className="t">
                      {l.name} · {l.company}
                    </span>
                    <span className="s">
                      {l.reference} · {l.interestLabel || l.interest}
                    </span>
                  </span>
                  <span className="s">
                    {shortDate(l.createdAt)}
                    {l.assignedTo ? ` · ${l.assignedTo}` : ''}
                  </span>
                  <StatusTag kind={l.status === 'new' ? 'new' : undefined}>{STATUS_LABEL[l.status]}</StatusTag>
                </button>
              ))}
              <div className="adm-pager">
                <span className="small">
                  {data.total} lead{data.total === 1 ? '' : 's'} · page {data.page} of {data.pages}
                </span>
                <span className="flex-wrap" style={{ gap: 8 }}>
                  <button type="button" className="iconbtn" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>
                    ← Previous
                  </button>
                  <button type="button" className="iconbtn" disabled={data.page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </button>
                </span>
              </div>
            </>
          )}
        </section>

        <aside className="adm-panel adm-pad r" aria-label="Lead details" aria-live="polite">
          {!selectedId ? (
            <p className="small">Select a lead to see its details, add notes, assign it and change its status.</p>
          ) : detailError ? (
            <ErrorBox message={detailError} />
          ) : !detail || !draft ? (
            <div aria-busy="true">
              <div className="skel" style={{ height: 18, width: '60%', marginBottom: 12 }} />
              <div className="skel" style={{ height: 14, marginBottom: 8 }} />
              <div className="skel" style={{ height: 14, width: '80%' }} />
            </div>
          ) : (
            <div className="col" style={{ gap: 18 }}>
              <div className="col" style={{ gap: 6 }}>
                <h2 className="h-card" style={{ fontSize: 22 }}>
                  {detail.name}
                </h2>
                <p className="small">
                  {detail.jobTitle ? `${detail.jobTitle}, ` : ''}
                  {detail.company}
                </p>
                <p className="small">
                  {detail.reference} · received {formatDateTime(detail.createdAt)}
                </p>
              </div>

              <dl className="dl-sm">
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${detail.email}?subject=${encodeURIComponent(`Your enquiry ${detail.reference}`)}`}>{detail.email}</a>
                </dd>
                {detail.phone && (
                  <>
                    <dt>Phone</dt>
                    <dd>
                      <a href={`tel:${detail.phone.replace(/[^\d+]/g, '')}`}>{detail.phone}</a>
                    </dd>
                  </>
                )}
                <dt>Interest</dt>
                <dd>{detail.interestLabel || detail.interest}</dd>
                <dt>Timeline</dt>
                <dd>{detail.timeline}</dd>
                {detail.budget && (
                  <>
                    <dt>Budget</dt>
                    <dd>{detail.budget}</dd>
                  </>
                )}
                <dt>Consent</dt>
                <dd>Given {formatDateTime(detail.consentAt)}</dd>
                <dt>Keep until</dt>
                <dd>{formatDateTime(detail.retentionUntil)}</dd>
              </dl>

              <div className="col" style={{ gap: 6 }}>
                <h3 className="eyebrow eyebrow--muted">PROJECT OVERVIEW</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.55 }}>{detail.overview}</p>
              </div>

              <form
                className="adm-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dirty) save();
                }}
              >
                <Field id="ld-status" label="Status">
                  <select id="ld-status" className="control" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as LeadStatus })}>
                    {STATUS_VALUES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s].charAt(0) + STATUS_LABEL[s].slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="ld-assigned" label="Assigned to" help="A name or initials — there are no separate user accounts yet.">
                  <input id="ld-assigned" className="control" maxLength={120} value={draft.assignedTo} onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })} />
                </Field>
                <Field id="ld-notes" label="Internal notes" help="Never shown to the visitor.">
                  <textarea id="ld-notes" className="control" rows={5} maxLength={5000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </Field>
                <div className="adm-actions">
                  <button type="submit" className="btn btn--sm btn-dark" disabled={saving || !dirty}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  {dirty && (
                    <button type="button" className="btn btn--sm btn-outline" onClick={() => setDraft(draftOf(detail))}>
                      Discard
                    </button>
                  )}
                </div>
              </form>

              <div className="col" style={{ gap: 8, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <p className="small">
                  Notification: <strong>{NOTIFY_LABEL[detail.notificationStatus] || detail.notificationStatus}</strong>
                  {detail.notificationError ? ` — ${detail.notificationError}` : ''}
                </p>
                <div className="flex-wrap" style={{ gap: 8 }}>
                  {data?.notificationsConfigured && (
                    <button type="button" className="btn btn--sm btn-outline" onClick={resend} disabled={resending}>
                      {resending ? 'Sending…' : 'Resend notification'}
                    </button>
                  )}
                  <button type="button" className="btn btn--sm btn-danger" onClick={() => setDel(true)}>
                    Delete lead
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {del && detail && (
        <ConfirmDialog
          title="Delete this lead?"
          message={`${detail.name} (${detail.reference}) will be permanently deleted. This cannot be undone.`}
          onCancel={() => setDel(false)}
          onConfirm={async () => {
            try {
              await api(`/inquiries/${detail.id}`, { method: 'DELETE', admin: true });
              toast('Lead deleted.');
              setDel(false);
              setSelectedId(null);
              setDetail(null);
              setDraft(null);
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <LeadsInner />
    </Suspense>
  );
}
