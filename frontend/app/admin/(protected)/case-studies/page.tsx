'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminCase, AdminService } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';
import { SLUG_RE } from '@/components/admin/helpers';

const SECTIONS = [
  { key: 'context', label: 'Context', help: 'Who the client is and the situation they were in.' },
  { key: 'challenge', label: 'Challenge', help: 'What needed to change, and why.' },
  { key: 'approach', label: 'Approach', help: 'How the work was framed and planned.' },
  { key: 'scope', label: 'Scope', help: 'What was and was not included.' },
  { key: 'implementation', label: 'Implementation', help: 'How it was delivered.' },
  { key: 'outcomes', label: 'Outcomes', help: 'Verified results only — never estimates or targets.' },
] as const;
type SectionKey = (typeof SECTIONS)[number]['key'];

interface Form {
  id?: number;
  title: string;
  slug: string;
  client: string;
  serviceSlug: string;
  sections: Record<SectionKey, string>;
  image: string;
  imageAlt: string;
  status: 'published' | 'draft';
  isSample: boolean;
}

const BLANK: Form = {
  title: '',
  slug: '',
  client: '',
  serviceSlug: '',
  sections: { context: '', challenge: '', approach: '', scope: '', implementation: '', outcomes: '' },
  image: '',
  imageAlt: '',
  status: 'draft',
  isSample: false,
};

const toForm = (c: AdminCase): Form => ({
  id: c.id,
  title: c.title,
  slug: c.slug,
  client: c.client,
  serviceSlug: c.serviceSlug,
  sections: { context: c.context, challenge: c.challenge, approach: c.approach, scope: c.scope, implementation: c.implementation, outcomes: c.outcomes },
  image: c.image || '',
  imageAlt: c.imageAlt,
  status: c.status,
  isSample: c.isSample,
});

const toBody = (f: Form) => ({
  title: f.title.trim(),
  slug: f.slug.trim().toLowerCase(),
  client: f.client.trim(),
  serviceSlug: f.serviceSlug,
  ...Object.fromEntries(SECTIONS.map((s) => [s.key, f.sections[s.key].trim()])),
  image: f.image.trim(),
  imageAlt: f.imageAlt.trim(),
  status: f.status,
  isSample: f.isSample,
});

function validate(f: Form, serviceSlugs: string[]) {
  const e: Record<string, string> = {};
  const slug = f.slug.trim().toLowerCase();
  if (f.title.trim().length < 4) e.title = 'Enter a title of at least 4 characters.';
  else if (f.title.trim().length > 160) e.title = 'Use 160 characters or fewer.';
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (f.client.trim().length > 160) e.client = 'Use 160 characters or fewer.';
  if (!serviceSlugs.includes(f.serviceSlug)) e.serviceSlug = 'Choose the related solution.';
  for (const s of SECTIONS) if (f.sections[s.key].trim().length > 3000) e[s.key] = 'Use 3,000 characters or fewer.';
  const img = f.image.trim();
  if (img && !/^(\/uploads\/[\w.-]+|https:\/\/\S+)$/.test(img)) e.image = 'Upload an image or use an https:// URL.';
  if (f.status === 'published') {
    if (!f.client.trim()) e.client = 'Required to publish (approved client name or description).';
    for (const s of SECTIONS) if (!f.sections[s.key].trim()) e[s.key] = 'Required to publish.';
  }
  return e;
}

export default function CaseStudiesAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminCase[] | null>(null);
  const [services, setServices] = useState<AdminService[]>([]);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminCase | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError('');
    Promise.all([api<AdminCase[]>('/case-studies/admin/all', { admin: true }), api<AdminService[]>('/services/admin/all', { admin: true })])
      .then(([c, s]) => {
        setItems(c);
        setServices(s);
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const serviceName = (slug: string) => services.find((s) => s.slug === slug)?.name || slug;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((p) => (p ? { ...p, [k]: v } : p));
  const setSection = (k: SectionKey, v: string) => setEdit((p) => (p ? { ...p, sections: { ...p.sections, [k]: v } } : p));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = validate(edit, services.map((s) => s.slug));
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    try {
      if (edit.id) await api(`/case-studies/${edit.id}`, { method: 'PATCH', admin: true, body: toBody(edit) });
      else await api('/case-studies', { method: 'POST', admin: true, body: toBody(edit) });
      toast(edit.id ? 'Case study saved.' : 'Case study added.');
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

  const togglePublished = async (c: AdminCase) => {
    const publishing = c.status !== 'published';
    if (publishing) {
      // Publishing needs every section and an approved client name: open the editor with the gaps shown.
      const f = { ...toForm(c), status: 'published' as const };
      const fe = validate(f, services.map((s) => s.slug));
      if (Object.keys(fe).length) {
        toast('Complete the highlighted fields before publishing.', true);
        setErrors(fe);
        setEdit(f);
        return;
      }
    }
    setBusyId(c.id);
    try {
      await api(`/case-studies/${c.id}`, { method: 'PATCH', admin: true, body: { status: publishing ? 'published' : 'draft' } });
      toast(publishing ? 'Published.' : 'Moved to draft.');
      load();
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Case studies">
        <button
          type="button"
          className="btn btn--sm btn-dark"
          onClick={() => {
            setErrors({});
            setEdit({ ...BLANK, sections: { ...BLANK.sections } });
          }}
          disabled={services.length === 0}
        >
          + Add case study
        </button>
      </AdminHeader>
      <p className="small" style={{ maxWidth: '70ch', marginBottom: 16 }}>
        Publish a case study only with the client’s approval and verified outcomes. Publishing requires an approved client name and all six sections.
      </p>

      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No case studies yet. The Case studies page shows its empty state until one is published.</EmptyBox>
        ) : (
          items.map((c) => (
            <div key={c.id} className="flex-wrap" style={{ gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)', opacity: c.status === 'published' ? 1 : 0.7 }}>
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="thumb" />
              ) : (
                <span className="thumb" style={{ display: 'inline-block' }} />
              )}
              <div className="col min0" style={{ flex: '1 1 240px', gap: 4 }}>
                <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.title}</span>
                <span className="small">
                  {c.client || 'No client name yet'} · {serviceName(c.serviceSlug)} · updated {formatDate(c.updatedAt)}
                </span>
              </div>
              <div className="flex-wrap" style={{ gap: 6 }}>
                {c.status === 'draft' && <StatusTag kind="draft">DRAFT</StatusTag>}
                {c.isSample && <StatusTag kind="sample">SAMPLE</StatusTag>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" disabled={busyId === c.id} onClick={() => togglePublished(c)}>
                  {c.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit(toForm(c));
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn" style={{ color: 'var(--error)' }} onClick={() => setDel(c)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && (
        <Modal title={edit.id ? `Edit — ${edit.title || 'case study'}` : 'Add case study'} onClose={() => setEdit(null)} wide>
          <form onSubmit={save} noValidate className="adm-form">
            <Field id="cs-title" label="Title *" error={errors.title}>
              <input id="cs-title" className="control" maxLength={160} value={edit.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} />
            </Field>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Field id="cs-client" label="Client (approved name or description)" error={errors.client} help="Required to publish.">
                <input id="cs-client" className="control" maxLength={160} value={edit.client} onChange={(e) => set('client', e.target.value)} aria-invalid={!!errors.client} />
              </Field>
              <Field id="cs-service" label="Related solution *" error={errors.serviceSlug}>
                <select id="cs-service" className="control" value={edit.serviceSlug} onChange={(e) => set('serviceSlug', e.target.value)} aria-invalid={!!errors.serviceSlug}>
                  <option value="">Select…</option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                      {s.status === 'draft' ? ' (draft)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field id="cs-slug" label="Page address (slug)" error={errors.slug} help={edit.id ? 'Changing this breaks existing links to the case study.' : 'Leave blank to create it from the title.'}>
              <input id="cs-slug" className="control" maxLength={80} value={edit.slug} onChange={(e) => set('slug', e.target.value)} aria-invalid={!!errors.slug} />
            </Field>

            {SECTIONS.map((s) => (
              <Field key={s.key} id={`cs-${s.key}`} label={s.label} error={errors[s.key]} help={`${s.help} Blank lines start a new paragraph. Required to publish.`}>
                <textarea id={`cs-${s.key}`} className="control" rows={4} maxLength={3000} value={edit.sections[s.key]} onChange={(e) => setSection(s.key, e.target.value)} aria-invalid={!!errors[s.key]} />
              </Field>
            ))}

            <ImageField id="cs-image" label="Image" value={edit.image} onChange={(v) => set('image', v)} error={errors.image} />
            <Field id="cs-alt" label="Image description (alt text)" error={errors.imageAlt}>
              <input id="cs-alt" className="control" maxLength={200} value={edit.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />
            </Field>

            <div className="flex-wrap" style={{ gap: 20, alignItems: 'center' }}>
              <Field id="cs-status" label="Status">
                <select id="cs-status" className="control" value={edit.status} onChange={(e) => set('status', e.target.value as Form['status'])}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <label className="adm-check">
                <input type="checkbox" checked={edit.isSample} onChange={(e) => set('isSample', e.target.checked)} />
                Sample (not a real engagement — shown only while “Show sample content” is on)
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
          title="Delete case study?"
          message={`"${del.title}" will be permanently removed. To keep it for later, unpublish it instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/case-studies/${del.id}`, { method: 'DELETE', admin: true });
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
