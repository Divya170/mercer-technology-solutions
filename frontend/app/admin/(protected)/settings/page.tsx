'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminSettings } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { AdminHeader, ErrorBox, Field, LoadingRows } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

export default function SettingsPage() {
  const { toast } = useAdmin();
  const [s, setS] = useState<AdminSettings | null>(null);
  const [orig, setOrig] = useState<AdminSettings | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<AdminSettings>('/settings/admin', { admin: true })
      .then((x) => {
        setS(x);
        setOrig(x);
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setS((p) => (p ? { ...p, [k]: v } : p));
  const dirty = JSON.stringify(s) !== JSON.stringify(orig);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s) return;
    const fe: Record<string, string> = {};
    if (s.companyName.trim().length < 2) fe.companyName = 'Enter the company name.';
    if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email.trim())) fe.email = 'Enter a valid email address, like name@company.com.';
    if (s.phone && !/^[0-9+()\-.\s]{7,30}$/.test(s.phone.trim())) fe.phone = 'Enter a valid phone number.';
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    try {
      const x = await api<AdminSettings>('/settings', {
        method: 'PATCH',
        admin: true,
        body: {
          companyName: s.companyName.trim(),
          contactName: s.contactName,
          email: s.email?.trim() || null,
          phone: s.phone?.trim() || null,
          addressLine1: s.addressLine1?.trim() || null,
          addressLine2: s.addressLine2?.trim() || null,
          locationTag: s.locationTag,
          companyStatement: s.companyStatement,
          companyOverview: s.companyOverview,
          companyFocus: s.companyFocus,
          privacyPolicy: s.privacyPolicy,
          showSamples: s.showSamples,
          showBudget: s.showBudget,
          enquiriesOpen: s.enquiriesOpen,
        },
      });
      setS(x);
      setOrig(x);
      toast('Settings saved. Changes are live on the site.');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors || {});
      toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Launch checklist reflects what is saved (not unsaved edits).
  const checklist = orig
    ? [
        { ok: !orig.showSamples, text: 'Sample content is hidden from visitors (“Show sample content” is off).' },
        { ok: !!orig.privacyPolicy.trim(), text: 'The privacy policy text has been added.' },
        { ok: !!orig.email && !!orig.phone, text: 'Contact email and phone number are filled in (and confirmed with the client).' },
        { ok: orig.enquiriesOpen, text: 'The contact form is accepting enquiries.' },
      ]
    : [];

  return (
    <>
      <AdminHeader eyebrow="CONFIGURATION" title="Settings" />
      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : !s || !orig ? (
        <div className="adm-panel">
          <LoadingRows />
        </div>
      ) : (
        <form onSubmit={save} noValidate className="adm-form" style={{ maxWidth: 860 }}>
          <div className="adm-panel adm-pad">
            <h2 className="h-card" style={{ fontSize: 18, marginBottom: 10 }}>
              Launch checklist
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              {checklist.map((c) => (
                <li key={c.text} style={{ display: 'flex', gap: 10 }}>
                  <span aria-hidden="true" style={{ color: c.ok ? 'var(--ink)' : 'var(--error)', fontWeight: 700 }}>
                    {c.ok ? '✓' : '✗'}
                  </span>
                  <span>
                    <span className="sr-only">{c.ok ? 'Done: ' : 'To do: '}</span>
                    {c.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="adm-panel adm-pad adm-form">
            <h2 className="h-card">Company &amp; contact details</h2>
            <p className="small">Shown in the header, footer, Company and Contact pages. Leave phone or email empty to hide it.</p>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Field id="st-name" label="Company name *" error={errors.companyName}>
                <input id="st-name" className="control" maxLength={120} value={s.companyName} onChange={(e) => set('companyName', e.target.value)} aria-invalid={!!errors.companyName} />
              </Field>
              <Field id="st-contact" label="Primary contact" error={errors.contactName}>
                <input id="st-contact" className="control" maxLength={120} value={s.contactName} onChange={(e) => set('contactName', e.target.value)} />
              </Field>
              <Field id="st-email" label="Email" error={errors.email} help="Also receives new-lead emails when NOTIFY_TO isn't set in backend/.env.">
                <input id="st-email" type="email" className="control" maxLength={254} value={s.email || ''} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />
              </Field>
              <Field id="st-phone" label="Phone" error={errors.phone}>
                <input id="st-phone" type="tel" className="control" maxLength={30} value={s.phone || ''} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />
              </Field>
              <Field id="st-a1" label="Address line 1" error={errors.addressLine1}>
                <input id="st-a1" className="control" maxLength={160} value={s.addressLine1 || ''} onChange={(e) => set('addressLine1', e.target.value)} />
              </Field>
              <Field id="st-a2" label="Address line 2 (city, state, ZIP)" error={errors.addressLine2}>
                <input id="st-a2" className="control" maxLength={160} value={s.addressLine2 || ''} onChange={(e) => set('addressLine2', e.target.value)} />
              </Field>
              <Field id="st-tag" label="Location tag" error={errors.locationTag} help="Small label in the home hero, e.g. “PHOENIX, AZ”.">
                <input id="st-tag" className="control" maxLength={80} value={s.locationTag} onChange={(e) => set('locationTag', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="adm-panel adm-pad adm-form">
            <h2 className="h-card">Company page copy</h2>
            <Field id="st-statement" label="Statement" error={errors.companyStatement} help="The large statement at the top of the Company page.">
              <textarea id="st-statement" className="control" rows={3} maxLength={600} value={s.companyStatement} onChange={(e) => set('companyStatement', e.target.value)} />
            </Field>
            <Field id="st-overview" label="Company overview" error={errors.companyOverview} help="Blank lines separate paragraphs. While empty, the page shows the design’s “to be supplied” placeholder.">
              <textarea id="st-overview" className="control" rows={6} maxLength={6000} value={s.companyOverview} onChange={(e) => set('companyOverview', e.target.value)} />
            </Field>
            <Field id="st-focus" label="Focus line" error={errors.companyFocus}>
              <input id="st-focus" className="control" maxLength={200} value={s.companyFocus} onChange={(e) => set('companyFocus', e.target.value)} />
            </Field>
          </div>

          <div className="adm-panel adm-pad adm-form">
            <h2 className="h-card">Privacy policy</h2>
            <Field
              id="st-privacy"
              label="Privacy policy text"
              error={errors.privacyPolicy}
              help="Use the wording the client (or their adviser) has approved. Leave a blank line between paragraphs; a paragraph starting with “## ” becomes a heading. Once this has text, the /privacy page appears and the contact form links to it."
            >
              <textarea id="st-privacy" className="control" rows={16} maxLength={30000} value={s.privacyPolicy} onChange={(e) => set('privacyPolicy', e.target.value)} />
            </Field>
            {orig.privacyPolicy.trim() && (
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="small" style={{ fontWeight: 600 }}>
                View the published page ↗
              </a>
            )}
          </div>

          <div className="adm-panel adm-pad adm-form">
            <h2 className="h-card">Site switches</h2>
            <label className="adm-check">
              <input type="checkbox" checked={s.showSamples} onChange={(e) => set('showSamples', e.target.checked)} />
              Show sample content
            </label>
            <p className="small">
              Sample industries, jobs, solutions, case studies and articles from the design are visible to visitors while this is on. <strong>Turn it off before launch.</strong>
            </p>
            {s.showSamples && (
              <div role="status" className="alert-warn" style={{ padding: 12 }}>
                Sample content is currently visible on the public site.
              </div>
            )}
            <label className="adm-check">
              <input type="checkbox" checked={s.showBudget} onChange={(e) => set('showBudget', e.target.checked)} />
              Ask for a budget range on the contact form
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={s.enquiriesOpen} onChange={(e) => set('enquiriesOpen', e.target.checked)} />
              Accept enquiries
            </label>
            <p className="small">When off, the contact form is disabled and visitors are asked to email or call instead.</p>
          </div>

          <div className="adm-actions">
            <button type="submit" className="btn btn--sm btn-dark" disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {dirty && (
              <button type="button" className="btn btn--sm btn-outline" onClick={() => setS(orig)}>
                Discard changes
              </button>
            )}
            <span className="small">Last saved {formatDateTime(orig.updatedAt)}</span>
          </div>
        </form>
      )}
    </>
  );
}
