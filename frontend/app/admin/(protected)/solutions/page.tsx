'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminService, Consideration } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';
import { moved, SLUG_RE, toLines } from '@/components/admin/helpers';

interface Form {
  id?: number;
  name: string;
  slug: string;
  short: string;
  overview: string;
  problems: string;
  scope: string;
  considerations: Consideration[];
  image: string;
  imageAlt: string;
  imageLabel: string;
  status: 'published' | 'draft';
  isSample: boolean;
}

const BLANK: Form = { name: '', slug: '', short: '', overview: '', problems: '', scope: '', considerations: [], image: '', imageAlt: '', imageLabel: '', status: 'draft', isSample: false };

const toForm = (s: AdminService): Form => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  short: s.short,
  overview: s.overview,
  problems: s.problems.join('\n'),
  scope: s.scope.join('\n'),
  considerations: s.considerations.map((c) => ({ ...c })),
  image: s.image || '',
  imageAlt: s.imageAlt,
  imageLabel: s.imageLabel,
  status: s.status,
  isSample: s.isSample,
});

const toBody = (f: Form) => ({
  name: f.name.trim(),
  slug: f.slug.trim().toLowerCase(),
  short: f.short.trim(),
  overview: f.overview.trim(),
  problems: toLines(f.problems),
  scope: toLines(f.scope),
  considerations: f.considerations.map((c) => ({ title: c.title.trim(), body: c.body.trim() })).filter((c) => c.title || c.body),
  image: f.image.trim(),
  imageAlt: f.imageAlt.trim(),
  imageLabel: f.imageLabel.trim(),
  status: f.status,
  isSample: f.isSample,
});

/** Mirrors the server rules so most mistakes are caught before the request. */
function validate(f: Form) {
  const e: Record<string, string> = {};
  const b = toBody(f);
  if (b.name.length < 2) e.name = 'Enter a service name.';
  else if (b.name.length > 80) e.name = 'Use 80 characters or fewer.';
  if (b.slug && !SLUG_RE.test(b.slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (b.slug === 'not-sure') e.slug = '"not-sure" is reserved for the enquiry form.';
  if (b.short.length > 300) e.short = 'Use 300 characters or fewer.';
  if (b.overview.length > 2000) e.overview = 'Use 2,000 characters or fewer.';
  if (b.problems.length > 8) e.problems = 'Use 8 items or fewer.';
  if (b.scope.length > 12) e.scope = 'Use 12 items or fewer.';
  if (b.considerations.length > 8) e.considerations = 'Use 8 considerations or fewer.';
  else if (b.considerations.some((c) => !c.title || !c.body)) e.considerations = 'Each consideration needs a title and a description.';
  if (b.image && !/^(\/uploads\/[\w.-]+|https:\/\/\S+)$/.test(b.image)) e.image = 'Upload an image or use an https:// URL.';
  if (b.status === 'published') {
    if (!b.short) e.short = 'Required to publish.';
    if (!b.overview) e.overview = 'Required to publish.';
  }
  return e;
}

export default function SolutionsAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminService[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminService | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError('');
    api<AdminService[]>('/services/admin/all', { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((p) => (p ? { ...p, [k]: v } : p));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = validate(edit);
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    try {
      if (edit.id) await api(`/services/${edit.id}`, { method: 'PATCH', admin: true, body: toBody(edit) });
      else await api('/services', { method: 'POST', admin: true, body: toBody(edit) });
      toast(edit.id ? 'Solution saved.' : 'Solution added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors || {});
      toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = moved(items, i, dir);
    if (next === items) return;
    setItems(next); // optimistic
    try {
      setItems(await api<AdminService[]>('/services/admin/reorder', { method: 'POST', admin: true, body: { ids: next.map((s) => s.id) } }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const togglePublished = async (s: AdminService) => {
    const publishing = s.status !== 'published';
    if (publishing && (!s.short.trim() || !s.overview.trim())) {
      toast('Add a short description and an overview before publishing.', true);
      setErrors({});
      setEdit({ ...toForm(s), status: 'published' });
      return;
    }
    setBusyId(s.id);
    try {
      await api(`/services/${s.id}`, { method: 'PATCH', admin: true, body: { status: publishing ? 'published' : 'draft' } });
      toast(publishing ? 'Published.' : 'Moved to draft.');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setBusyId(null);
    }
  };

  const setConsideration = (i: number, patch: Partial<Consideration>) => setEdit((p) => (p ? { ...p, considerations: p.considerations.map((c, j) => (j === i ? { ...c, ...patch } : c)) } : p));

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Solutions">
        <button
          type="button"
          className="btn btn--sm btn-dark"
          onClick={() => {
            setErrors({});
            setEdit({ ...BLANK });
          }}
        >
          + Add solution
        </button>
      </AdminHeader>
      <p className="small" style={{ maxWidth: '70ch', marginBottom: 16 }}>
        Solutions appear on the home page, the Solutions pages, the footer and as the “Area of interest” choices on the contact form. The order here is the order on the site. Drafts and samples are only visible to visitors when allowed in Settings.
      </p>

      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No solutions yet. Add one to populate the Solutions pages and the contact form.</EmptyBox>
        ) : (
          items.map((s, i) => (
            <div key={s.id} className="flex-wrap" style={{ gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)', opacity: s.status === 'published' ? 1 : 0.7 }}>
              <span className="mono-xs" style={{ width: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="thumb" />
              ) : (
                <span className="thumb" style={{ display: 'inline-block' }} />
              )}
              <div className="col min0" style={{ flex: '1 1 220px', gap: 4 }}>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.name}</span>
                <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  /{s.slug} · {s.short || 'No short description yet'}
                </span>
              </div>
              <div className="flex-wrap" style={{ gap: 6 }}>
                {s.status === 'draft' && <StatusTag kind="draft">DRAFT</StatusTag>}
                {s.isSample && <StatusTag kind="sample">SAMPLE</StatusTag>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="iconbtn" aria-label={`Move ${s.name} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="iconbtn" disabled={busyId === s.id} onClick={() => togglePublished(s)}>
                  {s.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit(toForm(s));
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn" style={{ color: 'var(--error)' }} onClick={() => setDel(s)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && (
        <Modal title={edit.id ? `Edit — ${edit.name || 'solution'}` : 'Add solution'} onClose={() => setEdit(null)} wide>
          <form onSubmit={save} noValidate className="adm-form">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Field id="sv-name" label="Name *" error={errors.name}>
                <input id="sv-name" className="control" maxLength={80} value={edit.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />
              </Field>
              <Field id="sv-slug" label="Page address (slug)" error={errors.slug} help={edit.id ? 'Fixed once created, so existing links keep working.' : 'Leave blank to create it from the name. It can’t be changed later.'}>
                <input id="sv-slug" className="control" maxLength={60} value={edit.slug} readOnly={!!edit.id} onChange={(e) => set('slug', e.target.value)} aria-invalid={!!errors.slug} />
              </Field>
            </div>
            <Field id="sv-short" label="Short description" error={errors.short} help="Shown on cards. Up to 300 characters; required to publish.">
              <textarea id="sv-short" className="control" rows={2} maxLength={300} value={edit.short} onChange={(e) => set('short', e.target.value)} />
            </Field>
            <Field id="sv-overview" label="Overview" error={errors.overview} help="Shown at the top of the solution page. Up to 2,000 characters; required to publish.">
              <textarea id="sv-overview" className="control" rows={5} maxLength={2000} value={edit.overview} onChange={(e) => set('overview', e.target.value)} />
            </Field>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Field id="sv-problems" label="Problems we solve" error={errors.problems} help="One per line (max 8).">
                <textarea id="sv-problems" className="control" rows={6} value={edit.problems} onChange={(e) => set('problems', e.target.value)} />
              </Field>
              <Field id="sv-scope" label="Typical scope" error={errors.scope} help="One per line (max 12).">
                <textarea id="sv-scope" className="control" rows={6} value={edit.scope} onChange={(e) => set('scope', e.target.value)} />
              </Field>
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="col">
              <legend style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Considerations</legend>
              <p className="small" style={{ marginBottom: 10 }}>
                Points to weigh before starting (max 8). Each needs a title and a description.
              </p>
              <div className="col" style={{ gap: 12 }}>
                {edit.considerations.map((c, i) => (
                  <div key={i} className="adm-subform">
                    <Field id={`sv-c${i}-t`} label={`Consideration ${i + 1} — title`}>
                      <input id={`sv-c${i}-t`} className="control" maxLength={120} value={c.title} onChange={(e) => setConsideration(i, { title: e.target.value })} />
                    </Field>
                    <Field id={`sv-c${i}-b`} label="Description">
                      <textarea id={`sv-c${i}-b`} className="control" rows={3} maxLength={800} value={c.body} onChange={(e) => setConsideration(i, { body: e.target.value })} />
                    </Field>
                    <div className="flex-wrap" style={{ gap: 6 }}>
                      <button type="button" className="iconbtn" disabled={i === 0} onClick={() => set('considerations', moved(edit.considerations, i, -1))}>
                        Move up
                      </button>
                      <button type="button" className="iconbtn" disabled={i === edit.considerations.length - 1} onClick={() => set('considerations', moved(edit.considerations, i, 1))}>
                        Move down
                      </button>
                      <button type="button" className="iconbtn" style={{ color: 'var(--error)' }} onClick={() => set('considerations', edit.considerations.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.considerations && (
                <p className="field-err" style={{ marginTop: 8 }}>
                  <span aria-hidden="true">!</span>
                  {errors.considerations}
                </p>
              )}
              <div style={{ marginTop: 10 }}>
                <button type="button" className="btn btn--sm btn-outline" disabled={edit.considerations.length >= 8} onClick={() => set('considerations', [...edit.considerations, { title: '', body: '' }])}>
                  + Add consideration
                </button>
              </div>
            </fieldset>

            <ImageField id="sv-image" label="Image" value={edit.image} onChange={(v) => set('image', v)} error={errors.image} />
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Field id="sv-alt" label="Image description (alt text)" error={errors.imageAlt} help="Describe the photo for screen-reader users.">
                <input id="sv-alt" className="control" maxLength={200} value={edit.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />
              </Field>
              <Field id="sv-label" label="Placeholder caption" error={errors.imageLabel} help="Shown on the placeholder until an image is added.">
                <input id="sv-label" className="control" maxLength={120} value={edit.imageLabel} onChange={(e) => set('imageLabel', e.target.value)} />
              </Field>
            </div>

            <div className="flex-wrap" style={{ gap: 20, alignItems: 'center' }}>
              <Field id="sv-status" label="Status">
                <select id="sv-status" className="control" value={edit.status} onChange={(e) => set('status', e.target.value as Form['status'])}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <label className="adm-check">
                <input type="checkbox" checked={edit.isSample} onChange={(e) => set('isSample', e.target.checked)} />
                Sample (unconfirmed — shown only while “Show sample content” is on)
              </label>
            </div>

            <div className="adm-actions">
              <button type="submit" className="btn btn--sm btn-dark" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn--sm btn-outline" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete solution?"
          message={`"${del.name}" will be removed from the site and from the contact form's area-of-interest list. Existing leads keep the name they were submitted with. To keep it for later, unpublish it instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/services/${del.id}`, { method: 'DELETE', admin: true });
              toast('Deleted.');
              setDel(null);
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
